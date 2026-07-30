const { createClient } = require('@supabase/supabase-js');
const stripeService = require('../services/stripeService');
const logger = require('../logger');

const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

/**
 * `pro` is the only plan on sale. `premium` stays valid so an existing
 * subscriber's webhooks and portal flows keep resolving, but it is not
 * offered at checkout — SELLABLE_PLANS is what the checkout endpoint accepts.
 */
const VALID_PLANS = ['pro', 'premium'];
const SELLABLE_PLANS = ['pro'];
const ACTIVE_STATUSES = ['active', 'trialing'];

// Resolve the app's base URL for Stripe redirects (Vercel is same-origin).
function baseUrl(req) {
  if (process.env.CLIENT_URL) return process.env.CLIENT_URL.replace(/\/$/, '');
  const proto = req.headers['x-forwarded-proto'] || req.protocol || 'https';
  return `${proto}://${req.headers.host}`;
}

async function getProfile(userId) {
  const { data } = await supabase
    .from('user_profiles')
    .select('id, plan, stripe_customer_id, stripe_subscription_id')
    .eq('id', userId)
    .single();
  return data;
}

/** POST /api/billing/checkout  { plan } -> { url } */
const createCheckout = async (req, res) => {
  try {
    const { plan, interval = stripeService.DEFAULT_INTERVAL } = req.body || {};
    if (!SELLABLE_PLANS.includes(plan)) {
      return res.status(400).json({ error: 'Invalid plan' });
    }
    if (!stripeService.INTERVALS.includes(interval)) {
      return res.status(400).json({ error: 'Invalid billing interval' });
    }
    // A price only exists once it has been created in Stripe and wired to an
    // env var. Fail with a clear message rather than a 500 from the API call.
    if (!stripeService.priceForPlan(plan, interval)) {
      return res.status(400).json({ error: 'That billing option is not available yet.' });
    }
    if (!req.user?.id) return res.status(401).json({ error: 'Authentication required' });

    const profile = await getProfile(req.user.id);
    const root = baseUrl(req);

    const session = await stripeService.createCheckoutSession({
      userId: req.user.id,
      email: req.user.email,
      plan,
      interval,
      customerId: profile?.stripe_customer_id || null,
      successUrl: `${root}/dashboard?upgrade=success`,
      cancelUrl: `${root}/pricing?upgrade=cancelled`,
    });

    res.json({ url: session.url });
  } catch (err) {
    logger.error({ err }, 'Failed to create checkout session');
    res.status(500).json({ error: 'Failed to start checkout' });
  }
};

/** POST /api/billing/portal -> { url } */
const createPortal = async (req, res) => {
  try {
    if (!req.user?.id) return res.status(401).json({ error: 'Authentication required' });
    const profile = await getProfile(req.user.id);
    if (!profile?.stripe_customer_id) {
      return res.status(400).json({ error: 'No active subscription to manage' });
    }
    const session = await stripeService.createPortalSession({
      customerId: profile.stripe_customer_id,
      returnUrl: `${baseUrl(req)}/dashboard`,
    });
    res.json({ url: session.url });
  } catch (err) {
    logger.error({ err }, 'Failed to create portal session');
    res.status(500).json({ error: 'Failed to open billing portal' });
  }
};

// --- Webhook handlers ------------------------------------------------------
async function updatePlan(userId, fields) {
  if (!userId) return;
  await supabase.from('user_profiles').update(fields).eq('id', userId);
}

async function findUserIdByCustomer(customerId) {
  if (!customerId) return null;
  const { data } = await supabase
    .from('user_profiles')
    .select('id')
    .eq('stripe_customer_id', customerId)
    .single();
  return data?.id || null;
}

async function handleCheckoutCompleted(session) {
  const userId = session.client_reference_id || session.metadata?.userId;
  const plan = session.metadata?.plan;
  if (!userId || !VALID_PLANS.includes(plan)) return;
  await updatePlan(userId, {
    plan,
    stripe_customer_id: session.customer || null,
    stripe_subscription_id: session.subscription || null,
  });
  logger.info({ userId, plan }, 'Checkout completed, plan upgraded');
}

async function handleSubscriptionChange(subscription) {
  let userId = subscription.metadata?.userId;
  if (!userId) userId = await findUserIdByCustomer(subscription.customer);
  if (!userId) return;

  const status = subscription.status;
  const priceId = subscription.items?.data?.[0]?.price?.id;
  const plan = stripeService.planForPrice(priceId);

  if (ACTIVE_STATUSES.includes(status) && plan) {
    await updatePlan(userId, {
      plan,
      stripe_customer_id: subscription.customer || null,
      stripe_subscription_id: subscription.id,
    });
  } else {
    // Cancelled, unpaid, or past_due -> revert to free.
    await updatePlan(userId, { plan: 'free', stripe_subscription_id: null });
  }
  logger.info({ userId, status, plan }, 'Subscription change processed');
}

async function handleSubscriptionDeleted(subscription) {
  let userId = subscription.metadata?.userId;
  if (!userId) userId = await findUserIdByCustomer(subscription.customer);
  await updatePlan(userId, { plan: 'free', stripe_subscription_id: null });
  logger.info({ userId }, 'Subscription deleted, reverted to free');
}

/** POST /api/billing/webhook  (raw body, mounted before express.json) */
const webhook = async (req, res) => {
  const signature = req.headers['stripe-signature'];
  let event;
  try {
    event = stripeService.constructEvent(req.body, signature);
  } catch (err) {
    logger.warn({ err: err.message }, 'Stripe webhook signature verification failed');
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Idempotency: Stripe delivers events at least once and retries. If we've
  // already fully handled this event id, acknowledge and skip re-processing.
  try {
    const { data: seen } = await supabase
      .from('stripe_processed_events')
      .select('event_id')
      .eq('event_id', event.id)
      .single();
    if (seen) {
      return res.json({ received: true, duplicate: true });
    }
  } catch {
    // Not found (or table unavailable) — proceed to handle the event.
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object);
        break;
      case 'customer.subscription.updated':
      case 'customer.subscription.created':
        await handleSubscriptionChange(event.data.object);
        break;
      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object);
        break;
      default:
        break;
    }

    // Record only AFTER successful handling, so a failed handler (500 -> Stripe
    // retry) is re-attempted rather than skipped. Ignore insert/conflict errors.
    try {
      await supabase.from('stripe_processed_events').insert({ event_id: event.id, type: event.type });
    } catch {
      // best-effort — the handlers above are themselves idempotent
    }

    res.json({ received: true });
  } catch (err) {
    logger.error({ err, type: event.type }, 'Error handling Stripe webhook');
    // 500 tells Stripe to retry.
    res.status(500).json({ error: 'Webhook handler failed' });
  }
};

/**
 * GET /api/billing/plans -> { plans: [{ id, intervals: [...] }] }
 *
 * The pricing page renders only the billing options that have a Stripe price
 * behind them, so a period we have not created yet is never offered and then
 * rejected at checkout.
 */
const getPlans = async (_req, res) => {
  res.json({
    plans: SELLABLE_PLANS.map((id) => ({
      id,
      intervals: stripeService.availableIntervals(id),
    })),
  });
};

module.exports = { createCheckout, createPortal, webhook, getPlans };
