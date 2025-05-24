import React from 'react';
import './ModernTemplate.css';

const ModernTemplate = ({ resumeData, demoMode = false }) => {
  // 🔧 MAJOR FIX: Removed useResume hook - templates should only use props!
  
  // Use demo data when in demo mode or when resumeData is undefined
  const demoData = {
    personalInfo: {
      firstName: 'Jane',
      lastName: 'Smith',
      email: 'jane.smith@email.com',
      phone: '(555) 987-6543',
      address: '456 Tech Ave',
      city: 'San Francisco',
      state: 'CA',
      zipCode: '94102'
    },
    summary: 'Innovative software engineer with 5+ years of experience in developing scalable web applications.',
    workExperience: [
      {
        title: 'Senior Software Engineer',
        company: 'Tech Corp',
        startDate: '2021',
        endDate: 'Present',
        description: 'Developed and maintained high-performance web applications using React and Node.js.'
      }
    ],
    education: [
      {
        degree: 'Master of Science',
        fieldOfStudy: 'Computer Science',
        institution: 'Tech University',
        graduationDate: '2020'
      }
    ],
    skills: ['React', 'Node.js', 'JavaScript', 'Python', 'AWS']
  };

  // Use demo data if in demo mode or if resumeData is undefined/incomplete
  const data = demoMode || !resumeData ? demoData : resumeData;
  
  // Safely destructure with fallbacks
  const {
    personalInfo = {},
    summary = '',
    workExperience = [],
    education = [],
    skills = []
  } = data || {};

  const {
    firstName = '',
    lastName = '',
    email = '',
    phone = '',
    address = '',
    city = '',
    state = '',
    zipCode = ''
  } = personalInfo || {};

  // Ensure skills is an array
  const skillsArray = Array.isArray(skills) ? skills : [];

  return (
    <div className="modern-template">
      <header className="modern-header">
        <div className="header-content">
          <h1>{firstName} {lastName}</h1>
          <div className="contact-info">
            {email && <span>{email}</span>}
            {phone && <span>{phone}</span>}
            {address && <span>{address}, {city}, {state} {zipCode}</span>}
          </div>
        </div>
      </header>

      <div className="modern-content">
        {summary && (
          <section className="modern-section">
            <h2>Summary</h2>
            <p>{summary}</p>
          </section>
        )}

        {workExperience.length > 0 && (
          <section className="modern-section">
            <h2>Experience</h2>
            {workExperience.map((exp, index) => (
              <div key={index} className="experience-item">
                <div className="experience-header">
                  <h3>{exp.title || exp.jobTitle || 'Position Title'}</h3>
                  <span className="date-range">
                    {exp.startDate || 'Start'} - {exp.endDate || 'End'}
                  </span>
                </div>
                <h4>{exp.company || 'Company Name'}</h4>
                {exp.description && <p>{exp.description}</p>}
              </div>
            ))}
          </section>
        )}

        {education.length > 0 && (
          <section className="modern-section">
            <h2>Education</h2>
            {education.map((edu, index) => (
              <div key={index} className="education-item">
                <h3>{edu.degree || 'Degree'}</h3>
                <h4>{edu.institution || 'Institution'}</h4>
                <p>{edu.fieldOfStudy || 'Field of Study'} • {edu.graduationDate || 'Graduation Date'}</p>
              </div>
            ))}
          </section>
        )}

        {skillsArray.length > 0 && (
          <section className="modern-section">
            <h2>Skills</h2>
            <div className="skills-grid">
              {skillsArray.map((skill, index) => (
                <span key={index} className="skill-tag">
                  {typeof skill === 'object' ? skill.name || '' : skill || ''}
                </span>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
};

export default ModernTemplate;