-- Idempotency ledger for Stripe webhooks. Stripe delivers each event at least
-- once and retries on failure, so we record handled event IDs and skip repeats.
-- Run in the Supabase SQL editor.

create table if not exists stripe_processed_events (
  event_id text primary key,
  type text,
  processed_at timestamptz default now()
);

-- Server-only (service role bypasses RLS). RLS on with no policies blocks
-- client access.
alter table stripe_processed_events enable row level security;
