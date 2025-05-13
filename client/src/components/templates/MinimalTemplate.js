import React from 'react';
import './Templates.css';

const MinimalTemplate = ({ resumeData }) => {
  return (
    <div className="resume-template minimal-template">
      <header className="template-header">
        <h1>{resumeData.personalInfo.firstName} {resumeData.personalInfo.lastName}</h1>
        <div className="contact-info">
          <div>{resumeData.personalInfo.email}</div>
          <div>{resumeData.personalInfo.phone}</div>
          <div>{resumeData.personalInfo.city}, {resumeData.personalInfo.state}</div>
        </div>
      </header>
      
      {resumeData.summary && (
        <section className="template-section">
          <h2>Summary</h2>
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
      
      {resumeData.skills.length > 0 && (
        <section className="template-section">
          <h2>Skills</h2>
          <div className="skills-list">
            {resumeData.skills.map((skill, index) => (
              <span key={index} className="skill-tag">{skill.name}</span>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

export default MinimalTemplate;
