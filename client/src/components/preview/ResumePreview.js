import React, { useRef } from 'react';
import { useResume } from '../../context/ResumeContext';
import ModernTemplate from '../templates/ModernTemplate';
import ProfessionalTemplate from '../templates/ProfessionalTemplate';
import MinimalistTemplate from '../templates/MinimalistTemplate';
import CreativeTemplate from '../templates/CreativeTemplate';
import TemplateStyles from '../common/TemplateStyles';
import { downloadPDF } from '../../services/pdfService';

const ResumePreview = ({ allowDownload = true }) => {
  const { resumeData } = useResume();
  const resumeRef = useRef(null);
  
  // Render the selected template
  const renderTemplate = () => {
    switch (resumeData.selectedTemplate) {
      case 'modern':
        return <ModernTemplate resumeData={resumeData} />;
      case 'professional':
        return <ProfessionalTemplate resumeData={resumeData} />;
      case 'minimalist':
        return <MinimalistTemplate resumeData={resumeData} />;
      case 'creative':
        return <CreativeTemplate resumeData={resumeData} />;
      default:
        return <ModernTemplate resumeData={resumeData} />;
    }
  };
  
  // Handle PDF download
  const handleDownload = async () => {
    if (!resumeRef.current) return;
    
    try {
      // Construct filename from user's name
      const { firstName, lastName } = resumeData.personalInfo;
      const name = `${firstName || 'Resume'}_${lastName || ''}`.trim().replace(/\s+/g, '_');
      const filename = `${name}_Resume.pdf`;
      
      // Download PDF
      await downloadPDF(resumeRef.current, {
        filename,
        format: 'a4',
        orientation: 'portrait',
        margin: { top: 10, right: 10, bottom: 10, left: 10 }
      });
    } catch (error) {
      console.error('Error downloading PDF:', error);
      alert('There was an error generating your PDF. Please try again.');
    }
  };
  
  return (
    <div className="resume-preview">
      {/* Add template-specific styles */}
      <TemplateStyles templateId={resumeData.selectedTemplate} />
      
      {allowDownload && (
        <div className="preview-actions">
          <button 
            className="btn btn-primary"
            onClick={handleDownload}
          >
            Download PDF
          </button>
        </div>
      )}
      
      <div className="preview-container">
        <div ref={resumeRef}>
          {renderTemplate()}
        </div>
      </div>
    </div>
  );
};

export default ResumePreview;
