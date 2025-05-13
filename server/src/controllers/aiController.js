const Resume = require('../models/Resume');
const aiService = require('../services/aiService');

// Generate a professional summary
const generateSummary = async (req, res) => {
  try {
    const { resumeId, jobTitle } = req.body;

    // Check if resumeId is provided
    if (!resumeId) {
      return res.status(400).json({ error: 'Resume ID is required' });
    }

    // Get resume data
    const resume = await Resume.findOne({
      _id: resumeId,
      user: req.user._id
    });

    if (!resume) {
      return res.status(404).json({ error: 'Resume not found' });
    }

    // Generate summary
    const summary = await aiService.generateSummary(resume, jobTitle);

    // Optionally update the resume summary
    if (req.body.updateResume) {
      resume.summary = summary;
      await resume.save();
    }

    res.json({ summary });
  } catch (error) {
    console.error('Generate summary error:', error);
    res.status(500).json({ error: 'Failed to generate summary. Please try again.' });
  }
};

// Enhance work experience descriptions
const enhanceExperience = async (req, res) => {
  try {
    const { experienceId, resumeId } = req.body;

    if (!resumeId) {
      return res.status(400).json({ error: 'Resume ID is required' });
    }

    // Get resume data
    const resume = await Resume.findOne({
      _id: resumeId,
      user: req.user._id
    });

    if (!resume) {
      return res.status(404).json({ error: 'Resume not found' });
    }

    // Find the experience to enhance
    let experience;
    if (experienceId) {
      experience = resume.workExperience.id(experienceId);
      if (!experience) {
        return res.status(404).json({ error: 'Experience not found' });
      }
    } else if (req.body.experience) {
      // Use provided experience data
      experience = req.body.experience;
    } else {
      return res.status(400).json({ error: 'Either experienceId or experience data is required' });
    }

    // Enhance the experience
    const enhancedDescription = await aiService.enhanceExperience(experience);

    // Optionally update the resume
    if (req.body.updateResume && experienceId) {
      experience.description = enhancedDescription;
      await resume.save();
    }

    res.json({ enhancedDescription });
  } catch (error) {
    console.error('Enhance experience error:', error);
    res.status(500).json({ error: 'Failed to enhance experience. Please try again.' });
  }
};

// Generate a cover letter
const generateCoverLetter = async (req, res) => {
  try {
    const { resumeId, jobDescription } = req.body;

    if (!resumeId || !jobDescription) {
      return res.status(400).json({ error: 'Resume ID and job description are required' });
    }

    // Get resume data
    const resume = await Resume.findOne({
      _id: resumeId,
      user: req.user._id
    });

    if (!resume) {
      return res.status(404).json({ error: 'Resume not found' });
    }

    // Generate cover letter
    const coverLetter = await aiService.generateCoverLetter(resume, jobDescription);

    res.json({ coverLetter });
  } catch (error) {
    console.error('Generate cover letter error:', error);
    res.status(500).json({ error: 'Failed to generate cover letter. Please try again.' });
  }
};

// Suggest skills based on job description
const suggestSkills = async (req, res) => {
  try {
    const { resumeId, jobDescription } = req.body;

    if (!resumeId || !jobDescription) {
      return res.status(400).json({ error: 'Resume ID and job description are required' });
    }

    // Get resume data
    const resume = await Resume.findOne({
      _id: resumeId,
      user: req.user._id
    });

    if (!resume) {
      return res.status(404).json({ error: 'Resume not found' });
    }

    // Get skill suggestions
    const suggestions = await aiService.suggestSkills(resume, jobDescription);

    res.json({ suggestions });
  } catch (error) {
    console.error('Suggest skills error:', error);
    res.status(500).json({ error: 'Failed to suggest skills. Please try again.' });
  }
};

// Improve achievement statement
const improveAchievement = async (req, res) => {
  try {
    const { achievement, context } = req.body;

    if (!achievement) {
      return res.status(400).json({ error: 'Achievement statement is required' });
    }

    // Improve the achievement
    const improvedAchievement = await aiService.improveAchievement(achievement, context);

    res.json({ improvedAchievement });
  } catch (error) {
    console.error('Improve achievement error:', error);
    res.status(500).json({ error: 'Failed to improve achievement. Please try again.' });
  }
};

// Suggest action verbs for resume bullets
const suggestActionVerbs = async (req, res) => {
  try {
    const { category } = req.body;

    // Get action verb suggestions
    const actionVerbs = await aiService.suggestActionVerbs(category);

    res.json({ actionVerbs });
  } catch (error) {
    console.error('Suggest action verbs error:', error);
    res.status(500).json({ error: 'Failed to suggest action verbs. Please try again.' });
  }
};

module.exports = {
  generateSummary,
  enhanceExperience,
  generateCoverLetter,
  suggestSkills,
  improveAchievement,
  suggestActionVerbs
};
