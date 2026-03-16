const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

const FREE_MONTHLY_CREDITS = 5;

/**
 * Check and deduct 1 AI credit. Rejects with 403 if no credits left.
 * Free users get credits reset monthly. Pro/Premium users have unlimited.
 */
const requireCredits = async (req, res, next) => {
  if (!req.user?.id) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  try {
    // Get or create profile
    let { data: profile, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', req.user.id)
      .single();

    if (error || !profile) {
      // Auto-create profile if missing (for existing users before this feature)
      const { data: newProfile, error: insertError } = await supabase
        .from('user_profiles')
        .insert({ id: req.user.id, plan: 'free', ai_credits: FREE_MONTHLY_CREDITS })
        .select()
        .single();

      if (insertError) {
        return res.status(500).json({ error: 'Failed to check credits' });
      }
      profile = newProfile;
    }

    // Pro/Premium = unlimited
    if (profile.plan === 'pro' || profile.plan === 'premium') {
      req.userPlan = profile.plan;
      return next();
    }

    // Monthly reset for free users
    const resetAt = new Date(profile.credits_reset_at);
    const now = new Date();
    const monthsSinceReset =
      (now.getFullYear() - resetAt.getFullYear()) * 12 + (now.getMonth() - resetAt.getMonth());

    if (monthsSinceReset >= 1) {
      // Reset credits
      await supabase
        .from('user_profiles')
        .update({ ai_credits: FREE_MONTHLY_CREDITS, credits_reset_at: now.toISOString() })
        .eq('id', req.user.id);
      profile.ai_credits = FREE_MONTHLY_CREDITS;
    }

    if (profile.ai_credits <= 0) {
      return res.status(403).json({
        error: 'You have used all your free AI credits this month. Upgrade to Pro for unlimited access.',
        credits_remaining: 0,
        plan: profile.plan,
      });
    }

    // Deduct 1 credit
    const newCredits = profile.ai_credits - 1;
    await supabase
      .from('user_profiles')
      .update({ ai_credits: newCredits })
      .eq('id', req.user.id);

    // Attach info to request for response headers
    req.userPlan = profile.plan;
    req.creditsRemaining = newCredits;

    // Add credits info to response
    res.on('finish', () => {});
    const originalJson = res.json.bind(res);
    res.json = (data) => {
      if (typeof data === 'object' && data !== null) {
        data._credits = { remaining: newCredits, plan: profile.plan };
      }
      return originalJson(data);
    };

    next();
  } catch (err) {
    return res.status(500).json({ error: 'Failed to check credits' });
  }
};

/**
 * Get user's current credits (no deduction)
 */
const getCredits = async (req, res) => {
  if (!req.user?.id) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  try {
    let { data: profile } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', req.user.id)
      .single();

    if (!profile) {
      const { data: newProfile } = await supabase
        .from('user_profiles')
        .insert({ id: req.user.id, plan: 'free', ai_credits: FREE_MONTHLY_CREDITS })
        .select()
        .single();
      profile = newProfile;
    }

    // Check for monthly reset
    const resetAt = new Date(profile.credits_reset_at);
    const now = new Date();
    const monthsSinceReset =
      (now.getFullYear() - resetAt.getFullYear()) * 12 + (now.getMonth() - resetAt.getMonth());

    if (monthsSinceReset >= 1 && profile.plan === 'free') {
      await supabase
        .from('user_profiles')
        .update({ ai_credits: FREE_MONTHLY_CREDITS, credits_reset_at: now.toISOString() })
        .eq('id', req.user.id);
      profile.ai_credits = FREE_MONTHLY_CREDITS;
    }

    res.json({
      plan: profile.plan,
      credits: profile.plan === 'pro' || profile.plan === 'premium' ? -1 : profile.ai_credits,
      max_credits: FREE_MONTHLY_CREDITS,
    });
  } catch {
    res.status(500).json({ error: 'Failed to get credits' });
  }
};

module.exports = { requireCredits, getCredits };
