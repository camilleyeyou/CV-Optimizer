import axios from 'axios';

const API_URL = '/api';

// Helper function to get the auth token
const getAuthHeader = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

// Get all resumes
export const getResumes = async () => {
  try {
    const response = await axios.get(`${API_URL}/resume`, {
      headers: getAuthHeader()
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching resumes:', error);
    throw error;
  }
};

// Get a specific resume by ID
export const getResumeById = async (resumeId) => {
  try {
    const response = await axios.get(`${API_URL}/resume/${resumeId}`, {
      headers: getAuthHeader()
    });
    return response.data.resume;
  } catch (error) {
    console.error(`Error fetching resume ${resumeId}:`, error);
    throw error;
  }
};

// Create a new resume
export const createResume = async (resumeData) => {
  try {
    const response = await axios.post(`${API_URL}/resume`, resumeData, {
      headers: getAuthHeader()
    });
    return response.data.resume;
  } catch (error) {
    console.error('Error creating resume:', error);
    throw error;
  }
};

// Update an existing resume
export const updateResume = async (resumeId, resumeData) => {
  try {
    const response = await axios.put(`${API_URL}/resume/${resumeId}`, resumeData, {
      headers: getAuthHeader()
    });
    return response.data.resume;
  } catch (error) {
    console.error(`Error updating resume ${resumeId}:`, error);
    throw error;
  }
};

// Delete a resume
export const deleteResume = async (resumeId) => {
  try {
    const response = await axios.delete(`${API_URL}/resume/${resumeId}`, {
      headers: getAuthHeader()
    });
    return response.data;
  } catch (error) {
    console.error(`Error deleting resume ${resumeId}:`, error);
    throw error;
  }
};

// Get available templates
export const getTemplates = async () => {
  try {
    const response = await axios.get(`${API_URL}/resume/templates`, {
      headers: getAuthHeader()
    });
    return response.data.templates;
  } catch (error) {
    console.error('Error fetching templates:', error);
    throw error;
  }
};

// Generate PDF
export const generatePDF = async (resume, template) => {
  try {
    const response = await axios.post(
      `${API_URL}/pdf/generate`,
      {
        resumeId: resume._id,
        template: template
      },
      {
        headers: {
          ...getAuthHeader(),
          'Content-Type': 'application/json',
        },
        responseType: 'blob' // Important! This tells axios to handle the response as binary data
      }
    );
    
    // Return the blob directly
    return response.data;
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw error;
  }
};

// Preview PDF as base64
export const previewPDF = async (resume, template) => {
  try {
    const response = await axios.post(
      `${API_URL}/pdf/preview`,
      {
        resumeId: resume._id,
        template: template
      },
      {
        headers: {
          ...getAuthHeader(),
          'Content-Type': 'application/json',
        }
      }
    );
    return response.data;
  } catch (error) {
    console.error('Error previewing PDF:', error);
    throw error;
  }
};
