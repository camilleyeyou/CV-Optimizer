import React from 'react';
import ContentSuggestions from '../ai/ContentSuggestions';
import './EnhancedField.css';

const EnhancedField = ({ 
  label, 
  name, 
  value, 
  onChange, 
  placeholder, 
  multiline = false,
  enableAI = false,
  fieldType = 'text'
}) => {
  const handleAISuggestion = (suggestion) => {
    onChange({
      target: {
        name,
        value: suggestion
      }
    });
  };
  
  return (
    <div className="enhanced-field">
      <label htmlFor={name}>{label}</label>
      
      {multiline ? (
        <textarea
          id={name}
          name={name}
          value={value || ''}
          onChange={onChange}
          placeholder={placeholder}
          rows={5}
        />
      ) : (
        <input
          type="text"
          id={name}
          name={name}
          value={value || ''}
          onChange={onChange}
          placeholder={placeholder}
        />
      )}
      
      {enableAI && (
        <ContentSuggestions 
          fieldType={fieldType}
          currentContent={value || ''}
          onApplySuggestion={handleAISuggestion}
        />
      )}
    </div>
  );
};

export default EnhancedField;
