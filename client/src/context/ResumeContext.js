import { createContext, useContext, useReducer, useCallback, useRef, useEffect } from 'react';
import { supabase } from '../config/supabase';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';

const ResumeContext = createContext(null);

const EMPTY_RESUME = {
  id: null,
  title: '',
  personal_info: {
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    job_title: '',
    location: '',
    linkedin: '',
    website: '',
  },
  summary: '',
  work_experience: [],
  education: [],
  skills: [],
  projects: [],
  certifications: [],
  languages: [],
  template: 'modern',
  created_at: null,
  updated_at: null,
};

const initialState = {
  resumeData: { ...EMPTY_RESUME },
  resumes: [],
  loading: false,
  saving: false,
  error: null,
};

const reducer = (state, action) => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_SAVING':
      return { ...state, saving: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    case 'SET_RESUMES':
      return { ...state, resumes: action.payload, loading: false };
    case 'SET_RESUME':
      return { ...state, resumeData: action.payload, loading: false };
    case 'UPDATE_FIELD':
      return {
        ...state,
        resumeData: {
          ...state.resumeData,
          [action.field]: action.value,
          updated_at: new Date().toISOString(),
        },
      };
    case 'UPDATE_RESUME':
      return {
        ...state,
        resumeData: { ...state.resumeData, ...action.payload, updated_at: new Date().toISOString() },
      };
    case 'RESET':
      return { ...state, resumeData: { ...EMPTY_RESUME } };
    default:
      return state;
  }
};

export const ResumeProvider = ({ children }) => {
  const [state, dispatch] = useReducer(reducer, initialState);
  const { user } = useAuth();
  const saveTimerRef = useRef(null);
  const lastSavedRef = useRef(null);

  // Fetch all resumes for current user
  const fetchResumes = useCallback(async () => {
    if (!user) return;
    dispatch({ type: 'SET_LOADING', payload: true });

    try {
      const { data, error } = await supabase
        .from('resumes')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });

      if (error) throw error;
      dispatch({ type: 'SET_RESUMES', payload: data || [] });
    } catch (err) {
      dispatch({ type: 'SET_ERROR', payload: err.message });
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [user]);

  // Load resumes when user changes
  useEffect(() => {
    if (user) {
      fetchResumes();
    } else {
      dispatch({ type: 'SET_RESUMES', payload: [] });
      dispatch({ type: 'RESET' });
    }
  }, [user, fetchResumes]);

  // Load a single resume
  const loadResume = useCallback(async (resumeId) => {
    dispatch({ type: 'SET_LOADING', payload: true });

    try {
      const { data, error } = await supabase
        .from('resumes')
        .select('*')
        .eq('id', resumeId)
        .single();

      if (error) throw error;
      dispatch({ type: 'SET_RESUME', payload: data });
      return data;
    } catch (err) {
      dispatch({ type: 'SET_ERROR', payload: err.message });
      dispatch({ type: 'SET_LOADING', payload: false });
      throw err;
    }
  }, []);

  // Create a new resume
  const createResume = useCallback(async (template = 'modern') => {
    if (!user) return null;

    try {
      const newResume = {
        ...EMPTY_RESUME,
        user_id: user.id,
        template,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      delete newResume.id;

      const { data, error } = await supabase
        .from('resumes')
        .insert(newResume)
        .select()
        .single();

      if (error) throw error;

      dispatch({ type: 'SET_RESUME', payload: data });
      // Add to list
      dispatch({ type: 'SET_RESUMES', payload: [data, ...state.resumes] });

      return data;
    } catch (err) {
      toast.error('Failed to create resume');
      throw err;
    }
  }, [user, state.resumes]);

  // Auto-save with debounce
  const saveResume = useCallback(async (resumeData) => {
    if (!resumeData?.id) return;

    const dataStr = JSON.stringify(resumeData);
    if (lastSavedRef.current === dataStr) return;

    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);

    saveTimerRef.current = setTimeout(async () => {
      dispatch({ type: 'SET_SAVING', payload: true });
      lastSavedRef.current = dataStr;

      try {
        const { error } = await supabase
          .from('resumes')
          .update({
            title: resumeData.title,
            personal_info: resumeData.personal_info,
            summary: resumeData.summary,
            work_experience: resumeData.work_experience,
            education: resumeData.education,
            skills: resumeData.skills,
            projects: resumeData.projects,
            certifications: resumeData.certifications,
            languages: resumeData.languages,
            template: resumeData.template,
            updated_at: new Date().toISOString(),
          })
          .eq('id', resumeData.id);

        if (error) throw error;
      } catch (err) {
        toast.error('Failed to save changes');
        lastSavedRef.current = null;
      } finally {
        dispatch({ type: 'SET_SAVING', payload: false });
      }
    }, 1000);
  }, []);

  // Update a specific field and auto-save
  const updateField = useCallback((field, value) => {
    dispatch({ type: 'UPDATE_FIELD', field, value });
  }, []);

  // Trigger save after field updates
  useEffect(() => {
    if (state.resumeData?.id) {
      saveResume(state.resumeData);
    }
  }, [state.resumeData, saveResume]);

  // Update multiple fields at once
  const updateResume = useCallback((updates) => {
    dispatch({ type: 'UPDATE_RESUME', payload: updates });
  }, []);

  // Delete a resume
  const deleteResume = useCallback(async (resumeId) => {
    try {
      const { error } = await supabase
        .from('resumes')
        .delete()
        .eq('id', resumeId);

      if (error) throw error;

      dispatch({
        type: 'SET_RESUMES',
        payload: state.resumes.filter((r) => r.id !== resumeId),
      });

      if (state.resumeData?.id === resumeId) {
        dispatch({ type: 'RESET' });
      }

      toast.success('Resume deleted');
    } catch (err) {
      toast.error('Failed to delete resume');
      throw err;
    }
  }, [state.resumes, state.resumeData?.id]);

  // Duplicate a resume
  const duplicateResume = useCallback(async (resumeId) => {
    if (!user) return null;

    try {
      const source = state.resumes.find((r) => r.id === resumeId);
      if (!source) throw new Error('Resume not found');

      const duplicate = {
        ...source,
        user_id: user.id,
        title: `${source.title || 'Resume'} (Copy)`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      delete duplicate.id;

      const { data, error } = await supabase
        .from('resumes')
        .insert(duplicate)
        .select()
        .single();

      if (error) throw error;

      dispatch({ type: 'SET_RESUMES', payload: [data, ...state.resumes] });
      toast.success('Resume duplicated');
      return data;
    } catch (err) {
      toast.error('Failed to duplicate resume');
      throw err;
    }
  }, [user, state.resumes]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, []);

  const value = {
    // State
    resumeData: state.resumeData,
    resumes: state.resumes,
    loading: state.loading,
    saving: state.saving,
    error: state.error,

    // Actions
    fetchResumes,
    loadResume,
    createResume,
    updateField,
    updateResume,
    saveResume,
    deleteResume,
    duplicateResume,
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
