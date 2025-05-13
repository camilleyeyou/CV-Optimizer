import React, { useState } from 'react';
import { useResume } from '../../context/ResumeContext';
import JobDescriptionAnalyzer from './JobDescriptionAnalyzer';
import SkillMatchAnalytics from './SkillMatchAnalytics';
import { analyzeResume, analyzeJobDescription } from '../../services/aiService';
import './ResumeAnalyzer.css';

const ResumeAnalyzer = () => {
  const { resumeData } = useResume();
  const [analysis, setAnalysis] = useState(null);
  const [jobDescription, setJobDescription] = useState('');
  const [jobKeywords, setJobKeywords] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('ats');

  // Extract resume skills
  const resumeSkills = resumeData.skills.map(skill => skill.name);

  const handleJobKeywordsExtracted = (data) => {
    setJobKeywords(data);
  };

  const handleAnalyzeResume = async () => {
    if (!jobDescription.trim()) {
      setError('Please provide a job description for analysis');
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const result = await analyzeResume(resumeData, jobDescription);
      setAnalysis(result);
    } catch (err) {
      console.error('Error analyzing resume:', err);
      setError('Failed to analyze resume. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleAnalyzeJobDescription = async () => {
    if (!jobDescription.trim()) {
      setError('Please provide a job description to analyze');
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const result = await analyzeJobDescription(jobDescription);
      setJobKeywords(result);
    } catch (err) {
      console.error('Error analyzing job description:', err);
      setError('Failed to analyze job description. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="resume-analyzer-wrapper">
      <div className="analyzer-tabs">
        <button 
          className={`tab-button ${activeTab === 'ats' ? 'active' : ''}`}
          onClick={() => setActiveTab('ats')}
        >
          ATS Analysis
        </button>
        <button 
          className={`tab-button ${activeTab === 'skills' ? 'active' : ''}`}
          onClick={() => setActiveTab('skills')}
        >
          Skill Matching
        </button>
        <button 
          className={`tab-button ${activeTab === 'keywords' ? 'active' : ''}`}
          onClick={() => setActiveTab('keywords')}
        >
          Keyword Extraction
        </button>
      </div>
      
      <div className="analyzer-content">
        {activeTab === 'ats' && (
          <div className="ats-analysis">
            <div className="job-description-input">
              <label htmlFor="job-description">Paste Job Description for ATS Analysis:</label>
              <textarea 
                id="job-description"
                placeholder="Paste the job description here to get personalized recommendations..."
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                rows={6}
              />
            </div>
            
            <button 
              className="analyze-button" 
              onClick={handleAnalyzeResume}
              disabled={loading}
            >
              {loading ? 'Analyzing...' : 'Analyze My Resume'}
            </button>
            
            {error && <div className="error-message">{error}</div>}
            
            {analysis && (
              <div className="analysis-results">
                <div className="score-section">
                  <h4>ATS Compatibility Score</h4>
                  <div className="score-circle" style={{ '--score': analysis.score }}>
                    <span className="score-value">{analysis.score}%</span>
                  </div>
                </div>
                
                <div className="recommendations">
                  <h4>Improvement Suggestions</h4>
                  <ul>
                    {analysis.suggestions.map((suggestion, index) => (
                      <li key={index}>
                        <strong>{suggestion.category}:</strong> {suggestion.text}
                      </li>
                    ))}
                  </ul>
                </div>
                
                <div className="keyword-analysis">
                  <h4>Keyword Analysis</h4>
                  <div className="keyword-grid">
                    <div className="found-keywords">
                      <h5>Found Keywords</h5>
                      <ul>
                        {analysis.keywords.found.map((keyword, index) => (
                          <li key={index} className="keyword found">{keyword}</li>
                        ))}
                      </ul>
                    </div>
                    <div className="missing-keywords">
                      <h5>Missing Keywords</h5>
                      <ul>
                        {analysis.keywords.missing.map((keyword, index) => (
                          <li key={index} className="keyword missing">
                            {keyword}
                            <button 
                              className="add-keyword-button" 
                              title="Add to your skills"
                              onClick={() => {
                                // Logic to add keyword to skills
                                alert(`Add ${keyword} to your skills`);
                              }}
                            >
                              +
                            </button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
        
        {activeTab === 'skills' && (
          <div className="skills-analysis">
            <div className="job-description-input">
              <label htmlFor="job-skills-description">Paste Job Description for Skill Matching:</label>
              <textarea 
                id="job-skills-description"
                placeholder="Paste the job description here to match your skills..."
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                rows={6}
              />
            </div>
            
            <button 
              className="analyze-button" 
              onClick={handleAnalyzeJobDescription}
              disabled={loading}
            >
              {loading ? 'Analyzing...' : 'Match My Skills'}
            </button>
            
            {error && <div className="error-message">{error}</div>}
            
            {jobKeywords && (
              <SkillMatchAnalytics 
                resumeSkills={resumeSkills} 
                jobSkills={jobKeywords.skills} 
              />
            )}
          </div>
        )}
        
        {activeTab === 'keywords' && (
          <div className="keyword-extraction">
            <JobDescriptionAnalyzer onKeywordsExtracted={handleJobKeywordsExtracted} />
          </div>
        )}
      </div>
    </div>
  );
};

export default ResumeAnalyzer;
