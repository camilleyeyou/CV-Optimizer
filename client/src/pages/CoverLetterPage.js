import React from 'react';
import CoverLetterGenerator from '../components/coverLetter/CoverLetterGenerator';
import './CoverLetterPage.css';

const CoverLetterPage = () => {
  return (
    <div className="cover-letter-page">
      <div className="page-header">
        <h1>Cover Letter Generator</h1>
        <p>Create personalized cover letters tailored to your resume and job applications</p>
      </div>
      
      <CoverLetterGenerator />
    </div>
  );
};

export default CoverLetterPage;
