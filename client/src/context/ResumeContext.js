import React, { createContext, useContext, useReducer, useEffect, useCallback, useRef } from 'react';
import { saveResume, getResume, getResumes, deleteResume } from '../services/api';

const ResumeContext = createContext();

// Initial state with professional-modern as default template
const initialState = {
  resumeData: {
    id: null,
    personalInfo: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      title: '',
      location: '',
      linkedIn: '',
      website: ''
    },
    summary: '',
    workExperience: [],
    education: [],
    skills: [],
    certifications: [],
    projects: [], // Added projects array
    technicalSkills: {}, // Added technical skills object
    languages: [], // Added languages array
    template: 'professional-modern', // ✅ Updated default template
    createdAt: null,
    updatedAt: null
  },
  resumes: [],
  currentResume: null,
  loading: false,
  error: null
};

// Reducer
const resumeReducer = (state, action) => {
  switch (action.type) {
    case 'SET_RESUME_DATA':
      return { 
        ...state, 
        resumeData: action.payload,
        currentResume: action.payload
      };

    case 'UPDATE_PERSONAL_INFO':
      const updatedPersonalInfo = {
        ...state.resumeData,
        personalInfo: { ...state.resumeData.personalInfo, ...action.payload },
        updatedAt: new Date().toISOString()
      };
      return {
        ...state,
        resumeData: updatedPersonalInfo,
        currentResume: updatedPersonalInfo
      };

    case 'UPDATE_SUMMARY':
      const updatedSummary = {
        ...state.resumeData,
        summary: action.payload,
        updatedAt: new Date().toISOString()
      };
      return {
        ...state,
        resumeData: updatedSummary,
        currentResume: updatedSummary
      };

    // Generic update action
    case 'UPDATE_RESUME_DATA':
      const updatedData = {
        ...action.payload,
        updatedAt: new Date().toISOString()
      };
      return {
        ...state,
        resumeData: updatedData,
        currentResume: updatedData
      };

    case 'SET_RESUMES':
      return { ...state, resumes: action.payload };

    case 'SET_LOADING':
      return { ...state, loading: action.payload };

    case 'SET_ERROR':
      return { ...state, error: action.payload };

    default:
      return state;
  }
};

// 🔧 HELPER: Save to localStorage
const saveToLocalStorage = (resumes) => {
  try {
    localStorage.setItem('resumes', JSON.stringify(resumes));
    console.log('✅ Saved to localStorage');
  } catch (error) {
    console.error('❌ Failed to save to localStorage:', error);
  }
};

// 🔧 HELPER: Load from localStorage
const loadFromLocalStorage = () => {
  try {
    const savedResumes = localStorage.getItem('resumes');
    if (savedResumes) {
      const resumes = JSON.parse(savedResumes);
      console.log('✅ Loaded from localStorage:', resumes.length, 'resumes');
      return resumes;
    }
  } catch (error) {
    console.error('❌ Failed to load from localStorage:', error);
  }
  return [];
};

export const ResumeProvider = ({ children }) => {
  const [state, dispatch] = useReducer(resumeReducer, initialState);
  
  // 🚫 PREVENT INFINITE LOOPS
  const savingRef = useRef(false);
  const lastSaveRef = useRef(null);
  const saveTimeoutRef = useRef(null);

  // 🔧 FETCH RESUMES: Memoized to fix ESLint warning
  const fetchResumes = useCallback(async () => {
    console.log('📋 fetchResumes called');
    dispatch({ type: 'SET_LOADING', payload: true });

    try {
      // Load from localStorage first
      const localResumes = loadFromLocalStorage();
      dispatch({ type: 'SET_RESUMES', payload: localResumes });

      // Try to also fetch from database and merge
      try {
        const dbResponse = await getResumes();
        console.log('🔍 Database response:', dbResponse);
        
        // Handle different response formats
        let dbResumes = [];
        if (Array.isArray(dbResponse)) {
          dbResumes = dbResponse;
        } else if (dbResponse && Array.isArray(dbResponse.data)) {
          dbResumes = dbResponse.data;
        } else if (dbResponse && Array.isArray(dbResponse.resumes)) {
          dbResumes = dbResponse.resumes;
        } else {
          console.log('⚠️ Unexpected database response format:', dbResponse);
          dbResumes = [];
        }

        console.log('📊 Processed database resumes:', dbResumes.length);

        if (dbResumes.length > 0) {
          // Simple merge: prefer database versions, add local-only ones
          const mergedResumes = [...dbResumes];
          localResumes.forEach(localResume => {
            if (!dbResumes.find(dbResume => dbResume.id === localResume.id)) {
              mergedResumes.push(localResume);
            }
          });
          dispatch({ type: 'SET_RESUMES', payload: mergedResumes });
          saveToLocalStorage(mergedResumes);
          console.log('✅ Merged and saved resumes:', mergedResumes.length);
        } else {
          console.log('📋 No database resumes, using localStorage only');
        }
      } catch (dbError) {
        console.log('❌ Database fetch failed, using localStorage only:', dbError.message);
      }

      dispatch({ type: 'SET_LOADING', payload: false });
    } catch (error) {
      console.error('❌ Error fetching resumes:', error);
      dispatch({ type: 'SET_ERROR', payload: error.message });
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, []);

  // 🔧 DEBOUNCED SAVE: Prevents infinite loops
  const debouncedSave = useCallback(async (resumeData) => {
    // Prevent duplicate saves
    if (savingRef.current) {
      console.log('⏭️ Save already in progress, skipping...');
      return;
    }

    // Prevent saving the same data
    const dataString = JSON.stringify(resumeData);
    if (lastSaveRef.current === dataString) {
      console.log('⏭️ Data unchanged, skipping save...');
      return;
    }

    // Clear any pending saves
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // Debounce the save operation
    saveTimeoutRef.current = setTimeout(async () => {
      savingRef.current = true;
      lastSaveRef.current = dataString;

      try {
        // Update localStorage immediately
        const existingResumes = loadFromLocalStorage();
        const resumeIndex = existingResumes.findIndex(r => r.id === resumeData.id);
        
        if (resumeIndex >= 0) {
          existingResumes[resumeIndex] = resumeData;
        } else {
          existingResumes.push(resumeData);
        }
        
        saveToLocalStorage(existingResumes);

        // Try to save to database (non-blocking)
        try {
          await saveResume(resumeData);
          console.log('✅ Dual save completed for:', resumeData.id);
        } catch (dbError) {
          console.error('❌ Database save failed (localStorage saved):', dbError);
        }
        
      } catch (error) {
        console.error('❌ Save operation failed:', error);
      } finally {
        savingRef.current = false;
      }
    }, 1000); // 1 second debounce
  }, []);

  // 🔧 UPDATE PERSONAL INFO
  const updatePersonalInfo = useCallback(async (updates) => {
    console.log('✏️ Updating personal info:', updates);
    
    // Ensure we have a resume ID
    const resumeId = state.resumeData.id || `resume_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Update state immediately
    dispatch({ type: 'UPDATE_PERSONAL_INFO', payload: updates });
    
    // Create updated resume data
    const updatedResumeData = {
      ...state.resumeData,
      id: resumeId,
      personalInfo: { ...state.resumeData.personalInfo, ...updates },
      updatedAt: new Date().toISOString()
    };

    // Debounced save to prevent infinite loops
    debouncedSave(updatedResumeData);
  }, [state.resumeData, debouncedSave]);

  // 🔧 UPDATE SUMMARY
  const updateSummary = useCallback(async (summary) => {
    console.log('✏️ Updating summary');
    
    dispatch({ type: 'UPDATE_SUMMARY', payload: summary });
    
    const updatedResumeData = {
      ...state.resumeData,
      summary,
      updatedAt: new Date().toISOString()
    };

    debouncedSave(updatedResumeData);
  }, [state.resumeData, debouncedSave]);

  // 🔧 ENHANCED DEBUG VERSION: Generic update resume data method
  const updateResumeData = useCallback(async (newData) => {
    console.log('🔍 DETAILED DEBUG - updateResumeData called with:', {
      type: typeof newData,
      isArray: Array.isArray(newData),
      isString: typeof newData === 'string',
      length: newData?.length,
      keys: newData && typeof newData === 'object' && !Array.isArray(newData) ? Object.keys(newData) : 'N/A',
      firstFewChars: typeof newData === 'string' ? newData.slice(0, 50) : 'N/A',
      data: newData
    });
    
    // Create a detailed stack trace for debugging
    console.log('🔍 ENHANCED STACK TRACE:');
    const error = new Error();
    const stack = error.stack.split('\n');
    stack.forEach((line, index) => {
      if (index < 10) { // Show first 10 lines
        console.log(`  ${index}: ${line}`);
      }
    });
    
    // If it's not a proper object, log error and return early
    if (!newData || typeof newData !== 'object' || Array.isArray(newData)) {
      console.error('❌ updateResumeData received invalid data:', newData);
      console.error('❌ This call is coming from the stack trace above ☝️');
      return;
    }
    
    console.log('✏️ Updating resume data:', Object.keys(newData));
    
    // Ensure we have a resume ID
    const resumeId = newData.id || state.resumeData.id || `resume_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const updatedData = {
      ...newData,
      id: resumeId,
      updatedAt: new Date().toISOString()
    };
    
    // Update state immediately
    dispatch({ type: 'UPDATE_RESUME_DATA', payload: updatedData });
    
    // Debounced save to prevent infinite loops
    debouncedSave(updatedData);
  }, [state.resumeData, debouncedSave]);

  // 🔧 LOAD RESUME
  const loadResume = useCallback(async (resumeId) => {
    console.log('🔥 loadResume called with ID:', resumeId);
    dispatch({ type: 'SET_LOADING', payload: true });

    try {
      // Try localStorage first
      const localResumes = loadFromLocalStorage();
      let resume = localResumes.find(r => r.id === resumeId);
      
      if (resume) {
        console.log('✅ Resume found in localStorage');
        dispatch({ type: 'SET_RESUME_DATA', payload: resume });
        dispatch({ type: 'SET_LOADING', payload: false });
        return resume;
      }

      // Try database if not in localStorage
      try {
        resume = await getResume(resumeId);
        if (resume) {
          console.log('✅ Resume found in database');
          dispatch({ type: 'SET_RESUME_DATA', payload: resume });
          dispatch({ type: 'SET_LOADING', payload: false });
          return resume;
        }
      } catch (dbError) {
        console.log('Database lookup failed, using localStorage only');
      }

      throw new Error('Resume not found');
    } catch (error) {
      console.error('❌ Error loading resume:', error);
      dispatch({ type: 'SET_ERROR', payload: error.message });
      dispatch({ type: 'SET_LOADING', payload: false });
      throw error;
    }
  }, []);

  // 🔧 CREATE RESUME with professional-modern as default
  const createResume = useCallback((templateType = 'professional-modern') => {
    const newResume = {
      id: `resume_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      personalInfo: {
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        title: '',
        location: '',
        linkedIn: '',
        website: ''
      },
      summary: '',
      workExperience: [],
      education: [],
      skills: [],
      certifications: [],
      projects: [], // ✅ Added projects array
      technicalSkills: {}, // ✅ Added technical skills object
      languages: [], // ✅ Added languages array
      template: templateType, // Will use 'professional-modern' by default
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    console.log('✨ Created new resume:', newResume.id);
    
    // Set as current resume data
    dispatch({ type: 'SET_RESUME_DATA', payload: newResume });
    
    // Save immediately (non-debounced for creation)
    savingRef.current = true;
    const existingResumes = loadFromLocalStorage();
    existingResumes.push(newResume);
    saveToLocalStorage(existingResumes);
    
    // Try to save to database (non-blocking)
    saveResume(newResume)
      .then(() => console.log('✅ New resume saved to database'))
      .catch((error) => console.log('❌ Database save failed for new resume:', error))
      .finally(() => {
        savingRef.current = false;
      });

    return newResume;
  }, []);

  // 🔧 CREATE NEW RESUME (for Templates.js compatibility)
  const createNewResume = useCallback((templateType = 'professional-modern') => {
    console.log('🎨 createNewResume called with template:', templateType);
    const newResume = createResume(templateType);
    console.log('✅ Returning resume ID:', newResume.id);
    return newResume.id; // Return just the ID for navigation
  }, [createResume]);

  // 🔧 DELETE RESUME
  const deleteResumeById = useCallback(async (resumeId) => {
    console.log('🗑️ Deleting resume:', resumeId);
    dispatch({ type: 'SET_LOADING', payload: true });

    try {
      // Delete from localStorage
      const existingResumes = loadFromLocalStorage();
      const filteredResumes = existingResumes.filter(r => r.id !== resumeId);
      saveToLocalStorage(filteredResumes);
      
      // Update state
      dispatch({ type: 'SET_RESUMES', payload: filteredResumes });
      
      // If deleting current resume, clear it
      if (state.currentResume?.id === resumeId) {
        dispatch({ type: 'SET_RESUME_DATA', payload: initialState.resumeData });
      }

      // Try to delete from database (non-blocking)
      try {
        await deleteResume(resumeId);
        console.log('✅ Deleted from database');
      } catch (dbError) {
        console.log('Database delete failed, but localStorage delete succeeded');
      }

      dispatch({ type: 'SET_LOADING', payload: false });
    } catch (error) {
      console.error('❌ Error deleting resume:', error);
      dispatch({ type: 'SET_ERROR', payload: error.message });
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [state.currentResume]);

  // 🔧 TEMPLATE MANAGEMENT: Update template
  const updateTemplate = useCallback((templateType) => {
    console.log('🎨 Updating template to:', templateType);
    
    const updatedResumeData = {
      ...state.resumeData,
      template: templateType,
      updatedAt: new Date().toISOString()
    };
    
    dispatch({ type: 'UPDATE_RESUME_DATA', payload: updatedResumeData });
    debouncedSave(updatedResumeData);
  }, [state.resumeData, debouncedSave]);

  // 🔧 PROJECTS MANAGEMENT: Add/Update/Remove projects
  const updateProjects = useCallback((projects) => {
    console.log('📂 Updating projects');
    
    const updatedResumeData = {
      ...state.resumeData,
      projects: projects,
      updatedAt: new Date().toISOString()
    };
    
    dispatch({ type: 'UPDATE_RESUME_DATA', payload: updatedResumeData });
    debouncedSave(updatedResumeData);
  }, [state.resumeData, debouncedSave]);

  // 🔧 TECHNICAL SKILLS MANAGEMENT: Update technical skills
  const updateTechnicalSkills = useCallback((technicalSkills) => {
    console.log('🛠️ Updating technical skills');
    
    const updatedResumeData = {
      ...state.resumeData,
      technicalSkills: technicalSkills,
      updatedAt: new Date().toISOString()
    };
    
    dispatch({ type: 'UPDATE_RESUME_DATA', payload: updatedResumeData });
    debouncedSave(updatedResumeData);
  }, [state.resumeData, debouncedSave]);

  // 🔧 LANGUAGES MANAGEMENT: Update languages
  const updateLanguages = useCallback((languages) => {
    console.log('🌍 Updating languages');
    
    const updatedResumeData = {
      ...state.resumeData,
      languages: languages,
      updatedAt: new Date().toISOString()
    };
    
    dispatch({ type: 'UPDATE_RESUME_DATA', payload: updatedResumeData });
    debouncedSave(updatedResumeData);
  }, [state.resumeData, debouncedSave]);

  // 🚫 PREVENT INFINITE LOOPS: Only load resumes once on mount
  const initializedRef = useRef(false);
  useEffect(() => {
    if (!initializedRef.current) {
      console.log('🚀 ResumeProvider initializing...');
      fetchResumes();
      initializedRef.current = true;
    }
  }, [fetchResumes]);

  // 🧹 CLEANUP: Clear timeouts on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  // 🔧 CONTEXT VALUE
  const value = {
    // State
    resumeData: state.resumeData,
    resumes: state.resumes,
    currentResume: state.currentResume,
    loading: state.loading,
    error: state.error,
    
    // Core Methods
    updatePersonalInfo,
    updateSummary,
    updateResumeData, // Generic update method with enhanced debugging
    loadResume,
    createResume,
    createNewResume, // Dedicated function for Templates.js
    fetchResumes,
    deleteResume: deleteResumeById,
    
    // Template Management
    updateTemplate,
    
    // Enhanced Data Management
    updateProjects,
    updateTechnicalSkills,
    updateLanguages,
    
    // Utility
    setResumeData: (data) => dispatch({ type: 'SET_RESUME_DATA', payload: data })
  };

  return (
    <ResumeContext.Provider value={value}>
      {children}
    </ResumeContext.Provider>
  );
};

export const useResume = () => {
  const context = useContext(ResumeContext);
  if (!context) {
    throw new Error('useResume must be used within a ResumeProvider');
  }
  return context;
};