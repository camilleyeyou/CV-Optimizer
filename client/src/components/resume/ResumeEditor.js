import React, { useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useResume } from '../../context/ResumeContext';
import ResumeForm from './ResumeForm';
import ResumePreview from './ResumePreview';
import TemplateSelector from './TemplateSelector';
import LoadingSpinner from '../common/LoadingSpinner';
import ErrorMessage from '../common/ErrorMessage';
import './ResumeEditor.css';

const ResumeEditor = () => {
  const { resumeId } = useParams();
  const navigate = useNavigate();
  const { loadResume, saveCurrentResume, isLoading, resumeData } = useResume();
  const resumeLoadedRef = useRef(false);
  const lastLoadedIdRef = useRef(null);

  // 🔧 CRITICAL FIX: Prevent infinite loading loops
  useEffect(() => {
    // Only load resume if:
    // 1. We have a resumeId
    // 2. It's different from the last loaded ID
    // 3. It's different from current resumeData.id
    if (resumeId && 
        resumeId !== lastLoadedIdRef.current && 
        resumeId !== resumeData.id) {
      
      console.log('📥 ResumeEditor loading resume:', resumeId);
      lastLoadedIdRef.current = resumeId;
      
      loadResume(resumeId).catch(err => {
        console.error('Error loading resume:', err);
        // Navigate to resume list if we can't load this resume
        navigate('/resumes');
      });
    }
  }, [resumeId, loadResume, navigate, resumeData.id]); // 🚨 Added resumeData.id

  const handleSave = async () => {
    try {
      await saveCurrentResume();
      // If this is a new resume (no ID), redirect to the resume list
      if (!resumeId) {
        navigate('/resumes');
      }
    } catch (err) {
      console.error('Error saving resume:', err);
    }
  };

  // 🔧 FIX: Better loading state check
  if (isLoading && (!resumeData.id || resumeData.id !== resumeId)) {
    return <LoadingSpinner message="Loading resume..." />;
  }

  return (
    <div className="resume-editor">
      <div className="editor-header">
        <h1>{resumeId ? 'Edit Resume' : 'Create New Resume'}</h1>
        <div className="header-actions">
          <TemplateSelector />
          <button className="save-button" onClick={handleSave} disabled={isLoading}>
            {isLoading ? 'Saving...' : 'Save Resume'}
          </button>
        </div>
      </div>

      <div className="editor-content">
        <div className="form-container">
          <ResumeForm />
        </div>
        <div className="preview-container">
          <ResumePreview />
        </div>
      </div>
    </div>
  );
};

export default ResumeEditor;