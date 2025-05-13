import React, { useState } from 'react';
import axios from 'axios';
import './JobDescriptionAnalyzer.css';

const JobDescriptionAnalyzer = ({ onKeywordsExtracted }) => {
  const [jobDescription, setJobDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [keywordData, setKeywordData] = useState(null);

  const handleAnalyze = async () => {
    if (!jobDescription.trim()) {
      setError('Please enter a job description');
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const response = await axios.post('/api/analyze-job-description', {
        jobDescription
      });
      
      setKeywordData(response.data);
      
      // Pass the extracted keywords to parent component
      if (onKeywordsExtracted) {
        onKeywordsExtracted(response.data);
      }
    } catch (err) {
      console.error('Error analyzing job description:', err);
      setError('Failed to analyze job description. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="job-description-analyzer">
      <h3>Job Description Analyzer</h3>
      <p className="analyzer-description">
        Paste a job description to extract key skills and requirements for your resume
      </p>
      
      <div className="job-description-input">
        <textarea
          placeholder="Paste job description here..."
          value={jobDescription}
          onChange={(e) => setJobDescription(e.target.value)}
          rows={8}
        />
      </div>
      
      <button 
        className="analyze-button" 
        onClick={handleAnalyze}
        disabled={loading}
      >
        {loading ? 'Analyzing...' : 'Analyze Job Description'}
      </button>
      
      {error && <div className="error-message">{error}</div>}
      
      {keywordData && (
        <div className="keyword-results">
          <div className="keyword-section">
            <h4>Required Skills</h4>
            <div className="keyword-tags">
              {keywordData.skills.map((skill, index) => (
                <span key={index} className="keyword-tag skill">
                  {skill}
                </span>
              ))}
            </div>
          </div>
          
          <div className="keyword-section">
            <h4>Key Responsibilities</h4>
            <div className="keyword-tags">
              {keywordData.responsibilities.map((resp, index) => (
                <span key={index} className="keyword-tag responsibility">
                  {resp}
                </span>
              ))}
            </div>
          </div>
          
          <div className="keyword-section">
            <h4>Qualifications</h4>
            <div className="keyword-tags">
              {keywordData.qualifications.map((qual, index) => (
                <span key={index} className="keyword-tag qualification">
                  {qual}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default JobDescriptionAnalyzer;
