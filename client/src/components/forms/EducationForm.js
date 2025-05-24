import React from 'react';
import { useResume } from '../../context/ResumeContext';
import '../../styles/Forms.css';

const EducationForm = () => {
  const { resumeData, updateResumeData } = useResume();
  const education = resumeData?.education || [];

  const addEducation = () => {
    const newEducation = {
      degree: '',
      fieldOfStudy: '',
      institution: '',
      graduationDate: ''
    };
    
    updateResumeData({
      ...resumeData,
      education: [...education, newEducation]
    });
  };

  const updateEducation = (index, field, value) => {
    const updated = education.map((edu, i) => 
      i === index ? { ...edu, [field]: value } : edu
    );
    
    updateResumeData({
      ...resumeData,
      education: updated
    });
  };

  const removeEducation = (index) => {
    const updated = education.filter((_, i) => i !== index);
    updateResumeData({
      ...resumeData,
      education: updated
    });
  };

  return (
    <div className="form-container">
      <h2>Education</h2>
      
      {education.map((edu, index) => (
        <div key={index} className="education-item">
          <div className="form-group">
            <label>Degree</label>
            <input
              type="text"
              value={edu.degree || ''}
              onChange={(e) => updateEducation(index, 'degree', e.target.value)}
              placeholder="Degree type"
            />
          </div>

          <div className="form-group">
            <label>Field of Study</label>
            <input
              type="text"
              value={edu.fieldOfStudy || ''}
              onChange={(e) => updateEducation(index, 'fieldOfStudy', e.target.value)}
              placeholder="Field of study"
            />
          </div>

          <div className="form-group">
            <label>Institution</label>
            <input
              type="text"
              value={edu.institution || ''}
              onChange={(e) => updateEducation(index, 'institution', e.target.value)}
              placeholder="School/University name"
            />
          </div>

          <div className="form-group">
            <label>Graduation Date</label>
            <input
              type="text"
              value={edu.graduationDate || ''}
              onChange={(e) => updateEducation(index, 'graduationDate', e.target.value)}
              placeholder="Graduation date"
            />
          </div>

          <button
            type="button"
            className="remove-btn"
            onClick={() => removeEducation(index)}
          >
            Remove
          </button>
        </div>
      ))}
      
      <button type="button" className="add-btn" onClick={addEducation}>
        Add Education
      </button>
    </div>
  );
};

export default EducationForm;
