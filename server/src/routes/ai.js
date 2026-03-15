const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const aiController = require('../controllers/aiController');

router.use(requireAuth);

router.post('/summary', aiController.generateSummary);
router.post('/enhance-experience', aiController.enhanceExperience);
router.post('/cover-letter', aiController.generateCoverLetter);
router.post('/suggest-skills', aiController.suggestSkills);
router.post('/tailor', aiController.tailorResume);
router.post('/generate-questions', aiController.generateQuestions);
router.post('/generate-resume', aiController.generateResumeFromAnswers);

module.exports = router;
