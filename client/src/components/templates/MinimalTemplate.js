import React from 'react';
import { useResume } from '../../context/ResumeContext';
import './MinimalTemplate.css';

const MinimalTemplate = ({ demoMode = false }) => {
  const { resumeData } = useResume();
  
  // Use demo data when in demo mode or when resumeData is undefined
  const demoData = {
    personalInfo: {
      firstName: 'Alex',
      lastName: 'Johnson',
      email: 'alex.johnson@email.com',
      phone: '(555) 555-5555',
      address: '789 Design St',
      city: 'Austin',
      state: 'TX',
      zipCode: '78701'
    },
    summary: 'Creative designer with a passion for clean, minimal aesthetics and user-centered design.',
    workExperience: [
      {
        title: 'UX Designer',
        company: 'Design Studio',
        startDate: '2022',
        endDate: 'Present',
        description: 'Created intuitive user interfaces for mobile and web applications.'
      }
    ],
    education: [
      {
        degree: 'Bachelor of Fine Arts',
        fieldOfStudy: 'Graphic Design',
        institution: 'Art Institute',
        graduationDate: '2021'
      }
    ],
    skills: ['UI/UX Design', 'Figma', 'Adobe Creative Suite', 'Prototyping']
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
    <div className="minimal-template">
      <header className="minimal-header">
        <h1>{firstName} {lastName}</h1>
        <div className="contact-line">
          {email && <span>{email}</span>}
          {phone && <span>•</span>}
          {phone && <span>{phone}</span>}
          {address && <span>•</span>}
          {address && <span>{city}, {state}</span>}
        </div>
      </header>

      {summary && (
        <section className="minimal-section">
          <p className="summary-text">{summary}</p>
        </section>
      )}

      {workExperience.length > 0 && (
        <section className="minimal-section">
          <h2>Experience</h2>
          {workExperience.map((exp, index) => (
            <div key={index} className="minimal-item">
              <div className="item-header">
                <span className="title">{exp.title || 'Position Title'}</span>
                <span className="date">{exp.startDate || 'Start'} - {exp.endDate || 'End'}</span>
              </div>
              <div className="company">{exp.company || 'Company Name'}</div>
              {exp.description && <p>{exp.description}</p>}
            </div>
          ))}
        </section>
      )}

      {education.length > 0 && (
        <section className="minimal-section">
          <h2>Education</h2>
          {education.map((edu, index) => (
            <div key={index} className="minimal-item">
              <div className="item-header">
                <span className="title">{edu.degree || 'Degree'}</span>
                <span className="date">{edu.graduationDate || 'Graduation Date'}</span>
              </div>
              <div className="company">{edu.institution || 'Institution'}</div>
              <p>{edu.fieldOfStudy || 'Field of Study'}</p>
            </div>
          ))}
        </section>
      )}

      {skillsArray.length > 0 && (
        <section className="minimal-section">
          <h2>Skills</h2>
          <div className="skills-line">
            {skillsArray.map((skill, index) => (
              <span key={index}>
                {typeof skill === 'object' ? skill.name || '' : skill || ''}
                {index < skillsArray.length - 1 && ' • '}
              </span>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

export default MinimalTemplate;
