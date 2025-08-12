import React from 'react';
import { useResume } from '../../context/ResumeContext';
import './ResumeForm.css';

const ResumeForm = () => {
  const { resumeData } = useResume();

  // ✅ SAFETY CHECK: Make sure resumeData exists and has proper structure
  if (!resumeData || typeof resumeData !== 'object') {
    return (
      <div className="resume-preview">
        <div className="loading-message">Loading resume...</div>
      </div>
    );
  }

  // ✅ SAFETY CHECK: Ensure personalInfo is an object
  const personalInfo = resumeData.personalInfo && typeof resumeData.personalInfo === 'object' && !Array.isArray(resumeData.personalInfo)
    ? resumeData.personalInfo
    : {};

  // Helper function to safely get skills as an array
  const getSkillsArray = () => {
    // Handle if skills is undefined or null
    if (!resumeData.skills) return [];
    
    // Handle if skills is already an array (old format)
    if (Array.isArray(resumeData.skills)) {
      return resumeData.skills;
    }
    
    // Handle if skills is the new nested object format
    const technical = Array.isArray(resumeData.skills.technical) 
      ? resumeData.skills.technical.map(skill => typeof skill === 'string' ? skill : skill.name)
      : [];
    
    const soft = Array.isArray(resumeData.skills.soft)
      ? resumeData.skills.soft.map(skill => typeof skill === 'string' ? skill : skill.name) 
      : [];
    
    return [...technical, ...soft];
  };

  // Get skills safely for rendering
  const skills = getSkillsArray();

  return (
    <div className="resume-preview">
      <div className="resume-header">
        {/* ✅ FIXED: Use safe personalInfo object */}
        <h1>
          {personalInfo.firstName || '[First Name]'} {personalInfo.lastName || '[Last Name]'}
        </h1>
        <div className="contact-info">
          {personalInfo.email && <p>{personalInfo.email}</p>}
          {personalInfo.phone && <p>{personalInfo.phone}</p>}
          {personalInfo.location && <p>{personalInfo.location}</p>}
          {personalInfo.linkedIn && <p>LinkedIn: {personalInfo.linkedIn}</p>}
          {personalInfo.website && <p>Website: {personalInfo.website}</p>}
          
          {/* Legacy address support - only show if these fields exist */}
          {personalInfo.address && (
            <p>
              {personalInfo.address}
              {personalInfo.city && `, ${personalInfo.city}`}
              {personalInfo.state && `, ${personalInfo.state}`}
              {personalInfo.zipCode && ` ${personalInfo.zipCode}`}
            </p>
          )}
        </div>
        
        {/* Show job title if available */}
        {personalInfo.title && (
          <div className="job-title">
            <h2>{personalInfo.title}</h2>
          </div>
        )}
      </div>
      
      {resumeData.summary && (
        <div className="resume-section">
          <h2>Professional Summary</h2>
          <p>{resumeData.summary}</p>
        </div>
      )}
      
      {resumeData.workExperience && Array.isArray(resumeData.workExperience) && resumeData.workExperience.length > 0 && (
        <div className="resume-section">
          <h2>Work Experience</h2>
          {resumeData.workExperience.map((job, index) => (
            <div key={index} className="experience-item">
              <div className="job-header">
                <h3>{job.title || '[Job Title]'}</h3>
                <p>
                  {job.company || '[Company]'}
                  {job.location && ` • ${job.location}`}
                </p>
                <p>
                  {job.startDate || '[Start Date]'} - {job.current ? 'Present' : (job.endDate || '[End Date]')}
                </p>
              </div>
              {job.description && <p>{job.description}</p>}
              {job.highlights && Array.isArray(job.highlights) && job.highlights.length > 0 && (
                <ul>
                  {job.highlights.map((highlight, i) => (
                    <li key={i}>{highlight}</li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      )}
      
      {resumeData.education && Array.isArray(resumeData.education) && resumeData.education.length > 0 && (
        <div className="resume-section">
          <h2>Education</h2>
          {resumeData.education.map((edu, index) => (
            <div key={index} className="education-item">
              <h3>
                {edu.degree || '[Degree]'}
                {edu.field && ` in ${edu.field}`}
              </h3>
              <p>
                {edu.institution || '[Institution]'}
                {edu.location && ` • ${edu.location}`}
              </p>
              <p>
                {edu.startDate || '[Start Date]'} - {edu.current ? 'Present' : (edu.endDate || '[End Date]')}
              </p>
              {edu.gpa && <p>GPA: {edu.gpa}</p>}
            </div>
          ))}
        </div>
      )}
      
      {skills.length > 0 && (
        <div className="resume-section">
          <h2>Skills</h2>
          <div className="skills-list">
            {skills.map((skill, index) => (
              <span key={index} className="skill-tag">{skill}</span>
            ))}
          </div>
        </div>
      )}
      
      {resumeData.certifications && Array.isArray(resumeData.certifications) && resumeData.certifications.length > 0 && (
        <div className="resume-section">
          <h2>Certifications</h2>
          <ul className="certifications-list">
            {resumeData.certifications.map((cert, index) => (
              <li key={index}>
                <strong>{cert.name || '[Certification Name]'}</strong>
                {cert.issuer && ` - ${cert.issuer}`}
                {cert.date && `, ${cert.date}`}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default ResumeForm;