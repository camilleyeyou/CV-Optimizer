-- Atomic single-credit deduction. Decrements ai_credits only when > 0 and
-- returns the new value, or NULL when there were no credits left (or the row is
-- missing). A single UPDATE ... WHERE ai_credits > 0 RETURNING is row-locked by
-- Postgres, so two concurrent requests for a user with 1 credit resolve to
-- exactly one success and one "no credits" (NULL).
-- Run in the Supabase SQL editor.

create or replace function deduct_credit(p_user uuid)
returns integer
language plpgsql
security definer
as $$
declare
  v_new integer;
begin
  update user_profiles
    set ai_credits = ai_credits - 1
    where id = p_user and ai_credits > 0
    returning ai_credits into v_new;
  return v_new; -- NULL if no row matched (no credits left)
end;
$$;

-- Server-only (service role); deny to anon/authenticated roles.
revoke all on function deduct_credit(uuid) from public;
