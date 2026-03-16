import axios from 'axios';
import { supabase } from '../config/supabase';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || (process.env.NODE_ENV === 'production' ? '' : 'http://localhost:5002'),
  headers: { 'Content-Type': 'application/json' },
});

// Attach Supabase auth token to every request
api.interceptors.request.use(async (config) => {
  const { data: { session } } = await supabase.auth.getSession();
  if (session?.access_token) {
    config.headers.Authorization = `Bearer ${session.access_token}`;
  }
  return config;
});

// Handle 401 responses — session expired or invalid
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      await supabase.auth.signOut();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// AI endpoints
export const generateSummary = (resumeData, jobTitle) =>
  api.post('/api/ai/summary', { resumeData, jobTitle }).then((r) => r.data);

export const enhanceExperience = (experience) =>
  api.post('/api/ai/enhance-experience', { experience }).then((r) => r.data);

export const generateCoverLetter = (resumeData, jobDescription) =>
  api.post('/api/ai/cover-letter', { resumeData, jobDescription }).then((r) => r.data);

export const suggestSkills = (resumeData, jobDescription) =>
  api.post('/api/ai/suggest-skills', { resumeData, jobDescription }).then((r) => r.data);

export const tailorResume = (resumeData, jobDescription) =>
  api.post('/api/ai/tailor', { resumeData, jobDescription }).then((r) => r.data);

// PDF generation
export const generatePDF = (resumeData, template) =>
  api.post('/api/pdf/generate', { resumeData, template }, { responseType: 'blob' }).then((r) => r.data);

// DOCX generation
export const generateDOCX = (resumeData, template) =>
  api.post('/api/pdf/generate-docx', { resumeData, template }, { responseType: 'blob' }).then((r) => r.data);

// ATS quick score
export const quickATSScore = (resumeData, jobTitle, jobDescription) =>
  api.post('/api/ats/quick-score', { resumeData, jobTitle, jobDescription }).then((r) => r.data);

// Interview Prep
export const generateInterviewQuestions = (resumeData, jobDescription) =>
  api.post('/api/ai/interview-questions', { resumeData, jobDescription }).then((r) => r.data);

export const evaluateAnswer = (question, answer, jobDescription) =>
  api.post('/api/ai/evaluate-answer', { question, answer, jobDescription }).then((r) => r.data);

// Credits
export const getCredits = () => api.get('/api/credits').then((r) => r.data);

// Health check
export const healthCheck = () => api.get('/api/health').then((r) => r.data);

export default api;
