const { createClient } = require('@supabase/supabase-js');
const logger = require('../logger');
const stripeService = require('../services/stripeService');

const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

// All tables that hold a row per user, keyed by user_id (resumes/applications/
// scores/shares) or id (user_profiles). Used for export + deletion.
const USER_TABLES = [
  { table: 'resumes', key: 'user_id' },
  { table: 'applications', key: 'user_id' },
  { table: 'resume_scores', key: 'user_id' },
  { table: 'resume_shares', key: 'user_id' },
];

/**
 * GET /api/account/export — download everything we hold about the user as JSON
 * (GDPR/CCPA data access / portability).
 */
const exportData = async (req, res) => {
  const userId = req.user.id;
  try {
    const out = {
      exported_at: new Date().toISOString(),
      account: { id: userId, email: req.user.email },
    };

    const { data: profile } = await supabase
      .from('user_profiles')
      .select('plan, ai_credits, credits_reset_at, created_at')
      .eq('id', userId)
      .single();
    out.profile = profile || null;

    for (const { table, key } of USER_TABLES) {
      const { data } = await supabase.from(table).select('*').eq(key, userId);
      out[table] = data || [];
    }

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', 'attachment; filename="cv-optimizer-data.json"');
    res.send(JSON.stringify(out, null, 2));
  } catch (err) {
    logger.error({ err: err?.message }, 'account export failed');
    res.status(500).json({ error: 'Failed to export your data. Please try again.' });
  }
};

/**
 * POST /api/account/delete — permanently delete the user's account and all data
 * (GDPR/CCPA right to erasure). Requires confirmText === 'DELETE'.
 */
const deleteAccount = async (req, res) => {
  const userId = req.user.id;

  if (req.body?.confirmText !== 'DELETE') {
    return res.status(400).json({ error: 'Please type DELETE to confirm account deletion.' });
  }

  try {
    // 1) Cancel any active Stripe subscription so billing stops (best-effort).
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('stripe_subscription_id')
      .eq('id', userId)
      .single();
    if (profile?.stripe_subscription_id) {
      try {
        await stripeService.cancelSubscription(profile.stripe_subscription_id);
      } catch (err) {
        logger.warn({ err: err?.message, userId }, 'stripe cancel during account deletion failed');
      }
    }

    // 2) Delete all user-owned rows. Deleting the auth user cascades, but we
    //    remove these explicitly so deletion is complete even if a cascade is
    //    ever missing.
    for (const { table, key } of USER_TABLES) {
      await supabase.from(table).delete().eq(key, userId);
    }
    await supabase.from('user_profiles').delete().eq('id', userId);

    // 3) Delete the auth user itself (requires the service role).
    const { error: authErr } = await supabase.auth.admin.deleteUser(userId);
    if (authErr) {
      logger.error({ err: authErr.message, userId }, 'auth user deletion failed');
      return res.status(500).json({ error: 'Failed to delete your account. Please contact support.' });
    }

    res.json({ deleted: true });
  } catch (err) {
    logger.error({ err: err?.message, userId }, 'account deletion failed');
    res.status(500).json({ error: 'Failed to delete your account. Please try again.' });
  }
};

module.exports = { exportData, deleteAccount };
