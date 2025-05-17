import React from 'react';

const ModernTemplate = ({ resumeData }) => {
  const { personalInfo, summary, workExperience, education, skills, certifications } = resumeData;
  
  const styles = {
    template: {
      fontFamily: 'Arial, sans-serif',
      maxWidth: '800px',
      margin: '0 auto',
      padding: '30px',
      color: '#333',
      lineHeight: 1.5,
      backgroundColor: 'white',
    },
    header: {
      marginBottom: '30px',
      borderBottom: '2px solid #0072b1',
      paddingBottom: '15px',
    },
    name: {
      margin: '0 0 10px 0',
      fontSize: '28px',
      color: '#0072b1',
    },
    contactInfo: {
      display: 'flex',
      flexWrap: 'wrap',
      gap: '15px',
    },
    contactItem: {
      margin: 0,
      fontSize: '14px',
    },
    section: {
      marginBottom: '25px',
    },
    sectionTitle: {
      fontSize: '18px',
      color: '#0072b1',
      margin: '0 0 15px 0',
      paddingBottom: '5px',
      borderBottom: '1px solid #ddd',
    },
    experienceItem: {
      marginBottom: '20px',
    },
    jobHeader: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'baseline',
    },
    jobTitle: {
      fontSize: '16px',
      fontWeight: 'bold',
      margin: '0 0 5px 0',
    },
    date: {
      fontSize: '14px',
      color: '#666',
    },
    company: {
      fontStyle: 'italic',
      margin: '0 0 10px 0',
    },
    description: {
      margin: '0 0 10px 0',
    },
    list: {
      paddingLeft: '20px',
      margin: 0,
    },
    listItem: {
      marginBottom: '5px',
    },
    skillsList: {
      display: 'flex',
      flexWrap: 'wrap',
      gap: '10px',
    },
    skillItem: {
      backgroundColor: '#f0f7fd',
      borderRadius: '3px',
      padding: '5px 10px',
      fontSize: '14px',
      display: 'flex',
      alignItems: 'center',
    },
    skillName: {
      fontWeight: 'bold',
    },
    skillLevel: {
      marginLeft: '5px',
      color: '#666',
      fontSize: '12px',
    },
  };

  return (
    <div style={styles.template}>
      <header style={styles.header}>
        <h1 style={styles.name}>{personalInfo?.firstName || ''} {personalInfo?.lastName || ''}</h1>
        <div style={styles.contactInfo}>
          {personalInfo?.email && <p style={styles.contactItem}><strong>Email:</strong> {personalInfo.email}</p>}
          {personalInfo?.phone && <p style={styles.contactItem}><strong>Phone:</strong> {personalInfo.phone}</p>}
          {personalInfo?.address && <p style={styles.contactItem}><strong>Address:</strong> {personalInfo.address}, {personalInfo?.city || ''}, {personalInfo?.state || ''} {personalInfo?.zipCode || ''}</p>}
          {personalInfo?.linkedIn && <p style={styles.contactItem}><strong>LinkedIn:</strong> {personalInfo.linkedIn}</p>}
          {personalInfo?.website && <p style={styles.contactItem}><strong>Website:</strong> {personalInfo.website}</p>}
        </div>
      </header>
      
      {summary && (
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Professional Summary</h2>
          <div>
            <p>{summary}</p>
          </div>
        </section>
      )}
      
      {workExperience && workExperience.length > 0 && (
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Work Experience</h2>
          <div>
            {workExperience.map((job, index) => (
              <div key={index} style={styles.experienceItem}>
                <div style={styles.jobHeader}>
                  <h3 style={styles.jobTitle}>{job.title || 'Job Title'}</h3>
                  <div style={styles.date}>
                    {job.startDate || 'Start Date'} - {job.current ? 'Present' : (job.endDate || 'End Date')}
                  </div>
                </div>
                <p style={styles.company}>{job.company || 'Company'}, {job.location || 'Location'}</p>
                <p style={styles.description}>{job.description || 'Job description'}</p>
                
                {job.highlights && job.highlights.length > 0 && (
                  <ul style={styles.list}>
                    {job.highlights.map((highlight, i) => (
                      <li key={i} style={styles.listItem}>{highlight}</li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </section>
      )}
      
      {education && education.length > 0 && (
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Education</h2>
          <div>
            {education.map((edu, index) => (
              <div key={index} style={styles.experienceItem}>
                <div style={styles.jobHeader}>
                  <h3 style={styles.jobTitle}>{edu.degree || 'Degree'} in {edu.field || 'Field'}</h3>
                  <div style={styles.date}>
                    {edu.startDate || 'Start Date'} - {edu.current ? 'Present' : (edu.endDate || 'End Date')}
                  </div>
                </div>
                <p style={styles.company}>{edu.institution || 'Institution'}, {edu.location || 'Location'}</p>
                {edu.gpa && <p>GPA: {edu.gpa}</p>}
              </div>
            ))}
          </div>
        </section>
      )}
      
      {skills && skills.length > 0 && (
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Skills</h2>
          <div style={styles.skillsList}>
            {skills.map((skill, index) => (
              <div key={index} style={styles.skillItem}>
                <span style={styles.skillName}>{skill.name || 'Skill'}</span>
                <span style={styles.skillLevel}> - {skill.level || 'Level'}</span>
              </div>
            ))}
          </div>
        </section>
      )}
      
      {certifications && certifications.length > 0 && (
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Certifications</h2>
          <div>
            {certifications.map((cert, index) => (
              <div key={index} style={styles.experienceItem}>
                <h3 style={styles.jobTitle}>{cert.name || 'Certification'}</h3>
                <p style={styles.company}>{cert.issuer || 'Issuer'}</p>
                <p style={styles.date}>{cert.date || 'Date'}</p>
                {cert.url && <p>URL: {cert.url}</p>}
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

export default ModernTemplate;
