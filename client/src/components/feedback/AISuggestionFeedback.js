import React, { useState } from 'react';
import { submitFeedback } from '../../services/aiService';
import './AISuggestionFeedback.css';

const AISuggestionFeedback = ({ suggestionId, suggestionType }) => {
  const [feedback, setFeedback] = useState(null);
  const [comment, setComment] = useState('');
  const [showComment, setShowComment] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleFeedback = async (rating) => {
    setFeedback(rating);
    
    if (rating === 'dislike') {
      setShowComment(true);
    } else {
      await handleSubmitFeedback(rating);
    }
  };

  const handleSubmitFeedback = async (rating = feedback) => {
    setSubmitting(true);
    
    try {
      await submitFeedback({
        suggestionId,
        suggestionType,
        rating,
        comment: comment || undefined
      });
      
      setSubmitted(true);
      setShowComment(false);
    } catch (error) {
      console.error('Error submitting feedback:', error);
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="feedback-container submitted">
        <div className="feedback-message">
          <span className="feedback-icon">✓</span>
          Thank you for your feedback!
        </div>
      </div>
    );
  }

  return (
    <div className="feedback-container">
      {!showComment ? (
        <div className="feedback-prompt">
          <span className="prompt-text">Was this suggestion helpful?</span>
          <div className="feedback-buttons">
            <button
              className={`feedback-button like ${feedback === 'like' ? 'active' : ''}`}
              onClick={() => handleFeedback('like')}
              disabled={submitting}
            >
              <span className="feedback-icon">👍</span>
            </button>
            <button
              className={`feedback-button dislike ${feedback === 'dislike' ? 'active' : ''}`}
              onClick={() => handleFeedback('dislike')}
              disabled={submitting}
            >
              <span className="feedback-icon">👎</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="feedback-comment">
          <label htmlFor="feedback-comment">How can we improve this suggestion?</label>
          <textarea
            id="feedback-comment"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Please tell us what would make this suggestion more helpful..."
            rows={3}
          />
          <div className="comment-actions">
            <button 
              className="cancel-button" 
              onClick={() => setShowComment(false)}
              disabled={submitting}
            >
              Cancel
            </button>
            <button 
              className="submit-button"
              onClick={() => handleSubmitFeedback()}
              disabled={submitting}
            >
              {submitting ? 'Submitting...' : 'Submit Feedback'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AISuggestionFeedback;
