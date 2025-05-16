import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useResume } from '../../context/ResumeContext';
import { getTemplates } from '../../services/resumeService';
import { FaCheck, FaArrowRight } from 'react-icons/fa';

const TemplateSelector = () => {
  const { resumeData, selectTemplate } = useResume();
  const [templates, setTemplates] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Default templates if API fails
  const defaultTemplates = [
    { id: 'modern', name: 'Modern', premium: false, thumbnail: '/images/templates/modern-thumb.png' },
    { id: 'professional', name: 'Professional', premium: false, thumbnail: '/images/templates/professional-thumb.png' },
    { id: 'minimalist', name: 'Minimalist', premium: false, thumbnail: '/images/templates/minimalist-thumb.png' },
    { id: 'creative', name: 'Creative', premium: false, thumbnail: '/images/templates/creative-thumb.png' },
  ];
  
  // Fetch available templates on component mount
  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        setIsLoading(true);
        const data = await getTemplates();
        setTemplates(data);
      } catch (err) {
        console.error('Error fetching templates:', err);
        setTemplates(defaultTemplates);
        setError('Failed to load templates. Showing default options.');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchTemplates();
  }, []);
  
  // Handle template selection
  const handleSelectTemplate = (templateId) => {
    selectTemplate(templateId);
  };
  
  if (isLoading) {
    return (
      <div className="template-selector-container">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading templates...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="template-selector-container">
      <div className="template-selector-header">
        <h3>Resume Template</h3>
        <Link to="/templates" className="btn-text">
          Browse All Templates <FaArrowRight />
        </Link>
      </div>
      
      {error && (
        <div className="alert alert-info">
          <p>{error}</p>
        </div>
      )}
      
      <div className="template-thumbnails">
        {templates.slice(0, 4).map(template => (
          <div 
            key={template.id} 
            className={`template-thumbnail ${resumeData.selectedTemplate === template.id ? 'selected' : ''}`}
            onClick={() => handleSelectTemplate(template.id)}
          >
            <div className="thumbnail-image">
              <img 
                src={template.thumbnail} 
                alt={`${template.name} template`} 
              />
              
              {resumeData.selectedTemplate === template.id && (
                <div className="thumbnail-selected">
                  <FaCheck />
                </div>
              )}
            </div>
            
            <div className="thumbnail-info">
              <span>{template.name}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TemplateSelector;