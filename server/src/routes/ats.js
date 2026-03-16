const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const { requireCredits } = require('../middleware/credits');
const atsController = require('../controllers/atsController');

router.use(requireAuth);

router.post('/analyze', requireCredits, atsController.analyzeResume);
router.post('/optimize', requireCredits, atsController.optimizeResume);
router.post('/parse', requireCredits, atsController.parseResume);
router.post('/quick-score', requireCredits, atsController.quickScore);

module.exports = router;
