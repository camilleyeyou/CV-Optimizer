const { createClient } = require('@supabase/supabase-js');
const { effectivePlan } = require('./effectivePlan');

const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

/**
 * Server-side paywall for plan-restricted features. UI hiding is bypassable, so
 * any feature advertised as Pro/Premium must also be enforced here.
 *
 * Resolves the plan exactly like the credits/template middleware. Fails closed
 * if the plan can't be verified.
 *
 * @param {string[]} allowedPlans e.g. ['pro','premium'] or ['premium']
 */
const requirePlan = (allowedPlans) => async (req, res, next) => {
  if (!req.user?.id) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  try {
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('plan')
      .eq('id', req.user.id)
      .single();

    const plan = effectivePlan(profile);

    if (allowedPlans.includes(plan)) {
      req.userPlan = plan;
      return next();
    }

    const tier = allowedPlans.includes('pro') ? 'Pro' : 'Premium';
    return res.status(403).json({
      error: `This feature requires a ${tier} plan. Upgrade to unlock it.`,
      upgrade_required: true,
      required_plans: allowedPlans,
    });
  } catch {
    // Fail closed — never grant a paid feature when the plan can't be verified.
    return res.status(403).json({ error: 'Unable to verify your plan. Please try again.' });
  }
};

module.exports = { requirePlan };
