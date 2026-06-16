-- Security hardening for public launch. Run in the Supabase SQL editor.
--
-- Both fixes close holes reachable with the public anon key that ships in the
-- client bundle. Neither breaks the app: the share page resolves tokens via the
-- service role server-side, and the client never writes user_profiles directly
-- (all plan/credit writes already go through the service role on the webhook).

-- 1) resume_shares: the "Anyone can view active shares" SELECT policy let any
--    anon-key holder dump EVERY active share's token, resume_id and user_id,
--    then fetch the full resume (name, email, phone, work history). Remove it.
--    Owners can still read/manage their own shares via the "manage own shares"
--    policy; the public share page uses GET /api/share/:token (service role).
drop policy if exists "Anyone can view active shares" on resume_shares;

-- 2) user_profiles: the "Users can update own profile" UPDATE policy had no
--    column restriction, so an authenticated user could self-grant
--    plan='premium' / unlimited ai_credits with the anon key, bypassing Stripe.
--    The client never updates this table directly, so remove the policy entirely;
--    the service role retains full access for legitimate (webhook) writes.
drop policy if exists "Users can update own profile" on user_profiles;
