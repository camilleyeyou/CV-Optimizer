import api from './api';

// Get list of user's resumes
export const getResumes = async () => {
  try {
    const response = await api.get('/api/resume');
    return response.data;
  } catch (error) {
    console.error('Error fetching resumes:', error);
    throw error;
  }
};

// Get a specific resume by ID
export const getResumeById = async (resumeId) => {
  try {
    const response = await api.get(`/api/resume/${resumeId}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching resume ${resumeId}:`, error);
    throw error;
  }
};

// Create a new resume
export const createResume = async (resumeData) => {
  try {
    const response = await api.post('/api/resume', resumeData);
    return response.data;
  } catch (error) {
    console.error('Error creating resume:', error);
    throw error;
  }
};

// Update an existing resume
export const updateResume = async (resumeId, resumeData) => {
  try {
    const response = await api.put(`/api/resume/${resumeId}`, resumeData);
    return response.data;
  } catch (error) {
    console.error(`Error updating resume ${resumeId}:`, error);
    throw error;
  }
};

// Delete a resume
export const deleteResume = async (resumeId) => {
  try {
    const response = await api.delete(`/api/resume/${resumeId}`);
    return response.data;
  } catch (error) {
    console.error(`Error deleting resume ${resumeId}:`, error);
    throw error;
  }
};

// Function to generate PDF - only supports resumeId
export const generatePDF = async (resumeData, template) => {
  try {
    console.log('Generating PDF with template:', template);
    
    // Check if we have the resume ID
    const resumeId = resumeData._id;
    
    if (!resumeId) {
      throw new Error('Resume ID is required to generate a PDF. Please save your resume first.');
    }
    
    console.log('Using resumeId for PDF generation:', resumeId);
    
    // Make API request to generate PDF
    const response = await fetch('/api/pdf/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}` // Make sure token is included
      },
      body: JSON.stringify({
        resumeId: resumeId,
        template: template || 'modern'
      }),
    });
    
    // Check for successful response
    if (!response.ok) {
      console.error('PDF generation failed with status:', response.status);
      const errorText = await response.text();
      console.error('Error response:', errorText);
      throw new Error(`PDF generation failed: ${response.status} ${response.statusText}`);
    }
    
    // Get the blob directly from the response
    const pdfBlob = await response.blob();
    console.log('PDF blob received:', pdfBlob.type, pdfBlob.size);
    
    return pdfBlob;
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw error;
  }
};

// Function to get AI suggestions
export const getAISuggestions = async (section, content) => {
  try {
    const response = await api.post('/api/ai/suggest', { section, content });
    return response.data;
  } catch (error) {
    console.error('Error getting AI suggestions:', error);
    throw error;
  }
};

// Function to analyze resume for ATS
export const analyzeResumeATS = async (resumeData, jobDescription) => {
  try {
    const response = await api.post('/api/ai/analyze-ats', { 
      resume: resumeData,
      jobDescription 
    });
    return response.data;
  } catch (error) {
    console.error('Error analyzing resume for ATS:', error);
    throw error;
  }
};

export default {
  getResumes,
  getResumeById,
  createResume,
  updateResume,
  deleteResume,
  generatePDF,
  getAISuggestions,
  analyzeResumeATS
};
