const crypto = require('crypto');
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

const createShare = async (req, res) => {
  try {
    const { resumeId } = req.body;
    if (!resumeId) {
      return res.status(400).json({ error: 'Resume ID is required' });
    }

    // Verify the resume belongs to the user
    const { data: resume, error: resumeError } = await supabase
      .from('resumes')
      .select('id')
      .eq('id', resumeId)
      .eq('user_id', req.user.id)
      .single();

    if (resumeError || !resume) {
      return res.status(404).json({ error: 'Resume not found' });
    }

    // Check for existing active share
    const { data: existing } = await supabase
      .from('resume_shares')
      .select('*')
      .eq('resume_id', resumeId)
      .eq('user_id', req.user.id)
      .eq('is_active', true)
      .single();

    if (existing) {
      return res.json({ share: existing });
    }

    // Create share token
    const shareToken = crypto.randomBytes(16).toString('hex');

    const { data: share, error } = await supabase
      .from('resume_shares')
      .insert({
        resume_id: resumeId,
        user_id: req.user.id,
        share_token: shareToken,
      })
      .select()
      .single();

    if (error) {
      return res.status(500).json({ error: 'Failed to create share link' });
    }

    res.json({ share });
  } catch {
    res.status(500).json({ error: 'Failed to create share link' });
  }
};

const getShare = async (req, res) => {
  try {
    const { token } = req.params;

    const { data: share, error } = await supabase
      .from('resume_shares')
      .select('*')
      .eq('share_token', token)
      .eq('is_active', true)
      .single();

    if (error || !share) {
      return res.status(404).json({ error: 'Share link not found or expired' });
    }

    // Increment view count
    await supabase
      .from('resume_shares')
      .update({ views: (share.views || 0) + 1 })
      .eq('id', share.id);

    // Fetch resume data
    const { data: resume, error: resumeError } = await supabase
      .from('resumes')
      .select('*')
      .eq('id', share.resume_id)
      .single();

    if (resumeError || !resume) {
      return res.status(404).json({ error: 'Resume not found' });
    }

    // Strip user_id from response for privacy
    const { user_id, ...safeResume } = resume;
    res.json({ resume: safeResume });
  } catch {
    res.status(500).json({ error: 'Failed to load shared resume' });
  }
};

const deleteShare = async (req, res) => {
  try {
    const { shareId } = req.params;

    const { error } = await supabase
      .from('resume_shares')
      .update({ is_active: false })
      .eq('id', shareId)
      .eq('user_id', req.user.id);

    if (error) {
      return res.status(500).json({ error: 'Failed to deactivate share' });
    }

    res.json({ success: true });
  } catch {
    res.status(500).json({ error: 'Failed to deactivate share' });
  }
};

module.exports = { createShare, getShare, deleteShare };
