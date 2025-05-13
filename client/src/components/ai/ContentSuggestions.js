import React, { useState } from 'react';
import axios from 'axios';
import './ContentSuggestions.css';

const ContentSuggestions = ({ fieldType, currentContent, onApplySuggestion }) => {
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const getSuggestions = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await axios.post('/api/generate-suggestions', {
        fieldType,
        currentContent
      });
      
      setSuggestions(response.data.suggestions);
    } catch (err) {
      console.error('Error getting suggestions:', err);
      setError('Failed to get AI suggestions. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="content-suggestions">
      <button 
        className="suggestion-button"
        onClick={getSuggestions}
        disabled={loading}
      >
        <i className="fas fa-magic"></i> {loading ? 'Generating...' : 'Get AI Suggestions'}
      </button>
      
      {error && <div className="error-message">{error}</div>}
      
      {suggestions.length > 0 && (
        <div className="suggestions-list">
          <h4>AI Suggestions</h4>
          <ul>
            {suggestions.map((suggestion, index) => (
              <li key={index} className="suggestion-item">
                <div className="suggestion-content">{suggestion}</div>
                <button 
                  className="apply-button"
                  onClick={() => onApplySuggestion(suggestion)}
                >
                  Apply
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default ContentSuggestions;
