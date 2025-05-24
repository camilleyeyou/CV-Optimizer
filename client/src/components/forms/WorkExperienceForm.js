import React from 'react';
import { useResume } from '../../context/ResumeContext';
import '../../styles/Forms.css';

const WorkExperienceForm = () => {
  const { resumeData, updateResumeData } = useResume();
  const workExperience = resumeData?.workExperience || [];

  const addExperience = () => {
    const newExperience = {
      title: '',
      company: '',
      startDate: '',
      endDate: '',
      description: ''
    };
    
    updateResumeData({
      ...resumeData,
      workExperience: [...workExperience, newExperience]
    });
  };

  const updateExperience = (index, field, value) => {
    const updated = workExperience.map((exp, i) => 
      i === index ? { ...exp, [field]: value } : exp
    );
    
    updateResumeData({
      ...resumeData,
      workExperience: updated
    });
  };

  const removeExperience = (index) => {
    const updated = workExperience.filter((_, i) => i !== index);
    updateResumeData({
      ...resumeData,
      workExperience: updated
    });
  };

  return (
    <div className="form-container">
      <h2>Work Experience</h2>
      
      {workExperience.map((exp, index) => (
        <div key={index} className="experience-item">
          <div className="form-group">
            <label>Job Title</label>
            <input
              type="text"
              value={exp.title || ''}
              onChange={(e) => updateExperience(index, 'title', e.target.value)}
              placeholder="Job title"
            />
          </div>

          <div className="form-group">
            <label>Company</label>
            <input
              type="text"
              value={exp.company || ''}
              onChange={(e) => updateExperience(index, 'company', e.target.value)}
              placeholder="Company name"
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Start Date</label>
              <input
                type="text"
                value={exp.startDate || ''}
                onChange={(e) => updateExperience(index, 'startDate', e.target.value)}
                placeholder="Start date"
              />
            </div>

            <div className="form-group">
              <label>End Date</label>
              <input
                type="text"
                value={exp.endDate || ''}
                onChange={(e) => updateExperience(index, 'endDate', e.target.value)}
                placeholder="End date or Present"
              />
            </div>
          </div>

          <div className="form-group">
            <label>Description</label>
            <textarea
              rows="3"
              value={exp.description || ''}
              onChange={(e) => updateExperience(index, 'description', e.target.value)}
              placeholder="Describe your responsibilities and achievements..."
            />
          </div>

          <button
            type="button"
            className="remove-btn"
            onClick={() => removeExperience(index)}
          >
            Remove
          </button>
        </div>
      ))}
      
      <button type="button" className="add-btn" onClick={addExperience}>
        Add Experience
      </button>
    </div>
  );
};

export default WorkExperienceForm;
