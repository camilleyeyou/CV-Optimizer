import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useResume } from '../context/ResumeContext';
import ModernTemplate from '../components/templates/ModernTemplate';
import ClassicTemplate from '../components/templates/ClassicTemplate';
import MinimalTemplate from '../components/templates/MinimalTemplate';
import CreativeTemplate from '../components/templates/CreativeTemplate';
import { FaArrowRight } from 'react-icons/fa';
import '../styles/Templates.css';

const Templates = () => {
  const navigate = useNavigate();
  const { createNewResume } = useResume();
  const [selectedTemplate, setSelectedTemplate] = useState(null);

  const templates = [
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
      console.log('🎨 No template selected, using default modern');
      const resumeId = createNewResume('modern');
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
                <h3>{capitalizeFirstLetter(template.name || '')}</h3>
                <p>
                  {template.id === 'modern' && 'A sleek and professional design'}
                  {template.id === 'classic' && 'A traditional and elegant layout'}
                  {template.id === 'minimal' && 'A simple and clean design'}
                  {template.id === 'creative' && 'A unique and eye-catching layout'}
                </p>
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
            ? `Use ${capitalizeFirstLetter(selectedTemplate || '')} Template` 
            : 'Select a Template'}
          <FaArrowRight className="icon-right" />
        </button>
      </div>
    </div>
  );
};

export default Templates;
