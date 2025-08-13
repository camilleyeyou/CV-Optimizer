import React from 'react';
import './ProfessionalModernTemplate.css';

const ProfessionalModernTemplate = ({ resumeData, demoMode = false }) => {
  // Demo data matching your example
  const demoData = {
    personalInfo: {
      firstName: 'Ghislain Camille',
      lastName: 'Yeyou',
      title: 'Full Stack Developer',
      email: 'camilleyeyou@gmail.com',
      phone: '+1 (620) 392-3121',
      linkedIn: 'LinkedIn',
      website: 'GitHub',
      location: 'Remote'
    },
    summary: 'Full Stack Developer with 3+ years of experience building scalable web and mobile applications using Python, JavaScript (React/Node.js/Angular), and cloud platforms (AWS/Azure/GCP). Passionate about solving complex problems through clean code and agile methodologies. Strong expertise in RESTful APIs, microservices, and CI/CD pipelines.',
    workExperience: [
      {
        title: 'Full Stack Developer',
        company: 'Upwork (Remote)',
        startDate: 'Jan 2022',
        endDate: 'Present',
        current: true,
        highlights: [
          'Delivered full-stack solutions using Django, React, Node.js, and Express, reducing client-side latency by 35% through performance optimization.',
          'Led end-to-end development of WordPress CMS projects, including custom plugin development and theme integration.',
          'Collaborated with cross-functional teams to translate business requirements into scalable technical architectures.'
        ]
      }
    ],
    projects: [
      {
        name: 'CV Optimizer App',
        link: 'GitHub',
        description: 'Developed an AI-driven resume builder with ATS optimization, increasing user interview rates by 40%.',
        techStack: 'React, Material UI, Node.js, MongoDB, JWT/OAuth'
      },
      {
        name: 'Movie Explorer',
        link: 'GitHub',
        description: 'Built a real-time movie discovery platform with JWT authentication and API caching (TMDB integration).',
        techStack: 'Responsive design, Redis-backed caching, and recommendation algorithms'
      }
    ],
    education: [
      {
        degree: 'Bachelor of Technology in ICT',
        institution: 'University of Bamenda, Cameroon',
        endDate: 'Dec 2022'
      }
    ],
    technicalSkills: {
      'Languages': ['Python', 'JavaScript', 'C/C++'],
      'Frontend': ['React', 'Angular', 'Material UI'],
      'Backend': ['Node.js', 'Django', 'Express'],
      'Cloud/DevOps': ['AWS', 'Azure', 'GCP', 'Docker', 'Kubernetes', 'CI/CD'],
      'Databases': ['PostgreSQL', 'MongoDB', 'MySQL', 'Redis'],
      'Tools': ['Git', 'JIRA', 'RESTful APIs', 'Microservices']
    },
    languages: [
      { name: 'English', level: 'Fluent' },
      { name: 'French', level: 'Conversational' }
    ]
  };

  // Use demo data if in demo mode or if resumeData is incomplete
  const data = demoMode || !resumeData ? demoData : resumeData;
  
  // Safely destructure with fallbacks
  const {
    personalInfo = {},
    summary = '',
    workExperience = [],
    education = [],
    skills = [],
    projects = [],
    technicalSkills = {},
    languages = []
  } = data || {};

  const {
    firstName = '',
    lastName = '',
    title = '',
    email = '',
    phone = '',
    linkedIn = '',
    website = '',
    location = ''
  } = personalInfo || {};

  // Helper function to get skills in proper format
  const getSkillsDisplay = () => {
    if (technicalSkills && Object.keys(technicalSkills).length > 0) {
      return technicalSkills;
    }
    
    // Fallback to regular skills array
    if (Array.isArray(skills) && skills.length > 0) {
      return {
        'Technical Skills': skills.map(skill => 
          typeof skill === 'object' ? skill.name || skill : skill
        ).filter(Boolean)
      };
    }
    
    return {};
  };

  // Helper function to format date range
  const formatDateRange = (startDate, endDate, current) => {
    if (current) return `${startDate} – Present`;
    if (endDate) return `${startDate} – ${endDate}`;
    return startDate;
  };

  // Helper function to safely render contact icons
  const getContactIcon = (type) => {
    const icons = {
      phone: '📞',
      email: '✉️',
      linkedIn: '🔗',
      website: '🌐',
      location: '📍'
    };
    return icons[type] || '•';
  };

  const skillsToDisplay = getSkillsDisplay();

  return (
    <div className="professional-modern-template">
      {/* Header Section */}
      <header className="resume-header-modern">
        <div className="header-content">
          <h1 className="full-name">
            {firstName && lastName ? `${firstName} ${lastName}` : firstName || lastName || 'Your Name'}
          </h1>
          {title && <h2 className="job-title">{title}</h2>}
          
          <div className="contact-info-modern">
            {phone && (
              <span className="contact-item">
                <span className="contact-icon">{getContactIcon('phone')}</span> {phone}
              </span>
            )}
            {email && (
              <span className="contact-item">
                <span className="contact-icon">{getContactIcon('email')}</span> {email}
              </span>
            )}
            {linkedIn && (
              <span className="contact-item">
                <span className="contact-icon">{getContactIcon('linkedIn')}</span> {linkedIn}
              </span>
            )}
            {website && (
              <span className="contact-item">
                <span className="contact-icon">{getContactIcon('website')}</span> {website}
              </span>
            )}
            {location && (
              <span className="contact-item">
                <span className="contact-icon">{getContactIcon('location')}</span> {location}
              </span>
            )}
          </div>
        </div>
      </header>

      {/* Professional Summary */}
      {summary && (
        <section className="resume-section-modern">
          <h3 className="section-title">Professional Summary</h3>
          <div className="section-content">
            <p className="summary-text">{summary}</p>
          </div>
        </section>
      )}

      {/* Work Experience */}
      {workExperience && workExperience.length > 0 && (
        <section className="resume-section-modern">
          <h3 className="section-title">Work Experience</h3>
          <div className="section-content">
            {workExperience.map((exp, index) => (
              <div key={index} className="experience-item-modern">
                <div className="experience-header">
                  <div className="experience-title-company">
                    <span className="job-title-modern">{exp.title || exp.jobTitle}</span>
                    {(exp.title || exp.jobTitle) && exp.company && <span className="separator"> | </span>}
                    <span className="company-name">{exp.company}</span>
                    {(exp.startDate || exp.endDate) && <span className="separator"> | </span>}
                    <span className="date-range">
                      {formatDateRange(exp.startDate, exp.endDate, exp.current)}
                    </span>
                  </div>
                </div>
                
                {exp.description && (
                  <p className="job-description">{exp.description}</p>
                )}
                
                {exp.highlights && Array.isArray(exp.highlights) && exp.highlights.length > 0 && (
                  <ul className="job-highlights">
                    {exp.highlights.map((highlight, i) => (
                      <li key={i}>{highlight}</li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Projects Section */}
      {projects && projects.length > 0 && (
        <section className="resume-section-modern">
          <h3 className="section-title">Projects</h3>
          <div className="section-content">
            {projects.map((project, index) => (
              <div key={index} className="project-item-modern">
                <div className="project-header">
                  <span className="project-name">{project.name}</span>
                  {project.link && (
                    <>
                      <span className="separator"> | </span>
                      <span className="project-link">{project.link}</span>
                    </>
                  )}
                </div>
                
                {project.description && (
                  <p className="project-description">{project.description}</p>
                )}
                
                {project.techStack && (
                  <p className="tech-stack">
                    <span className="tech-label">Tech Stack:</span> {project.techStack}
                  </p>
                )}
                
                {project.highlights && (
                  <p className="tech-stack">
                    <span className="tech-label">Highlights:</span> {project.highlights}
                  </p>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Education */}
      {education && education.length > 0 && (
        <section className="resume-section-modern">
          <h3 className="section-title">Education</h3>
          <div className="section-content">
            {education.map((edu, index) => (
              <div key={index} className="education-item-modern">
                <div className="education-header">
                  <span className="degree-name">{edu.degree}</span>
                </div>
                <div className="education-details">
                  <span className="institution-name">{edu.institution || edu.school}</span>
                  {edu.location && (
                    <>
                      <span className="separator"> | </span>
                      <span className="education-location">{edu.location}</span>
                    </>
                  )}
                  {(edu.endDate || edu.graduationDate) && (
                    <>
                      <span className="separator"> | </span>
                      <span className="graduation-date">{edu.endDate || edu.graduationDate}</span>
                    </>
                  )}
                </div>
                {edu.gpa && (
                  <p className="gpa">GPA: {edu.gpa}</p>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Technical Skills */}
      {Object.keys(skillsToDisplay).length > 0 && (
        <section className="resume-section-modern">
          <h3 className="section-title">Technical Skills</h3>
          <div className="section-content">
            <div className="skills-grid-modern">
              {Object.entries(skillsToDisplay).map(([category, skillList], index) => (
                <div key={index} className="skill-category">
                  <span className="skill-category-name">{category}:</span>
                  <span className="skill-list">
                    {Array.isArray(skillList) ? skillList.join(', ') : skillList}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Languages */}
      {languages && languages.length > 0 && (
        <section className="resume-section-modern">
          <h3 className="section-title">Languages</h3>
          <div className="section-content">
            <div className="languages-list">
              {languages.map((lang, index) => (
                <div key={index} className="language-item">
                  <span className="language-name">{lang.name}</span>
                  {lang.level && <span className="language-level"> ({lang.level})</span>}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
};

export default ProfessionalModernTemplate;