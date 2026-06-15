const { createClient } = require('@supabase/supabase-js');
const { getTemplate } = require('../templateRegistry');

const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

const PREMIUM_PLANS = ['pro', 'premium'];

/**
 * Server-side enforcement of the premium-template paywall.
 * Free templates pass through. Premium templates require a pro/premium plan
 * (expired student plans are treated as free, matching the credits middleware).
 */
const enforceTemplateAccess = async (req, res, next) => {
  const spec = getTemplate(req.body?.template);
  if (!spec.premium) return next();

  if (!req.user?.id) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  try {
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('plan, is_student, student_expires_at')
      .eq('id', req.user.id)
      .single();

    let plan = profile?.plan || 'free';
    if (
      profile?.is_student &&
      profile.student_expires_at &&
      new Date(profile.student_expires_at) < new Date()
    ) {
      plan = 'free';
    }

    if (PREMIUM_PLANS.includes(plan)) return next();

    return res.status(403).json({
      error: 'This template is part of Pro. Upgrade to export with premium templates, or choose a free template.',
      premium_template: spec.id,
    });
  } catch {
    // Fail closed for premium templates if we can't verify the plan.
    return res.status(403).json({ error: 'Unable to verify template access. Please try again.' });
  }
};

module.exports = { enforceTemplateAccess };
