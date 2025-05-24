import React, { useState, useMemo } from 'react';
import { useResume } from '../../context/ResumeContext';
import { generateResumePDF, downloadResumeHTML } from '../../utils/pdfGenerator';
import './ResumePreview.css';

// Import templates with error handling
let ModernTemplate, ClassicTemplate, CreativeTemplate, MinimalTemplate, ProfessionalTemplate, TechnicalTemplate;

try {
  ModernTemplate = require('../templates/ModernTemplate').default;
} catch (e) {
  console.warn('ModernTemplate not found');
}

try {
  ClassicTemplate = require('../templates/ClassicTemplate').default;
} catch (e) {
  console.warn('ClassicTemplate not found');
}

try {
  CreativeTemplate = require('../templates/CreativeTemplate').default;
} catch (e) {
  console.warn('CreativeTemplate not found');
}

try {
  MinimalTemplate = require('../templates/MinimalTemplate').default;
} catch (e) {
  console.warn('MinimalTemplate not found');
}

try {
  ProfessionalTemplate = require('../templates/ProfessionalTemplate').default;
} catch (e) {
  console.warn('ProfessionalTemplate not found');
}

try {
  TechnicalTemplate = require('../templates/TechnicalTemplate').default;
} catch (e) {
  console.warn('TechnicalTemplate not found');
}

// Fallback template component
const FallbackTemplate = ({ resumeData }) => (
  <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
    <header style={{ borderBottom: '2px solid #333', paddingBottom: '10px', marginBottom: '20px' }}>
      <h1>{resumeData.personalInfo?.firstName} {resumeData.personalInfo?.lastName}</h1>
      <p>{resumeData.personalInfo?.email} | {resumeData.personalInfo?.phone}</p>
      <p>{resumeData.personalInfo?.address}</p>
    </header>
    
    {resumeData.summary && (
      <section style={{ marginBottom: '20px' }}>
        <h2>Summary</h2>
        <p>{resumeData.summary}</p>
      </section>
    )}
    
    {resumeData.workExperience && resumeData.workExperience.length > 0 && (
      <section style={{ marginBottom: '20px' }}>
        <h2>Work Experience</h2>
        {resumeData.workExperience.map((job, index) => (
          <div key={index} style={{ marginBottom: '15px' }}>
            <h3>{job.jobTitle} at {job.company}</h3>
            <p><em>{job.startDate} - {job.endDate}</em></p>
            <p>{job.description}</p>
          </div>
        ))}
      </section>
    )}
    
    {resumeData.education && resumeData.education.length > 0 && (
      <section style={{ marginBottom: '20px' }}>
        <h2>Education</h2>
        {resumeData.education.map((edu, index) => (
          <div key={index} style={{ marginBottom: '10px' }}>
            <h3>{edu.degree} - {edu.school}</h3>
            <p><em>{edu.graduationDate}</em></p>
          </div>
        ))}
      </section>
    )}
    
    {resumeData.skills && resumeData.skills.length > 0 && (
      <section>
        <h2>Skills</h2>
        <p>{resumeData.skills.join(', ')}</p>
      </section>
    )}
  </div>
);

const ResumePreview = ({ showHeader = true }) => {
  // FIXED: Only destructure properties that actually exist in your context
  const { resumeData, saveCurrentResume, isLoading } = useResume();
  
  const [saveMessage, setSaveMessage] = useState('');
  const [error, setError] = useState('');

  // FIXED: Get template from resumeData.template instead of non-existent activeTemplate
  // Use useMemo to prevent unnecessary recalculations
  const currentTemplate = useMemo(() => {
    return resumeData?.template || 'modern';
  }, [resumeData?.template]);

  const handleDownloadPDF = async () => {
    try {
      setError(''); // Clear any previous errors
      
      // Save the resume first
      setSaveMessage('Saving resume...');
      const savedId = saveCurrentResume();
      
      if (savedId) {
        setSaveMessage('Generating PDF...');
        
        // Try PDF generation first
        try {
          await generateResumePDF(resumeData);
          setSaveMessage('PDF generated successfully!');
        } catch (pdfError) {
          console.warn('PDF generation failed, falling back to HTML download:', pdfError);
          setSaveMessage('Downloading as HTML file...');
          downloadResumeHTML(resumeData);
          setSaveMessage('HTML file downloaded successfully!');
        }
        
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
  };

  // Return the appropriate template based on the template value
  const renderTemplate = () => {
    // FIXED: Completely remove console.log to stop spam
    // Template logging removed as it was causing performance issues
    
    const TemplateComponent = (() => {
      switch (currentTemplate) {
        case 'modern':
          return ModernTemplate || FallbackTemplate;
        case 'classic':
          return ClassicTemplate || FallbackTemplate;
        case 'creative':
          return CreativeTemplate || FallbackTemplate;
        case 'minimal':
          return MinimalTemplate || FallbackTemplate;
        case 'professional':
          return ProfessionalTemplate || FallbackTemplate;
        case 'technical':
          return TechnicalTemplate || FallbackTemplate;
        default:
          return ModernTemplate || FallbackTemplate;
      }
    })();

    return <TemplateComponent resumeData={resumeData} />;
  };

  // FIXED: Add safety check for resumeData
  if (!resumeData) {
    return <div>Loading resume...</div>;
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

// Use React.memo to prevent unnecessary re-rendering
export default React.memo(ResumePreview);