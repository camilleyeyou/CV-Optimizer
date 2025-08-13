import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useResume } from '../context/ResumeContext';
import ResumeForm from '../components/builder/ResumeForm';
import ResumePreview from '../components/builder/ResumePreview';
import ResumeAnalyzer from '../components/analysis/ResumeAnalyzer';
import './Builder.css';

const Builder = () => {
  const { id } = useParams();
  
  // ✅ FIXED: Use correct methods from context
  const { 
    loadResume, 
    resumeData, 
    loading, 
    error 
  } = useResume();
  
  const [activeTab, setActiveTab] = useState('edit');
  const [isSaving, setIsSaving] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Load resume effect
  useEffect(() => {
    if (id && id !== resumeData?.id) {
      console.log('📥 Builder loading resume:', id);
      loadResume(id);
    }
  }, [id, loadResume, resumeData?.id]);

  // ✅ FIXED: Simplified save handler - context already handles auto-saving
  const handleSave = async () => {
    setIsSaving(true);
    try {
      // The context already auto-saves via updatePersonalInfo, updateSummary, etc.
      // Just show success feedback to user
      console.log('✅ Resume changes are automatically saved to localStorage and database');
      
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error) {
      console.error('Error saving resume:', error);
      alert('Failed to save resume. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  // ✅ FIXED: Simplified PDF generation
  const handleDownloadPDF = async () => {
    setIsGeneratingPDF(true);
    try {
      // Check if we have resume data
      if (!resumeData || !resumeData.personalInfo) {
        throw new Error('No resume data available. Please fill out your resume first.');
      }

      // Create filename from user's name
      const firstName = resumeData.personalInfo.firstName || 'Resume';
      const lastName = resumeData.personalInfo.lastName || '';
      const filename = `${firstName}${lastName ? '_' + lastName : ''}_Resume.pdf`;

      // Simple PDF generation using browser's print functionality
      // This creates a PDF of the current preview
      const printWindow = window.open('', '_blank');
      
      // Get the preview content
      const previewElement = document.querySelector('.resume-preview') || 
                           document.querySelector('[class*="template"]') ||
                           document.querySelector('.builder-content');
      
      if (!previewElement) {
        throw new Error('Could not find resume preview to generate PDF');
      }

      // Create a simple HTML document for printing
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>${filename}</title>
          <style>
            body { 
              font-family: Arial, sans-serif; 
              margin: 0; 
              padding: 20px; 
              line-height: 1.4;
            }
            .resume-preview {
              max-width: 8.5in;
              margin: 0 auto;
            }
            .resume-header h1 {
              font-size: 24px;
              margin-bottom: 10px;
            }
            .contact-info {
              margin-bottom: 20px;
            }
            .resume-section {
              margin-bottom: 20px;
            }
            .resume-section h2 {
              font-size: 18px;
              border-bottom: 1px solid #ccc;
              padding-bottom: 5px;
              margin-bottom: 10px;
            }
            .experience-item, .education-item {
              margin-bottom: 15px;
            }
            .skills-list {
              display: flex;
              flex-wrap: wrap;
              gap: 10px;
            }
            .skill-tag {
              background: #f0f0f0;
              padding: 4px 8px;
              border-radius: 4px;
              font-size: 14px;
            }
            @media print {
              body { print-color-adjust: exact; }
            }
          </style>
        </head>
        <body>
          ${previewElement.outerHTML}
        </body>
        </html>
      `);
      
      printWindow.document.close();
      
      // Trigger print dialog
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 250);

      console.log('✅ PDF generation initiated');
      
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert(`Failed to generate PDF: ${error.message}`);
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="builder-page">
        <div className="loading-message">Loading resume...</div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="builder-page">
        <div className="error-message">Error: {error}</div>
      </div>
    );
  }

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
            {isSaving ? 'Saving...' : 'Auto-Saved ✓'}
          </button>
          <button 
            className="download-button" 
            onClick={handleDownloadPDF}
            disabled={isGeneratingPDF || !resumeData?.personalInfo?.firstName}
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
        {activeTab === 'analyze' && <ResumeAnalyzer />}
      </div>
    </div>
  );
};

export default Builder;