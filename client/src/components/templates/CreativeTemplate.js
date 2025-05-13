import React from 'react';
import { FaEnvelope, FaPhone, FaMapMarkerAlt, FaLinkedin, FaGlobe } from 'react-icons/fa';

const CreativeTemplate = ({ resumeData }) => {
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
  
  // Group skills into categories based on first word (if no explicit categories)
  const categorizeSkills = () => {
    const categories = {};
    
    skills.forEach(skill => {
      // Check if skill has an explicit category (format: "Category: Skill")
      const colonIndex = skill.indexOf(':');
      
      if (colonIndex !== -1) {
        const category = skill.substring(0, colonIndex).trim();
        const skillName = skill.substring(colonIndex + 1).trim();
        
        if (!categories[category]) {
          categories[category] = [];
        }
        
        categories[category].push(skillName);
      } else {
        if (!categories['Skills']) {
          categories['Skills'] = [];
        }
        
        categories['Skills'].push(skill);
      }
    });
    
    return categories;
  };
  
  return (
    <div className="resume-template creative-template">
      <div className="resume-sidebar">
        <div className="profile-section">
          <div className="profile-name">
            <h1>{personalInfo.firstName}</h1>
            <h1>{personalInfo.lastName}</h1>
          </div>
          {personalInfo.title && <h2 className="profile-title">{personalInfo.title}</h2>}
        </div>
        
        <div className="contact-section">
          <h3>Contact</h3>
          <div className="contact-list">
            {personalInfo.email && (
              <div className="contact-item">
                <div className="contact-icon"><FaEnvelope /></div>
                <div className="contact-text">{personalInfo.email}</div>
              </div>
            )}
            
            {personalInfo.phone && (
              <div className="contact-item">
                <div className="contact-icon"><FaPhone /></div>
                <div className="contact-text">{personalInfo.phone}</div>
              </div>
            )}
            
            {personalInfo.location && (
              <div className="contact-item">
                <div className="contact-icon"><FaMapMarkerAlt /></div>
                <div className="contact-text">{personalInfo.location}</div>
              </div>
            )}
            
            {personalInfo.linkedIn && (
              <div className="contact-item">
                <div className="contact-icon"><FaLinkedin /></div>
                <div className="contact-text">{personalInfo.linkedIn}</div>
              </div>
            )}
            
            {personalInfo.website && (
              <div className="contact-item">
                <div className="contact-icon"><FaGlobe /></div>
                <div className="contact-text">{personalInfo.website}</div>
              </div>
            )}
          </div>
        </div>
        
        {skills.length > 0 && (
          <div className="skills-section">
            {Object.entries(categorizeSkills()).map(([category, categorySkills]) => (
              <div key={category} className="skills-category">
                <h3>{category}</h3>
                <div className="skills-list">
                  {categorySkills.map((skill, index) => (
                    <div key={index} className="skill-item">
                      <div className="skill-bullet"></div>
                      <div className="skill-text">{skill}</div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      <div className="resume-main">
        {summary && (
          <div className="main-section">
            <h3 className="section-title">About Me</h3>
            <div className="section-content">
              <p className="summary">{summary}</p>
            </div>
          </div>
        )}
        
        {workExperience.length > 0 && (
          <div className="main-section">
            <h3 className="section-title">Work Experience</h3>
            <div className="section-content timeline">
              {workExperience.map(experience => (
                <div key={experience.id} className="timeline-item">
                  <div className="timeline-marker"></div>
                  <div className="timeline-content">
                    <div className="item-header">
                      <h4>{experience.position}</h4>
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
                    <h5>{experience.company}{experience.location && `, ${experience.location}`}</h5>
                    <div className="item-description">
                      {formatDescription(experience.description)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {education.length > 0 && (
          <div className="main-section">
            <h3 className="section-title">Education</h3>
            <div className="section-content timeline">
              {education.map(edu => (
                <div key={edu.id} className="timeline-item">
                  <div className="timeline-marker"></div>
                  <div className="timeline-content">
                    <div className="item-header">
                      <h4>{edu.degree}{edu.fieldOfStudy && `, ${edu.fieldOfStudy}`}</h4>
                      <div className="item-date">
                        {edu.startDate && 
                          (edu.endDate 
                            ? `${edu.startDate} - ${edu.endDate}`
                            : edu.startDate
                          )
                        }
                      </div>
                    </div>
                    <h5>{edu.institution}{edu.location && `, ${edu.location}`}</h5>
                    {edu.description && (
                      <div className="item-description">
                        <p>{edu.description}</p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CreativeTemplate;
