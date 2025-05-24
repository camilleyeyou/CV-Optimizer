import React, { useState } from 'react';
import { useResume } from '../../context/ResumeContext';
import '../../styles/Forms.css';

const SkillsForm = () => {
  const { resumeData, updateResumeData } = useResume();
  const skills = resumeData?.skills || [];
  const [newSkill, setNewSkill] = useState('');

  const addSkill = () => {
    if (newSkill.trim()) {
      updateResumeData({
        ...resumeData,
        skills: [...skills, newSkill.trim()]
      });
      setNewSkill('');
    }
  };

  const removeSkill = (index) => {
    const updated = skills.filter((_, i) => i !== index);
    updateResumeData({
      ...resumeData,
      skills: updated
    });
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addSkill();
    }
  };

  return (
    <div className="form-container">
      <h2>Skills</h2>
      
      <div className="form-group">
        <label>Add Skill</label>
        <div className="skill-input">
          <input
            type="text"
            value={newSkill}
            onChange={(e) => setNewSkill(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Enter a skill and press Enter"
          />
          <button type="button" onClick={addSkill}>Add</button>
        </div>
      </div>

      <div className="skills-list">
        {skills.map((skill, index) => (
          <div key={index} className="skill-tag">
            <span>{typeof skill === 'object' ? skill.name : skill}</span>
            <button
              type="button"
              className="remove-skill"
              onClick={() => removeSkill(index)}
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SkillsForm;
