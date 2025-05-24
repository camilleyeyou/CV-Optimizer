import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useResume } from '../context/ResumeContext';
import ResumeForm from '../components/builder/ResumeForm';
import ResumePreview from '../components/builder/ResumePreview';
import ResumeAnalyzer from '../components/analysis/ResumeAnalyzer';
import './Builder.css';

const Builder = () => {
  const { id } = useParams();
  
  // FIXED: Get all needed data from context including download tracking
  const { loadResume, saveCurrentResume, resumeData, incrementDownloadCount } = useResume();
  
  const [activeTab, setActiveTab] = useState('edit');
  // const [jobDescription, setJobDescription] = useState(''); // Commented out unused variables
  const [isSaving, setIsSaving] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // 🔧 CRITICAL FIX: Only load when we have an ID and it's different from current
  useEffect(() => {
    if (id && id !== resumeData.id) {
      console.log('📥 Builder loading resume:', id);
      loadResume(id);
    }
  }, [id, loadResume, resumeData.id]); // 🚨 Added resumeData.id to prevent unnecessary loads

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // FIXED: Use correct function name and await the result
      const savedId = await saveCurrentResume();
      
      if (savedId) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      } else {
        throw new Error('Failed to save resume');
      }
    } catch (error) {
      console.error('Error saving resume:', error);
      alert('Failed to save resume. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDownloadPDF = async () => {
    setIsGeneratingPDF(true);
    try {
      // Save the resume first
      const savedId = await saveCurrentResume();
      
      if (savedId) {
        // Import and use the PDF generator directly
        const { generateResumePDF } = await import('../utils/pdfGenerator');
        
        // Generate PDF using the current resume data
        await generateResumePDF(resumeData);
        
        // Increment download count using context function
        const newDownloadCount = await incrementDownloadCount(savedId);
        
        alert(`PDF downloaded successfully! Total downloads: ${newDownloadCount}`);
      } else {
        throw new Error('Failed to save resume');
      }
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Failed to generate PDF. Please try again.');
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  return (
    <div className="builder-page">
      <div className="builder-header">
        <h1>{id ? 'Edit Resume' : 'Create New Resume'}</h1>
        <div className="builder-actions">
          <button 
            className="save-button" 
            onClick={handleSave}
            disabled={isSaving}
          >
            {isSaving ? 'Saving...' : 'Save'}
          </button>
          <button 
            className="download-button" 
            onClick={handleDownloadPDF}
            disabled={isGeneratingPDF}
          >
            {isGeneratingPDF ? 'Preparing...' : 'Download PDF'}
          </button>
        </div>
        {saveSuccess && <div className="save-success">Resume saved successfully!</div>}
      </div>
      
      <div className="builder-tabs">
        <button 
          className={`tab-button ${activeTab === 'edit' ? 'active' : ''}`}
          onClick={() => setActiveTab('edit')}
        >
          Edit
        </button>
        <button 
          className={`tab-button ${activeTab === 'preview' ? 'active' : ''}`}
          onClick={() => setActiveTab('preview')}
        >
          Preview
        </button>
        <button 
          className={`tab-button ${activeTab === 'analyze' ? 'active' : ''}`}
          onClick={() => setActiveTab('analyze')}
        >
          Analyze
        </button>
      </div>
      
      <div className="builder-content">
        {activeTab === 'edit' && <ResumeForm />}
        {activeTab === 'preview' && <ResumePreview />}
        {activeTab === 'analyze' && (
          <ResumeAnalyzer />
        )}
      </div>
    </div>
  );
};

export default Builder;