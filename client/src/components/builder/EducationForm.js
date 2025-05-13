import React, { useState } from 'react';
import { useResume } from '../../context/ResumeContext';
import { FaPlus, FaTrash } from 'react-icons/fa';

const EducationForm = () => {
  const { 
    resumeData, 
    addEducation, 
    updateEducation, 
    removeEducation 
  } = useResume();
  
  const [activeItemId, setActiveItemId] = useState(
    resumeData.education.length > 0 ? resumeData.education[0].id : null
  );
  
  const handleChange = (id, field, value) => {
    updateEducation(id, { [field]: value });
  };
  
  const handleAddItem = () => {
    const newId = addEducation();
    setActiveItemId(newId);
  };
  
  const handleRemoveItem = (id) => {
    if (resumeData.education.length <= 1) {
      alert('You need at least one education entry.');
      return;
    }
    
    removeEducation(id);
    
    // Set the first item as active if the active item was removed
    if (activeItemId === id && resumeData.education.length > 0) {
      const remainingIds = resumeData.education
        .filter(edu => edu.id !== id)
        .map(edu => edu.id);
      
      if (remainingIds.length > 0) {
        setActiveItemId(remainingIds[0]);
      }
    }
  };
  
  return (
    <div className="form-section">
      <div className="education-list">
        {resumeData.education.map((education) => (
          <div 
            key={education.id} 
            className={`education-item ${activeItemId === education.id ? 'active' : ''}`}
            onClick={() => setActiveItemId(education.id)}
          >
            <div className="education-item-header">
              <div className="education-title">
                <h4>
                  {education.institution || 'New Education'} 
                  {education.degree && ` - ${education.degree}`}
                </h4>
              </div>
              <div className="education-actions">
                <button 
                  className="btn-icon btn-danger" 
                  onClick={() => handleRemoveItem(education.id)}
                >
                  <FaTrash />
                </button>
              </div>
            </div>
            
            {activeItemId === education.id && (
              <div className="education-form">
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor={`institution-${education.id}`}>Institution *</label>
                    <input
                      type="text"
                      id={`institution-${education.id}`}
                      value={education.institution}
                      onChange={(e) => handleChange(education.id, 'institution', e.target.value)}
                      placeholder="University/College name"
                      required
                    />
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor={`location-${education.id}`}>Location</label>
                    <input
                      type="text"
                      id={`location-${education.id}`}
                      value={education.location}
                      onChange={(e) => handleChange(education.id, 'location', e.target.value)}
                      placeholder="City, State/Province, Country"
                    />
                  </div>
                </div>
                
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor={`degree-${education.id}`}>Degree *</label>
                    <input
                      type="text"
                      id={`degree-${education.id}`}
                      value={education.degree}
                      onChange={(e) => handleChange(education.id, 'degree', e.target.value)}
                      placeholder="e.g., Bachelor of Science"
                      required
                    />
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor={`fieldOfStudy-${education.id}`}>Field of Study</label>
                    <input
                      type="text"
                      id={`fieldOfStudy-${education.id}`}
                      value={education.fieldOfStudy}
                      onChange={(e) => handleChange(education.id, 'fieldOfStudy', e.target.value)}
                      placeholder="e.g., Computer Science"
                    />
                  </div>
                </div>
                
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor={`startDate-${education.id}`}>Start Date *</label>
                    <input
                      type="text"
                      id={`startDate-${education.id}`}
                      value={education.startDate}
                      onChange={(e) => handleChange(education.id, 'startDate', e.target.value)}
                      placeholder="e.g., Sept 2018"
                      required
                    />
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor={`endDate-${education.id}`}>End Date</label>
                    <input
                      type="text"
                      id={`endDate-${education.id}`}
                      value={education.endDate}
                      onChange={(e) => handleChange(education.id, 'endDate', e.target.value)}
                      placeholder="e.g., May 2022 (or 'Expected May 2024')"
                    />
                  </div>
                </div>
                
                <div className="form-group">
                  <label htmlFor={`description-${education.id}`}>Description</label>
                  <textarea
                    id={`description-${education.id}`}
                    value={education.description}
                    onChange={(e) => handleChange(education.id, 'description', e.target.value)}
                    placeholder="Include relevant coursework, honors, awards, activities, or GPA if impressive"
                    rows={4}
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
          <FaPlus /> Add Another Education
        </button>
      </div>
      
      <div className="form-hint">
        <h4>Tips for Education Section</h4>
        <ul>
          <li>List your education in reverse chronological order (most recent first)</li>
          <li>If you're a recent graduate, place education above work experience</li>
          <li>Include your GPA if it's 3.5/4.0 or higher (or equivalent)</li>
          <li>For recent graduates, include relevant coursework that relates to your target jobs</li>
        </ul>
      </div>
    </div>
  );
};

export default EducationForm;
