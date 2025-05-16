import api from './api';

export const getResumes = async () => {
  const response = await api.get('/api/resume');
  return response.data;
};

export const getResumeById = async (id) => {
  const response = await api.get(`/api/resume/${id}`);
  return response.data;
};

export const createResume = async (resumeData) => {
  const response = await api.post('/api/resume', resumeData);
  return response.data;
};

export const updateResume = async (id, resumeData) => {
  const response = await api.put(`/api/resume/${id}`, resumeData);
  return response.data;
};

export const deleteResume = async (id) => {
  const response = await api.delete(`/api/resume/${id}`);
  return response.data;
};

export const generatePDF = async (resumeData, template) => {
  const response = await api.post('/api/pdf/generate', {
    resumeData,
    template
  }, {
    responseType: 'blob' // Important for handling the PDF binary data
  });
  return response.data;
};

// Additional methods that match your backend
export const getTemplates = async () => {
  const response = await api.get('/api/resume/templates');
  return response.data;
};

export const duplicateResume = async (id) => {
  const response = await api.post(`/api/resume/${id}/duplicate`);
  return response.data;
};

export const analyzeResume = async (id) => {
  const response = await api.post(`/api/resume/${id}/analyze`);
  return response.data;
};
