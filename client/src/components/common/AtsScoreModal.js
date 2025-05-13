import React from 'react';
import { FaTimes, FaCheckCircle, FaExclamationTriangle, FaQuestionCircle } from 'react-icons/fa';

const AtsScoreModal = ({ score, suggestions, onClose }) => {
  // Determine score color and message
  const getScoreColor = () => {
    if (score >= 80) return 'green';
    if (score >= 60) return 'orange';
    return 'red';
  };
  
  const getScoreMessage = () => {
    if (score >= 80) {
      return 'Excellent! Your resume is well-optimized for ATS.';
    } else if (score >= 60) {
      return 'Good start! With a few improvements, your resume can pass ATS with flying colors.';
    } else {
      return 'Your resume needs significant improvements to pass ATS systems.';
    }
  };
  
  // Group suggestions by priority
  const groupedSuggestions = {
    critical: suggestions.filter(s => s.priority === 'critical'),
    important: suggestions.filter(s => s.priority === 'important'),
    improvement: suggestions.filter(s => s.priority === 'improvement' || !s.priority),
  };
  
  return (
    <div className="modal-overlay">
      <div className="modal-content ats-score-modal">
        <div className="modal-header">
          <h2>ATS Compatibility Score</h2>
          <button className="modal-close" onClick={onClose}>
            <FaTimes />
          </button>
        </div>
        
        <div className="modal-body">
          <div className="score-display">
            <div 
              className="score-circle" 
              style={{ borderColor: getScoreColor() }}
            >
              <span className="score-number" style={{ color: getScoreColor() }}>
                {score}
              </span>
              <span className="score-percent">%</span>
            </div>
            
            <p className="score-message">{getScoreMessage()}</p>
          </div>
          
          <div className="suggestions-section">
            {groupedSuggestions.critical.length > 0 && (
              <div className="suggestion-category critical">
                <h3>
                  <FaExclamationTriangle /> Critical Issues to Fix
                </h3>
                <ul>
                  {groupedSuggestions.critical.map((suggestion, index) => (
                    <li key={`critical-${index}`}>
                      <div className="suggestion-content">
                        <strong>{suggestion.title}</strong>
                        <p>{suggestion.description}</p>
                        {suggestion.example && (
                          <div className="suggestion-example">
                            <span>Example: </span>
                            {suggestion.example}
                          </div>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            
            {groupedSuggestions.important.length > 0 && (
              <div className="suggestion-category important">
                <h3>
                  <FaExclamationTriangle /> Important Improvements
                </h3>
                <ul>
                  {groupedSuggestions.important.map((suggestion, index) => (
                    <li key={`important-${index}`}>
                      <div className="suggestion-content">
                        <strong>{suggestion.title}</strong>
                        <p>{suggestion.description}</p>
                        {suggestion.example && (
                          <div className="suggestion-example">
                            <span>Example: </span>
                            {suggestion.example}
                          </div>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            
            {groupedSuggestions.improvement.length > 0 && (
              <div className="suggestion-category improvement">
                <h3>
                  <FaCheckCircle /> Suggested Enhancements
                </h3>
                <ul>
                  {groupedSuggestions.improvement.map((suggestion, index) => (
                    <li key={`improvement-${index}`}>
                      <div className="suggestion-content">
                        <strong>{suggestion.title}</strong>
                        <p>{suggestion.description}</p>
                        {suggestion.example && (
                          <div className="suggestion-example">
                            <span>Example: </span>
                            {suggestion.example}
                          </div>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
          
          <div className="ats-info">
            <h3>
              <FaQuestionCircle /> What is ATS?
            </h3>
            <p>
              Applicant Tracking Systems (ATS) are software used by employers to scan, sort, and rank resumes before human reviewers see them. 
              Over 75% of companies use ATS to filter applications. Optimizing your resume for ATS increases your chances of getting past 
              this initial screening.
            </p>
          </div>
        </div>
        
        <div className="modal-footer">
          <button className="btn btn-primary" onClick={onClose}>
            Return to Editor
          </button>
        </div>
      </div>
    </div>
  );
};

export default AtsScoreModal;
