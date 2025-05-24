import React from 'react';
import { useResume } from '../../context/ResumeContext';
import './ResumeForm.css';

const ResumeForm = () => {
  const { resumeData } = useResume();

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
        <h1>{resumeData.personalInfo.firstName} {resumeData.personalInfo.lastName}</h1>
        <div className="contact-info">
          {resumeData.personalInfo.email && <p>{resumeData.personalInfo.email}</p>}
          {resumeData.personalInfo.phone && <p>{resumeData.personalInfo.phone}</p>}
          {resumeData.personalInfo.address && (
            <p>
              {resumeData.personalInfo.address}, 
              {resumeData.personalInfo.city}, 
              {resumeData.personalInfo.state} 
              {resumeData.personalInfo.zipCode}
            </p>
          )}
        </div>
      </div>
      
      {resumeData.summary && (
        <div className="resume-section">
          <h2>Professional Summary</h2>
          <p>{resumeData.summary}</p>
        </div>
      )}
      
      {resumeData.workExperience && resumeData.workExperience.length > 0 && (
        <div className="resume-section">
          <h2>Work Experience</h2>
          {resumeData.workExperience.map((job, index) => (
            <div key={index} className="experience-item">
              <div className="job-header">
                <h3>{job.title}</h3>
                <p>{job.company} • {job.location}</p>
                <p>{job.startDate} - {job.current ? 'Present' : job.endDate}</p>
              </div>
              <p>{job.description}</p>
              {job.highlights && job.highlights.length > 0 && (
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
      
      {resumeData.education && resumeData.education.length > 0 && (
        <div className="resume-section">
          <h2>Education</h2>
          {resumeData.education.map((edu, index) => (
            <div key={index} className="education-item">
              <h3>{edu.degree} in {edu.field}</h3>
              <p>{edu.institution} • {edu.location}</p>
              <p>{edu.startDate} - {edu.current ? 'Present' : edu.endDate}</p>
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
      
      {resumeData.certifications && resumeData.certifications.length > 0 && (
        <div className="resume-section">
          <h2>Certifications</h2>
          <ul className="certifications-list">
            {resumeData.certifications.map((cert, index) => (
              <li key={index}>
                <strong>{cert.name}</strong> - {cert.issuer}, {cert.date}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default ResumeForm;
