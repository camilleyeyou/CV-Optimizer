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

    // Get resume data - Updated to work with UUID strings
    const resume = await Resume.findById(resumeId);

    if (!resume) {
      return res.status(404).json({ error: 'Resume not found' });
    }

    // Optional: Check if user owns this resume (if you have authentication)
    // if (req.user && resume.user && resume.user !== req.user._id) {
    //   return res.status(403).json({ error: 'Unauthorized' });
    // }

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

    // Get resume data - Updated to work with UUID strings
    const resume = await Resume.findById(resumeId);

    if (!resume) {
      return res.status(404).json({ error: 'Resume not found' });
    }

    // Optional: Check if user owns this resume
    // if (req.user && resume.user && resume.user !== req.user._id) {
    //   return res.status(403).json({ error: 'Unauthorized' });
    // }

    // Find the experience to enhance
    let experience;
    if (experienceId) {
      // Updated to work with string IDs instead of ObjectIds
      experience = resume.workExperience.find(exp => exp.id === experienceId);
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
      const expIndex = resume.workExperience.findIndex(exp => exp.id === experienceId);
      if (expIndex !== -1) {
        resume.workExperience[expIndex].description = enhancedDescription;
        await resume.save();
      }
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

    // Get resume data - Updated to work with UUID strings
    const resume = await Resume.findById(resumeId);

    if (!resume) {
      return res.status(404).json({ error: 'Resume not found' });
    }

    // Optional: Check if user owns this resume
    // if (req.user && resume.user && resume.user !== req.user._id) {
    //   return res.status(403).json({ error: 'Unauthorized' });
    // }

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

    // Get resume data - Updated to work with UUID strings
    const resume = await Resume.findById(resumeId);

    if (!resume) {
      return res.status(404).json({ error: 'Resume not found' });
    }

    // Optional: Check if user owns this resume
    // if (req.user && resume.user && resume.user !== req.user._id) {
    //   return res.status(403).json({ error: 'Unauthorized' });
    // }

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

// Submit feedback for AI suggestions
const submitFeedback = async (req, res) => {
  try {
    const { suggestionType, suggestionText, rating, feedback, helpful } = req.body;

    // Validate required fields
    if (!suggestionType) {
      return res.status(400).json({ error: 'Suggestion type is required' });
    }

    // Log feedback data (you can later save this to a database)
    const feedbackData = {
      userId: req.user ? req.user._id : 'anonymous', // Handle case where no user auth
      suggestionType,
      suggestionText,
      rating,
      feedback,
      helpful,
      timestamp: new Date()
    };

    console.log('AI Suggestion Feedback:', feedbackData);

    // If you have a Feedback model, you could save it like this:
    // const feedbackEntry = new Feedback(feedbackData);
    // await feedbackEntry.save();

    res.json({ 
      message: 'Feedback submitted successfully',
      feedbackId: Date.now() // You can replace this with actual ID from database
    });
  } catch (error) {
    console.error('Submit feedback error:', error);
    res.status(500).json({ error: 'Failed to submit feedback. Please try again.' });
  }
};

// Generate suggestions endpoint (for backward compatibility)
const generateSuggestions = async (req, res) => {
  try {
    const { fieldType, currentContent, resumeId } = req.body;

    if (!fieldType) {
      return res.status(400).json({ error: 'Field type is required' });
    }

    let suggestions = [];

    switch (fieldType) {
      case 'summary':
        if (!resumeId) {
          return res.status(400).json({ error: 'Resume ID is required for summary suggestions' });
        }
        // Updated to work with UUID strings
        const resume = await Resume.findById(resumeId);
        if (!resume) {
          return res.status(404).json({ error: 'Resume not found' });
        }
        // Optional: Check if user owns this resume
        // if (req.user && resume.user && resume.user !== req.user._id) {
        //   return res.status(403).json({ error: 'Unauthorized' });
        // }
        const summary = await aiService.generateSummary(resume);
        suggestions = [summary];
        break;

      case 'experience':
        const enhancedDesc = await aiService.enhanceExperience({ 
          position: currentContent || 'Software Developer',
          description: currentContent 
        });
        suggestions = enhancedDesc;
        break;

      case 'achievement':
        const improved = await aiService.improveAchievement(currentContent);
        suggestions = [improved];
        break;

      default:
        const actionVerbs = await aiService.suggestActionVerbs();
        suggestions = actionVerbs.slice(0, 5);
    }

    res.json({ suggestions });
  } catch (error) {
    console.error('Generate suggestions error:', error);
    res.status(500).json({ error: 'Failed to generate suggestions. Please try again.' });
  }
};

module.exports = {
  generateSummary,
  enhanceExperience,
  generateCoverLetter,
  suggestSkills,
  improveAchievement,
  suggestActionVerbs,
  submitFeedback,
  generateSuggestions
};