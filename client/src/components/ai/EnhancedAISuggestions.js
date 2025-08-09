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
  resumeId, 
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
      // Debug logging
      console.log('Getting suggestions for:', { type, resumeId, currentContent });
      
      // 🔧 FIX: No longer require resumeId for all types
      // The backend will handle missing resume data gracefully
      
      let result;
      
      // Handle different suggestion types with appropriate parameters
      switch (type) {
        case 'summary':
          if (!resumeId) {
            setError('Please save your resume first to get AI suggestions for summary.');
            return;
          }
          result = await aiService.generateEnhancedSuggestions(
            type, 
            resumeId, // Pass resumeId as currentContent for summary
            jobDescription, 
            improvementFocus
          );
          break;
          
        case 'skill':
          if (!resumeId) {
            setError('Please save your resume first to get AI suggestions for skills.');
            return;
          }
          result = await aiService.generateEnhancedSuggestions(
            type, 
            resumeId, // Pass resumeId as currentContent for skills
            jobDescription, 
            improvementFocus
          );
          break;
          
        case 'bullet_point':
          // For bullet points, we can work with current content directly
          if (!currentContent || currentContent.trim() === '') {
            setError('Please enter some experience content first.');
            return;
          }
          result = await aiService.generateEnhancedSuggestions(
            type, 
            currentContent, 
            jobDescription, 
            improvementFocus
          );
          break;
          
        case 'achievement':
          // For achievements, we can work with current content directly
          if (!currentContent || currentContent.trim() === '') {
            setError('Please enter an achievement statement first.');
            return;
          }
          result = await aiService.generateEnhancedSuggestions(
            type, 
            currentContent, 
            jobDescription, 
            improvementFocus
          );
          break;
          
        case 'job_title':
          // For job titles, we can work with current content directly
          if (!currentContent || currentContent.trim() === '') {
            setError('Please enter a job title first.');
            return;
          }
          result = await aiService.generateEnhancedSuggestions(
            type, 
            currentContent, 
            jobDescription, 
            improvementFocus
          );
          break;
          
        default:
          result = await aiService.generateEnhancedSuggestions(
            type, 
            currentContent, 
            jobDescription, 
            improvementFocus
          );
      }
      
      if (result && result.suggestions) {
        setSuggestions(result.suggestions);
        setError(null);
      } else {
        setError('No suggestions were generated. Please try again.');
      }
    } catch (err) {
      console.error('Error getting AI suggestions:', err);
      
      // 🔧 BETTER ERROR HANDLING
      if (err.message && err.message.includes('Resume not found')) {
        setError('Please save your resume first to get AI suggestions for this section.');
      } else if (err.response && err.response.status === 404) {
        setError('Please save your resume first to get AI suggestions for this section.');
      } else if (err.response && err.response.status === 400) {
        setError('Invalid request. Please check your data and try again.');
      } else {
        setError(aiService.handleApiError ? aiService.handleApiError(err) : err.message);
      }
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

  // 🔧 HELPER: Check if we can generate suggestions for this type
  const canGenerateSuggestions = () => {
    switch (type) {
      case 'summary':
      case 'skill':
        return !!resumeId;
      case 'bullet_point':
      case 'achievement':
      case 'job_title':
        return !!(currentContent && currentContent.trim());
      default:
        return true;
    }
  };

  const getButtonText = () => {
    if (loading) return 'Generating...';
    
    if (!canGenerateSuggestions()) {
      switch (type) {
        case 'summary':
        case 'skill':
          return 'Save Resume First';
        case 'bullet_point':
        case 'achievement':
        case 'job_title':
          return 'Enter Content First';
        default:
          return 'Generate AI Suggestions';
      }
    }
    
    return 'Generate AI Suggestions';
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
          disabled={loading || !canGenerateSuggestions()}
        >
          {loading ? (
            <span className="loading-spinner"></span>
          ) : (
            <>
              <span className="button-icon">✨</span>
              {getButtonText()}
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