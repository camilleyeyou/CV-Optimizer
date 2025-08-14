import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useResume } from '../context/ResumeContext';
import ModernTemplate from '../components/templates/ModernTemplate';
import ClassicTemplate from '../components/templates/ClassicTemplate';
import MinimalTemplate from '../components/templates/MinimalTemplate';
import CreativeTemplate from '../components/templates/CreativeTemplate';
import ProfessionalModernTemplate from '../components/templates/ProfessionalModernTemplate';
import { FaArrowRight } from 'react-icons/fa';
import '../styles/Templates.css';

const Templates = () => {
  const navigate = useNavigate();
  const { createNewResume } = useResume();
  const [selectedTemplate, setSelectedTemplate] = useState(null);

  const templates = [
    { id: 'professional-modern', name: 'Professional Modern', component: ProfessionalModernTemplate },
    { id: 'modern', name: 'Modern', component: ModernTemplate },
    { id: 'classic', name: 'Classic', component: ClassicTemplate },
    { id: 'minimal', name: 'Minimal', component: MinimalTemplate },
    { id: 'creative', name: 'Creative', component: CreativeTemplate },
  ];

  const selectTemplate = (templateId) => {
    setSelectedTemplate(templateId);
  };

  const handleCreateResume = () => {
    try {
      if (selectedTemplate) {
        console.log('🎨 Creating resume with template:', selectedTemplate);
        const resumeId = createNewResume(selectedTemplate);
        console.log('✅ Created resume with ID:', resumeId);
        navigate(`/builder/${resumeId}`);
      } else {
        console.log('🎨 No template selected, using default professional-modern');
        const resumeId = createNewResume('professional-modern');
        console.log('✅ Created resume with ID:', resumeId);
        navigate(`/builder/${resumeId}`);
      }
    } catch (error) {
      console.error('❌ Error creating resume:', error);
      // You could show a toast/alert here
    }
  };

  const capitalizeFirstLetter = (string) => {
    // Check if string exists before calling charAt
    if (!string) return '';
    return string.charAt(0).toUpperCase() + string.slice(1);
  };

  // Helper function to format template names properly
  const formatTemplateName = (name) => {
    if (!name) return '';
    // Handle hyphenated names like 'professional-modern'
    return name
      .split('-')
      .map(word => capitalizeFirstLetter(word))
      .join(' ');
  };

  // Helper function to get template description
  const getTemplateDescription = (templateId) => {
    const descriptions = {
      'professional-modern': 'ATS-optimized professional design with modern styling',
      'modern': 'A sleek and professional design',
      'classic': 'A traditional and elegant layout',
      'minimal': 'A simple and clean design',
      'creative': 'A unique and eye-catching layout'
    };
    return descriptions[templateId] || 'A professional resume template';
  };

  return (
    <div className="templates-container">
      <h1>Choose a Template</h1>
      <p>Select a template to get started with your resume</p>
      
      <div className="templates-grid">
        {templates.map((template) => {
          const TemplateComponent = template.component;
          return (
            <div
              key={template.id}
              className={`template-card ${selectedTemplate === template.id ? 'selected' : ''}`}
              onClick={() => selectTemplate(template.id)}
            >
              <div className="template-preview">
                <TemplateComponent demoMode={true} />
              </div>
              <div className="template-info">
                <h3>{formatTemplateName(template.name)}</h3>
                <p>{getTemplateDescription(template.id)}</p>
              </div>
            </div>
          );
        })}
      </div>
      
      <div className="template-actions">
        <button 
          className="select-template-btn"
          onClick={handleCreateResume}
          disabled={!selectedTemplate}
        >
          {selectedTemplate 
            ? `Use ${formatTemplateName(selectedTemplate)} Template` 
            : 'Select a Template'}
          <FaArrowRight className="icon-right" />
        </button>
      </div>
    </div>
  );
};

export default Templates;