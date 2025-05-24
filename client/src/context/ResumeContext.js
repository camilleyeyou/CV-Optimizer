import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';

const ResumeContext = createContext();

export const useResume = () => {
  const context = useContext(ResumeContext);
  if (!context) {
    throw new Error('useResume must be used within a ResumeProvider');
  }
  return context;
};

export const ResumeProvider = ({ children }) => {
  // 🔧 FINAL FIX: Prevent double initialization with ref
  const isInitializedRef = useRef(false);
  
  const [resumeData, setResumeData] = useState({
    personalInfo: {},
    summary: '',
    workExperience: [],
    education: [],
    skills: [],
    certifications: [],
    template: 'modern'
  });
  
  const [resumeList, setResumeList] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // 🔧 CRITICAL: Single initialization only
  useEffect(() => {
    if (isInitializedRef.current) {
      return; // Already initialized
    }
    
    console.log('🚀 ResumeProvider initializing...');
    isInitializedRef.current = true;
    
    try {
      const savedResumes = localStorage.getItem('resumes');
      if (savedResumes) {
        const parsedResumes = JSON.parse(savedResumes);
        const validResumes = Array.isArray(parsedResumes) 
          ? parsedResumes.filter(resume => resume && resume.id !== 'undefined')
          : [];
        
        setResumeList(validResumes);
        console.log('✅ Loaded resumes from localStorage (blocked problematic ID)');
      }
    } catch (error) {
      console.error('Error loading resumes from localStorage:', error);
      setResumeList([]);
    }
  }, []); // Empty dependency array - run once only

  // 🔧 STABLE: Memoized functions to prevent re-renders
  const updateResumeData = useCallback((field, value) => {
    setResumeData(prev => ({
      ...prev,
      [field]: value
    }));
  }, []);

  const updatePersonalInfo = useCallback((field, value) => {
    setResumeData(prev => ({
      ...prev,
      personalInfo: {
        ...prev.personalInfo,
        [field]: value
      }
    }));
  }, []);

  const loadResume = useCallback((resumeId) => {
    if (!resumeId || resumeId === 'undefined') {
      console.warn('⚠️ loadResume called with invalid ID:', resumeId);
      return false;
    }

    // Prevent loading the same resume twice
    if (resumeData.id === resumeId) {
      console.log('📋 Resume already loaded:', resumeId);
      return true;
    }

    console.log('🔥 loadResume called with ID:', resumeId);
    
    try {
      const savedResumes = localStorage.getItem('resumes');
      if (savedResumes) {
        const resumes = JSON.parse(savedResumes);
        const foundResume = resumes.find(resume => resume.id === resumeId);
        
        if (foundResume) {
          setResumeData(foundResume);
          console.log('✅ Resume loaded from localStorage');
          return true;
        }
      }
      
      console.warn('⚠️ Resume not found:', resumeId);
      return false;
    } catch (error) {
      console.error('❌ Error loading resume:', error);
      setError('Failed to load resume');
      return false;
    }
  }, [resumeData.id]); // Only depend on current resume ID

  const saveCurrentResume = useCallback(() => {
    try {
      const resumeToSave = {
        ...resumeData,
        id: resumeData.id || `resume_${Date.now()}`,
        updatedAt: new Date().toISOString()
      };

      const savedResumes = localStorage.getItem('resumes');
      let resumes = savedResumes ? JSON.parse(savedResumes) : [];
      
      const existingIndex = resumes.findIndex(r => r.id === resumeToSave.id);
      if (existingIndex >= 0) {
        resumes[existingIndex] = resumeToSave;
      } else {
        resumes.push(resumeToSave);
      }

      localStorage.setItem('resumes', JSON.stringify(resumes));
      setResumeList(resumes);
      setResumeData(resumeToSave);
      
      console.log('✅ Resume saved to localStorage');
      return resumeToSave.id;
    } catch (error) {
      console.error('❌ Error saving resume:', error);
      setError('Failed to save resume');
      return null;
    }
  }, [resumeData]);

  const createNewResume = useCallback((template = 'modern') => {
    const newResumeId = `resume_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const newResume = {
      id: newResumeId,
      template,
      title: `Resume - ${new Date().toLocaleDateString()}`,
      personalInfo: {},
      summary: '',
      workExperience: [],
      education: [],
      skills: [],
      certifications: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    setResumeData(newResume);
    console.log('✨ Created new resume:', newResumeId);
    return newResumeId;
  }, []);

  const deleteResume = useCallback((resumeId) => {
    try {
      const savedResumes = localStorage.getItem('resumes');
      if (savedResumes) {
        const resumes = JSON.parse(savedResumes);
        const filteredResumes = resumes.filter(resume => resume.id !== resumeId);
        
        localStorage.setItem('resumes', JSON.stringify(filteredResumes));
        setResumeList(filteredResumes);
        
        // If we're deleting the currently loaded resume, clear it
        if (resumeData.id === resumeId) {
          setResumeData({
            personalInfo: {},
            summary: '',
            workExperience: [],
            education: [],
            skills: [],
            certifications: [],
            template: 'modern'
          });
        }
        
        console.log('🗑️ Resume deleted:', resumeId);
        return true;
      }
      return false;
    } catch (error) {
      console.error('❌ Error deleting resume:', error);
      setError('Failed to delete resume');
      return false;
    }
  }, [resumeData.id]);

  const fetchResumes = useCallback(() => {
    console.log('📋 fetchResumes called');
    setIsLoading(true);
    try {
      const savedResumes = localStorage.getItem('resumes');
      if (savedResumes) {
        const resumes = JSON.parse(savedResumes);
        const validResumes = Array.isArray(resumes) 
          ? resumes.filter(resume => resume && resume.id !== 'undefined')
          : [];
        setResumeList(validResumes);
        console.log('✅ Fetched resumes from localStorage');
      }
    } catch (error) {
      console.error('❌ Error fetching resumes:', error);
      setError('Failed to fetch resumes');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 🔧 MISSING FUNCTION: Add list item (skills, certifications, etc.)
  const addListItem = useCallback((field, item) => {
    setResumeData(prev => ({
      ...prev,
      [field]: [...(prev[field] || []), item]
    }));
  }, []);

  // 🔧 MISSING FUNCTION: Remove list item
  const removeListItem = useCallback((field, index) => {
    setResumeData(prev => ({
      ...prev,
      [field]: (prev[field] || []).filter((_, i) => i !== index)
    }));
  }, []);

  // 🔧 MISSING FUNCTION: Update list item
  const updateListItem = useCallback((field, index, item) => {
    setResumeData(prev => ({
      ...prev,
      [field]: (prev[field] || []).map((existing, i) => 
        i === index ? item : existing
      )
    }));
  }, []);

  // Context value with all necessary functions and state
  const contextValue = {
    resumeData,
    resumeList,
    isLoading,
    error,
    updateResumeData,
    updatePersonalInfo,
    loadResume,
    saveCurrentResume,
    createNewResume,
    deleteResume,
    fetchResumes,
    addListItem,
    removeListItem,
    updateListItem,
    setError
  };

  return (
    <ResumeContext.Provider value={contextValue}>
      {children}
    </ResumeContext.Provider>
  );
};