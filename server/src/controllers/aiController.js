const openaiService = require('../services/openaiService');

const generateSummary = async (req, res) => {
  try {
    const { resumeData, jobTitle } = req.body;
    const summary = await openaiService.generateSummary(resumeData, jobTitle);
    res.json({ summary });
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate summary' });
  }
};

const enhanceExperience = async (req, res) => {
  try {
    const { experience } = req.body;
    const enhancedDescription = await openaiService.enhanceExperience(experience);
    res.json({ enhancedDescription });
  } catch (error) {
    res.status(500).json({ error: 'Failed to enhance experience' });
  }
};

const generateCoverLetter = async (req, res) => {
  try {
    const { resumeData, jobDescription } = req.body;
    const coverLetter = await openaiService.generateCoverLetter(resumeData, jobDescription);
    res.json({ coverLetter });
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate cover letter' });
  }
};

const suggestSkills = async (req, res) => {
  try {
    const { resumeData, jobDescription } = req.body;
    const suggestions = await openaiService.suggestSkills(resumeData, jobDescription);
    res.json({ suggestions });
  } catch (error) {
    res.status(500).json({ error: 'Failed to suggest skills' });
  }
};

const tailorResume = async (req, res) => {
  try {
    const { resumeData, jobDescription } = req.body;
    const analysis = await openaiService.tailorResume(resumeData, jobDescription);
    res.json(analysis);
  } catch (error) {
    res.status(500).json({ error: 'Failed to analyze resume' });
  }
};

const generateQuestions = async (req, res) => {
  try {
    const { jobDescription } = req.body;
    const result = await openaiService.generateQuestions(jobDescription);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate questions' });
  }
};

const generateResumeFromAnswers = async (req, res) => {
  try {
    const { jobDescription, answers, jobTitle } = req.body;
    const resume = await openaiService.generateResumeFromAnswers(jobDescription, answers, jobTitle);
    res.json({ resume });
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate resume' });
  }
};

const generateInterviewQuestions = async (req, res) => {
  try {
    const { resumeData, jobDescription } = req.body;
    const questions = await openaiService.generateInterviewQuestions(resumeData, jobDescription);
    res.json({ questions });
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate interview questions' });
  }
};

const evaluateAnswer = async (req, res) => {
  try {
    const { question, answer, jobDescription } = req.body;
    const evaluation = await openaiService.evaluateAnswer(question, answer, jobDescription);
    res.json(evaluation);
  } catch (error) {
    res.status(500).json({ error: 'Failed to evaluate answer' });
  }
};

const generateEmail = async (req, res) => {
  try {
    const { type, context } = req.body;
    const email = await openaiService.generateEmail(type, context);
    res.json(email);
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate email' });
  }
};

const translateResume = async (req, res) => {
  try {
    const { resumeData, targetLanguage } = req.body;
    const translated = await openaiService.translateResume(resumeData, targetLanguage);
    res.json(translated);
  } catch (error) {
    res.status(500).json({ error: 'Failed to translate resume' });
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
