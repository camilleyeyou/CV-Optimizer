import React, { createContext, useContext, useState, useEffect } from 'react';
import { resumeService } from '../services/serviceFactory';
import { authService } from '../services/serviceFactory';

const ResumeContext = createContext();

export const useResume = () => useContext(ResumeContext);

// Helper function to map backend resume format to frontend format
const mapResumeToFrontendFormat = (backendResume) => {
  // This function adapts the backend resume structure to what the frontend expects
  // Customize this based on exact differences between your backend and frontend models
  
  return {
    _id: backendResume._id,
    personalInfo: {
      firstName: backendResume.personalInfo?.firstName || '',
      lastName: backendResume.personalInfo?.lastName || '',
      email: backendResume.personalInfo?.email || '',
      phone: backendResume.personalInfo?.phone || '',
      address: backendResume.personalInfo?.location?.split(',')[0] || '',
      city: backendResume.personalInfo?.location?.split(',')[1]?.trim() || '',
      state: backendResume.personalInfo?.location?.split(',')[2]?.trim() || '',
      zipCode: '',
      linkedIn: backendResume.personalInfo?.linkedin || '',
      website: backendResume.personalInfo?.website || ''
    },
    summary: backendResume.summary || '',
    workExperience: backendResume.workExperience?.map(exp => ({
      title: exp.position || '',
      company: exp.company || '',
      location: exp.location || '',
      startDate: exp.startDate ? new Date(exp.startDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long' }) : '',
      endDate: exp.endDate ? new Date(exp.endDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long' }) : '',
      current: exp.current || false,
      description: exp.description?.join('\n') || '',
      highlights: exp.achievements || []
    })) || [],
    education: backendResume.education?.map(edu => ({
      institution: edu.institution || '',
      degree: edu.degree || '',
      field: edu.fieldOfStudy || '',
      location: edu.location || '',
      startDate: edu.startDate ? new Date(edu.startDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long' }) : '',
      endDate: edu.endDate ? new Date(edu.endDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long' }) : '',
      current: edu.current || false,
      gpa: edu.gpa || ''
    })) || [],
    skills: backendResume.skills ? [
      ...backendResume.skills.technical?.map(skill => ({ name: skill, level: 'Advanced' })) || [],
      ...backendResume.skills.soft?.map(skill => ({ name: skill, level: 'Intermediate' })) || [],
    ] : [],
    certifications: backendResume.certifications?.map(cert => ({
      name: cert.name || '',
      issuer: cert.issuer || '',
      date: cert.date ? new Date(cert.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long' }) : '',
      url: cert.url || ''
    })) || [],
    projects: backendResume.projects || [],
    languages: backendResume.skills?.languages || [],
    customSections: backendResume.customSections || []
  };
};

// Helper function to map frontend resume format to backend format
const mapResumeToBackendFormat = (frontendResume) => {
  // This function adapts the frontend resume structure to what the backend expects
  // Customize this based on exact differences between your frontend and backend models
  
  return {
    name: `${frontendResume.personalInfo.firstName} ${frontendResume.personalInfo.lastName} - Resume`,
    personalInfo: {
      firstName: frontendResume.personalInfo.firstName,
      lastName: frontendResume.personalInfo.lastName,
      email: frontendResume.personalInfo.email,
      phone: frontendResume.personalInfo.phone,
      location: [
        frontendResume.personalInfo.address,
        frontendResume.personalInfo.city,
        frontendResume.personalInfo.state,
        frontendResume.personalInfo.zipCode
      ].filter(Boolean).join(', '),
      linkedin: frontendResume.personalInfo.linkedIn,
      website: frontendResume.personalInfo.website,
      github: ''
    },
    summary: frontendResume.summary,
    workExperience: frontendResume.workExperience.map(exp => ({
      company: exp.company,
      position: exp.title,
      location: exp.location,
      startDate: exp.startDate ? new Date(exp.startDate) : null,
      endDate: exp.current ? null : (exp.endDate ? new Date(exp.endDate) : null),
      current: exp.current,
      description: exp.description ? exp.description.split('\n').filter(Boolean) : [],
      achievements: exp.highlights || []
    })),
    education: frontendResume.education.map(edu => ({
      institution: edu.institution,
      degree: edu.degree,
      fieldOfStudy: edu.field,
      location: edu.location,
      startDate: edu.startDate ? new Date(edu.startDate) : null,
      endDate: edu.current ? null : (edu.endDate ? new Date(edu.endDate) : null),
      current: edu.current,
      gpa: edu.gpa,
      honors: []
    })),
    skills: {
      technical: frontendResume.skills
        .filter(skill => skill.level === 'Advanced' || skill.level === 'Expert')
        .map(skill => skill.name),
      soft: frontendResume.skills
        .filter(skill => skill.level === 'Intermediate' || skill.level === 'Beginner')
        .map(skill => skill.name),
      languages: frontendResume.languages || []
    },
    projects: frontendResume.projects || [],
    certifications: frontendResume.certifications.map(cert => ({
      name: cert.name,
      issuer: cert.issuer,
      date: cert.date ? new Date(cert.date) : null,
      expiryDate: null,
      credentialId: '',
      url: cert.url
    })),
    achievements: [],
    customSections: frontendResume.customSections || [],
    template: frontendResume.template || 'modern',
    metadata: {
      lastModified: new Date(),
      version: 1
    }
  };
};

export const ResumeProvider = ({ children }) => {
  const [resumeData, setResumeData] = useState({
    personalInfo: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      address: '',
      city: '',
      state: '',
      zipCode: '',
      linkedIn: '',
      website: ''
    },
    summary: '',
    workExperience: [],
    education: [],
    skills: [],
    certifications: [],
    projects: [],
    languages: [],
    customSections: []
  });
  
  const [activeTemplate, setActiveTemplate] = useState('modern');
  const [resumeList, setResumeList] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch user's resumes when component mounts
  useEffect(() => {
    if (authService.isAuthenticated()) {
      fetchResumes();
    }
  }, []);

  const fetchResumes = async () => {
    if (!authService.isAuthenticated()) {
      return;
    }
    
    setIsLoading(true);
    try {
      const resumes = await resumeService.getResumes();
      setResumeList(resumes);
    } catch (err) {
      console.error('Error fetching resumes:', err);
      setError('Failed to load your resumes');
    } finally {
      setIsLoading(false);
    }
  };

  const loadResume = async (resumeId) => {
    setIsLoading(true);
    try {
      const resume = await resumeService.getResumeById(resumeId);
      // Transform from backend format to frontend format
      const frontendResume = mapResumeToFrontendFormat(resume);
      setResumeData(frontendResume);
      setActiveTemplate(resume.template || 'modern');
      return frontendResume;
    } catch (err) {
      console.error('Error loading resume:', err);
      setError('Failed to load resume');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const saveResume = async () => {
    setIsLoading(true);
    try {
      // Transform from frontend format to backend format
      const backendResume = mapResumeToBackendFormat(resumeData);
      backendResume.template = activeTemplate;

      let result;
      if (resumeData._id) {
        result = await resumeService.updateResume(resumeData._id, backendResume);
      } else {
        result = await resumeService.createResume(backendResume);

        // Update the resume with the ID from the server
        setResumeData({
          ...resumeData,
          _id: result._id
        });
      }

      // Refresh the resume list
      await fetchResumes();
      
      return result;
    } catch (err) {
      console.error('Error saving resume:', err);
      setError('Failed to save resume');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const deleteResume = async (resumeId) => {
    setIsLoading(true);
    try {
      await resumeService.deleteResume(resumeId);
      
      // Refresh the resume list
      await fetchResumes();
    } catch (err) {
      console.error('Error deleting resume:', err);
      setError('Failed to delete resume');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const generatePDF = async () => {
    setIsLoading(true);
    try {
      // Transform to backend format for PDF generation
      const backendResume = mapResumeToBackendFormat(resumeData);
      
      const pdfBlob = await resumeService.generatePDF(backendResume, activeTemplate);
      
      // Create a blob URL and trigger download
      const url = window.URL.createObjectURL(pdfBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${resumeData.personalInfo.firstName}-${resumeData.personalInfo.lastName}-resume.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      return true;
    } catch (err) {
      console.error('Error generating PDF:', err);
      setError('Failed to generate PDF');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const updateResumeData = (field, value) => {
    if (field.includes('.')) {
      const [section, key] = field.split('.');
      setResumeData(prev => ({
        ...prev,
        [section]: {
          ...prev[section],
          [key]: value
        }
      }));
    } else {
      setResumeData(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  const addListItem = (section, item) => {
    setResumeData(prev => ({
      ...prev,
      [section]: [...prev[section], item]
    }));
  };

  const updateListItem = (section, index, item) => {
    setResumeData(prev => {
      const updatedSection = [...prev[section]];
      updatedSection[index] = item;
      return {
        ...prev,
        [section]: updatedSection
      };
    });
  };

  const removeListItem = (section, index) => {
    setResumeData(prev => {
      const updatedSection = [...prev[section]];
      updatedSection.splice(index, 1);
      return {
        ...prev,
        [section]: updatedSection
      };
    });
  };

  const value = {
    resumeData,
    activeTemplate,
    resumeList,
    isLoading,
    error,
    setActiveTemplate,
    updateResumeData,
    addListItem,
    updateListItem,
    removeListItem,
    loadResume,
    saveResume,
    deleteResume,
    generatePDF,
    fetchResumes
  };

  return (
    <ResumeContext.Provider value={value}>
      {children}
    </ResumeContext.Provider>
  );
};
