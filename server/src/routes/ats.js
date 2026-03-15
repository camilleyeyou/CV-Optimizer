const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const atsController = require('../controllers/atsController');

router.use(requireAuth);

router.post('/analyze', atsController.analyzeResume);

module.exports = router;
