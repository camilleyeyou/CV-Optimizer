const openaiService = require('../services/openaiService');
const logger = require('../logger');

// Log the real upstream error (so production failures are diagnosable) and
// return an appropriate message. Quota / rate-limit errors get a clearer,
// actionable message instead of a generic 500.
function handleAiError(res, error, action) {
  const status = error?.status;
  logger.error(
    { status, code: error?.code, type: error?.type, err: error?.message, action },
    'AI request failed'
  );
  if (status === 429) {
    return res.status(503).json({
      error: 'The AI service is busy or over its usage limit right now. Please try again shortly.',
    });
  }
  return res.status(500).json({ error: `Failed to ${action}. Please try again.` });
}

const generateSummary = async (req, res) => {
  try {
    const { resumeData, jobTitle } = req.body;
    const summary = await openaiService.generateSummary(resumeData, jobTitle);
    res.json({ summary });
  } catch (error) {
    handleAiError(res, error, 'generate summary');
  }
};

const enhanceExperience = async (req, res) => {
  try {
    const { experience } = req.body;
    const enhancedDescription = await openaiService.enhanceExperience(experience);
    res.json({ enhancedDescription });
  } catch (error) {
    handleAiError(res, error, 'enhance experience');
  }
};

const generateCoverLetter = async (req, res) => {
  try {
    const { resumeData, jobDescription } = req.body;
    const coverLetter = await openaiService.generateCoverLetter(resumeData, jobDescription);
    res.json({ coverLetter });
  } catch (error) {
    handleAiError(res, error, 'generate cover letter');
  }
};

const suggestSkills = async (req, res) => {
  try {
    const { resumeData, jobDescription } = req.body;
    const suggestions = await openaiService.suggestSkills(resumeData, jobDescription);
    res.json({ suggestions });
  } catch (error) {
    handleAiError(res, error, 'suggest skills');
  }
};

const tailorResume = async (req, res) => {
  try {
    const { resumeData, jobDescription } = req.body;
    const analysis = await openaiService.tailorResume(resumeData, jobDescription);
    res.json(analysis);
  } catch (error) {
    handleAiError(res, error, 'analyze resume');
  }
};

const generateQuestions = async (req, res) => {
  try {
    const { jobDescription } = req.body;
    const result = await openaiService.generateQuestions(jobDescription);
    res.json(result);
  } catch (error) {
    handleAiError(res, error, 'analyze job description');
  }
};

const generateResumeFromAnswers = async (req, res) => {
  try {
    const { jobDescription, answers, jobTitle } = req.body;
    const resume = await openaiService.generateResumeFromAnswers(jobDescription, answers, jobTitle);
    res.json({ resume });
  } catch (error) {
    handleAiError(res, error, 'generate resume');
  }
};

const generateInterviewQuestions = async (req, res) => {
  try {
    const { resumeData, jobDescription } = req.body;
    const questions = await openaiService.generateInterviewQuestions(resumeData, jobDescription);
    res.json({ questions });
  } catch (error) {
    handleAiError(res, error, 'generate interview questions');
  }
};

const evaluateAnswer = async (req, res) => {
  try {
    const { question, answer, jobDescription } = req.body;
    const evaluation = await openaiService.evaluateAnswer(question, answer, jobDescription);
    res.json(evaluation);
  } catch (error) {
    handleAiError(res, error, 'evaluate answer');
  }
};

const generateEmail = async (req, res) => {
  try {
    const { type, context } = req.body;
    const email = await openaiService.generateEmail(type, context);
    res.json(email);
  } catch (error) {
    handleAiError(res, error, 'generate email');
  }
};

const translateResume = async (req, res) => {
  try {
    const { resumeData, targetLanguage } = req.body;
    const translated = await openaiService.translateResume(resumeData, targetLanguage);
    res.json(translated);
  } catch (error) {
    handleAiError(res, error, 'translate resume');
  }
};

module.exports = {
  generateSummary,
  enhanceExperience,
  generateCoverLetter,
  suggestSkills,
  tailorResume,
  generateQuestions,
  generateResumeFromAnswers,
  generateInterviewQuestions,
  evaluateAnswer,
  generateEmail,
  translateResume,
};
