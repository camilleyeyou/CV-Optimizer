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

    if (!isEducationalEmail(email)) {
      return res.status(400).json({
        error: 'Student verification requires an educational email (.edu, .ac.uk, etc.)',
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
