import React, { useState } from 'react';
import { useResume } from '../../context/ResumeContext';
import { getSafeSkillsArray } from '../../utils/SafeSkillsArray';
import './ResumeAnalyzer.css';

const ResumeAnalyzer = () => {
  const { resumeData } = useResume();
  const [jobDescription, setJobDescription] = useState('');
  const [analysisResult, setAnalysisResult] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  // Use the SafeSkillsArray utility to ensure we have an array
  const safeSkills = getSafeSkillsArray(resumeData.skills);
  
  const handleAnalyze = async () => {
    if (!jobDescription.trim()) {
      alert('Please enter a job description to analyze against.');
      return;
    }
    
    setIsAnalyzing(true);
    
    try {
      // Simulate analysis (replace with actual API call)
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Create a simple analysis based on skills matching
      const jobKeywords = jobDescription.toLowerCase().split(/\s+/);
      const matchedSkills = [];
      const missingSkills = [];
      
      // Extract skill names for matching - using safeSkills instead of resumeData.skills
      const skillNames = safeSkills.map(skill => 
        typeof skill === 'string' ? skill.toLowerCase() : (skill.name || '').toLowerCase()
      );
      
      // Simple keyword matching (would be more sophisticated in real implementation)
      jobKeywords.forEach(keyword => {
        if (keyword.length > 3) {
          const found = skillNames.some(skill => skill.includes(keyword));
          if (found) {
            if (!matchedSkills.includes(keyword)) matchedSkills.push(keyword);
          } else {
            if (!missingSkills.includes(keyword) && 
                !['and', 'the', 'for', 'with', 'will', 'have', 'you'].includes(keyword)) {
              missingSkills.push(keyword);
            }
          }
        }
      });
      
      // Calculate a simple score
      const score = Math.min(100, Math.round((matchedSkills.length / (matchedSkills.length + missingSkills.length)) * 100) || 0);
      
      setAnalysisResult({
        score,
        matchedSkills,
        missingSkills: missingSkills.slice(0, 10), // Limit to top 10 missing skills
        breakdown: {
          skills: score,
          experience: Math.round(Math.random() * 40) + 60, // Simulated scores
          formatting: Math.round(Math.random() * 20) + 80
        }
      });
    } catch (error) {
      console.error('Error analyzing resume:', error);
      alert('Failed to analyze resume.');
    } finally {
      setIsAnalyzing(false);
    }
  };
  
  return (
    <div className="resume-analyzer">
      <h2>ATS Resume Analysis</h2>
      <p className="help-text">
        Paste a job description below to analyze how well your resume matches the requirements.
      </p>
      
      <textarea
        className="job-description-input"
        placeholder="Paste the job description here..."
        value={jobDescription}
        onChange={(e) => setJobDescription(e.target.value)}
        rows={8}
      />
      
      <button 
        className="analyze-button"
        onClick={handleAnalyze}
        disabled={isAnalyzing}
      >
        {isAnalyzing ? 'Analyzing...' : 'Analyze Resume'}
      </button>
      
      {analysisResult && (
        <div className="analysis-results">
          <div className="score-container">
            <div className="score-circle" style={{ 
              background: `conic-gradient(#4CAF50 ${analysisResult.score * 3.6}deg, #f0f0f0 0deg)`
            }}>
              <div className="score-inner">
                <span className="score-value">{analysisResult.score}</span>
                <span className="score-label">ATS Score</span>
              </div>
            </div>
          </div>
          
          <div className="score-breakdown">
            <h3>Score Breakdown</h3>
            <div className="breakdown-item">
              <span>Keywords Match:</span>
              <div className="progress-bar">
                <div className="progress" style={{ width: `${analysisResult.breakdown.skills}%` }}></div>
              </div>
              <span>{analysisResult.breakdown.skills}%</span>
            </div>
            <div className="breakdown-item">
              <span>Experience:</span>
              <div className="progress-bar">
                <div className="progress" style={{ width: `${analysisResult.breakdown.experience}%` }}></div>
              </div>
              <span>{analysisResult.breakdown.experience}%</span>
            </div>
            <div className="breakdown-item">
              <span>Formatting:</span>
              <div className="progress-bar">
                <div className="progress" style={{ width: `${analysisResult.breakdown.formatting}%` }}></div>
              </div>
              <span>{analysisResult.breakdown.formatting}%</span>
            </div>
          </div>
          
          <div className="keywords-section">
            <div className="matched-keywords">
              <h3>Matched Keywords</h3>
              <div className="keyword-list">
                {analysisResult.matchedSkills.length > 0 ? (
                  analysisResult.matchedSkills.map((keyword, index) => (
                    <span key={index} className="keyword-tag matched">{keyword}</span>
                  ))
                ) : (
                  <p>No matching keywords found.</p>
                )}
              </div>
            </div>
            
            <div className="missing-keywords">
              <h3>Missing Keywords</h3>
              <div className="keyword-list">
                {analysisResult.missingSkills.length > 0 ? (
                  analysisResult.missingSkills.map((keyword, index) => (
                    <span key={index} className="keyword-tag missing">{keyword}</span>
                  ))
                ) : (
                  <p>No significant missing keywords detected.</p>
                )}
              </div>
            </div>
          </div>
          
          <div className="suggestions">
            <h3>Improvement Suggestions</h3>
            <ul>
              {analysisResult.missingSkills.length > 0 && (
                <li>Consider adding these missing keywords to your resume: <strong>{analysisResult.missingSkills.join(', ')}</strong></li>
              )}
              <li>Make sure your most relevant experience is prominently featured at the top.</li>
              <li>Use action verbs and quantifiable achievements in your work descriptions.</li>
              <li>Ensure your resume is properly formatted with clear sections and consistent styling.</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

export default React.memo(ResumeAnalyzer);
