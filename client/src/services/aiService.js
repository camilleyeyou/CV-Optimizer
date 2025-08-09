import axios from 'axios';

const API_BASE_URL = '/api/ai';

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to include auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 🔧 ULTRA SAFE: Get resume data from localStorage by ID
const getResumeDataById = (resumeId) => {
  try {
    // Ensure resumeId is a string
    if (!resumeId || typeof resumeId !== 'string') {
      console.error('Invalid resumeId:', resumeId, typeof resumeId);
      return null;
    }

    const savedResumes = localStorage.getItem('resumes');
    if (!savedResumes) {
      console.error('No resumes found in localStorage');
      return null;
    }

    const resumes = JSON.parse(savedResumes);
    if (!Array.isArray(resumes)) {
      console.error('Resumes is not an array:', resumes);
      return null;
    }

    const resume = resumes.find(r => r && r.id === resumeId);
    if (!resume) {
      console.error('Resume not found for ID:', resumeId);
      console.log('Available resume IDs:', resumes.map(r => r?.id));
    }

    return resume;
  } catch (error) {
    console.error('Error getting resume data:', error);
    return null;
  }
};

// 🔧 ULTRA SAFE: Validate resume ID
const validateResumeId = (resumeId) => {
  if (!resumeId) {
    throw new Error('Resume ID is required');
  }
  if (typeof resumeId !== 'string') {
    throw new Error(`Resume ID must be a string, got ${typeof resumeId}: ${JSON.stringify(resumeId)}`);
  }
  if (resumeId.trim() === '') {
    throw new Error('Resume ID cannot be empty');
  }
  return resumeId.trim();
};

// Main function - ULTRA SAFE VERSION
export const generateEnhancedSuggestions = async (type, currentContent, jobDescription, improvementFocus) => {
  try {
    console.log('🔧 generateEnhancedSuggestions called with:', { type, currentContent, jobDescription, improvementFocus });
    
    let response;
    
    switch (type) {
      case 'summary':
        // Validate and get resume data
        const validResumeId = validateResumeId(currentContent);
        const resumeData = getResumeDataById(validResumeId);
        if (!resumeData) {
          throw new Error('Resume not found. Please save your resume first.');
        }
        
        console.log('📋 Generating summary for resume:', validResumeId);
        response = await generateSummary(validResumeId, jobDescription, resumeData);
        return {
          suggestions: [{
            text: response.summary,
            reasoning: `Generated professional summary focusing on ${improvementFocus}`
          }]
        };
        
      case 'skill':
        // Validate and get resume data
        const validSkillResumeId = validateResumeId(currentContent);
        const skillResumeData = getResumeDataById(validSkillResumeId);
        if (!skillResumeData) {
          throw new Error('Resume not found. Please save your resume first.');
        }
        
        console.log('🎯 Generating skills for resume:', validSkillResumeId);
        response = await suggestSkills(validSkillResumeId, jobDescription, skillResumeData);
        return {
          suggestions: [
            ...response.suggestions.technical.map(skill => ({
              text: skill,
              reasoning: 'Technical skill relevant to job description'
            })),
            ...response.suggestions.soft.map(skill => ({
              text: skill,
              reasoning: 'Soft skill that enhances professional profile'
            }))
          ]
        };
        
      case 'bullet_point':
        if (!currentContent || typeof currentContent !== 'string') {
          throw new Error('Experience content is required for bullet point enhancement');
        }
        console.log('💡 Enhancing experience bullet point');
        response = await enhanceExperience(currentContent, improvementFocus);
        return {
          suggestions: response.enhancedDescription.map((desc, index) => ({
            text: desc,
            reasoning: `Enhanced bullet point #${index + 1} for better impact`
          }))
        };
        
      case 'achievement':
        if (!currentContent || typeof currentContent !== 'string') {
          throw new Error('Achievement content is required');
        }
        console.log('🏆 Improving achievement statement');
        response = await improveAchievement(currentContent, improvementFocus);
        return {
          suggestions: [{
            text: response.improvedAchievement,
            reasoning: `Improved achievement statement with focus on ${improvementFocus}`
          }]
        };
        
      case 'job_title':
        if (!currentContent || typeof currentContent !== 'string') {
          throw new Error('Job title content is required');
        }
        console.log('👔 Suggesting action verbs for job title');
        response = await suggestActionVerbs('leadership');
        return {
          suggestions: response.actionVerbs.slice(0, 5).map(verb => ({
            text: `${verb} ${currentContent}`,
            reasoning: 'Enhanced with powerful action verb'
          }))
        };
        
      default:
        throw new Error(`Unsupported suggestion type: ${type}`);
    }
  } catch (error) {
    console.error('❌ Error in generateEnhancedSuggestions:', error);
    throw error;
  }
};

// 🔧 ULTRA SAFE: Individual service functions
export const generateSummary = async (resumeId, jobTitle, resumeData = null) => {
  try {
    console.log('🔧 generateSummary called with:', { resumeId, jobTitle, hasResumeData: !!resumeData });
    
    // Validate inputs
    const validResumeId = validateResumeId(resumeId);
    
    const payload = {
      jobTitle,
      updateResume: false
    };

    // NEVER send resumeId if we have resumeData - avoid MongoDB lookup
    if (resumeData && typeof resumeData === 'object') {
      payload.resumeData = resumeData;
      console.log('📋 Using provided resume data (no resumeId sent)');
    } else {
      // Only send resumeId if no resumeData is provided
      payload.resumeId = validResumeId;
      console.log('🔍 Will attempt database lookup with resumeId:', validResumeId);
    }

    console.log('📤 Sending payload:', payload);
    const response = await apiClient.post('/summary', payload);
    console.log('📥 Received response:', response.data);
    
    return response.data;
  } catch (error) {
    console.error('❌ Error generating summary:', error);
    throw error;
  }
};

export const suggestSkills = async (resumeId, jobDescription, resumeData = null) => {
  try {
    console.log('🔧 suggestSkills called with:', { resumeId, jobDescription, hasResumeData: !!resumeData });
    
    // Validate inputs
    const validResumeId = validateResumeId(resumeId);
    
    if (!jobDescription) {
      throw new Error('Job description is required for skill suggestions');
    }

    const payload = {
      jobDescription
    };

    // NEVER send resumeId if we have resumeData - avoid MongoDB lookup
    if (resumeData && typeof resumeData === 'object') {
      payload.resumeData = resumeData;
      console.log('📋 Using provided resume data (no resumeId sent)');
    } else {
      // Only send resumeId if no resumeData is provided
      payload.resumeId = validResumeId;
      console.log('🔍 Will attempt database lookup with resumeId:', validResumeId);
    }

    console.log('📤 Sending payload:', payload);
    const response = await apiClient.post('/suggest-skills', payload);
    console.log('📥 Received response:', response.data);
    
    return response.data;
  } catch (error) {
    console.error('❌ Error suggesting skills:', error);
    throw error;
  }
};

export const generateCoverLetter = async (resumeId, jobDescription) => {
  try {
    console.log('🔧 generateCoverLetter called with:', { resumeId, jobDescription });
    
    // Validate inputs
    const validResumeId = validateResumeId(resumeId);
    
    if (!jobDescription) {
      throw new Error('Job description is required for cover letter generation');
    }

    // Get resume data from localStorage
    const resumeData = getResumeDataById(validResumeId);
    
    const payload = {
      jobDescription
    };

    // NEVER send resumeId if we have resumeData - avoid MongoDB lookup
    if (resumeData && typeof resumeData === 'object') {
      payload.resumeData = resumeData;
      console.log('📋 Using provided resume data (no resumeId sent)');
    } else {
      // Only send resumeId if no resumeData is provided
      payload.resumeId = validResumeId;
      console.log('🔍 Will attempt database lookup with resumeId:', validResumeId);
    }

    console.log('📤 Sending payload:', payload);
    const response = await apiClient.post('/cover-letter', payload);
    console.log('📥 Received response:', response.data);
    
    return response.data;
  } catch (error) {
    console.error('❌ Error generating cover letter:', error);
    throw error;
  }
};

export const enhanceExperience = async (experienceData, context) => {
  try {
    console.log('🔧 enhanceExperience called with:', { experienceData, context });
    
    if (!experienceData) {
      throw new Error('Experience data is required');
    }

    const payload = {
      experience: experienceData,
      updateResume: false
    };

    console.log('📤 Sending payload:', payload);
    const response = await apiClient.post('/enhance-experience', payload);
    console.log('📥 Received response:', response.data);
    
    return response.data;
  } catch (error) {
    console.error('❌ Error enhancing experience:', error);
    throw error;
  }
};

export const improveAchievement = async (achievement, context) => {
  try {
    console.log('🔧 improveAchievement called with:', { achievement, context });
    
    if (!achievement) {
      throw new Error('Achievement statement is required');
    }

    const payload = {
      achievement,
      context
    };

    console.log('📤 Sending payload:', payload);
    const response = await apiClient.post('/improve-achievement', payload);
    console.log('📥 Received response:', response.data);
    
    return response.data;
  } catch (error) {
    console.error('❌ Error improving achievement:', error);
    throw error;
  }
};

export const suggestActionVerbs = async (category) => {
  try {
    console.log('🔧 suggestActionVerbs called with:', { category });

    const payload = {
      category
    };

    console.log('📤 Sending payload:', payload);
    const response = await apiClient.post('/action-verbs', payload);
    console.log('📥 Received response:', response.data);
    
    return response.data;
  } catch (error) {
    console.error('❌ Error suggesting action verbs:', error);
    throw error;
  }
};

// Submit feedback for AI suggestions
export const submitFeedback = async (feedbackData) => {
  try {
    console.log('🔧 submitFeedback called with:', feedbackData);
    
    const response = await apiClient.post('/feedback', feedbackData);
    return response.data;
  } catch (error) {
    console.error('❌ Error submitting feedback:', error);
    throw error;
  }
};

// Helper function to handle API errors
export const handleApiError = (error) => {
  if (error.response) {
    // Server responded with error status
    return error.response.data.error || 'An error occurred';
  } else if (error.request) {
    // Request was made but no response received
    return 'Network error. Please check your connection.';
  } else {
    // Something else happened
    return error.message || 'An unexpected error occurred';
  }
};