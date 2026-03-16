const { body, validationResult } = require('express-validator');

// Run validation and return 400 if errors
const handleValidation = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: errors.array()[0].msg,
      details: errors.array().map((e) => ({ field: e.path, message: e.msg })),
    });
  }
  next();
};

// AI route validators
const validateSummary = [
  body('resumeData').isObject().withMessage('Resume data is required'),
  handleValidation,
];

const validateEnhanceExperience = [
  body('experience').isObject().withMessage('Experience data is required'),
  body('experience.position').optional().isString(),
  body('experience.company').optional().isString(),
  handleValidation,
];

const validateCoverLetter = [
  body('resumeData').isObject().withMessage('Resume data is required'),
  body('jobDescription')
    .isString()
    .isLength({ min: 10, max: 10000 })
    .withMessage('Job description is required (10-10000 chars)'),
  handleValidation,
];

const validateSuggestSkills = [
  body('resumeData').isObject().withMessage('Resume data is required'),
  body('jobDescription')
    .isString()
    .isLength({ min: 10, max: 10000 })
    .withMessage('Job description is required (10-10000 chars)'),
  handleValidation,
];

const validateTailor = [
  body('resumeData').isObject().withMessage('Resume data is required'),
  body('jobDescription')
    .isString()
    .isLength({ min: 10, max: 10000 })
    .withMessage('Job description is required (10-10000 chars)'),
  handleValidation,
];

const validateGenerateQuestions = [
  body('jobDescription')
    .isString()
    .isLength({ min: 10, max: 10000 })
    .withMessage('Job description is required (10-10000 chars)'),
  handleValidation,
];

const validateGenerateResume = [
  body('jobDescription')
    .isString()
    .isLength({ min: 10, max: 10000 })
    .withMessage('Job description is required'),
  body('answers').isObject().withMessage('Answers are required'),
  handleValidation,
];

const validateInterviewQuestions = [
  body('resumeData').isObject().withMessage('Resume data is required'),
  body('jobDescription')
    .isString()
    .isLength({ min: 10, max: 10000 })
    .withMessage('Job description is required (10-10000 chars)'),
  handleValidation,
];

const validateEvaluateAnswer = [
  body('question').isString().isLength({ min: 1 }).withMessage('Question is required'),
  body('answer').isString().isLength({ min: 1 }).withMessage('Answer is required'),
  body('jobDescription').isString().isLength({ min: 10 }).withMessage('Job description is required'),
  handleValidation,
];

// PDF route validators
const validatePDF = [
  body('resumeData').isObject().withMessage('Resume data is required'),
  body('template').optional().isString().isIn(['modern', 'classic', 'minimal', 'professional']).withMessage('Invalid template'),
  handleValidation,
];

module.exports = {
  validateSummary,
  validateEnhanceExperience,
  validateCoverLetter,
  validateSuggestSkills,
  validateTailor,
  validateGenerateQuestions,
  validateGenerateResume,
  validateInterviewQuestions,
  validateEvaluateAnswer,
  validatePDF,
};
