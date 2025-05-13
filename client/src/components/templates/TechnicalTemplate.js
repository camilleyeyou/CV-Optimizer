import React from 'react';
import './Templates.css';

const TechnicalTemplate = ({ resumeData }) => {
  // Sort skills by level
  const sortedSkills = [...resumeData.skills].sort((a, b) => {
    const levelOrder = { 'Expert': 0, 'Advanced': 1, 'Intermediate': 2, 'Beginner': 3 };
    return levelOrder[a.level] - levelOrder[b.level];
  });
  
  return (
    <div className="resume-template technical-template">
      <header className="template-header">
        <h1>{resumeData.personalInfo.firstName} {resumeData.personalInfo.lastName}</h1>
        <p className="job-title">{resumeData.workExperience.length > 0 ? resumeData.workExperience[0].title : 'Technical Professional'}</p>
        <div className="contact-info">
          <div>{resumeData.personalInfo.email}</div>
          <div>{resumeData.personalInfo.phone}</div>
          <div>{resumeData.personalInfo.city}, {resumeData.personalInfo.state}</div>
          {resumeData.personalInfo.linkedIn && <div>{resumeData.personalInfo.linkedIn}</div>}
          {resumeData.personalInfo.website && <div>{resumeData.personalInfo.website}</div>}
        </div>
      </header>
      
      <div className="template-two-columns">
        <div className="left-column">
          {resumeData.skills.length > 0 && (
            <section className="template-section">
              <h2>Technical Skills</h2>
              <div className="skills-categories">
                {sortedSkills.filter(skill => skill.level === 'Expert' || skill.level === 'Advanced').length > 0 && (
                  <div className="skill-category">
                    <h3>Advanced Skills</h3>
                    <div className="skills-list">
                      {sortedSkills
                        .filter(skill => skill.level === 'Expert' || skill.level === 'Advanced')
                        .map((skill, index) => (
                          <span key={index} className="skill-tag">{skill.name}</span>
                        ))
                      }
                    </div>
                  </div>
                )}
                
                {sortedSkills.filter(skill => skill.level === 'Intermediate').length > 0 && (
                  <div className="skill-category">
                    <h3>Intermediate Skills</h3>
                    <div className="skills-list">
                      {sortedSkills
                        .filter(skill => skill.level === 'Intermediate')
                        .map((skill, index) => (
                          <span key={index} className="skill-tag">{skill.name}</span>
                        ))
                      }
                    </div>
                  </div>
                )}
                
                {sortedSkills.filter(skill => skill.level === 'Beginner').length > 0 && (
                  <div className="skill-category">
                    <h3>Familiar With</h3>
                    <div className="skills-list">
                      {sortedSkills
                        .filter(skill => skill.level === 'Beginner')
                        .map((skill, index) => (
                          <span key={index} className="skill-tag">{skill.name}</span>
                        ))
                      }
                    </div>
                  </div>
                )}
              </div>
            </section>
          )}
          
          {resumeData.certifications.length > 0 && (
            <section className="template-section">
              <h2>Certifications</h2>
              {resumeData.certifications.map((cert, index) => (
                <div key={index} className="template-item">
                  <h3>{cert.name}</h3>
                  <div className="item-subheader">{cert.issuer} - {cert.date}</div>
                </div>
              ))}
            </section>
          )}
          
          {resumeData.education.length > 0 && (
            <section className="template-section">
              <h2>Education</h2>
              {resumeData.education.map((edu, index) => (
                <div key={index} className="template-item">
                  <div className="item-header">
                    <h3>{edu.degree} in {edu.field}</h3>
                    <span className="date-range">{edu.startDate} - {edu.current ? 'Present' : edu.endDate}</span>
                  </div>
                  <div className="item-subheader">{edu.institution}, {edu.location}</div>
                  {edu.gpa && <p>GPA: {edu.gpa}</p>}
                </div>
              ))}
            </section>
          )}
        </div>
        
        <div className="right-column">
          {resumeData.summary && (
            <section className="template-section">
              <h2>Profile</h2>
              <p>{resumeData.summary}</p>
            </section>
          )}
          
          {resumeData.workExperience.length > 0 && (
            <section className="template-section">
              <h2>Professional Experience</h2>
              {resumeData.workExperience.map((exp, index) => (
                <div key={index} className="template-item">
                  <div className="item-header">
                    <h3>{exp.title}</h3>
                    <span className="date-range">{exp.startDate} - {exp.current ? 'Present' : exp.endDate}</span>
                  </div>
                  <div className="item-subheader">{exp.company}, {exp.location}</div>
                  <p>{exp.description}</p>
                  {exp.highlights.length > 0 && (
                    <ul className="item-bullets">
                      {exp.highlights.map((highlight, idx) => (
                        <li key={idx}>{highlight}</li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </section>
          )}
        </div>
      </div>
    </div>
  );
};

export default TechnicalTemplate;
