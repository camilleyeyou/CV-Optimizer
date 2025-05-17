import React from 'react';

const CreativeTemplate = ({ resumeData }) => {
  const { personalInfo } = resumeData;
  
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
    title: {
      color: '#0072b1',
      marginBottom: '20px',
    },
    name: {
      marginTop: '10px',
    }
  };

  return (
    <div style={styles.template}>
      <h1 style={styles.title}>CreativeTemplate Template</h1>
      <p style={styles.name}>
        <strong>Name:</strong> {personalInfo?.firstName || ''} {personalInfo?.lastName || ''}
      </p>
      <p>This is a placeholder for the CreativeTemplate template.</p>
    </div>
  );
};

export default CreativeTemplate;
