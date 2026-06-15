const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

// Academic email domains
const EDU_PATTERNS = [
  /\.edu$/i,
  /\.edu\.[a-z]{2}$/i,
  /\.ac\.[a-z]{2}$/i,
  /\.ac\.[a-z]{2}\.[a-z]{2}$/i,
  /\.edu\.[a-z]{2}\.[a-z]{2}$/i,
];

const isEducationalEmail = (email) => {
  const domain = email.split('@')[1];
  if (!domain) return false;
  return EDU_PATTERNS.some((pattern) => pattern.test(domain));
};

const verifyStudent = async (req, res) => {
  try {
    const email = req.user.email;

    // Require a confirmed email so the .edu address is genuinely owned by the
    // user (not just typed in). Supabase sets email_confirmed_at after the
    // confirmation link is clicked.
    // NOTE: This proves ownership, not active enrollment. For stronger proof of
    // active student status, integrate a verifier such as SheerID before grant.
    if (!req.user.email_confirmed_at && !req.user.confirmed_at) {
      return res.status(403).json({
        error: 'Please confirm your email address before verifying student status.',
      });
    }

    if (!isEducationalEmail(email)) {
      return res.status(400).json({
        error: 'Student verification requires an educational email (.edu, .ac.uk, etc.)',
      });
    }

    // Block re-verification while an existing student grant is still active.
    const { data: existing } = await supabase
      .from('user_profiles')
      .select('is_student, student_expires_at')
      .eq('id', req.user.id)
      .single();
    if (existing?.is_student && existing.student_expires_at && new Date(existing.student_expires_at) > new Date()) {
      return res.status(409).json({
        error: 'Student access is already active on this account.',
        expires_at: existing.student_expires_at,
      });
    }

    const now = new Date();
    const expiresAt = new Date(now);
    expiresAt.setMonth(expiresAt.getMonth() + 6);

    // Update user profile
    const { error } = await supabase
      .from('user_profiles')
      .update({
        plan: 'pro',
        is_student: true,
        student_verified_at: now.toISOString(),
        student_expires_at: expiresAt.toISOString(),
        ai_credits: -1, // unlimited for pro
      })
      .eq('id', req.user.id);

    if (error) {
      return res.status(500).json({ error: 'Failed to verify student status' });
    }

    res.json({
      verified: true,
      plan: 'pro',
      expires_at: expiresAt.toISOString(),
    });
  } catch {
    res.status(500).json({ error: 'Failed to verify student status' });
  }
};

module.exports = { verifyStudent };
