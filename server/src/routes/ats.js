const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const atsController = require('../controllers/atsController');

router.use(requireAuth);

router.post('/analyze', atsController.analyzeResume);
router.post('/optimize', atsController.optimizeResume);

module.exports = router;
