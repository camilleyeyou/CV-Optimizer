import React from 'react';
import { FaEnvelope, FaPhone, FaMapMarkerAlt, FaLinkedin, FaGlobe } from 'react-icons/fa';

const ProfessionalTemplate = ({ resumeData }) => {
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
  
  // Group skills into categories (if skills are formatted as "Category: Skill")
  const groupSkills = () => {
    const categories = {};
    
    skills.forEach(skill => {
      const colonIndex = skill.indexOf(':');
      
      if (colonIndex !== -1) {
        const category = skill.substring(0, colonIndex).trim();
        const skillName = skill.substring(colonIndex + 1).trim();
        
        if (!categories[category]) {
          categories[category] = [];
        }
        
        categories[category].push(skillName);
      } else {
        if (!categories['Other Skills']) {
          categories['Other Skills'] = [];
        }
        
        categories['Other Skills'].push(skill);
      }
    });
    
    return categories;
  };
  
  const hasCategories = Object.keys(groupSkills()).length > 1 || !Object.keys(groupSkills()).includes('Other Skills');
  
  return (
    <div className="resume-template professional-template">
      <div className="resume-header">
        <div className="name-title">
          <h1>{personalInfo.firstName} {personalInfo.lastName}</h1>
          {personalInfo.title && <h2>{personalInfo.title}</h2>}
        </div>
        
        <div className="contact-info">
          {personalInfo.email && (
            <div className="contact-item">
              <FaEnvelope />
              <span>{personalInfo.email}</span>
            </div>
          )}
          
          {personalInfo.phone && (
            <div className="contact-item">
              <FaPhone />
              <span>{personalInfo.phone}</span>
            </div>
          )}
          
          {personalInfo.location && (
            <div className="contact-item">
              <FaMapMarkerAlt />
              <span>{personalInfo.location}</span>
            </div>
          )}
          
          {personalInfo.linkedIn && (
            <div className="contact-item">
              <FaLinkedin />
              <span>{personalInfo.linkedIn}</span>
            </div>
          )}
          
          {personalInfo.website && (
            <div className="contact-item">
              <FaGlobe />
              <span>{personalInfo.website}</span>
            </div>
          )}
        </div>
      </div>
      
      <div className="resume-content">
        <div className="resume-main">
          {summary && (
            <div className="resume-section">
              <h3 className="section-title">Professional Summary</h3>
              <div className="section-content">
                <p className="summary">{summary}</p>
              </div>
            </div>
          )}
          
          {workExperience.length > 0 && (
            <div className="resume-section">
              <h3 className="section-title">Work Experience</h3>
              <div className="section-content">
                {workExperience.map(experience => (
                  <div key={experience.id} className="experience-item">
                    <div className="experience-header">
                      <div className="job-title-company">
                        <h4>{experience.position}</h4>
                        <h5>{experience.company}{experience.location && `, ${experience.location}`}</h5>
                      </div>
                      
                      <div className="job-duration">
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
                    
                    <div className="experience-description">
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
                    <div className="education-header">
                      <div className="degree-institution">
                        <h4>{edu.degree}{edu.fieldOfStudy && `, ${edu.fieldOfStudy}`}</h4>
                        <h5>{edu.institution}{edu.location && `, ${edu.location}`}</h5>
                      </div>
                      
                      <div className="education-duration">
                        {edu.startDate && 
                          (edu.endDate 
                            ? `${edu.startDate} - ${edu.endDate}`
                            : edu.startDate
                          )
                        }
                      </div>
                    </div>
                    
                    {edu.description && (
                      <div className="education-description">
                        <p>{edu.description}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        
        {skills.length > 0 && (
          <div className="resume-sidebar">
            <div className="resume-section skills-section">
              <h3 className="section-title">Skills</h3>
              <div className="section-content">
                {hasCategories ? (
                  // Render skills by category
                  Object.entries(groupSkills()).map(([category, skillList]) => (
                    <div key={category} className="skill-category">
                      <h4>{category}</h4>
                      <div className="skills-list">
                        {skillList.map((skill, index) => (
                          <div key={index} className="skill-item">
                            {skill}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))
                ) : (
                  // Render all skills as one list
                  <div className="skills-list">
                    {skills.map((skill, index) => (
                      <div key={index} className="skill-item">
                        {skill}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfessionalTemplate;
