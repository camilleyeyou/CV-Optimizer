import React, { useState, useMemo } from 'react';
import { useResume } from '../../context/ResumeContext';
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
      <p>{resumeData.personalInfo?.location || resumeData.personalInfo?.address}</p>
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
            <h3>{job.title || job.jobTitle} at {job.company}</h3>
            <p><em>{job.startDate} - {job.endDate || 'Present'}</em></p>
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
            <h3>{edu.degree} - {edu.institution || edu.school}</h3>
            <p><em>{edu.graduationDate || edu.endDate}</em></p>
          </div>
        ))}
      </section>
    )}
    
    {resumeData.skills && resumeData.skills.length > 0 && (
      <section>
        <h2>Skills</h2>
        <p>{Array.isArray(resumeData.skills) ? resumeData.skills.map(skill => 
          typeof skill === 'object' ? skill.name : skill
        ).join(', ') : resumeData.skills}</p>
      </section>
    )}
  </div>
);

// Function to get all CSS styles from the page
const getAllStyles = () => {
  let styles = '';
  
  // Get all stylesheets
  Array.from(document.styleSheets).forEach(styleSheet => {
    try {
      Array.from(styleSheet.cssRules || styleSheet.rules).forEach(rule => {
        styles += rule.cssText + '\n';
      });
    } catch (e) {
      // Handle cross-origin stylesheets or access issues
      console.warn('Could not access stylesheet:', e);
    }
  });
  
  // Get inline styles from style tags
  Array.from(document.querySelectorAll('style')).forEach(styleTag => {
    styles += styleTag.innerHTML + '\n';
  });
  
  return styles;
};

// Template-specific styles
const getTemplateStyles = (template) => {
  const baseStyles = `
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body { 
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      line-height: 1.5;
      color: #333;
      background: white;
      padding: 0.75in;
      font-size: 14px;
    }
    .resume-preview, .preview-document {
      max-width: 8.5in;
      margin: 0 auto;
      background: white;
    }
    h1 { 
      font-size: 28px; 
      margin-bottom: 12px;
      font-weight: 700;
    }
    h2 { 
      font-size: 18px; 
      margin: 20px 0 12px 0;
      font-weight: 600;
    }
    h3 { 
      font-size: 16px; 
      margin: 12px 0 6px 0;
      font-weight: 600;
    }
    h4 {
      font-size: 14px;
      margin: 8px 0 4px 0;
      font-weight: 500;
    }
    p { 
      margin-bottom: 8px;
      font-size: 14px;
      line-height: 1.4;
    }
    ul, ol {
      margin-left: 20px;
      margin-bottom: 12px;
    }
    li {
      margin-bottom: 4px;
      font-size: 14px;
      line-height: 1.4;
    }
    @media print {
      body { 
        print-color-adjust: exact;
        -webkit-print-color-adjust: exact;
        margin: 0;
        padding: 0.5in;
      }
      * {
        -webkit-print-color-adjust: exact !important;
        color-adjust: exact !important;
      }
    }
    @page {
      margin: 0.5in;
      size: letter;
    }
  `;

  const templateStyles = {
    modern: `
      ${baseStyles}
      .modern-template {
        font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
      }
      .modern-header {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        padding: 30px;
        margin: -0.75in -0.75in 30px -0.75in;
        text-align: center;
      }
      .modern-header h1 {
        font-size: 32px;
        font-weight: 700;
        margin-bottom: 8px;
        color: white;
      }
      .modern-header .contact-info {
        font-size: 16px;
        opacity: 0.9;
      }
      .modern-header .contact-info span {
        margin: 0 15px;
      }
      .modern-section {
        margin-bottom: 25px;
      }
      .modern-section h2 {
        color: #667eea;
        font-size: 20px;
        font-weight: 600;
        border-bottom: 2px solid #667eea;
        padding-bottom: 5px;
        margin-bottom: 15px;
      }
      .experience-item, .education-item {
        margin-bottom: 20px;
        padding-left: 15px;
        border-left: 3px solid #f0f0f0;
      }
      .job-header h3 {
        color: #333;
        font-size: 18px;
        font-weight: 600;
      }
      .job-header p {
        color: #666;
        font-style: italic;
        margin-bottom: 8px;
      }
      .skills-list {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        margin-top: 10px;
      }
      .skill-tag {
        background: linear-gradient(135deg, #667eea, #764ba2);
        color: white;
        padding: 6px 12px;
        border-radius: 20px;
        font-size: 12px;
        font-weight: 500;
      }
    `,
    
    classic: `
      ${baseStyles}
      .classic-template {
        font-family: 'Times New Roman', serif;
        max-width: 8.5in;
        margin: 0 auto;
      }
      .classic-header {
        text-align: center;
        border-bottom: 3px double #333;
        padding-bottom: 20px;
        margin-bottom: 25px;
      }
      .classic-header h1 {
        font-size: 30px;
        font-weight: bold;
        color: #2c3e50;
        margin-bottom: 10px;
        text-transform: uppercase;
        letter-spacing: 1px;
      }
      .classic-header .contact-info {
        font-size: 14px;
        color: #555;
      }
      .classic-header .contact-info span {
        margin: 0 10px;
      }
      .classic-section {
        margin-bottom: 25px;
      }
      .classic-section h2 {
        font-size: 18px;
        font-weight: bold;
        color: #2c3e50;
        text-transform: uppercase;
        border-bottom: 1px solid #333;
        padding-bottom: 3px;
        margin-bottom: 15px;
        letter-spacing: 0.5px;
      }
      .experience-item, .education-item {
        margin-bottom: 18px;
      }
      .experience-item h3, .education-item h3 {
        font-size: 16px;
        font-weight: bold;
        color: #2c3e50;
      }
      .experience-item h4, .education-item h4 {
        font-size: 14px;
        color: #555;
        font-style: italic;
        margin-bottom: 5px;
      }
      .date-range {
        font-size: 13px;
        color: #777;
        font-style: italic;
      }
      .skills-list {
        line-height: 1.6;
      }
      .skill-item {
        display: inline;
        margin-right: 12px;
        font-weight: 500;
      }
      .skill-item:after {
        content: " •";
        color: #999;
      }
      .skill-item:last-child:after {
        content: "";
      }
    `,
    
    minimal: `
      ${baseStyles}
      .minimal-template {
        font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
        font-weight: 300;
        color: #333;
      }
      .minimal-header {
        margin-bottom: 40px;
        padding-bottom: 20px;
        border-bottom: 1px solid #e0e0e0;
      }
      .minimal-header h1 {
        font-size: 36px;
        font-weight: 200;
        color: #2c3e50;
        margin-bottom: 8px;
        letter-spacing: -0.5px;
      }
      .minimal-header .contact-info {
        font-size: 14px;
        color: #7f8c8d;
        font-weight: 300;
      }
      .minimal-section {
        margin-bottom: 30px;
      }
      .minimal-section h2 {
        font-size: 16px;
        font-weight: 400;
        color: #2c3e50;
        text-transform: uppercase;
        letter-spacing: 2px;
        margin-bottom: 20px;
        position: relative;
      }
      .minimal-section h2:after {
        content: '';
        position: absolute;
        bottom: -5px;
        left: 0;
        width: 30px;
        height: 1px;
        background: #3498db;
      }
      .experience-item, .education-item {
        margin-bottom: 25px;
        position: relative;
        padding-left: 0;
      }
      .experience-item h3, .education-item h3 {
        font-size: 16px;
        font-weight: 400;
        color: #2c3e50;
        margin-bottom: 4px;
      }
      .experience-item p, .education-item p {
        font-size: 13px;
        color: #7f8c8d;
        margin-bottom: 8px;
      }
      .skills-list {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
        gap: 8px;
        margin-top: 15px;
      }
      .skill-tag {
        background: #f8f9fa;
        border: 1px solid #e9ecef;
        padding: 8px 12px;
        text-align: center;
        font-size: 12px;
        font-weight: 400;
        color: #495057;
        border-radius: 0;
      }
    `,
    
    creative: `
      ${baseStyles}
      .creative-template {
        font-family: 'Poppins', -apple-system, BlinkMacSystemFont, sans-serif;
        background: linear-gradient(45deg, #ff6b6b, #4ecdc4, #45b7d1, #f9ca24);
        background-size: 400% 400%;
        padding: 30px;
        border-radius: 10px;
        color: #2c3e50;
      }
      .creative-header {
        background: rgba(255, 255, 255, 0.95);
        padding: 25px;
        border-radius: 15px;
        text-align: center;
        margin-bottom: 25px;
        box-shadow: 0 8px 25px rgba(0,0,0,0.1);
      }
      .creative-header h1 {
        font-size: 32px;
        font-weight: 700;
        background: linear-gradient(45deg, #ff6b6b, #4ecdc4);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
        margin-bottom: 10px;
      }
      .creative-header .contact-info {
        font-size: 14px;
        color: #555;
        font-weight: 500;
      }
      .creative-section {
        background: rgba(255, 255, 255, 0.9);
        padding: 20px;
        border-radius: 10px;
        margin-bottom: 20px;
        box-shadow: 0 4px 15px rgba(0,0,0,0.05);
      }
      .creative-section h2 {
        font-size: 20px;
        font-weight: 600;
        color: #2c3e50;
        margin-bottom: 15px;
        position: relative;
        padding-left: 15px;
      }
      .creative-section h2:before {
        content: '';
        position: absolute;
        left: 0;
        top: 50%;
        transform: translateY(-50%);
        width: 4px;
        height: 20px;
        background: linear-gradient(45deg, #ff6b6b, #4ecdc4);
        border-radius: 2px;
      }
      .experience-item, .education-item {
        margin-bottom: 20px;
        padding: 15px;
        background: rgba(255, 255, 255, 0.7);
        border-radius: 8px;
        border-left: 4px solid #4ecdc4;
      }
      .skills-list {
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
        margin-top: 15px;
      }
      .skill-tag {
        background: linear-gradient(45deg, #ff6b6b, #4ecdc4);
        color: white;
        padding: 8px 15px;
        border-radius: 25px;
        font-size: 12px;
        font-weight: 500;
        box-shadow: 0 2px 10px rgba(0,0,0,0.1);
      }
    `
  };

  return templateStyles[template] || templateStyles.modern;
};

const ResumePreview = ({ showHeader = true }) => {
  const { 
    resumeData, 
    loading
  } = useResume();
  
  const [saveMessage, setSaveMessage] = useState('');
  const [error, setError] = useState('');

  const currentTemplate = useMemo(() => {
    return resumeData?.template || 'modern';
  }, [resumeData?.template]);

  // Enhanced PDF download with template styles
  const handleDownloadPDF = async () => {
    try {
      setError('');
      setSaveMessage('Preparing PDF with template styles...');
      
      // Check if we have resume data
      if (!resumeData || !resumeData.personalInfo) {
        throw new Error('No resume data available. Please fill out your resume first.');
      }

      // Create filename from user's name
      const firstName = resumeData.personalInfo.firstName || 'Resume';
      const lastName = resumeData.personalInfo.lastName || '';
      const filename = `${firstName}${lastName ? '_' + lastName : ''}_Resume.pdf`;

      // Get the preview content
      const previewElement = document.querySelector('.preview-document') || 
                           document.querySelector('.resume-preview');
      
      if (!previewElement) {
        throw new Error('Could not find resume preview to generate PDF');
      }

      setSaveMessage('Capturing template styles...');

      // Create a new window for printing with enhanced styling
      const printWindow = window.open('', '_blank', 'width=800,height=1000');
      
      // Get computed styles for the preview element
      const computedStyles = window.getComputedStyle(previewElement);
      
      // Get template-specific styles
      const templateStyles = getTemplateStyles(currentTemplate);
      
      // Create enhanced HTML document for printing
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>${filename}</title>
          <meta charset="UTF-8">
          <style>
            ${templateStyles}
            
            /* Additional enhancements for PDF */
            body {
              -webkit-print-color-adjust: exact !important;
              color-adjust: exact !important;
            }
            
            * {
              -webkit-print-color-adjust: exact !important;
              color-adjust: exact !important;
            }
            
            /* Prevent page breaks inside items */
            .experience-item,
            .education-item,
            .skill-section,
            .resume-section {
              page-break-inside: avoid;
              break-inside: avoid;
            }
            
            /* Ensure headers don't get orphaned */
            h1, h2, h3 {
              page-break-after: avoid;
              break-after: avoid;
            }
            
            /* Better spacing for print */
            .resume-preview {
              box-shadow: none !important;
              border: none !important;
              margin: 0 !important;
              padding: 0 !important;
            }
            
            /* Hide any preview-only elements */
            .preview-header,
            .preview-actions,
            .download-button {
              display: none !important;
            }
          </style>
        </head>
        <body>
          ${previewElement.outerHTML}
          <script>
            // Wait for fonts and styles to load, then print
            window.onload = function() {
              // Give extra time for any web fonts to load
              setTimeout(function() {
                window.print();
                // Close after a delay to allow print dialog
                setTimeout(function() {
                  window.close();
                }, 1000);
              }, 750);
            }
          </script>
        </body>
        </html>
      `);
      
      printWindow.document.close();
      printWindow.focus();
      
      setSaveMessage('PDF download initiated! 🎉');
      setTimeout(() => setSaveMessage(''), 4000);
      
    } catch (err) {
      console.error('Error downloading PDF:', err);
      setError(`Failed to download PDF: ${err.message}`);
      setSaveMessage('');
      setTimeout(() => setError(''), 5000);
    }
  };

  // Return the appropriate template based on the template value
  const renderTemplate = () => {
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

  if (!resumeData) {
    return (
      <div className="resume-preview">
        <div className="loading-message">Loading resume...</div>
      </div>
    );
  }

  return (
    <div className="resume-preview">
      <div className="preview-container">
        {showHeader && (
          <div className="preview-header">
            <h3>Resume Preview - {currentTemplate.charAt(0).toUpperCase() + currentTemplate.slice(1)} Template</h3>
            <div className="preview-actions">
              {saveMessage && (
                <div className="save-message" style={{ 
                  color: '#28a745', 
                  fontWeight: 'bold',
                  padding: '8px 12px',
                  backgroundColor: '#f8f9fa',
                  borderRadius: '4px',
                  border: '1px solid #28a745'
                }}>
                  {saveMessage}
                </div>
              )}
              {error && (
                <div className="error-message" style={{ 
                  color: '#dc3545', 
                  fontWeight: 'bold',
                  padding: '8px 12px',
                  backgroundColor: '#f8f9fa',
                  borderRadius: '4px',
                  border: '1px solid #dc3545'
                }}>
                  {error}
                </div>
              )}
              <button 
                className="download-button" 
                onClick={handleDownloadPDF}
                disabled={loading || !resumeData?.personalInfo?.firstName}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#007bff',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '500',
                  boxShadow: '0 2px 4px rgba(0,123,255,0.2)',
                  transition: 'all 0.2s ease'
                }}
                onMouseOver={(e) => e.target.style.backgroundColor = '#0056b3'}
                onMouseOut={(e) => e.target.style.backgroundColor = '#007bff'}
              >
                {loading ? '⏳ Processing...' : '📄 Download PDF with Styling'}
              </button>
            </div>
          </div>
        )}
        
        <div className="preview-document" style={{ 
          border: '1px solid #ddd', 
          borderRadius: '8px', 
          overflow: 'hidden',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
        }}>
          {renderTemplate()}
        </div>
      </div>
    </div>
  );
};

export default React.memo(ResumePreview);