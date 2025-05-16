import React, { useState } from 'react';
import * as aiService from '../../services/aiService';
import './EnhancedAISuggestions.css';

const SuggestionTypes = {
  SUMMARY: 'summary',
  BULLET_POINT: 'bullet_point',
  SKILL: 'skill',
  JOB_TITLE: 'job_title',
  ACHIEVEMENT: 'achievement'
};

const EnhancedAISuggestions = ({ 
  type, 
  currentContent, 
  jobDescription, 
  onApplySuggestion 
}) => {
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [improvementFocus, setImprovementFocus] = useState('general');

  const getTypeTitle = () => {
    switch (type) {
      case SuggestionTypes.SUMMARY:
        return 'Professional Summary';
      case SuggestionTypes.BULLET_POINT:
        return 'Experience Bullet Point';
      case SuggestionTypes.SKILL:
        return 'Skill';
      case SuggestionTypes.JOB_TITLE:
        return 'Job Title';
      case SuggestionTypes.ACHIEVEMENT:
        return 'Achievement';
      default:
        return 'Content';
    }
  };

  const getSuggestions = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await aiService.generateEnhancedSuggestions(
        type, 
        currentContent, 
        jobDescription, 
        improvementFocus
      );
      
      setSuggestions(result.suggestions);
    } catch (err) {
      console.error('Error getting AI suggestions:', err);
      setError('Failed to get AI suggestions. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderImprovementOptions = () => {
    const options = {
      general: 'General Improvement',
      ats: 'ATS Optimization',
      clarity: 'Clarity & Conciseness',
      impact: 'Impact & Results',
      keywords: 'Keyword Enrichment'
    };

    return (
      <div className="improvement-focus">
        <label>Focus on:</label>
        <div className="focus-options">
          {Object.entries(options).map(([key, label]) => (
            <button
              key={key}
              className={`focus-option ${improvementFocus === key ? 'active' : ''}`}
              onClick={() => setImprovementFocus(key)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="enhanced-ai-suggestions">
      <div className="suggestion-header">
        <h4>AI Suggestions for {getTypeTitle()}</h4>
        <div className="ai-badge">
          <span className="ai-icon">AI</span>
          <span className="badge-text">Powered</span>
        </div>
      </div>
      
      {renderImprovementOptions()}
      
      <div className="suggestion-actions">
        <button 
          className="get-suggestions-button" 
          onClick={getSuggestions}
          disabled={loading}
        >
          {loading ? (
            <span className="loading-spinner"></span>
          ) : (
            <>
              <span className="button-icon">✨</span>
              Generate AI Suggestions
            </>
          )}
        </button>
      </div>
      
      {error && <div className="error-message">{error}</div>}
      
      {suggestions.length > 0 && (
        <div className="suggestions-list">
          {suggestions.map((suggestion, index) => (
            <div key={index} className="suggestion-card">
              <div className="suggestion-content">
                {suggestion.text}
              </div>
              <div className="suggestion-meta">
                {suggestion.reasoning && (
                  <div className="suggestion-reasoning">
                    <span className="reasoning-label">Why:</span> {suggestion.reasoning}
                  </div>
                )}
                <div className="suggestion-actions">
                  <button 
                    className="apply-button"
                    onClick={() => onApplySuggestion(suggestion.text)}
                  >
                    Apply
                  </button>
                  <button className="edit-button">
                    Edit
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default EnhancedAISuggestions;
