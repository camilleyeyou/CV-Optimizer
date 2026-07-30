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
  /* Autosave outcome, so the builder can say what is actually true.
     'idle' nothing written yet | 'saving' | 'saved' | 'error' write failed.
     Previously a failed write flipped `saving` back to false and the toolbar
     went straight back to a green "Saved" — the toast was the only evidence,
     and it disappeared after three seconds. */
  saveStatus: 'idle',
  savedAt: null,
};

// The columns saveResume() actually writes. The dirty check compares exactly
// these, so anything else moving - a re-render, a fresh load - is not a change.
const PERSISTED_FIELDS = [
  'title',
  'personal_info',
  'summary',
  'work_experience',
  'education',
  'skills',
  'projects',
  'certifications',
  'languages',
  'template',
];

/**
 * Fingerprint of the saveable content of a resume.
 *
 * `updated_at` is deliberately excluded: the reducer stamps a new one on every
 * dispatch, so including it would make every comparison differ and defeat the
 * guard entirely - which is what made merely opening a resume rewrite it.
 */
const signatureOf = (resume) => {
  if (!resume) return null;
  return JSON.stringify(PERSISTED_FIELDS.map((f) => resume[f] ?? null));
};

const reducer = (state, action) => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_SAVING':
      return { ...state, saving: action.payload, saveStatus: action.payload ? 'saving' : state.saveStatus };
    case 'SAVE_OK':
      return { ...state, saving: false, saveStatus: 'saved', savedAt: action.payload };
    case 'SAVE_FAILED':
      return { ...state, saving: false, saveStatus: 'error' };
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
      // Signed out: drop the baseline and any queued write so the cleared
      // editor is never flushed over the previous user's resume.
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      saveTimerRef.current = null;
      lastSavedRef.current = null;
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
      // What we just read IS what the database holds - record it as the save
      // baseline so the autosave effect below doesn't immediately write it back.
      lastSavedRef.current = signatureOf(data);
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

      // Freshly inserted - the row already matches local state.
      lastSavedRef.current = signatureOf(data);
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

    const signature = signatureOf(resumeData);
    if (lastSavedRef.current === signature) {
      // Nothing to persist. If an edit was queued and then undone back to the
      // saved state, drop that pending write instead of letting it fire.
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      saveTimerRef.current = null;
      return;
    }

    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);

    saveTimerRef.current = setTimeout(async () => {
      dispatch({ type: 'SET_SAVING', payload: true });
      lastSavedRef.current = signature;

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
        dispatch({ type: 'SAVE_OK', payload: Date.now() });
      } catch {
        toast.error('Failed to save changes');
        // Clearing the signature is what lets the next edit retry the write.
        lastSavedRef.current = null;
        dispatch({ type: 'SAVE_FAILED' });
      }
    }, 1000);
  }, []);

  // Update a specific field and auto-save
  const updateField = useCallback((field, value) => {
    dispatch({ type: 'UPDATE_FIELD', field, value });
  }, []);

  // Trigger save after field updates.
  //
  // This fires on every resumeData reference change, including the one from
  // loading a resume. saveResume() is the gate: it writes only when the content
  // differs from the last known database state, so opening a resume (or
  // switching template back and forth) costs zero writes.
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
    saveStatus: state.saveStatus,
    savedAt: state.savedAt,
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

/**
 * Same context, but null outside a provider instead of throwing.
 *
 * The preview renders both inside the builder (live context) and standalone
 * with an explicit `data` prop - template thumbnails and the layout-parity
 * harness - where no provider exists.
 */
export const useResumeOptional = () => useContext(ResumeContext);
