import React, { useState } from 'react';
import { useResume } from '../../context/ResumeContext';
import { generateCoverLetter } from '../../services/aiService';
import { FaFileAlt, FaSpinner, FaDownload, FaCopy, FaRedo } from 'react-icons/fa';

const CoverLetterGenerator = () => {
  const { resumeData } = useResume();
  const [formData, setFormData] = useState({
    jobTitle: '',
    companyName: '',
    jobDescription: '',
    hiringManager: '',
    tone: 'professional',
    length: 'medium'
  });
  const [coverLetter, setCoverLetter] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleGenerate = async (e) => {
    e.preventDefault();
    
    // Reset states
    setError('');
    setCoverLetter('');
    
    // Validate form
    if (!formData.jobTitle.trim() || !formData.companyName.trim() || !formData.jobDescription.trim()) {
      setError('Please fill out all required fields.');
      return;
    }
    
    try {
      setIsGenerating(true);
      
      // Generate cover letter
      const result = await generateCoverLetter(
        resumeData,
        formData.jobDescription,
        {
          jobTitle: formData.jobTitle,
          companyName: formData.companyName,
          hiringManager: formData.hiringManager,
          tone: formData.tone,
          length: formData.length
        }
      );
      
      setCoverLetter(result.coverLetter);
    } catch (error) {
      console.error('Error generating cover letter:', error);
      setError('Failed to generate cover letter. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };
  
  const handleCopy = () => {
    navigator.clipboard.writeText(coverLetter);
    setCopied(true);
    
    // Reset copied state after 2 seconds
    setTimeout(() => {
      setCopied(false);
    }, 2000);
  };
  
  const handleDownload = () => {
    // Create blob from cover letter text
    const blob = new Blob([coverLetter], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    
    // Create element to trigger download
    const link = document.createElement('a');
    link.href = url;
    link.download = `Cover_Letter_${formData.companyName.replace(/\s+/g, '_')}.txt`;
    document.body.appendChild(link);
    link.click();
    
    // Clean up
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };
  
  return (
    <div className="cover-letter-container">
      <div className="cover-letter-header">
        <div className="header-icon">
          <FaFileAlt />
        </div>
        <div className="header-text">
          <h2>AI Cover Letter Generator</h2>
          <p>Create a personalized cover letter for your job application</p>
        </div>
      </div>
      
      {error && (
        <div className="alert alert-danger">
          <p>{error}</p>
        </div>
      )}
      
      <div className="cover-letter-content">
        <div className="cover-letter-form">
          <form onSubmit={handleGenerate}>
            <div className="form-group">
              <label htmlFor="jobTitle">Job Title *</label>
              <input
                type="text"
                id="jobTitle"
                name="jobTitle"
                value={formData.jobTitle}
                onChange={handleChange}
                placeholder="Enter the job title you're applying for"
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="companyName">Company Name *</label>
              <input
                type="text"
                id="companyName"
                name="companyName"
                value={formData.companyName}
                onChange={handleChange}
                placeholder="Enter the company name"
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="hiringManager">Hiring Manager (optional)</label>
              <input
                type="text"
                id="hiringManager"
                name="hiringManager"
                value={formData.hiringManager}
                onChange={handleChange}
                placeholder="Enter the hiring manager's name if known"
              />
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="tone">Tone</label>
                <select
                  id="tone"
                  name="tone"
                  value={formData.tone}
                  onChange={handleChange}
                >
                  <option value="professional">Professional</option>
                  <option value="enthusiastic">Enthusiastic</option>
                  <option value="formal">Formal</option>
                  <option value="conversational">Conversational</option>
                </select>
              </div>
              
              <div className="form-group">
                <label htmlFor="length">Length</label>
                <select
                  id="length"
                  name="length"
                  value={formData.length}
                  onChange={handleChange}
                >
                  <option value="short">Short</option>
                  <option value="medium">Medium</option>
                  <option value="long">Long</option>
                </select>
              </div>
            </div>
            
            <div className="form-group">
              <label htmlFor="jobDescription">Job Description *</label>
              <textarea
                id="jobDescription"
                name="jobDescription"
                value={formData.jobDescription}
                onChange={handleChange}
                placeholder="Paste the job description here"
                rows={6}
                required
              />
            </div>
            
            <button 
              type="submit" 
              className="btn btn-primary btn-block"
              disabled={isGenerating}
            >
              {isGenerating ? (
                <>
                  <FaSpinner className="spinner" /> Generating Cover Letter...
                </>
              ) : (
                'Generate Cover Letter'
              )}
            </button>
          </form>
          
          <div className="form-hint">
            <h4>Tips for Better Results</h4>
            <ul>
              <li>Include the full job description for better targeting</li>
              <li>Make sure your resume is complete with relevant experience</li>
              <li>Adjust the tone based on the company culture</li>
              <li>Review and personalize the generated letter before sending</li>
            </ul>
          </div>
        </div>
        
        {coverLetter && (
          <div className="cover-letter-output">
            <div className="output-header">
              <h3>Your Cover Letter</h3>
              <div className="output-actions">
                <button 
                  className="btn btn-outline btn-sm"
                  onClick={handleCopy}
                >
                  {copied ? 'Copied!' : <><FaCopy /> Copy</>}
                </button>
                <button 
                  className="btn btn-outline btn-sm"
                  onClick={handleDownload}
                >
                  <FaDownload /> Download
                </button>
                <button 
                  className="btn btn-outline btn-sm"
                  onClick={handleGenerate}
                  disabled={isGenerating}
                >
                  <FaRedo /> Regenerate
                </button>
              </div>
            </div>
            
            <div className="cover-letter-text">
              {coverLetter.split('\n').map((paragraph, index) => (
                <p key={index}>{paragraph}</p>
              ))}
            </div>
            
            <div className="output-footer">
              <p>Remember to personalize this letter before sending it to employers.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CoverLetterGenerator;