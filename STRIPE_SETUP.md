# Stripe Billing Setup

This app uses **Stripe Checkout** (hosted) for subscriptions and the **Stripe Customer Portal** (hosted) for managing/cancelling them. A webhook keeps each user's `plan` in Supabase in sync. Follow these steps once to go live.

> Do everything in **Test mode** first (toggle in the Stripe dashboard). The flow is identical; only the keys differ. Switch to live keys when you're ready to charge real cards.

---

## 1. Create a Stripe account
1. Sign up at https://dashboard.stripe.com/register.
2. Stay in **Test mode** (toggle top-right) while setting up.

## 2. Create the two products + prices
Dashboard → **Product catalog** → **Add product**. Create two:

| Product | Price | Billing | Notes |
|---|---|---|---|
| CV Optimizer Pro | $12.00 USD | Recurring · Monthly | |
| CV Optimizer Premium | $24.00 USD | Recurring · Monthly | |

After saving each, open the price and copy its **Price ID** (looks like `price_1Q...`). You need both:
- Pro price ID → `STRIPE_PRICE_PRO`
- Premium price ID → `STRIPE_PRICE_PREMIUM`

## 3. Get your API secret key
Dashboard → **Developers → API keys** → copy the **Secret key** (`sk_test_...` in test mode).
- → `STRIPE_SECRET_KEY`

## 4. Enable the Customer Portal
Dashboard → **Settings → Billing → Customer portal** → **Activate**. Allow customers to cancel and switch plans. (Required for the "Manage subscription" button to work.)

## 5. Create the webhook
The webhook is what actually upgrades/downgrades a user after payment.

**Production:**
1. Dashboard → **Developers → Webhooks → Add endpoint**.
2. Endpoint URL: `https://YOUR_DOMAIN/api/billing/webhook`
3. Select events:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
4. Save, then copy the **Signing secret** (`whsec_...`).
   - → `STRIPE_WEBHOOK_SECRET`

**Local development** (use the Stripe CLI to forward events to your machine):
```bash
brew install stripe/stripe-cli/stripe   # or see https://stripe.com/docs/stripe-cli
stripe login
stripe listen --forward-to localhost:5002/api/billing/webhook
```
`stripe listen` prints a `whsec_...` secret — use that as `STRIPE_WEBHOOK_SECRET` locally.

## 6. Set environment variables
Add these to `server/.env` (local) and to the **Vercel project env vars** (production). See `server/.env.example`.

```
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_PRO=price_...        # $12/mo price ID
STRIPE_PRICE_PREMIUM=price_...    # $24/mo price ID
CLIENT_URL=https://YOUR_DOMAIN    # used for Checkout success/cancel redirects
```

> On Vercel the app is same-origin, so `CLIENT_URL` is optional — the server falls back to the request's host. Set it anyway for clean, predictable redirect URLs.

## 7. Run the database migration
In the Supabase SQL editor, run `server/src/migrations/002_billing.sql` (adds `stripe_customer_id` and `stripe_subscription_id` to `user_profiles`). Fresh installs from `supabase-schema.sql` already include these columns.

## 8. Test the full flow (test mode)
1. Start the app and `stripe listen` (step 5).
2. Sign in, go to the Dashboard, click **Upgrade to Pro**.
3. On Stripe Checkout use test card `4242 4242 4242 4242`, any future expiry, any CVC/ZIP.
4. After success you're redirected to `/dashboard?upgrade=success`; the webhook flips your plan to `pro` within a second or two and the banner updates.
5. Click **Manage subscription** → cancel → confirm the webhook downgrades you to `free`.

---

## How it works (for reference)
- **Checkout:** `POST /api/billing/checkout {plan}` → server creates a Checkout Session (with `userId`/`plan` in metadata) → returns the hosted URL → client redirects.
- **Webhook:** `POST /api/billing/webhook` (raw body, signature-verified) handles `checkout.session.completed` and `customer.subscription.*` events, writing `plan` + Stripe IDs to `user_profiles` via the Supabase service role.
- **Portal:** `POST /api/billing/portal` → server creates a Customer Portal session for the stored `stripe_customer_id` → client redirects.
- **Enforcement:** premium templates are gated server-side in `server/src/middleware/templateAccess.js`; AI credits are unlimited for `pro`/`premium` in `server/src/middleware/credits.js`.

## Going live
1. Toggle the dashboard to **Live mode** and repeat steps 2–5 (live products, `sk_live_...` key, live webhook + `whsec_...`).
2. Update the production env vars with the live values.
3. Do one real low-risk transaction (you can refund it) to confirm the live webhook fires.
