import axios from 'axios';
import { supabase } from '../config/supabase';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || (import.meta.env.PROD ? '' : 'http://localhost:5002'),
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

// When a request uses responseType 'blob', an error response body also arrives
// as a Blob — so err.response.data.error is unreadable. Decode it and attach a
// human-readable message so callers can show the real reason (e.g. a 403).
const blobRequest = (promise) =>
  promise.then((r) => r.data).catch(async (err) => {
    const data = err.response?.data;
    if (data instanceof Blob) {
      try {
        const json = JSON.parse(await data.text());
        if (json?.error) err.serverError = json.error;
      } catch {
        // non-JSON body — leave the generic error
      }
    }
    throw err;
  });

// PDF generation
export const generatePDF = (resumeData, template) =>
  blobRequest(api.post('/api/pdf/generate', { resumeData, template }, { responseType: 'blob' }));

// DOCX generation
export const generateDOCX = (resumeData, template) =>
  blobRequest(api.post('/api/pdf/generate-docx', { resumeData, template }, { responseType: 'blob' }));

// ATS quick score
export const quickATSScore = (resumeData, jobTitle, jobDescription) =>
  api.post('/api/ats/quick-score', { resumeData, jobTitle, jobDescription }).then((r) => r.data);

// Email Generator
export const generateEmail = (type, context) =>
  api.post('/api/ai/generate-email', { type, context }).then((r) => r.data);

// Resume Translation
export const translateResume = (resumeData, targetLanguage) =>
  api.post('/api/ai/translate-resume', { resumeData, targetLanguage }).then((r) => r.data);

// Interview Prep
export const generateInterviewQuestions = (resumeData, jobDescription) =>
  api.post('/api/ai/interview-questions', { resumeData, jobDescription }).then((r) => r.data);

export const evaluateAnswer = (question, answer, jobDescription) =>
  api.post('/api/ai/evaluate-answer', { question, answer, jobDescription }).then((r) => r.data);

// Cover letter PDF/DOCX
export const generateCoverLetterPDF = (coverLetterText, personalInfo, companyName, jobTitle) =>
  api.post('/api/pdf/cover-letter-pdf', { coverLetterText, personalInfo, companyName, jobTitle }, { responseType: 'blob' }).then((r) => r.data);

export const generateCoverLetterDOCX = (coverLetterText, personalInfo, companyName, jobTitle) =>
  api.post('/api/pdf/cover-letter-docx', { coverLetterText, personalInfo, companyName, jobTitle }, { responseType: 'blob' }).then((r) => r.data);

// Resume sharing
export const createShare = (resumeId) => api.post('/api/share/create', { resumeId }).then((r) => r.data);
export const getShareByToken = (token) => api.get(`/api/share/${token}`).then((r) => r.data);
export const deleteShare = (shareId) => api.delete(`/api/share/${shareId}`).then((r) => r.data);

// Credits
export const getCredits = () => api.get('/api/credits').then((r) => r.data);

// Billing (Stripe)
export const startCheckout = (plan, interval = 'monthly') =>
  api.post('/api/billing/checkout', { plan, interval }).then((r) => r.data);
export const openBillingPortal = () =>
  api.post('/api/billing/portal').then((r) => r.data);
/** Which billing periods actually have a Stripe price behind them. Public. */
export const getBillingPlans = () =>
  api.get('/api/billing/plans').then((r) => r.data);

// Account (data rights)
export const exportMyData = () =>
  api.get('/api/account/export', { responseType: 'blob' }).then((r) => r.data);
export const deleteMyAccount = () =>
  api.post('/api/account/delete', { confirmText: 'DELETE' }).then((r) => r.data);

// Health check
export const healthCheck = () => api.get('/api/health').then((r) => r.data);

export default api;
