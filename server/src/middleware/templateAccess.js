const { createClient } = require('@supabase/supabase-js');
const { getTemplate } = require('../templateRegistry');
const { effectivePlan } = require('./effectivePlan');
const logger = require('../logger');

const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

const PREMIUM_PLANS = ['pro', 'premium'];

// The premium-template paywall is opt-in. Until billing is live (there is no
// Stripe checkout to upgrade a free user), it stays OFF and every template is
// downloadable. Set TEMPLATE_PAYWALL_ENABLED=true to re-enable it.
const PAYWALL_ENABLED = process.env.TEMPLATE_PAYWALL_ENABLED === 'true';

/**
 * Server-side enforcement of the premium-template paywall.
 * Free templates pass through. Premium templates require a pro/premium plan
 * (expired student plans are treated as free, matching the credits middleware).
 */
const enforceTemplateAccess = async (req, res, next) => {
  if (!PAYWALL_ENABLED) return next();

  const spec = getTemplate(req.body?.template);
  if (!spec.premium) return next();

  if (!req.user?.id) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  try {
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('plan, is_student, student_expires_at, stripe_subscription_id')
      .eq('id', req.user.id)
      .single();

    const plan = effectivePlan(profile);

    if (PREMIUM_PLANS.includes(plan)) return next();

    return res.status(403).json({
      error: 'This template is part of Pro. Upgrade to export with premium templates, or choose a free template.',
      premium_template: spec.id,
    });
  } catch (err) {
    // Fail OPEN: a transient profile-lookup failure must not block a paying
    // user from exporting. A template download is not sensitive enough to
    // justify denying real customers on a glitch.
    logger.warn({ err: err?.message, userId: req.user.id }, 'template access check failed; allowing export');
    return next();
  }
};

module.exports = { enforceTemplateAccess };
