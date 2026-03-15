const openaiService = require('../services/openaiService');

const generateSummary = async (req, res) => {
  try {
    const { resumeData, jobTitle } = req.body;
    if (!resumeData) {
      return res.status(400).json({ error: 'Resume data is required' });
    }
    const summary = await openaiService.generateSummary(resumeData, jobTitle);
    res.json({ summary });
  } catch (error) {
    console.error('Generate summary error:', error.message);
    res.status(500).json({ error: 'Failed to generate summary' });
  }
};

const enhanceExperience = async (req, res) => {
  try {
    const { experience } = req.body;
    if (!experience) {
      return res.status(400).json({ error: 'Experience data is required' });
    }
    const enhancedDescription = await openaiService.enhanceExperience(experience);
    res.json({ enhancedDescription });
  } catch (error) {
    console.error('Enhance experience error:', error.message);
    res.status(500).json({ error: 'Failed to enhance experience' });
  }
};

const generateCoverLetter = async (req, res) => {
  try {
    const { resumeData, jobDescription } = req.body;
    if (!resumeData || !jobDescription) {
      return res.status(400).json({ error: 'Resume data and job description are required' });
    }
    const coverLetter = await openaiService.generateCoverLetter(resumeData, jobDescription);
    res.json({ coverLetter });
  } catch (error) {
    console.error('Generate cover letter error:', error.message);
    res.status(500).json({ error: 'Failed to generate cover letter' });
  }
};

const suggestSkills = async (req, res) => {
  try {
    const { resumeData, jobDescription } = req.body;
    if (!resumeData || !jobDescription) {
      return res.status(400).json({ error: 'Resume data and job description are required' });
    }
    const suggestions = await openaiService.suggestSkills(resumeData, jobDescription);
    res.json({ suggestions });
  } catch (error) {
    console.error('Suggest skills error:', error.message);
    res.status(500).json({ error: 'Failed to suggest skills' });
  }
};

const tailorResume = async (req, res) => {
  try {
    const { resumeData, jobDescription } = req.body;
    if (!resumeData || !jobDescription) {
      return res.status(400).json({ error: 'Resume data and job description are required' });
    }
    const analysis = await openaiService.tailorResume(resumeData, jobDescription);
    res.json(analysis);
  } catch (error) {
    console.error('Tailor resume error:', error.message);
    res.status(500).json({ error: 'Failed to analyze resume' });
  }
};

const generateQuestions = async (req, res) => {
  try {
    const { jobDescription } = req.body;
    if (!jobDescription) {
      return res.status(400).json({ error: 'Job description is required' });
    }
    const result = await openaiService.generateQuestions(jobDescription);
    res.json(result);
  } catch (error) {
    console.error('Generate questions error:', error.message);
    res.status(500).json({ error: 'Failed to generate questions' });
  }
};

const generateResumeFromAnswers = async (req, res) => {
  try {
    const { jobDescription, answers, jobTitle } = req.body;
    if (!jobDescription || !answers) {
      return res.status(400).json({ error: 'Job description and answers are required' });
    }
    const resume = await openaiService.generateResumeFromAnswers(jobDescription, answers, jobTitle);
    res.json({ resume });
  } catch (error) {
    console.error('Generate resume error:', error.message);
    res.status(500).json({ error: 'Failed to generate resume' });
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
};
