import React, { useState } from 'react';
import { useResume } from '../../context/ResumeContext';
import { getAiSuggestions } from '../../services/aiService';

const SummaryForm = () => {
  const { resumeData, updateSummary } = useResume();
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  
  const handleChange = (e) => {
    updateSummary(e.target.value);
  };
  
  const generateSummary = async () => {
    try {
      setIsLoading(true);
      
      // Get suggestions from the AI service
      const result = await getAiSuggestions('summary', resumeData);
      
      setSuggestions(result);
    } catch (error) {
      console.error('Error generating summary:', error);
      alert('Error generating summary. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const applySuggestion = (suggestion) => {
    updateSummary(suggestion);
    setSuggestions([]);
  };
  
  return (
    <div className="form-section">
      <div className="form-group">
        <label htmlFor="summary">Professional Summary</label>
        <textarea
          id="summary"
          name="summary"
          value={resumeData.summary}
          onChange={handleChange}
          placeholder="Write a concise summary of your professional background, skills, and career goals (2-4 sentences recommended)"
          rows={6}
        />
        
        <div className="char-count">
          {resumeData.summary.length} / 500 characters
        </div>
      </div>
      
      <div className="form-actions">
        <button 
          className="btn btn-secondary"
          onClick={generateSummary}
          disabled={isLoading}
        >
          {isLoading ? 'Generating...' : 'Generate AI Summary'}
        </button>
      </div>
      
      {suggestions.length > 0 && (
        <div className="suggestions-container">
          <h4>AI-Generated Suggestions</h4>
          <div className="suggestions-list">
            {suggestions.map((suggestion, index) => (
              <div key={index} className="suggestion-item">
                <p>{suggestion}</p>
                <button 
                  className="btn btn-sm btn-outline"
                  onClick={() => applySuggestion(suggestion)}
                >
                  Use This
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
      
      <div className="form-hint">
        <h4>Tips for a Strong Professional Summary</h4>
        <ul>
          <li>Keep it concise (2-4 sentences)</li>
          <li>Highlight your years of experience and key areas of expertise</li>
          <li>Include 2-3 of your most impressive achievements or strengths</li>
          <li>Tailor it to the types of jobs you're applying for</li>
          <li>Avoid generic statements that could apply to anyone</li>
        </ul>
      </div>
    </div>
  );
};

export default SummaryForm;
