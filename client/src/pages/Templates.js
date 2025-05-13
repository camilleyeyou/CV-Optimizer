import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useResume } from '../context/ResumeContext';
import TemplateSelector from '../components/templates/TemplateSelector';
import './Templates.css';

const Templates = () => {
  const navigate = useNavigate();
  const { activeTemplate, saveResume } = useResume();
  
  const handleContinue = async () => {
    try {
      // Save the template selection
      await saveResume();
      // Navigate to the builder page
      navigate('/builder');
    } catch (error) {
      console.error('Error saving template selection:', error);
    }
  };
  
  return (
    <div className="templates-page">
      <div className="page-header">
        <h1>Choose Your Resume Template</h1>
        <p>Select a template design that best fits your style and industry</p>
      </div>
      
      <TemplateSelector />
      
      <div className="templates-actions">
        <button className="continue-button" onClick={handleContinue}>
          Continue with {activeTemplate.charAt(0).toUpperCase() + activeTemplate.slice(1)} Template
        </button>
      </div>
    </div>
  );
};

export default Templates;
