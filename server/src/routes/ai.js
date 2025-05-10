const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');

// Placeholder AI controllers - we'll implement these later
const aiController = {
  generateSummary: (req, res) => res.json({ message: 'AI summary generation coming soon' }),
  enhanceExperience: (req, res) => res.json({ message: 'Experience enhancement coming soon' }),
  suggestSkills: (req, res) => res.json({ message: 'Skill suggestions coming soon' }),
  generateCoverLetter: (req, res) => res.json({ message: 'Cover letter generation coming soon' }),
  optimizeForATS: (req, res) => res.json({ message: 'ATS optimization coming soon' }),
  suggestActionVerbs: (req, res) => res.json({ message: 'Action verb suggestions coming soon' }),
  improveAchievement: (req, res) => res.json({ message: 'Achievement improvement coming soon' })
};

// All routes require authentication
router.use(auth);

// AI-powered features
router.post('/summary', aiController.generateSummary);
router.post('/enhance-experience', aiController.enhanceExperience);
router.post('/suggest-skills', aiController.suggestSkills);
router.post('/cover-letter', aiController.generateCoverLetter);
router.post('/optimize-ats', aiController.optimizeForATS);
router.post('/action-verbs', aiController.suggestActionVerbs);
router.post('/improve-achievement', aiController.improveAchievement);

module.exports = router;
