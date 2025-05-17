import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import * as resumeService from '../services/resumeService';
import * as authService from '../services/authService';

const ResumeContext = createContext();

export const useResume = () => useContext(ResumeContext);

// Helper function to check authentication compatibility
const isUserAuthenticated = () => {
  const isAuthFn = authService.isAuthenticated;
  return typeof isAuthFn === 'function' ? isAuthFn() : isAuthFn;
};

export const ResumeProvider = ({ children }) => {
  // Initialize with a complete structure to avoid undefined errors
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
  
  // Use refs to track state without triggering re-renders
  const fetchLockRef = useRef(false);
  const fetchCountRef = useRef(0);
  const lastFetchTimeRef = useRef(Date.now());

  // CRITICAL: This is the function that was causing the infinite loop
  const fetchResumes = useCallback(async (force = false) => {
    // Check authentication first - handle both function and property
    if (!isUserAuthenticated()) {
      console.log('User not authenticated, skipping fetch');
      return;
    }
    
    // Skip if lock is active (another fetch is in progress)
    if (fetchLockRef.current && !force) {
      console.log('Fetch already in progress, skipping');
      return;
    }
    
    // Implement a maximum fetch rate limit
    const now = Date.now();
    const timeSinceLastFetch = now - lastFetchTimeRef.current;
    
    // If we've already fetched once and it's been less than 5 seconds, skip
    if (fetchCountRef.current > 0 && timeSinceLastFetch < 5000 && !force) {
      console.log(`Too soon since last fetch (${timeSinceLastFetch}ms), skipping`);
      return;
    }
    
    // If we've fetched more than 5 times, stop fetching to break any potential loops
    if (fetchCountRef.current >= 5 && !force) {
      console.log('Maximum fetch count reached, stopping');
      return;
    }
    
    // Set the lock to prevent concurrent fetches
    fetchLockRef.current = true;
    lastFetchTimeRef.current = now;
    fetchCountRef.current += 1;
    
    console.log(`Fetching resumes (attempt ${fetchCountRef.current})...`);
    setIsLoading(true);
    
    try {
      const response = await resumeService.getResumes();
      console.log('Resume fetch response:', response);
      
      // Handle different response formats
      if (response) {
        if (Array.isArray(response)) {
          setResumeList(response);
        } else if (response.resumes && Array.isArray(response.resumes)) {
          setResumeList(response.resumes);
        } else {
          console.warn('Unexpected response format:', response);
          setResumeList([]);
        }
        setError(null);
      }
    } catch (err) {
      console.error('Error fetching resumes:', err);
      setError('Failed to load your resumes');
      setResumeList([]); // Set to empty array on error
    } finally {
      setIsLoading(false);
      // Release the lock
      fetchLockRef.current = false;
    }
  }, []); // No dependencies to prevent recreation

  // Reset fetch counter every 30 seconds to allow fetching again
  useEffect(() => {
    const resetTimer = setInterval(() => {
      if (fetchCountRef.current > 0) {
        console.log('Resetting fetch counter');
        fetchCountRef.current = 0;
      }
    }, 30000);
    
    return () => clearInterval(resetTimer);
  }, []);

  // Implement all the required methods
  const loadResume = async (resumeId) => {
    setIsLoading(true);
    try {
      const resume = await resumeService.getResumeById(resumeId);
      
      // Ensure all required fields exist in the loaded resume
      const completeResume = {
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
          website: '',
          ...resume.personalInfo
        },
        summary: resume.summary || '',
        workExperience: resume.workExperience || [],
        education: resume.education || [],
        skills: resume.skills || [],
        certifications: resume.certifications || [],
        projects: resume.projects || [],
        languages: resume.languages || [],
        customSections: resume.customSections || [],
        ...resume
      };
      
      // Set the completed resume data
      setResumeData(completeResume);
      setActiveTemplate(resume.template || 'modern');
      return completeResume;
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
      // Transform from frontend format to backend format if needed
      let result;
      if (resumeData._id) {
        result = await resumeService.updateResume(resumeData._id, {
          ...resumeData,
          template: activeTemplate
        });
      } else {
        result = await resumeService.createResume({
          ...resumeData,
          template: activeTemplate
        });

        // Update the resume with the ID from the server
        setResumeData({
          ...resumeData,
          _id: result._id
        });
      }

      // Refresh the resume list
      await fetchResumes(true); // Force refresh
      
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
      await fetchResumes(true); // Force refresh
    } catch (err) {
      console.error('Error deleting resume:', err);
      setError('Failed to delete resume');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Updated generatePDF function that requires a saved resume with ID (Option 2)
  const generatePDF = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('Preparing to generate PDF with template:', activeTemplate);
      
      // Check if we have a saved resume with an ID
      if (!resumeData._id) {
        throw new Error('Resume must be saved before generating a PDF. Please save your resume first.');
      }
      
      console.log('Sending PDF generation request with resumeId:', resumeData._id);
      const pdfBlob = await resumeService.generatePDF(resumeData, activeTemplate);
      
      if (!pdfBlob || !(pdfBlob instanceof Blob)) {
        throw new Error('Invalid PDF data received from server');
      }
      
      console.log('PDF blob received:', pdfBlob.type, pdfBlob.size);
      
      // Create a filename
      const filename = `${resumeData.personalInfo?.firstName || 'resume'}-${resumeData.personalInfo?.lastName || 'document'}.pdf`;
      
      // Create a download link and trigger it
      const url = window.URL.createObjectURL(pdfBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      
      console.log('Triggering download for:', filename);
      a.click();
      
      // Clean up
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      return true;
    } catch (err) {
      console.error('Error generating PDF:', err);
      setError('Failed to generate PDF: ' + (err.message || 'Unknown error'));
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const updateResumeData = (field, value) => {
    if (field.includes('.')) {
      const [section, key] = field.split('.');
      setResumeData(prev => {
        // Make sure the section exists
        const sectionData = prev[section] || {};
        return {
          ...prev,
          [section]: {
            ...sectionData,
            [key]: value
          }
        };
      });
    } else {
      setResumeData(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  const addListItem = (section, item) => {
    setResumeData(prev => {
      // Make sure the section exists and is an array
      const sectionItems = Array.isArray(prev[section]) ? prev[section] : [];
      return {
        ...prev,
        [section]: [...sectionItems, item]
      };
    });
  };

  const updateListItem = (section, index, item) => {
    setResumeData(prev => {
      // Make sure the section exists and is an array
      const sectionItems = Array.isArray(prev[section]) ? prev[section] : [];
      
      // Create a new array with the updated item
      const updatedSection = [...sectionItems];
      if (index >= 0 && index < updatedSection.length) {
        updatedSection[index] = item;
      } else {
        console.warn(`Index ${index} out of bounds for section ${section}`);
      }
      
      return {
        ...prev,
        [section]: updatedSection
      };
    });
  };

  const removeListItem = (section, index) => {
    setResumeData(prev => {
      // Make sure the section exists and is an array
      const sectionItems = Array.isArray(prev[section]) ? prev[section] : [];
      
      // Create a new array without the item at the specified index
      const updatedSection = [...sectionItems];
      if (index >= 0 && index < updatedSection.length) {
        updatedSection.splice(index, 1);
      } else {
        console.warn(`Index ${index} out of bounds for section ${section}`);
      }
      
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
    loadResume,
    saveResume,
    deleteResume,
    generatePDF,
    fetchResumes,
    updateResumeData,
    addListItem,
    updateListItem,
    removeListItem
  };

  return (
    <ResumeContext.Provider value={value}>
      {children}
    </ResumeContext.Provider>
  );
};
