import React from 'react';
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
  const { resumeData, activeTemplate, generatePDF } = useResume();

  const handleDownloadPDF = () => {
    generatePDF();
  };

  // Return the appropriate template based on the activeTemplate value
  const renderTemplate = () => {
    console.log('Rendering template:', activeTemplate);
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
  };

  return (
    <div className="resume-preview">
      <div className="preview-container">
        {showHeader && (
          <div className="preview-header">
            <h3>Resume Preview</h3>
            <div className="preview-actions">
              <button className="download-button" onClick={handleDownloadPDF}>
                Download PDF
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

export default ResumePreview;
