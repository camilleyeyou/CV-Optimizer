
const express = require('express');
const router = express.Router();
const aiController = require('../controllers/aiController');
const { auth, optionalAuth } = require('../middleware/auth');

// AI routes with optional authentication - work with or without auth
router.post('/summary', optionalAuth, aiController.generateSummary);
router.post('/enhance-experience', optionalAuth, aiController.enhanceExperience);
router.post('/cover-letter', optionalAuth, aiController.generateCoverLetter);
router.post('/suggest-skills', optionalAuth, aiController.suggestSkills);
router.post('/improve-achievement', optionalAuth, aiController.improveAchievement);
router.post('/action-verbs', optionalAuth, aiController.suggestActionVerbs);
router.post('/feedback', optionalAuth, aiController.submitFeedback);
router.post('/suggestions', optionalAuth, aiController.generateSuggestions);

// If you want to require authentication for AI features in production,
// uncomment these routes and comment out the optional auth routes above:
/*
router.use(auth); // Require authentication for all AI routes

router.post('/summary', aiController.generateSummary);
router.post('/enhance-experience', aiController.enhanceExperience);
router.post('/cover-letter', aiController.generateCoverLetter);
router.post('/suggest-skills', aiController.suggestSkills);
router.post('/improve-achievement', aiController.improveAchievement);
router.post('/action-verbs', aiController.suggestActionVerbs);
router.post('/feedback', aiController.submitFeedback);
router.post('/suggestions', aiController.generateSuggestions);
*/

module.exports = router;