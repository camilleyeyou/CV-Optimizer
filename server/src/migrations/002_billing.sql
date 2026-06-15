-- Billing (Stripe) columns for user_profiles.
-- Run in the Supabase SQL editor.

alter table user_profiles add column if not exists stripe_customer_id text;
alter table user_profiles add column if not exists stripe_subscription_id text;

create index if not exists idx_user_profiles_stripe_customer
  on user_profiles(stripe_customer_id);

-- Plan changes are written by the server (service role) from the Stripe webhook,
-- which bypasses RLS. The existing "Users can update own profile" policy still
-- lets users update non-plan fields; tightening that is optional.
