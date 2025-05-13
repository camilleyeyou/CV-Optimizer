import React, { useState } from 'react';
import { useResume } from '../../context/ResumeContext';
import { FaPlus, FaTimes } from 'react-icons/fa';
import { getAiSuggestions } from '../../services/aiService';

const SkillsForm = () => {
  const { resumeData, addSkill, removeSkill, updateSkills } = useResume();
  const [newSkill, setNewSkill] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  
  const handleAddSkill = (e) => {
    e.preventDefault();
    
    if (newSkill.trim()) {
      addSkill(newSkill.trim());
      setNewSkill('');
    }
  };
  
  const handleRemoveSkill = (skill) => {
    removeSkill(skill);
  };
  
  const handleKeyDown = (e) => {
    // Add skill when Enter is pressed
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddSkill(e);
    }
  };
  
  const generateSkills = async () => {
    try {
      setIsLoading(true);
      
      // Get suggestions from the AI service based on work experience and summary
      const result = await getAiSuggestions('skills', {
        workExperience: resumeData.workExperience,
        summary: resumeData.summary,
        personalInfo: resumeData.personalInfo
      });
      
      setSuggestions(result);
    } catch (error) {
      console.error('Error generating skills:', error);
      alert('Error generating skills. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const addSuggestedSkill = (skill) => {
    if (!resumeData.skills.includes(skill)) {
      addSkill(skill);
      
      // Remove from suggestions
      setSuggestions(prevSuggestions => 
        prevSuggestions.filter(s => s !== skill)
      );
    }
  };
  
  const addAllSuggestions = () => {
    const newSkills = [...resumeData.skills];
    
    suggestions.forEach(skill => {
      if (!newSkills.includes(skill)) {
        newSkills.push(skill);
      }
    });
    
    updateSkills(newSkills);
    setSuggestions([]);
  };
  
  return (
    <div className="form-section">
      <div className="form-group">
        <label htmlFor="skills">Add Skills</label>
        <div className="skills-input-container">
          <input
            type="text"
            id="skills"
            value={newSkill}
            onChange={(e) => setNewSkill(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a skill and press Enter"
          />
          <button 
            className="btn btn-primary"
            onClick={handleAddSkill}
          >
            <FaPlus />
          </button>
        </div>
      </div>
      
      <div className="skills-container">
        {resumeData.skills.length > 0 ? (
          <>
            <h4>Your Skills</h4>
            <div className="skills-tags">
              {resumeData.skills.map((skill, index) => (
                <div key={index} className="skill-tag">
                  <span>{skill}</span>
                  <button 
                    className="btn-icon" 
                    onClick={() => handleRemoveSkill(skill)}
                  >
                    <FaTimes />
                  </button>
                </div>
              ))}
            </div>
          </>
        ) : (
          <p className="no-skills">No skills added yet. Start typing to add skills.</p>
        )}
      </div>
      
      <div className="form-actions">
        <button 
          className="btn btn-secondary"
          onClick={generateSkills}
          disabled={isLoading}
        >
          {isLoading ? 'Generating...' : 'Suggest Skills Based on My Profile'}
        </button>
      </div>
      
      {suggestions.length > 0 && (
        <div className="suggestions-container">
          <div className="suggestions-header">
            <h4>AI-Suggested Skills</h4>
            <button 
              className="btn btn-sm btn-outline"
              onClick={addAllSuggestions}
            >
              Add All
            </button>
          </div>
          
          <div className="skills-tags suggestions-tags">
            {suggestions.map((skill, index) => (
              <div 
                key={index} 
                className={`skill-tag suggestion ${resumeData.skills.includes(skill) ? 'disabled' : ''}`}
                onClick={() => addSuggestedSkill(skill)}
              >
                <span>{skill}</span>
                {!resumeData.skills.includes(skill) && (
                  <button className="btn-icon">
                    <FaPlus />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
      
      <div className="form-hint">
        <h4>Tips for Skills Section</h4>
        <ul>
          <li>Include a mix of technical (hard) skills and soft skills</li>
          <li>Prioritize skills mentioned in job descriptions for your target roles</li>
          <li>Be specific with technical skills (e.g., "React.js" instead of just "JavaScript")</li>
          <li>Include levels of proficiency if relevant (e.g., "Fluent in Spanish")</li>
        </ul>
      </div>
    </div>
  );
};

export default SkillsForm;
