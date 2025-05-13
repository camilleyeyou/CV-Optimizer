import React, { createContext, useContext, useState, useEffect } from 'react';
import * as resumeService from '../services/resumeService';
import { isAuthenticated } from '../services/authService';

const ResumeContext = createContext();

export const useResume = () => useContext(ResumeContext);

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
    if (isAuthenticated()) {
      fetchResumes();
    }
  }, []);

  const fetchResumes = async () => {
    if (!isAuthenticated()) {
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
      setResumeData(resume.content);
      setActiveTemplate(resume.template || 'modern');
      return resume;
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
      const resumeToSave = {
        content: resumeData,
        template: activeTemplate,
        title: `${resumeData.personalInfo.firstName} ${resumeData.personalInfo.lastName} - Resume`
      };

      let result;
      if (resumeData._id) {
        result = await resumeService.updateResume(resumeData._id, resumeToSave);
      } else {
        result = await resumeService.createResume(resumeToSave);

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
      const pdfBlob = await resumeService.generatePDF(resumeData, activeTemplate);
      
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
