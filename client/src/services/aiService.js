import api from './api';

// Mapping our frontend functions to the appropriate backend endpoints
export const analyzeResume = async (resume, jobDescription) => {
  const response = await api.post('/api/ai/optimize-ats', {
    resume,
    jobDescription
  });
  return response.data;
};

export const analyzeJobDescription = async (jobDescription) => {
  const response = await api.post('/api/ai/suggest-skills', {
    jobDescription
  });
  return response.data;
};

export const generateSuggestions = async (fieldType, currentContent, jobDescription) => {
  const response = await api.post('/api/ai/summary', {
    fieldType,
    currentContent,
    jobDescription
  });
  return response.data;
};

export const generateEnhancedSuggestions = async (type, currentContent, jobDescription, improvementFocus) => {
  const response = await api.post('/api/ai/enhance-experience', {
    type,
    currentContent,
    jobDescription,
    improvementFocus
  });
  return response.data;
};

export const generateCoverLetter = async (resume, jobDetails) => {
  const response = await api.post('/api/ai/cover-letter', {
    resume,
    jobDetails
  });
  return response.data;
};

export const submitFeedback = async (feedbackData) => {
  const response = await api.post('/api/ai/improve-achievement', feedbackData);
  return response.data;
};

// Additional methods that match your backend
export const suggestActionVerbs = async (context) => {
  const response = await api.post('/api/ai/action-verbs', {
    context
  });
  return response.data;
};
