import React from 'react';

const SkillsSection = ({ 
  skills, 
  addSkill, 
  updateSkill, 
  removeSkill, 
  showAiSuggestion 
}) => {
  // Process skills to handle different formats
  const processSkills = () => {
    if (!skills) return [];
    
    // If skills is already an array, return it
    if (Array.isArray(skills)) {
      return skills;
    }
    
    // If skills has technical and soft properties (object format from schema)
    if (skills.technical || skills.soft) {
      // Combine technical and soft skills into a single array
      const technicalSkills = Array.isArray(skills.technical) 
        ? skills.technical.map(skill => typeof skill === 'string' 
            ? { name: skill, level: 'Intermediate' } 
            : skill)
        : [];
      
      const softSkills = Array.isArray(skills.soft)
        ? skills.soft.map(skill => typeof skill === 'string'
            ? { name: skill, level: 'Intermediate' }
            : skill)
        : [];
        
      return [...technicalSkills, ...softSkills];
    }
    
    // Fallback
    return [];
  };
  
  const processedSkills = processSkills();

  return (
    <div className="form-section">
      <div className="section-header">
        <h2>Skills</h2>
        <button className="add-item-button" onClick={addSkill}>
          Add Skill
        </button>
      </div>
      
      <div className="skills-grid">
        {processedSkills.map((skill, skillIndex) => (
          <div key={skillIndex} className="skill-item">
            <div className="skill-input">
              <input
                type="text"
                value={typeof skill === 'string' ? skill : (skill.name || '')}
                onChange={(e) => updateSkill(skillIndex, 'name', e.target.value)}
                placeholder="e.g., JavaScript"
              />
              
              <select
                value={typeof skill === 'string' ? 'Intermediate' : (skill.level || 'Intermediate')}
                onChange={(e) => updateSkill(skillIndex, 'level', e.target.value)}
              >
                <option value="Beginner">Beginner</option>
                <option value="Intermediate">Intermediate</option>
                <option value="Advanced">Advanced</option>
                <option value="Expert">Expert</option>
              </select>
              
              <button 
                className="remove-skill-button"
                onClick={() => removeSkill(skillIndex)}
                title="Remove skill"
              >
                ×
              </button>
            </div>
          </div>
        ))}
        
        <div className="skill-item add-skill" onClick={addSkill}>
          <div className="add-skill-button">+ Add Skill</div>
        </div>
      </div>
      
      <div className="ai-skills-section">
        <button 
          className="ai-skills-button"
          onClick={() => showAiSuggestion('skill', 'name')}
        >
          Get AI Skill Suggestions Based on Job Description
        </button>
      </div>
    </div>
  );
};

export default SkillsSection;
