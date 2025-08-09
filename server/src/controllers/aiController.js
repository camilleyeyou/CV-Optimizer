const Resume = require('../models/Resume');
const aiService = require('../services/aiService');

// 🔧 ULTRA SAFE: Generate a professional summary
const generateSummary = async (req, res) => {
  try {
    const { resumeId, jobTitle, resumeData } = req.body;
    console.log('🔧 generateSummary endpoint called with:', { 
      hasResumeId: !!resumeId, 
      resumeIdType: typeof resumeId,
      hasResumeData: !!resumeData,
      jobTitle 
    });

    let resume;

    // 🚨 PRIORITY 1: Use resumeData if provided (avoid database entirely)
    if (resumeData && typeof resumeData === 'object') {
      resume = resumeData;
      console.log('✅ Using provided resume data - skipping database lookup');
    } 
    // 🚨 PRIORITY 2: Only try database if resumeData is not provided AND resumeId is valid
    else if (resumeId && typeof resumeId === 'string' && resumeId.trim() !== '') {
      console.log('🔍 Attempting database lookup for resumeId:', resumeId);
      try {
        resume = await Resume.findById(resumeId.trim());
        if (resume) {
          console.log('✅ Found resume in database');
        } else {
          console.log('❌ Resume not found in database');
          return res.status(404).json({ 
            error: 'Resume not found in database. Please provide resume data or save your resume first.' 
          });
        }
      } catch (dbError) {
        console.error('❌ Database lookup failed:', dbError.message);
        return res.status(400).json({ 
          error: 'Invalid resume ID format. Please provide resume data instead.' 
        });
      }
    } else {
      console.log('❌ Neither valid resumeData nor resumeId provided');
      return res.status(400).json({ 
        error: 'Either resumeData (object) or resumeId (string) is required' 
      });
    }

    // Generate summary
    console.log('🎯 Generating summary with AI service');
    const summary = await aiService.generateSummary(resume, jobTitle);
    console.log('✅ Summary generated successfully');

    // Optionally update the resume in database (only if we have a valid resumeId)
    if (req.body.updateResume && resumeId && typeof resumeId === 'string') {
      try {
        const dbResume = await Resume.findById(resumeId.trim());
        if (dbResume) {
          dbResume.summary = summary;
          await dbResume.save();
          console.log('✅ Updated resume in database');
        }
      } catch (updateError) {
        console.log('⚠️ Could not update database resume:', updateError.message);
      }
    }

    res.json({ summary });
  } catch (error) {
    console.error('❌ Generate summary error:', error);
    res.status(500).json({ error: 'Failed to generate summary. Please try again.' });
  }
};

// 🔧 ULTRA SAFE: Suggest skills based on job description
const suggestSkills = async (req, res) => {
  try {
    const { resumeId, jobDescription, resumeData } = req.body;
    console.log('🔧 suggestSkills endpoint called with:', { 
      hasResumeId: !!resumeId, 
      resumeIdType: typeof resumeId,
      hasResumeData: !!resumeData,
      hasJobDescription: !!jobDescription 
    });

    if (!jobDescription) {
      return res.status(400).json({ error: 'Job description is required' });
    }

    let resume;

    // 🚨 PRIORITY 1: Use resumeData if provided (avoid database entirely)
    if (resumeData && typeof resumeData === 'object') {
      resume = resumeData;
      console.log('✅ Using provided resume data - skipping database lookup');
    } 
    // 🚨 PRIORITY 2: Only try database if resumeData is not provided AND resumeId is valid
    else if (resumeId && typeof resumeId === 'string' && resumeId.trim() !== '') {
      console.log('🔍 Attempting database lookup for resumeId:', resumeId);
      try {
        resume = await Resume.findById(resumeId.trim());
        if (resume) {
          console.log('✅ Found resume in database');
        } else {
          console.log('❌ Resume not found in database');
          return res.status(404).json({ 
            error: 'Resume not found in database. Please provide resume data or save your resume first.' 
          });
        }
      } catch (dbError) {
        console.error('❌ Database lookup failed:', dbError.message);
        return res.status(400).json({ 
          error: 'Invalid resume ID format. Please provide resume data instead.' 
        });
      }
    } else {
      console.log('❌ Neither valid resumeData nor resumeId provided');
      return res.status(400).json({ 
        error: 'Either resumeData (object) or resumeId (string) is required' 
      });
    }

    // Generate skill suggestions
    console.log('🎯 Generating skill suggestions with AI service');
    const suggestions = await aiService.suggestSkills(resume, jobDescription);
    console.log('✅ Skill suggestions generated successfully');

    res.json({ suggestions });
  } catch (error) {
    console.error('❌ Suggest skills error:', error);
    res.status(500).json({ error: 'Failed to suggest skills. Please try again.' });
  }
};

// 🔧 ULTRA SAFE: Generate a cover letter
const generateCoverLetter = async (req, res) => {
  try {
    const { resumeId, jobDescription, resumeData } = req.body;
    console.log('🔧 generateCoverLetter endpoint called with:', { 
      hasResumeId: !!resumeId, 
      resumeIdType: typeof resumeId,
      hasResumeData: !!resumeData,
      hasJobDescription: !!jobDescription 
    });

    if (!jobDescription) {
      return res.status(400).json({ error: 'Job description is required' });
    }

    let resume;

    // 🚨 PRIORITY 1: Use resumeData if provided (avoid database entirely)
    if (resumeData && typeof resumeData === 'object') {
      resume = resumeData;
      console.log('✅ Using provided resume data - skipping database lookup');
    } 
    // 🚨 PRIORITY 2: Only try database if resumeData is not provided AND resumeId is valid
    else if (resumeId && typeof resumeId === 'string' && resumeId.trim() !== '') {
      console.log('🔍 Attempting database lookup for resumeId:', resumeId);
      try {
        resume = await Resume.findById(resumeId.trim());
        if (resume) {
          console.log('✅ Found resume in database');
        } else {
          console.log('❌ Resume not found in database');
          return res.status(404).json({ 
            error: 'Resume not found in database. Please provide resume data or save your resume first.' 
          });
        }
      } catch (dbError) {
        console.error('❌ Database lookup failed:', dbError.message);
        return res.status(400).json({ 
          error: 'Invalid resume ID format. Please provide resume data instead.' 
        });
      }
    } else {
      console.log('❌ Neither valid resumeData nor resumeId provided');
      return res.status(400).json({ 
        error: 'Either resumeData (object) or resumeId (string) is required' 
      });
    }

    // Generate cover letter
    console.log('🎯 Generating cover letter with AI service');
    const coverLetter = await aiService.generateCoverLetter(resume, jobDescription);
    console.log('✅ Cover letter generated successfully');

    res.json({ coverLetter });
  } catch (error) {
    console.error('❌ Generate cover letter error:', error);
    res.status(500).json({ error: 'Failed to generate cover letter. Please try again.' });
  }
};

// Enhance work experience descriptions
const enhanceExperience = async (req, res) => {
  try {
    const { experienceId, resumeId, resumeData, experience } = req.body;
    console.log('🔧 enhanceExperience endpoint called with:', { 
      hasExperienceId: !!experienceId,
      hasResumeId: !!resumeId,
      hasResumeData: !!resumeData,
      hasExperience: !!experience 
    });

    let targetExperience;

    // 🚨 PRIORITY 1: Use direct experience data if provided
    if (experience && typeof experience === 'object') {
      targetExperience = experience;
      console.log('✅ Using provided experience data directly');
    } 
    // 🚨 PRIORITY 2: Use resumeData if provided
    else if (resumeData && typeof resumeData === 'object') {
      if (experienceId) {
        targetExperience = resumeData.workExperience?.find(exp => exp.id === experienceId);
        if (!targetExperience) {
          return res.status(404).json({ error: 'Experience not found in provided resume data' });
        }
        console.log('✅ Found experience in provided resume data');
      } else {
        return res.status(400).json({ error: 'Experience ID required when using resume data' });
      }
    } 
    // 🚨 PRIORITY 3: Try database lookup
    else if (resumeId && typeof resumeId === 'string') {
      try {
        const resume = await Resume.findById(resumeId.trim());
        if (!resume) {
          return res.status(404).json({ error: 'Resume not found in database. Please provide experience data.' });
        }
        
        if (experienceId) {
          targetExperience = resume.workExperience?.find(exp => exp.id === experienceId);
          if (!targetExperience) {
            return res.status(404).json({ error: 'Experience not found' });
          }
          console.log('✅ Found experience in database');
        } else {
          return res.status(400).json({ error: 'Experience ID required' });
        }
      } catch (dbError) {
        console.error('❌ Database lookup failed:', dbError.message);
        return res.status(400).json({ error: 'Invalid resume ID format. Please provide experience data.' });
      }
    } else {
      return res.status(400).json({ error: 'Either experience data, resumeData, or resumeId with experienceId is required' });
    }

    // Enhance the experience
    console.log('🎯 Enhancing experience with AI service');
    const enhancedDescription = await aiService.enhanceExperience(targetExperience);
    console.log('✅ Experience enhanced successfully');

    res.json({ enhancedDescription });
  } catch (error) {
    console.error('❌ Enhance experience error:', error);
    res.status(500).json({ error: 'Failed to enhance experience. Please try again.' });
  }
};

// Improve achievement statement
const improveAchievement = async (req, res) => {
  try {
    const { achievement, context } = req.body;
    console.log('🔧 improveAchievement endpoint called with:', { hasAchievement: !!achievement, context });

    if (!achievement) {
      return res.status(400).json({ error: 'Achievement statement is required' });
    }

    // Improve the achievement
    console.log('🎯 Improving achievement with AI service');
    const improvedAchievement = await aiService.improveAchievement(achievement, context);
    console.log('✅ Achievement improved successfully');

    res.json({ improvedAchievement });
  } catch (error) {
    console.error('❌ Improve achievement error:', error);
    res.status(500).json({ error: 'Failed to improve achievement. Please try again.' });
  }
};

// Suggest action verbs for resume bullets
const suggestActionVerbs = async (req, res) => {
  try {
    const { category } = req.body;
    console.log('🔧 suggestActionVerbs endpoint called with:', { category });

    // Get action verb suggestions
    console.log('🎯 Generating action verbs with AI service');
    const actionVerbs = await aiService.suggestActionVerbs(category);
    console.log('✅ Action verbs generated successfully');

    res.json({ actionVerbs });
  } catch (error) {
    console.error('❌ Suggest action verbs error:', error);
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

    // Log feedback data
    const feedbackData = {
      userId: req.user ? req.user._id : 'anonymous',
      suggestionType,
      suggestionText,
      rating,
      feedback,
      helpful,
      timestamp: new Date()
    };

    console.log('✅ AI Suggestion Feedback received:', feedbackData);

    res.json({ 
      message: 'Feedback submitted successfully',
      feedbackId: Date.now()
    });
  } catch (error) {
    console.error('❌ Submit feedback error:', error);
    res.status(500).json({ error: 'Failed to submit feedback. Please try again.' });
  }
};

// Generate suggestions endpoint (for backward compatibility)
const generateSuggestions = async (req, res) => {
  try {
    const { fieldType, currentContent, resumeId, resumeData } = req.body;
    console.log('🔧 generateSuggestions endpoint called with:', { fieldType, hasCurrentContent: !!currentContent, hasResumeId: !!resumeId, hasResumeData: !!resumeData });

    if (!fieldType) {
      return res.status(400).json({ error: 'Field type is required' });
    }

    let suggestions = [];
    let resume;

    // Handle resume data safely
    if (resumeData && typeof resumeData === 'object') {
      resume = resumeData;
    } else if (resumeId && typeof resumeId === 'string') {
      try {
        resume = await Resume.findById(resumeId.trim());
      } catch (dbError) {
        console.error('Database lookup failed:', dbError.message);
      }
    }

    switch (fieldType) {
      case 'summary':
        if (!resume) {
          return res.status(400).json({ error: 'Resume data is required for summary suggestions' });
        }
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
    console.error('❌ Generate suggestions error:', error);
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