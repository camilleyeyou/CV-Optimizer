import axios from 'axios';

// Base API URL (should be environment variable in production)
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests if available
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

/**
 * Save resume data to the backend
 * @param {Object} resumeData - The resume data to save
 * @returns {Promise} Promise with the save result
 */
export const saveResume = async (resumeData) => {
  try {
    const response = await api.post('/resumes', resumeData);
    return response.data;
  } catch (error) {
    console.error('Error saving resume:', error);
    throw error;
  }
};

/**
 * Get user's saved resumes
 * @returns {Promise} Promise with the user's resumes
 */
export const getUserResumes = async () => {
  try {
    const response = await api.get('/resumes');
    return response.data;
  } catch (error) {
    console.error('Error fetching resumes:', error);
    throw error;
  }
};

/**
 * Get a specific resume by ID
 * @param {string} id - The resume ID
 * @returns {Promise} Promise with the resume data
 */
export const getResumeById = async (id) => {
  try {
    const response = await api.get(`/resumes/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching resume:', error);
    throw error;
  }
};

/**
 * Delete a resume by ID
 * @param {string} id - The resume ID to delete
 * @returns {Promise} Promise with the delete result
 */
export const deleteResume = async (id) => {
  try {
    const response = await api.delete(`/resumes/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error deleting resume:', error);
    throw error;
  }
};

/**
 * Generate PDF from resume data
 * @param {Object} resumeData - The resume data to generate PDF from
 * @returns {Promise} Promise with the PDF blob
 */
export const generatePDF = async (resumeData) => {
  try {
    const response = await api.post('/resumes/generate-pdf', resumeData, {
      responseType: 'blob',
    });
    return response.data;
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw error;
  }
};

/**
 * Analyze resume against job description
 * @param {Object} resumeData - The resume data to analyze
 * @param {string} jobDescription - The job description to analyze against
 * @returns {Promise} Promise with the analysis results
 */
export const analyzeResume = async (resumeData, jobDescription) => {
  try {
    // For now, mock API response
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Mock response
    return {
      score: Math.floor(Math.random() * 41) + 60, // Random score between 60-100
      suggestions: [
        {
          priority: 'critical',
          title: 'Add more keywords from the job description',
          description: 'Include more key terms from the job posting to improve ATS match.',
          example: 'Try adding skills like "project management" or "data analysis".'
        },
        {
          priority: 'important',
          title: 'Use more action verbs in work experience',
          description: 'Start bullet points with strong action verbs to make your achievements stand out.',
          example: 'Instead of "Responsible for team management", try "Led a team of 5 developers".'
        },
        {
          priority: 'improvement',
          title: 'Quantify your achievements',
          description: 'Add numbers and percentages to demonstrate your impact.',
          example: 'Add metrics like "Increased sales by 15%" or "Reduced processing time by 25%".'
        }
      ]
    };
  } catch (error) {
    console.error('Error analyzing resume:', error);
    throw error;
  }
};

/**
 * Get templates
 * @returns {Promise} Promise with available templates
 */
export const getTemplates = async () => {
  try {
    // For now, mock API response
    await new Promise(resolve => setTimeout(resolve, 800));
    
    // Mock response
    return [
      { id: 'modern', name: 'Modern', premium: false, thumbnail: '/images/templates/modern-thumb.png' },
      { id: 'professional', name: 'Professional', premium: false, thumbnail: '/images/templates/professional-thumb.png' },
      { id: 'minimalist', name: 'Minimalist', premium: false, thumbnail: '/images/templates/minimalist-thumb.png' },
      { id: 'creative', name: 'Creative', premium: false, thumbnail: '/images/templates/creative-thumb.png' },
      { id: 'executive', name: 'Executive', premium: true, thumbnail: '/images/templates/executive-thumb.png' },
      { id: 'technical', name: 'Technical', premium: true, thumbnail: '/images/templates/technical-thumb.png' }
    ];
  } catch (error) {
    console.error('Error fetching templates:', error);
    throw error;
  }
};

export default {
  saveResume,
  getUserResumes,
  getResumeById,
  deleteResume,
  generatePDF,
  analyzeResume,
  getTemplates,
};
