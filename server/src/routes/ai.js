const express = require('express');
const router = express.Router();
const aiController = require('../controllers/aiController');
const { auth } = require('../middleware/auth');

// All routes require authentication
router.use(auth);

// AI-powered features
router.post('/summary', aiController.generateSummary);
router.post('/enhance-experience', aiController.enhanceExperience);
router.post('/cover-letter', aiController.generateCoverLetter);
router.post('/suggest-skills', aiController.suggestSkills);
router.post('/improve-achievement', aiController.improveAchievement);
router.post('/action-verbs', aiController.suggestActionVerbs);

module.exports = router;
