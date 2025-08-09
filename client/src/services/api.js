import axios from 'axios';

// Create a basic axios instance with minimal configuration
const api = axios.create({
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for adding auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Log the request URL for debugging
    console.log('Request URL:', config.url);
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for handling authentication errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error);
    if (error.response && error.response.status === 401) {
      // Redirect to login page if unauthorized
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// 🔧 HEALTH CHECK
export const healthCheck = async () => {
  try {
    const response = await api.get('/api/health');
    return response.data;
  } catch (error) {
    throw error;
  }
};

// 🔧 AUTHENTICATION FUNCTIONS
export const login = async (credentials) => {
  try {
    const response = await api.post('/api/auth/login', credentials);
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
    }
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const register = async (userData) => {
  try {
    const response = await api.post('/api/auth/register', userData);
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
    }
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const logout = () => {
  localStorage.removeItem('token');
};

export const getCurrentUser = async () => {
  try {
    const response = await api.get('/api/auth/me');
    return response.data;
  } catch (error) {
    throw error;
  }
};

// 🔧 RESUME MANAGEMENT FUNCTIONS (NEW)

// Save/Create Resume
export const saveResume = async (resumeData) => {
  try {
    console.log('💾 API: Saving resume to database:', resumeData.id);
    
    // If resume has an ID, try to update it first
    if (resumeData.id) {
      try {
        const response = await api.put(`/api/resumes/${resumeData.id}`, resumeData);
        console.log('✅ API: Resume updated in database');
        return response.data;
      } catch (updateError) {
        // If update fails (e.g., resume doesn't exist), try to create it
        if (updateError.response?.status === 404) {
          console.log('📝 API: Resume not found, creating new one');
          const response = await api.post('/api/resumes', resumeData);
          console.log('✅ API: Resume created in database');
          return response.data;
        }
        throw updateError;
      }
    } else {
      // Create new resume
      const response = await api.post('/api/resumes', resumeData);
      console.log('✅ API: New resume created in database');
      return response.data;
    }
  } catch (error) {
    console.error('❌ API: Failed to save resume:', error.response?.data || error.message);
    throw error;
  }
};

// Get single resume
export const getResume = async (resumeId) => {
  try {
    console.log('🔍 API: Fetching resume from database:', resumeId);
    const response = await api.get(`/api/resumes/${resumeId}`);
    console.log('✅ API: Resume fetched from database');
    return response.data;
  } catch (error) {
    console.error('❌ API: Failed to fetch resume:', error.response?.data || error.message);
    throw error;
  }
};

// Get all resumes for current user
export const getResumes = async () => {
  try {
    console.log('📋 API: Fetching all resumes from database');
    const response = await api.get('/api/resumes');
    console.log('✅ API: All resumes fetched from database');
    console.log('🔍 API: Raw response data:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ API: Failed to fetch resumes:', error.response?.data || error.message);
    throw error;
  }
};

// Delete resume
export const deleteResume = async (resumeId) => {
  try {
    console.log('🗑️ API: Deleting resume from database:', resumeId);
    const response = await api.delete(`/api/resumes/${resumeId}`);
    console.log('✅ API: Resume deleted from database');
    return response.data;
  } catch (error) {
    console.error('❌ API: Failed to delete resume:', error.response?.data || error.message);
    throw error;
  }
};

// 🔧 PDF GENERATION (if you have this endpoint)
export const generatePDF = async (resumeData) => {
  try {
    console.log('📄 API: Generating PDF');
    const response = await api.post('/api/pdf/generate', resumeData, {
      responseType: 'blob' // Important for PDF download
    });
    console.log('✅ API: PDF generated successfully');
    return response.data;
  } catch (error) {
    console.error('❌ API: Failed to generate PDF:', error.response?.data || error.message);
    throw error;
  }
};

// 🔧 AI SERVICES (if you have these endpoints)
export const generateAISummary = async (resumeData, jobTitle) => {
  try {
    console.log('🤖 API: Generating AI summary');
    const response = await api.post('/api/ai/summary', {
      resumeData,
      jobTitle
    });
    console.log('✅ API: AI summary generated');
    return response.data;
  } catch (error) {
    console.error('❌ API: Failed to generate AI summary:', error.response?.data || error.message);
    throw error;
  }
};

export const enhanceExperience = async (experienceData) => {
  try {
    console.log('🤖 API: Enhancing experience with AI');
    const response = await api.post('/api/ai/enhance-experience', {
      experience: experienceData
    });
    console.log('✅ API: Experience enhanced with AI');
    return response.data;
  } catch (error) {
    console.error('❌ API: Failed to enhance experience:', error.response?.data || error.message);
    throw error;
  }
};

export const suggestSkills = async (resumeData, jobDescription) => {
  try {
    console.log('🤖 API: Getting AI skill suggestions');
    const response = await api.post('/api/ai/suggest-skills', {
      resumeData,
      jobDescription
    });
    console.log('✅ API: AI skill suggestions generated');
    return response.data;
  } catch (error) {
    console.error('❌ API: Failed to get skill suggestions:', error.response?.data || error.message);
    throw error;
  }
};

export const generateCoverLetter = async (resumeData, jobDescription) => {
  try {
    console.log('🤖 API: Generating AI cover letter');
    const response = await api.post('/api/ai/cover-letter', {
      resumeData,
      jobDescription
    });
    console.log('✅ API: AI cover letter generated');
    return response.data;
  } catch (error) {
    console.error('❌ API: Failed to generate cover letter:', error.response?.data || error.message);
    throw error;
  }
};

// 🔧 UTILITY FUNCTIONS
export const handleApiError = (error) => {
  if (error.response) {
    // Server responded with error status
    const message = error.response.data?.message || error.response.data?.error || 'An error occurred';
    return message;
  } else if (error.request) {
    // Request was made but no response received
    return 'Network error. Please check your connection.';
  } else {
    // Something else happened
    return error.message || 'An unexpected error occurred';
  }
};

// Export the axios instance as default (for backward compatibility)
export default api;