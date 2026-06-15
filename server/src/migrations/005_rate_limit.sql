-- Shared rate-limit counters (fallback store when Upstash Redis is not
-- configured). Enforces limits across serverless instances, unlike the
-- per-instance in-memory default. Run in the Supabase SQL editor.

create table if not exists rate_limit_counters (
  key text primary key,
  count integer not null default 0,
  expires_at timestamptz not null
);

create index if not exists idx_rate_limit_expires on rate_limit_counters(expires_at);

-- Server-only (service role bypasses RLS). RLS on with no policies blocks
-- client access.
alter table rate_limit_counters enable row level security;

-- Atomic fixed-window increment: returns the current hit count and the window
-- reset time. Resets the window once it has expired.
create or replace function increment_rate_limit(p_key text, p_window_ms bigint)
returns table(total_hits integer, reset_at timestamptz)
language plpgsql
as $$
declare
  v_now timestamptz := now();
  v_count integer;
  v_expires timestamptz;
begin
  insert into rate_limit_counters as r (key, count, expires_at)
    values (p_key, 1, v_now + make_interval(secs => p_window_ms / 1000.0))
  on conflict (key) do update
    set count = case when r.expires_at <= v_now then 1 else r.count + 1 end,
        expires_at = case when r.expires_at <= v_now
                          then v_now + make_interval(secs => p_window_ms / 1000.0)
                          else r.expires_at end
  returning r.count, r.expires_at into v_count, v_expires;

  total_hits := v_count;
  reset_at := v_expires;
  return next;
end;
$$;

revoke all on function increment_rate_limit(text, bigint) from public;
