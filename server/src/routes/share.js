const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const { requirePlan } = require('../middleware/requirePlan');
const shareController = require('../controllers/shareController');

// Resume sharing links are a Pro feature. Viewing/deleting an existing share is
// not plan-gated so links still work and can be revoked after a downgrade.
router.post('/create', requireAuth, requirePlan(['pro', 'premium']), shareController.createShare);
router.get('/:token', shareController.getShare);
router.delete('/:shareId', requireAuth, shareController.deleteShare);

module.exports = router;
