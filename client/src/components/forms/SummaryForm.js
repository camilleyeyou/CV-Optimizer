import React from 'react';
import { useResume } from '../../context/ResumeContext';

const SummaryForm = () => {
  const { resumeData, updateResumeData } = useResume();

  const handleChange = (value) => {
    updateResumeData({
      ...resumeData,
      summary: value
    });
  };

  return (
    <div className="form-container">
      <h2>Professional Summary</h2>
      
      <div className="form-group">
        <label htmlFor="summary">Summary</label>
        <textarea
          id="summary"
          rows="6"
          value={resumeData?.summary || ''}
          onChange={(e) => handleChange(e.target.value)}
          placeholder="Write a brief professional summary..."
        />
      </div>
    </div>
  );
};

export default SummaryForm;
