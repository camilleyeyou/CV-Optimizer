import React, { useState } from 'react';
import { useResume } from '../../context/ResumeContext';
import { FaPlus, FaTrash } from 'react-icons/fa';

const WorkExperienceForm = () => {
  const { 
    resumeData, 
    addWorkExperience, 
    updateWorkExperience, 
    removeWorkExperience 
  } = useResume();
  
  const [activeItemId, setActiveItemId] = useState(
    resumeData.workExperience.length > 0 ? resumeData.workExperience[0].id : null
  );
  
  const handleChange = (id, field, value) => {
    updateWorkExperience(id, { [field]: value });
  };
  
  const handleAddItem = () => {
    const newId = addWorkExperience();
    setActiveItemId(newId);
  };
  
  const handleRemoveItem = (id) => {
    if (resumeData.workExperience.length <= 1) {
      alert('You need at least one work experience entry.');
      return;
    }
    
    removeWorkExperience(id);
    
    // Set the first item as active if the active item was removed
    if (activeItemId === id && resumeData.workExperience.length > 0) {
      const remainingIds = resumeData.workExperience
        .filter(exp => exp.id !== id)
        .map(exp => exp.id);
      
      if (remainingIds.length > 0) {
        setActiveItemId(remainingIds[0]);
      }
    }
  };
  
  const handleToggleCurrent = (id, current) => {
    updateWorkExperience(id, { current });
    
    // Clear end date if current job
    if (current) {
      updateWorkExperience(id, { endDate: '' });
    }
  };
  
  return (
    <div className="form-section">
      <div className="experience-list">
        {resumeData.workExperience.map((experience) => (
          <div 
            key={experience.id} 
            className={`experience-item ${activeItemId === experience.id ? 'active' : ''}`}
            onClick={() => setActiveItemId(experience.id)}
          >
            <div className="experience-item-header">
              <div className="experience-title">
                <h4>
                  {experience.company || 'New Experience'} 
                  {experience.position && ` - ${experience.position}`}
                </h4>
              </div>
              <div className="experience-actions">
                <button 
                  className="btn-icon btn-danger" 
                  onClick={() => handleRemoveItem(experience.id)}
                >
                  <FaTrash />
                </button>
              </div>
            </div>
            
            {activeItemId === experience.id && (
              <div className="experience-form">
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor={`company-${experience.id}`}>Company *</label>
                    <input
                      type="text"
                      id={`company-${experience.id}`}
                      value={experience.company}
                      onChange={(e) => handleChange(experience.id, 'company', e.target.value)}
                      placeholder="Company name"
                      required
                    />
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor={`position-${experience.id}`}>Position *</label>
                    <input
                      type="text"
                      id={`position-${experience.id}`}
                      value={experience.position}
                      onChange={(e) => handleChange(experience.id, 'position', e.target.value)}
                      placeholder="Job title"
                      required
                    />
                  </div>
                </div>
                
                <div className="form-group">
                  <label htmlFor={`location-${experience.id}`}>Location</label>
                  <input
                    type="text"
                    id={`location-${experience.id}`}
                    value={experience.location}
                    onChange={(e) => handleChange(experience.id, 'location', e.target.value)}
                    placeholder="City, State/Province, Country"
                  />
                </div>
                
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor={`startDate-${experience.id}`}>Start Date *</label>
                    <input
                      type="text"
                      id={`startDate-${experience.id}`}
                      value={experience.startDate}
                      onChange={(e) => handleChange(experience.id, 'startDate', e.target.value)}
                      placeholder="e.g., May 2020"
                      required
                    />
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor={`endDate-${experience.id}`}>End Date</label>
                    <input
                      type="text"
                      id={`endDate-${experience.id}`}
                      value={experience.endDate}
                      onChange={(e) => handleChange(experience.id, 'endDate', e.target.value)}
                      placeholder="e.g., June 2022"
                      disabled={experience.current}
                    />
                    
                    <div className="current-job-checkbox">
                      <input
                        type="checkbox"
                        id={`current-${experience.id}`}
                        checked={experience.current}
                        onChange={(e) => handleToggleCurrent(experience.id, e.target.checked)}
                      />
                      <label htmlFor={`current-${experience.id}`}>Current Job</label>
                    </div>
                  </div>
                </div>
                
                <div className="form-group">
                  <label htmlFor={`description-${experience.id}`}>Description *</label>
                  <textarea
                    id={`description-${experience.id}`}
                    value={experience.description}
                    onChange={(e) => handleChange(experience.id, 'description', e.target.value)}
                    placeholder="Describe your responsibilities and achievements. Use bullet points starting with action verbs."
                    rows={6}
                    required
                  />
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
      
      <div className="form-actions">
        <button 
          className="btn btn-secondary btn-block"
          onClick={handleAddItem}
        >
          <FaPlus /> Add Another Position
        </button>
      </div>
      
      <div className="form-hint">
        <h4>Tips for Work Experience</h4>
        <ul>
          <li>List your work experience in reverse chronological order (most recent first)</li>
          <li>Use action verbs to start each bullet point (e.g., Managed, Developed, Increased)</li>
          <li>Include quantifiable achievements when possible (numbers, percentages, etc.)</li>
          <li>Focus on responsibilities and achievements most relevant to your target jobs</li>
        </ul>
      </div>
    </div>
  );
};

export default WorkExperienceForm;
