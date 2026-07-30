const Stripe = require('stripe');

// Lazy singleton so a missing key never crashes module load (mirrors the
// other services). Throws only when a billing action is actually attempted.
let client = null;
function getClient() {
  if (!client) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) throw new Error('STRIPE_SECRET_KEY is not configured');
    client = new Stripe(key, { apiVersion: '2025-08-27.basil' });
  }
  return client;
}

/**
 * Price lookup, keyed by plan and billing interval.
 *
 * A job search is bursty and finite, so Pro is sold monthly, quarterly and
 * weekly rather than monthly alone. Read from the environment on every call so
 * a key added after boot is picked up without a restart.
 *
 * `premium` is legacy: it is no longer sold, but existing subscriptions still
 * resolve through planForPrice() so their webhooks keep working.
 */
const PRICE_MAP = () => ({
  pro: {
    monthly: process.env.STRIPE_PRICE_PRO,
    quarterly: process.env.STRIPE_PRICE_PRO_QUARTERLY,
    weekly: process.env.STRIPE_PRICE_PRO_WEEKLY,
  },
  premium: {
    monthly: process.env.STRIPE_PRICE_PREMIUM,
  },
});

const DEFAULT_INTERVAL = 'monthly';
const INTERVALS = ['monthly', 'quarterly', 'weekly'];

function priceForPlan(plan, interval = DEFAULT_INTERVAL) {
  return PRICE_MAP()[plan]?.[interval] || null;
}

/** Which intervals actually have a price configured, for the pricing UI. */
function availableIntervals(plan) {
  const forPlan = PRICE_MAP()[plan] || {};
  return INTERVALS.filter((i) => Boolean(forPlan[i]));
}

function planForPrice(priceId) {
  if (!priceId) return null;
  const map = PRICE_MAP();
  for (const [plan, byInterval] of Object.entries(map)) {
    if (Object.values(byInterval).includes(priceId)) return plan;
  }
  return null;
}

/**
 * Create a Stripe-hosted Checkout session for a subscription.
 * userId/plan are stored on the session AND the subscription metadata so the
 * webhook can resolve them on later subscription.updated/deleted events.
 */
async function createCheckoutSession({
  userId, email, plan, interval = DEFAULT_INTERVAL, customerId, successUrl, cancelUrl,
}) {
  const price = priceForPlan(plan, interval);
  if (!price) throw new Error(`No Stripe price configured for plan "${plan}" (${interval})`);

  return getClient().checkout.sessions.create({
    mode: 'subscription',
    line_items: [{ price, quantity: 1 }],
    success_url: successUrl,
    cancel_url: cancelUrl,
    client_reference_id: userId,
    ...(customerId ? { customer: customerId } : { customer_email: email }),
    metadata: { userId, plan, interval },
    subscription_data: { metadata: { userId, plan, interval } },
    allow_promotion_codes: true,
  });
}

/** Stripe-hosted Customer Portal for managing/cancelling the subscription. */
async function createPortalSession({ customerId, returnUrl }) {
  return getClient().billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl,
  });
}

/** Verify a webhook payload signature and return the parsed event. */
function constructEvent(rawBody, signature) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) throw new Error('STRIPE_WEBHOOK_SECRET is not configured');
  return getClient().webhooks.constructEvent(rawBody, signature, secret);
}

async function getSubscription(subscriptionId) {
  return getClient().subscriptions.retrieve(subscriptionId);
}

/** Immediately cancel a subscription (used on account deletion). */
async function cancelSubscription(subscriptionId) {
  return getClient().subscriptions.cancel(subscriptionId);
}

module.exports = {
  getClient,
  priceForPlan,
  planForPrice,
  availableIntervals,
  INTERVALS,
  DEFAULT_INTERVAL,
  createCheckoutSession,
  createPortalSession,
  constructEvent,
  getSubscription,
  cancelSubscription,
};
