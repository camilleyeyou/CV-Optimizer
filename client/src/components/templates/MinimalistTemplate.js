import React from 'react';

const MinimalistTemplate = ({ resumeData }) => {
  const { 
    personalInfo, 
    summary, 
    workExperience, 
    education, 
    skills 
  } = resumeData;
  
  // Format the content of the work experience description with bullet points
  const formatDescription = (description) => {
    if (!description) return null;
    
    // Split by new lines or bullet points
    const lines = description.split(/\n|•/).filter(line => line.trim());
    
    return (
      <ul className="description-list">
        {lines.map((line, index) => (
          <li key={index}>{line.trim().startsWith('-') ? line.trim().substring(1).trim() : line.trim()}</li>
        ))}
      </ul>
    );
  };
  
  return (
    <div className="resume-template minimalist-template">
      <div className="resume-header">
        <h1 className="name">{personalInfo.firstName} {personalInfo.lastName}</h1>
        {personalInfo.title && <h2 className="title">{personalInfo.title}</h2>}
        
        <div className="contact-info">
          {personalInfo.email && <span>{personalInfo.email}</span>}
          {personalInfo.phone && <span>{personalInfo.phone}</span>}
          {personalInfo.location && <span>{personalInfo.location}</span>}
          {personalInfo.linkedIn && <span>{personalInfo.linkedIn}</span>}
          {personalInfo.website && <span>{personalInfo.website}</span>}
        </div>
      </div>
      
      {summary && (
        <div className="resume-section">
          <h3 className="section-title">Profile</h3>
          <div className="section-content">
            <p className="summary">{summary}</p>
          </div>
        </div>
      )}
      
      {workExperience.length > 0 && (
        <div className="resume-section">
          <h3 className="section-title">Experience</h3>
          <div className="section-content">
            {workExperience.map(experience => (
              <div key={experience.id} className="experience-item">
                <div className="item-header">
                  <div className="item-title">
                    <h4>{experience.position}</h4>
                    <h5>{experience.company}</h5>
                  </div>
                  <div className="item-date">
                    {experience.startDate && 
                      (experience.current 
                        ? `${experience.startDate} - Present`
                        : experience.endDate 
                          ? `${experience.startDate} - ${experience.endDate}`
                          : experience.startDate
                      )
                    }
                  </div>
                </div>
                {experience.location && <div className="item-location">{experience.location}</div>}
                <div className="item-description">
                  {formatDescription(experience.description)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {education.length > 0 && (
        <div className="resume-section">
          <h3 className="section-title">Education</h3>
          <div className="section-content">
            {education.map(edu => (
              <div key={edu.id} className="education-item">
                <div className="item-header">
                  <div className="item-title">
                    <h4>{edu.degree}{edu.fieldOfStudy && `, ${edu.fieldOfStudy}`}</h4>
                    <h5>{edu.institution}</h5>
                  </div>
                  <div className="item-date">
                    {edu.startDate && 
                      (edu.endDate 
                        ? `${edu.startDate} - ${edu.endDate}`
                        : edu.startDate
                      )
                    }
                  </div>
                </div>
                {edu.location && <div className="item-location">{edu.location}</div>}
                {edu.description && (
                  <div className="item-description">
                    <p>{edu.description}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
      
      {skills.length > 0 && (
        <div className="resume-section">
          <h3 className="section-title">Skills</h3>
          <div className="section-content">
            <div className="skills-list">
              {skills.map((skill, index) => (
                <div key={index} className="skill-item">
                  {skill}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MinimalistTemplate;
