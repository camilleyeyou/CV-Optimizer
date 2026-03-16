const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const { requireCredits } = require('../middleware/credits');
const aiController = require('../controllers/aiController');
const {
  validateSummary,
  validateEnhanceExperience,
  validateCoverLetter,
  validateSuggestSkills,
  validateTailor,
  validateGenerateQuestions,
  validateGenerateResume,
  validateInterviewQuestions,
  validateEvaluateAnswer,
} = require('../middleware/validate');

router.use(requireAuth);

router.post('/summary', validateSummary, requireCredits, aiController.generateSummary);
router.post('/enhance-experience', validateEnhanceExperience, requireCredits, aiController.enhanceExperience);
router.post('/cover-letter', validateCoverLetter, requireCredits, aiController.generateCoverLetter);
router.post('/suggest-skills', validateSuggestSkills, requireCredits, aiController.suggestSkills);
router.post('/tailor', validateTailor, requireCredits, aiController.tailorResume);
router.post('/generate-questions', validateGenerateQuestions, requireCredits, aiController.generateQuestions);
router.post('/generate-resume', validateGenerateResume, requireCredits, aiController.generateResumeFromAnswers);
router.post('/interview-questions', validateInterviewQuestions, requireCredits, aiController.generateInterviewQuestions);
router.post('/evaluate-answer', validateEvaluateAnswer, requireCredits, aiController.evaluateAnswer);

module.exports = router;
