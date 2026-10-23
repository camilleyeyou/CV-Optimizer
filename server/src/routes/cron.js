const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const logger = require('../logger');

const router = express.Router();

const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

/**
 * Only Vercel Cron may call these. Vercel sends `Authorization: Bearer
 * $CRON_SECRET` when that env var is set on the project; without it configured
 * the endpoints stay closed rather than open to anyone.
 */
const requireCronSecret = (req, res, next) => {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.authorization !== `Bearer ${secret}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
};

/**
 * Keep the Supabase project from pausing.
 *
 * Free-tier projects pause after a week without database activity, and a
 * paused project takes auth and every app feature down with it. Scheduled in
 * vercel.json every few days; a head-only count is enough to count as activity
 * without reading any rows.
 */
router.get('/keepalive', requireCronSecret, async (req, res) => {
  const { error } = await supabase
    .from('user_profiles')
    .select('id', { count: 'exact', head: true });

  if (error) {
    logger.error({ err: error }, 'Supabase keepalive query failed');
    return res.status(502).json({ status: 'error' });
  }
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

module.exports = router;
