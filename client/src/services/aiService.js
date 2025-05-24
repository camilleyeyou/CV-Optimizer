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

// Main function that routes different suggestion types to appropriate endpoints
export const generateEnhancedSuggestions = async (type, currentContent, jobDescription, improvementFocus) => {
  try {
    let response;
    
    switch (type) {
      case 'summary':
        response = await generateSummary(currentContent, jobDescription);
        return {
          suggestions: [{
            text: response.summary,
            reasoning: `Generated professional summary focusing on ${improvementFocus}`
          }]
        };
        
      case 'bullet_point':
        response = await enhanceExperience(currentContent, improvementFocus);
        return {
          suggestions: response.enhancedDescription.map((desc, index) => ({
            text: desc,
            reasoning: `Enhanced bullet point #${index + 1} for better impact`
          }))
        };
        
      case 'skill':
        response = await suggestSkills(currentContent, jobDescription);
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
        
      case 'achievement':
        response = await improveAchievement(currentContent, improvementFocus);
        return {
          suggestions: [{
            text: response.improvedAchievement,
            reasoning: `Improved achievement statement with focus on ${improvementFocus}`
          }]
        };
        
      case 'job_title':
        // For job titles, we can use action verbs as suggestions
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
    console.error('Error in generateEnhancedSuggestions:', error);
    throw error;
  }
};

// Individual service functions
export const generateSummary = async (resumeId, jobTitle) => {
  try {
    const response = await apiClient.post('/summary', {
      resumeId,
      jobTitle,
      updateResume: false
    });
    return response.data;
  } catch (error) {
    console.error('Error generating summary:', error);
    throw error;
  }
};

export const enhanceExperience = async (experienceData, context) => {
  try {
    const response = await apiClient.post('/enhance-experience', {
      experience: experienceData,
      updateResume: false
    });
    return response.data;
  } catch (error) {
    console.error('Error enhancing experience:', error);
    throw error;
  }
};

export const generateCoverLetter = async (resumeId, jobDescription) => {
  try {
    const response = await apiClient.post('/cover-letter', {
      resumeId,
      jobDescription
    });
    return response.data;
  } catch (error) {
    console.error('Error generating cover letter:', error);
    throw error;
  }
};

export const suggestSkills = async (resumeId, jobDescription) => {
  try {
    const response = await apiClient.post('/suggest-skills', {
      resumeId,
      jobDescription
    });
    return response.data;
  } catch (error) {
    console.error('Error suggesting skills:', error);
    throw error;
  }
};

export const improveAchievement = async (achievement, context) => {
  try {
    const response = await apiClient.post('/improve-achievement', {
      achievement,
      context
    });
    return response.data;
  } catch (error) {
    console.error('Error improving achievement:', error);
    throw error;
  }
};

export const suggestActionVerbs = async (category) => {
  try {
    const response = await apiClient.post('/action-verbs', {
      category
    });
    return response.data;
  } catch (error) {
    console.error('Error suggesting action verbs:', error);
    throw error;
  }
};

// Submit feedback for AI suggestions
export const submitFeedback = async (feedbackData) => {
  try {
    const response = await apiClient.post('/feedback', feedbackData);
    return response.data;
  } catch (error) {
    console.error('Error submitting feedback:', error);
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