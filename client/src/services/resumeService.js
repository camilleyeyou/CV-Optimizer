import api from './api';

export const getResumes = async () => {
  const response = await api.get('/api/resumes');
  return response.data;
};

export const getResumeById = async (id) => {
  const response = await api.get(`/api/resumes/${id}`);
  return response.data;
};

export const createResume = async (resumeData) => {
  const response = await api.post('/api/resumes', resumeData);
  return response.data;
};

export const updateResume = async (id, resumeData) => {
  const response = await api.put(`/api/resumes/${id}`, resumeData);
  return response.data;
};

export const deleteResume = async (id) => {
  const response = await api.delete(`/api/resumes/${id}`);
  return response.data;
};

export const generatePDF = async (resumeData, template) => {
  const response = await api.post('/api/generate-pdf', {
    resumeData,
    template
  }, {
    responseType: 'blob' // Important for handling the PDF binary data
  });
  return response.data;
};
