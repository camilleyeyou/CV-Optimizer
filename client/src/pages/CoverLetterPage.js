import React from 'react';
import CoverLetterGenerator from '../components/coverLetter/CoverLetterGenerator';

const CoverLetterPage = () => {
  return (
    <div className="container page-container">
      <div className="page-header">
        <h1>AI Cover Letter Generator</h1>
        <p>Create personalized cover letters tailored to your resume and job descriptions</p>
      </div>
      
      <CoverLetterGenerator />
    </div>
  );
};

export default CoverLetterPage;