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

const PRICE_BY_PLAN = () => ({
  pro: process.env.STRIPE_PRICE_PRO,
  premium: process.env.STRIPE_PRICE_PREMIUM,
});

function priceForPlan(plan) {
  return PRICE_BY_PLAN()[plan] || null;
}

function planForPrice(priceId) {
  const map = PRICE_BY_PLAN();
  if (priceId && priceId === map.premium) return 'premium';
  if (priceId && priceId === map.pro) return 'pro';
  return null;
}

/**
 * Create a Stripe-hosted Checkout session for a subscription.
 * userId/plan are stored on the session AND the subscription metadata so the
 * webhook can resolve them on later subscription.updated/deleted events.
 */
async function createCheckoutSession({ userId, email, plan, customerId, successUrl, cancelUrl }) {
  const price = priceForPlan(plan);
  if (!price) throw new Error(`No Stripe price configured for plan "${plan}"`);

  return getClient().checkout.sessions.create({
    mode: 'subscription',
    line_items: [{ price, quantity: 1 }],
    success_url: successUrl,
    cancel_url: cancelUrl,
    client_reference_id: userId,
    ...(customerId ? { customer: customerId } : { customer_email: email }),
    metadata: { userId, plan },
    subscription_data: { metadata: { userId, plan } },
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
  createCheckoutSession,
  createPortalSession,
  constructEvent,
  getSubscription,
  cancelSubscription,
};
