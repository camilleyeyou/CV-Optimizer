import api from './api';

export const analyzeResume = async (resume, jobDescription) => {
  const response = await api.post('/api/analyze-resume', {
    resume,
    jobDescription
  });
  return response.data;
};

export const analyzeJobDescription = async (jobDescription) => {
  const response = await api.post('/api/analyze-job-description', {
    jobDescription
  });
  return response.data;
};

export const generateSuggestions = async (fieldType, currentContent, jobDescription) => {
  const response = await api.post('/api/generate-suggestions', {
    fieldType,
    currentContent,
    jobDescription
  });
  return response.data;
};

export const generateEnhancedSuggestions = async (type, currentContent, jobDescription, improvementFocus) => {
  const response = await api.post('/api/enhanced-suggestions', {
    type,
    currentContent,
    jobDescription,
    improvementFocus
  });
  return response.data;
};

export const generateCoverLetter = async (resume, jobDetails) => {
  const response = await api.post('/api/generate-cover-letter', {
    resume,
    jobDetails
  });
  return response.data;
};

export const submitFeedback = async (feedbackData) => {
  const response = await api.post('/api/feedback', feedbackData);
  return response.data;
};
