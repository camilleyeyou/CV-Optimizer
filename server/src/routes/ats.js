const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const { requireCredits } = require('../middleware/credits');
const atsController = require('../controllers/atsController');

// Public route (rate limited in server.js)
router.post('/public-score', atsController.publicQuickScore);

// Authenticated routes
router.post('/analyze', requireAuth, requireCredits, atsController.analyzeResume);
router.post('/optimize', requireAuth, requireCredits, atsController.optimizeResume);
router.post('/parse', requireAuth, requireCredits, atsController.parseResume);
router.post('/quick-score', requireAuth, requireCredits, atsController.quickScore);

module.exports = router;
