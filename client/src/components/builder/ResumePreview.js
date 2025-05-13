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

const ResumePreview = () => {
  const { resumeData, activeTemplate } = useResume();

  // Return the appropriate template based on the activeTemplate value
  const renderTemplate = () => {
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
        <div className="preview-header">
          <h3>Resume Preview</h3>
          <div className="preview-actions">
            <button className="zoom-button" title="Zoom Out">-</button>
            <button className="zoom-button" title="Zoom In">+</button>
          </div>
        </div>
        
        <div className="preview-document">
          {/* For now, we'll show a placeholder until we create the actual templates */}
          <div className="template-placeholder">
            <h2>{activeTemplate.charAt(0).toUpperCase() + activeTemplate.slice(1)} Template</h2>
            <div className="preview-section">
              <h3>Personal Information</h3>
              <p>
                <strong>{resumeData.personalInfo.firstName} {resumeData.personalInfo.lastName}</strong>
              </p>
              <p>{resumeData.personalInfo.email} | {resumeData.personalInfo.phone}</p>
              <p>{resumeData.personalInfo.city}, {resumeData.personalInfo.state}</p>
            </div>
            
            {resumeData.summary && (
              <div className="preview-section">
                <h3>Professional Summary</h3>
                <p>{resumeData.summary}</p>
              </div>
            )}
            
            {resumeData.workExperience.length > 0 && (
              <div className="preview-section">
                <h3>Work Experience</h3>
                {resumeData.workExperience.map((exp, index) => (
                  <div key={index} className="preview-item">
                    <div className="preview-item-header">
                      <h4>{exp.title}</h4>
                      <span>{exp.startDate} - {exp.current ? 'Present' : exp.endDate}</span>
                    </div>
                    <h5>{exp.company}, {exp.location}</h5>
                    <p>{exp.description}</p>
                    {exp.highlights.length > 0 && (
                      <ul>
                        {exp.highlights.map((highlight, idx) => (
                          <li key={idx}>{highlight}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            )}
            
            {resumeData.education.length > 0 && (
              <div className="preview-section">
                <h3>Education</h3>
                {resumeData.education.map((edu, index) => (
                  <div key={index} className="preview-item">
                    <div className="preview-item-header">
                      <h4>{edu.degree} in {edu.field}</h4>
                      <span>{edu.startDate} - {edu.current ? 'Present' : edu.endDate}</span>
                    </div>
                    <h5>{edu.institution}, {edu.location}</h5>
                    {edu.gpa && <p>GPA: {edu.gpa}</p>}
                  </div>
                ))}
              </div>
            )}
            
            {resumeData.skills.length > 0 && (
              <div className="preview-section">
                <h3>Skills</h3>
                <div className="preview-skills">
                  {resumeData.skills.map((skill, index) => (
                    <span key={index} className="preview-skill">
                      {skill.name} ({skill.level})
                    </span>
                  ))}
                </div>
              </div>
            )}
            
            {resumeData.certifications.length > 0 && (
              <div className="preview-section">
                <h3>Certifications</h3>
                {resumeData.certifications.map((cert, index) => (
                  <div key={index} className="preview-item">
                    <h4>{cert.name}</h4>
                    <p>{cert.issuer} - {cert.date}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResumePreview;
