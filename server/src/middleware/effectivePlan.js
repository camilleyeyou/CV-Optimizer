/**
 * Resolve a user's effective plan from their profile row.
 *
 * An expired student grant falls back to 'free' — UNLESS the user has since
 * taken a paid Stripe subscription, in which case the paid plan stands. This
 * prevents the lapsed-student downgrade from silently dropping an actively
 * paying subscriber to free.
 *
 * @param {{plan?: string, is_student?: boolean, student_expires_at?: string, stripe_subscription_id?: string|null}} profile
 * @returns {'free'|'pro'|'premium'|string}
 */
function effectivePlan(profile) {
  if (!profile) return 'free';
  const plan = profile.plan || 'free';
  const studentExpired =
    profile.is_student &&
    profile.student_expires_at &&
    new Date(profile.student_expires_at) < new Date();
  if (studentExpired && !profile.stripe_subscription_id) return 'free';
  return plan;
}

module.exports = { effectivePlan };
