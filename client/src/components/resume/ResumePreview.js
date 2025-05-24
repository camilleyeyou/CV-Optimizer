import React, { useState, useCallback } from 'react';
import { useResume } from '../../context/ResumeContext';
import './ResumePreview.css';

// Import templates
import ModernTemplate from '../templates/ModernTemplate';
import ClassicTemplate from '../templates/ClassicTemplate';
import CreativeTemplate from '../templates/CreativeTemplate';
import MinimalTemplate from '../templates/MinimalTemplate';
import ProfessionalTemplate from '../templates/ProfessionalTemplate';
import TechnicalTemplate from '../templates/TechnicalTemplate';

const ResumePreview = ({ showHeader = true }) => {
  // Fix: Use correct properties from context
  const { resumeData, saveCurrentResume, isLoading } = useResume();
  const [saveMessage, setSaveMessage] = useState('');
  const [error, setError] = useState('');

  // Fix: Use resumeData.template instead of activeTemplate
  const activeTemplate = resumeData?.template || 'modern';

  // 🔧 PERFORMANCE: Use useCallback to prevent unnecessary re-renders
  const handleDownloadPDF = useCallback(async () => {
    try {
      setError(''); // Clear any previous errors
      
      // Save the resume first
      setSaveMessage('Saving resume...');
      const savedId = await saveCurrentResume();
      
      if (savedId) {
        setSaveMessage('Resume saved! Generating PDF...');
        
        // Import the PDF generation utility
        const { generateResumePDF } = await import('../../utils/pdfGenerator');
        
        // Generate PDF
        await generateResumePDF(resumeData);
        
        setSaveMessage('PDF downloaded successfully!');
        setTimeout(() => setSaveMessage(''), 3000);
      } else {
        throw new Error('Failed to save resume');
      }
    } catch (err) {
      console.error('Error downloading PDF:', err);
      setError('Failed to download PDF. Please try again.');
      setSaveMessage('');
      
      // Clear the error message after 5 seconds
      setTimeout(() => setError(''), 5000);
    }
  }, [resumeData, saveCurrentResume]);

  // 🔧 CRITICAL FIX: Memoize template rendering to prevent infinite loops
  const renderTemplate = useCallback(() => {
    // Early return if no resumeData
    if (!resumeData) {
      return <ModernTemplate resumeData={null} />;
    }
    
    switch (activeTemplate) {
      case 'modern':
        return <ModernTemplate resumeData={resumeData} />;
      case 'classic':
        return <ClassicTemplate resumeData={resumeData} />;
      case 'creative':
        return <CreativeTemplate resumeData={resumeData} />;
      case 'minimal':
        return <MinimalTemplate resumeData={resumeData} />;
      case 'professional':
        return <ProfessionalTemplate resumeData={resumeData} />;
      case 'technical':
        return <TechnicalTemplate resumeData={resumeData} />;
      default:
        return <ModernTemplate resumeData={resumeData} />;
    }
  }, [activeTemplate, resumeData]); // Only re-render when template or data changes

  // 🔧 SAFETY: Early return if no resumeData
  if (!resumeData) {
    return (
      <div className="resume-preview">
        <div className="preview-container">
          <div className="loading-preview">Loading preview...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="resume-preview">
      <div className="preview-container">
        {showHeader && (
          <div className="preview-header">
            <h3>Resume Preview</h3>
            <div className="preview-actions">
              {saveMessage && (
                <div className="save-message">{saveMessage}</div>
              )}
              {error && (
                <div className="error-message">{error}</div>
              )}
              <button 
                className="download-button" 
                onClick={handleDownloadPDF}
                disabled={isLoading}
              >
                {isLoading ? 'Processing...' : 'Download PDF'}
              </button>
            </div>
          </div>
        )}
        
        <div className="preview-document">
          {renderTemplate()}
        </div>
      </div>
    </div>
  );
};

// 🔧 PERFORMANCE: Use React.memo with proper comparison
export default React.memo(ResumePreview, (prevProps, nextProps) => {
  // Only re-render if showHeader changes
  return prevProps.showHeader === nextProps.showHeader;
});