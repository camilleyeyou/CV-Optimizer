/**
 * Resolve a user's plan from their profile row, defaulting to 'free'.
 *
 * This used to reconcile expired .edu student grants against real upgrades.
 * That program is gone, so the rule is now simply "whatever the profile says",
 * with a missing profile treated as free — a user who has never hit an
 * authenticated route has no row at all (profiles are created lazily by the
 * credits middleware, not by a trigger).
 *
 * Kept as a shared helper rather than inlined so the credits, template and plan
 * middleware cannot drift on what an absent profile means.
 *
 * @param {{plan?: string}} profile
 * @returns {'free'|'pro'|'premium'|string}
 */
function effectivePlan(profile) {
  if (!profile) return 'free';
  return profile.plan || 'free';
}

module.exports = { effectivePlan };
