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
  
  // ✅ FIXED: Use the correct methods from context
  const { 
    loadResume, 
    loading, 
    resumeData, 
    error 
  } = useResume();
  
  const resumeLoadedRef = useRef(false);
  const lastLoadedIdRef = useRef(null);

  // Load resume effect
  useEffect(() => {
    if (resumeId && 
        resumeId !== lastLoadedIdRef.current && 
        resumeId !== resumeData?.id) {
      
      console.log('📥 ResumeEditor loading resume:', resumeId);
      lastLoadedIdRef.current = resumeId;
      
      loadResume(resumeId).catch(err => {
        console.error('Error loading resume:', err);
        navigate('/resumes');
      });
    }
  }, [resumeId, loadResume, navigate, resumeData?.id]);

  // ✅ FIXED: Simplified save handler - the context already handles auto-saving
  const handleSave = () => {
    // The context automatically saves changes via updatePersonalInfo, updateSummary, etc.
    // So we just need to show feedback to the user
    console.log('✅ Resume changes are automatically saved');
    
    // Optionally navigate back to resume list
    if (!resumeId) {
      navigate('/resumes');
    }
  };

  // ✅ FIXED: Use correct loading state
  if (loading && (!resumeData?.id || resumeData.id !== resumeId)) {
    return <LoadingSpinner message="Loading resume..." />;
  }

  // ✅ FIXED: Handle error state
  if (error) {
    return <ErrorMessage message={`Error: ${error}`} />;
  }

  return (
    <div className="resume-editor">
      <div className="editor-header">
        <h1>{resumeId ? 'Edit Resume' : 'Create New Resume'}</h1>
        <div className="header-actions">
          <TemplateSelector />
          <button className="save-button" onClick={handleSave} disabled={loading}>
            {loading ? 'Saving...' : 'Auto-Saved'}
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