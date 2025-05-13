import React from 'react';
import './Templates.css';

const CreativeTemplate = ({ resumeData }) => {
  return (
    <div className="resume-template creative-template">
      <header className="template-header">
        <h1>{resumeData.personalInfo.firstName} {resumeData.personalInfo.lastName}</h1>
        <p className="job-title">{resumeData.workExperience.length > 0 ? resumeData.workExperience[0].title : 'Professional'}</p>
        <div className="contact-info">
          <div>{resumeData.personalInfo.email}</div>
          <div>{resumeData.personalInfo.phone}</div>
          <div>{resumeData.personalInfo.city}, {resumeData.personalInfo.state}</div>
        </div>
      </header>
      
      <div className="template-two-columns">
        <div className="left-column">
          {resumeData.summary && (
            <section className="template-section">
              <h2>About Me</h2>
              <p>{resumeData.summary}</p>
            </section>
          )}
          
          {resumeData.workExperience.length > 0 && (
            <section className="template-section">
              <h2>Experience</h2>
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
        
        <div className="right-column">
          {resumeData.skills.length > 0 && (
            <section className="template-section">
              <h2>Skills</h2>
              <div className="skills-container">
                {resumeData.skills.map((skill, index) => (
                  <div key={index} className="skill-item">
                    <span className="skill-name">{skill.name}</span>
                    <div className="skill-level">
                      <div 
                        className="skill-level-bar" 
                        style={{ 
                          width: skill.level === 'Beginner' ? '25%' : 
                                skill.level === 'Intermediate' ? '50%' : 
                                skill.level === 'Advanced' ? '75%' : '100%' 
                        }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
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
        </div>
      </div>
    </div>
  );
};

export default CreativeTemplate;
