import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useResume } from '../context/ResumeContext';
import ResumeForm from '../components/builder/ResumeForm';
import ResumePreview from '../components/builder/ResumePreview';
import ResumeAnalyzer from '../components/analysis/ResumeAnalyzer';
import './Builder.css';

const Builder = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { resumeData, loadResume, saveResume, generatePDF } = useResume();
  const [activeTab, setActiveTab] = useState('edit');
  const [jobDescription, setJobDescription] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    if (id) {
      loadResume(id);
    }
  }, [id, loadResume]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await saveResume();
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error) {
      console.error('Error saving resume:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDownloadPDF = async () => {
    setIsGeneratingPDF(true);
    try {
      await generatePDF();
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
            {isGeneratingPDF ? 'Generating...' : 'Download PDF'}
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
          <ResumeAnalyzer 
            jobDescription={jobDescription} 
            onJobDescriptionChange={setJobDescription} 
          />
        )}
      </div>
    </div>
  );
};

export default Builder;
