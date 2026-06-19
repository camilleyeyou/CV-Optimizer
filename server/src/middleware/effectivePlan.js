/**
 * Resolve a user's effective plan from their profile row.
 *
 * An expired student grant falls back to 'free' — UNLESS the plan is a genuine
 * upgrade that the student program could not have produced. The student program
 * only ever grants 'pro', so an explicit 'premium' plan (or any plan backed by a
 * paid Stripe subscription) is a real upgrade and survives student-grant expiry.
 * This also covers manual DB upgrades, which set plan but have no Stripe sub.
 *
 * @param {{plan?: string, is_student?: boolean, student_expires_at?: string, stripe_subscription_id?: string|null}} profile
 * @returns {'free'|'pro'|'premium'|string}
 */
function effectivePlan(profile) {
  if (!profile) return 'free';
  const plan = profile.plan || 'free';
  if (plan === 'premium' || profile.stripe_subscription_id) return plan;
  const studentExpired =
    profile.is_student &&
    profile.student_expires_at &&
    new Date(profile.student_expires_at) < new Date();
  if (studentExpired) return 'free';
  return plan;
}

module.exports = { effectivePlan };
