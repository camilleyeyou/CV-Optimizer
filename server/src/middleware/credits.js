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

    // Check student expiry
    if (profile.is_student && profile.student_expires_at) {
      const expiresAt = new Date(profile.student_expires_at);
      if (expiresAt < new Date()) {
        if (profile.stripe_subscription_id) {
          // Student promo lapsed but the user is now a paying subscriber —
          // only clear the student flag; never touch their paid plan/credits.
          await supabase
            .from('user_profiles')
            .update({ is_student: false })
            .eq('id', req.user.id);
          profile.is_student = false;
        } else {
          await supabase
            .from('user_profiles')
            .update({ plan: 'free', is_student: false, ai_credits: FREE_MONTHLY_CREDITS })
            .eq('id', req.user.id);
          profile.plan = 'free';
          profile.ai_credits = FREE_MONTHLY_CREDITS;
        }
      }
    }

    // Pro/Premium = unlimited
    if (profile.plan === 'pro' || profile.plan === 'premium') {
      req.userPlan = profile.plan;
      return next();
    }

    // Monthly reset for free users.
    const resetAt = new Date(profile.credits_reset_at);
    const now = new Date();
    const monthsSinceReset =
      (now.getFullYear() - resetAt.getFullYear()) * 12 + (now.getMonth() - resetAt.getMonth());
    if (monthsSinceReset >= 1) {
      await supabase
        .from('user_profiles')
        .update({ ai_credits: FREE_MONTHLY_CREDITS, credits_reset_at: now.toISOString() })
        .eq('id', req.user.id);
    }

    // Atomically decrement one credit (only when > 0). The single DB function
    // avoids a read-then-write race where concurrent requests could double-spend.
    // Returns the new balance, or null when there were no credits left.
    const { data: remaining, error: rpcError } = await supabase.rpc('deduct_credit', {
      p_user: req.user.id,
    });

    if (rpcError) {
      return res.status(500).json({ error: 'Failed to check credits' });
    }

    if (remaining === null || remaining === undefined || remaining < 0) {
      return res.status(403).json({
        error: 'You have used all your free AI credits this month. Upgrade to Pro for unlimited access.',
        credits_remaining: 0,
        plan: profile.plan,
      });
    }

    // Attach info to request for response headers
    req.userPlan = profile.plan;
    req.creditsRemaining = remaining;

    // Add credits info to response
    const originalJson = res.json.bind(res);
    res.json = (data) => {
      if (typeof data === 'object' && data !== null) {
        data._credits = { remaining, plan: profile.plan };
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
