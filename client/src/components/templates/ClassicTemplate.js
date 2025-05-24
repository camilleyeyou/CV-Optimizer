import React from 'react';
import './ClassicTemplate.css';

const ClassicTemplate = ({ resumeData, demoMode = false }) => {
  // 🔧 MAJOR FIX: Removed useResume hook - templates should only use props!
  
  // Use demo data when in demo mode or when resumeData is undefined
  const demoData = {
    personalInfo: {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@email.com',
      phone: '(555) 123-4567',
      address: '123 Main St',
      city: 'New York',
      state: 'NY',
      zipCode: '10001'
    },
    summary: 'Experienced professional with a proven track record of success in various industries.',
    workExperience: [
      {
        title: 'Senior Manager',
        company: 'ABC Company',
        startDate: '2020',
        endDate: 'Present',
        description: 'Led a team of 10+ professionals and increased productivity by 25%.'
      }
    ],
    education: [
      {
        degree: 'Bachelor of Science',
        fieldOfStudy: 'Business Administration',
        institution: 'University of Example',
        graduationDate: '2018'
      }
    ],
    skills: ['Leadership', 'Project Management', 'Communication', 'Problem Solving']
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
    <div className="classic-template">
      <header className="classic-header">
        <h1>{firstName} {lastName}</h1>
        <div className="contact-info">
          {email && <span>{email}</span>}
          {phone && <span>{phone}</span>}
          {address && <span>{address}, {city}, {state} {zipCode}</span>}
        </div>
      </header>

      {summary && (
        <section className="classic-section">
          <h2>Professional Summary</h2>
          <p>{summary}</p>
        </section>
      )}

      {workExperience.length > 0 && (
        <section className="classic-section">
          <h2>Work Experience</h2>
          {workExperience.map((exp, index) => (
            <div key={index} className="experience-item">
              <h3>{exp.title || exp.jobTitle || 'Position Title'}</h3>
              <h4>{exp.company || 'Company Name'}</h4>
              <p className="date-range">
                {exp.startDate || 'Start'} - {exp.endDate || 'End'}
              </p>
              {exp.description && <p>{exp.description}</p>}
            </div>
          ))}
        </section>
      )}

      {education.length > 0 && (
        <section className="classic-section">
          <h2>Education</h2>
          {education.map((edu, index) => (
            <div key={index} className="education-item">
              <h3>{edu.degree || 'Degree'}</h3>
              <h4>{edu.institution || 'Institution'}</h4>
              <p>{edu.fieldOfStudy || 'Field of Study'}</p>
              <p>{edu.graduationDate || 'Graduation Date'}</p>
            </div>
          ))}
        </section>
      )}

      {skillsArray.length > 0 && (
        <section className="classic-section">
          <h2>Skills</h2>
          <div className="skills-list">
            {skillsArray.map((skill, index) => (
              <span key={index} className="skill-item">
                {typeof skill === 'object' ? skill.name || '' : skill || ''}
              </span>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

export default ClassicTemplate;