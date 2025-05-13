import React from 'react';
import { useResume } from '../../context/ResumeContext';
import './TemplateSelector.css';

// Template preview images - you'll need to add these to your public folder
const templates = [
  {
    id: 'modern',
    name: 'Modern',
    description: 'Clean, professional design with subtle color accents',
    preview: '/templates/modern.png'
  },
  {
    id: 'classic',
    name: 'Classic',
    description: 'Traditional layout that works well for conservative industries',
    preview: '/templates/classic.png'
  },
  {
    id: 'creative',
    name: 'Creative',
    description: 'Bold design for standing out in creative fields',
    preview: '/templates/creative.png'
  },
  {
    id: 'minimal',
    name: 'Minimal',
    description: 'Simple, distraction-free layout focused on content',
    preview: '/templates/minimal.png'
  },
  {
    id: 'professional',
    name: 'Professional',
    description: 'Sophisticated design for executives and senior positions',
    preview: '/templates/professional.png'
  },
  {
    id: 'technical',
    name: 'Technical',
    description: 'Optimized for technical roles with skills emphasis',
    preview: '/templates/technical.png'
  }
];

const TemplateSelector = () => {
  const { activeTemplate, setActiveTemplate } = useResume();

  return (
    <div className="template-selector">
      <h2>Choose a Template</h2>
      <p className="selector-description">
        Select a template that best showcases your experience and matches the job you're applying for
      </p>
      
      <div className="templates-grid">
        {templates.map(template => (
          <div 
            key={template.id} 
            className={`template-card ${activeTemplate === template.id ? 'active' : ''}`}
            onClick={() => setActiveTemplate(template.id)}
          >
            <div className="template-preview">
              <img src={template.preview} alt={`${template.name} template preview`} />
              {activeTemplate === template.id && (
                <div className="selected-overlay">
                  <span>Selected</span>
                </div>
              )}
            </div>
            <div className="template-info">
              <h3>{template.name}</h3>
              <p>{template.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TemplateSelector;
