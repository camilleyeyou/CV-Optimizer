import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

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
    fetchResumes();
  }, []);

  const fetchResumes = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        return;
      }

      const response = await axios.get('/api/resumes', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      setResumeList(response.data);
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
      const token = localStorage.getItem('token');
      if (!token) {
        return;
      }

      const response = await axios.get(`/api/resumes/${resumeId}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      setResumeData(response.data.content);
      setActiveTemplate(response.data.template || 'modern');
    } catch (err) {
      console.error('Error loading resume:', err);
      setError('Failed to load resume');
    } finally {
      setIsLoading(false);
    }
  };

  const saveResume = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('You must be logged in to save a resume');
      }

      const resumeToSave = {
        content: resumeData,
        template: activeTemplate,
        title: `${resumeData.personalInfo.firstName} ${resumeData.personalInfo.lastName} - Resume`
      };

      let response;
      if (resumeData._id) {
        response = await axios.put(`/api/resumes/${resumeData._id}`, resumeToSave, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
      } else {
        response = await axios.post('/api/resumes', resumeToSave, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        // Update the resume with the ID from the server
        setResumeData({
          ...resumeData,
          _id: response.data._id
        });
      }

      // Refresh the resume list
      fetchResumes();
      
      return response.data;
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
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('You must be logged in to delete a resume');
      }

      await axios.delete(`/api/resumes/${resumeId}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      // Refresh the resume list
      fetchResumes();
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
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('You must be logged in to generate a PDF');
      }

      const response = await axios.post('/api/generate-pdf', {
        resumeData,
        template: activeTemplate
      }, {
        headers: {
          Authorization: `Bearer ${token}`
        },
        responseType: 'blob' // Important for handling the PDF binary data
      });

      // Create a blob URL and trigger download
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
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
    generatePDF
  };

  return (
    <ResumeContext.Provider value={value}>
      {children}
    </ResumeContext.Provider>
  );
};
