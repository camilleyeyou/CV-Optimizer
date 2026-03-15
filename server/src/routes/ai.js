const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const aiController = require('../controllers/aiController');
const {
  validateSummary,
  validateEnhanceExperience,
  validateCoverLetter,
  validateSuggestSkills,
  validateTailor,
  validateGenerateQuestions,
  validateGenerateResume,
} = require('../middleware/validate');

router.use(requireAuth);

router.post('/summary', validateSummary, aiController.generateSummary);
router.post('/enhance-experience', validateEnhanceExperience, aiController.enhanceExperience);
router.post('/cover-letter', validateCoverLetter, aiController.generateCoverLetter);
router.post('/suggest-skills', validateSuggestSkills, aiController.suggestSkills);
router.post('/tailor', validateTailor, aiController.tailorResume);
router.post('/generate-questions', validateGenerateQuestions, aiController.generateQuestions);
router.post('/generate-resume', validateGenerateResume, aiController.generateResumeFromAnswers);

module.exports = router;
