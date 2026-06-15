-- Atomic AI-credit consumption for free users.
-- Replaces the previous read-then-write in the credits middleware, which could
-- race under concurrent requests and let a user exceed their monthly free credits.
-- Run in the Supabase SQL editor.

create or replace function consume_ai_credit(p_user_id uuid, p_monthly integer)
returns integer
language plpgsql
security definer
as $$
declare
  remaining integer;
begin
  -- Monthly reset: if a new calendar month has started, refill free credits.
  update user_profiles
    set ai_credits = p_monthly,
        credits_reset_at = now()
    where id = p_user_id
      and plan = 'free'
      and date_trunc('month', credits_reset_at) < date_trunc('month', now());

  -- Atomic decrement: only succeeds while credits remain.
  update user_profiles
    set ai_credits = ai_credits - 1
    where id = p_user_id
      and ai_credits > 0
    returning ai_credits into remaining;

  -- NULL means the row was missing or had no credits left.
  return coalesce(remaining, -1);
end;
$$;

-- Lock the function down to the service role (the server) only.
revoke all on function consume_ai_credit(uuid, integer) from public;
