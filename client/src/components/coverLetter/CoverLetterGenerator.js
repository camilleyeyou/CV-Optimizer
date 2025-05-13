import React, { useState } from 'react';
import axios from 'axios';
import { useResume } from '../../context/ResumeContext';
import './CoverLetterGenerator.css';

const CoverLetterGenerator = () => {
  const { resumeData } = useResume();
  const [jobDetails, setJobDetails] = useState({
    title: '',
    company: '',
    requirements: '',
    description: ''
  });
  const [coverLetter, setCoverLetter] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setJobDetails(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const generateCoverLetter = async () => {
    if (!jobDetails.title || !jobDetails.company) {
      setError('Please provide at least the job title and company name.');
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const response = await axios.post('/api/generate-cover-letter', {
        resume: resumeData,
        jobDetails
      });
      
      setCoverLetter(response.data.coverLetter);
    } catch (err) {
      console.error('Error generating cover letter:', err);
      setError('Failed to generate cover letter. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(coverLetter)
      .then(() => {
        alert('Cover letter copied to clipboard!');
      })
      .catch(err => {
        console.error('Failed to copy text: ', err);
      });
  };

  return (
    <div className="cover-letter-generator">
      <div className="job-details-form">
        <h3>Generate AI Cover Letter</h3>
        <p className="description">
          Fill in the job details below and we'll generate a personalized cover letter based on your resume.
        </p>
        
        <div className="form-group">
          <label htmlFor="job-title">Job Title*</label>
          <input
            id="job-title"
            name="title"
            value={jobDetails.title}
            onChange={handleInputChange}
            placeholder="e.g., Senior Software Engineer"
            required
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="company">Company Name*</label>
          <input
            id="company"
            name="company"
            value={jobDetails.company}
            onChange={handleInputChange}
            placeholder="e.g., Acme Inc."
            required
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="requirements">Key Requirements</label>
          <textarea
            id="requirements"
            name="requirements"
            value={jobDetails.requirements}
            onChange={handleInputChange}
            placeholder="List the key skills or requirements for this position..."
            rows={3}
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="description">Job Description</label>
          <textarea
            id="description"
            name="description"
            value={jobDetails.description}
            onChange={handleInputChange}
            placeholder="Paste the full job description for more tailored results..."
            rows={5}
          />
        </div>
        
        <button 
          className="generate-button" 
          onClick={generateCoverLetter}
          disabled={loading}
        >
          {loading ? 'Generating...' : 'Generate Cover Letter'}
        </button>
        
        {error && <div className="error-message">{error}</div>}
      </div>
      
      {coverLetter && (
        <div className="cover-letter-output">
          <div className="cover-letter-header">
            <h3>Your Personalized Cover Letter</h3>
            <button className="copy-button" onClick={handleCopy}>
              <i className="fas fa-copy"></i> Copy
            </button>
          </div>
          <div className="cover-letter-content">
            {coverLetter.split('\n').map((paragraph, i) => (
              <p key={i}>{paragraph}</p>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default CoverLetterGenerator;
