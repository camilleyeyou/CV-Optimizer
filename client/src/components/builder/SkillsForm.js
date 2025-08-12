import React, { useState } from 'react';
import { useResume } from '../../context/ResumeContext';
import { FaPlus, FaTimes } from 'react-icons/fa';
import { getAiSuggestions } from '../../services/aiService';

const SkillsForm = () => {
  const { resumeData, updateResumeData } = useResume();
  const [newSkill, setNewSkill] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  
  // Ensure we have a valid skills structure
  const ensureSkillsStructure = () => {
    if (!resumeData?.skills || typeof resumeData.skills !== 'object') {
      return { technical: [], soft: [] };
    }
    
    return {
      technical: Array.isArray(resumeData.skills.technical) ? resumeData.skills.technical : [],
      soft: Array.isArray(resumeData.skills.soft) ? resumeData.skills.soft : []
    };
  };

  // Helper to get a flat list of all skills for display
  const getAllSkills = () => {
    const skills = ensureSkillsStructure();
    
    // Extract skill names from technical skills (which might be objects)
    const technicalSkillNames = skills.technical.map(skill => 
      typeof skill === 'string' ? skill : skill.name
    );
    
    // Combine with soft skills (ensuring they're strings too)
    const softSkillNames = skills.soft.map(skill => 
      typeof skill === 'string' ? skill : skill.name
    );
    
    return [...technicalSkillNames, ...softSkillNames];
  };
  
  const handleAddSkill = (e) => {
    e.preventDefault();
    
    if (newSkill.trim()) {
      addSkill(newSkill.trim());
      setNewSkill('');
    }
  };

  const addSkill = (skillName) => {
    // Get existing skills structure or create a new one
    const skills = ensureSkillsStructure();
    
    // Create a new technical skill object
    const newSkillObj = { name: skillName, level: 'Intermediate' };
    
    // Add to technical skills array
    const updatedTechnical = [...skills.technical, newSkillObj];
    
    // ✅ FIXED: Pass complete resume object to updateResumeData
    updateResumeData({
      ...resumeData,
      skills: {
        ...skills,
        technical: updatedTechnical
      }
    });
  };
  
  const removeSkill = (skillToRemove) => {
    const skills = ensureSkillsStructure();
    
    // Filter out the skill from technical skills
    const updatedTechnical = skills.technical.filter(skill => 
      (typeof skill === 'string' && skill !== skillToRemove) || 
      (typeof skill === 'object' && skill.name !== skillToRemove)
    );
    
    // Filter out the skill from soft skills
    const updatedSoft = skills.soft.filter(skill => 
      (typeof skill === 'string' && skill !== skillToRemove) || 
      (typeof skill === 'object' && skill.name !== skillToRemove)
    );
    
    // ✅ FIXED: Pass complete resume object to updateResumeData
    updateResumeData({
      ...resumeData,
      skills: {
        technical: updatedTechnical,
        soft: updatedSoft
      }
    });
  };
  
  const updateSkills = (newSkills) => {
    // Convert simple strings to skill objects
    const updatedSkills = newSkills.map(skill => {
      return typeof skill === 'string' 
        ? { name: skill, level: 'Intermediate' }
        : skill;
    });
    
    // ✅ FIXED: Pass complete resume object to updateResumeData
    updateResumeData({
      ...resumeData,
      skills: {
        ...ensureSkillsStructure(),
        technical: updatedSkills
      }
    });
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
        workExperience: resumeData?.workExperience || [],
        summary: resumeData?.summary || '',
        personalInfo: resumeData?.personalInfo || {}
      });
      
      setSuggestions(result || []);
    } catch (error) {
      console.error('Error generating skills:', error);
      alert('Error generating skills. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const addSuggestedSkill = (skill) => {
    const allSkills = getAllSkills();
    
    if (!allSkills.includes(skill)) {
      addSkill(skill);
      
      // Remove from suggestions
      setSuggestions(prevSuggestions => 
        prevSuggestions.filter(s => s !== skill)
      );
    }
  };
  
  const addAllSuggestions = () => {
    const allSkills = getAllSkills();
    const newSkills = [...allSkills];
    
    suggestions.forEach(skill => {
      if (!newSkills.includes(skill)) {
        newSkills.push(skill);
      }
    });
    
    updateSkills(newSkills);
    setSuggestions([]);
  };

  // Get all skills for display
  const allSkills = getAllSkills();
  
  // ✅ SAFETY CHECK: Don't render if resumeData is invalid
  if (!resumeData || typeof resumeData !== 'object') {
    return (
      <div className="form-section">
        <div className="loading-message">Loading skills form...</div>
      </div>
    );
  }
  
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
        {allSkills.length > 0 ? (
          <>
            <h4>Your Skills</h4>
            <div className="skills-tags">
              {allSkills.map((skill, index) => (
                <div key={index} className="skill-tag">
                  <span>{skill}</span>
                  <button 
                    className="btn-icon" 
                    onClick={() => removeSkill(skill)}
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
                className={`skill-tag suggestion ${allSkills.includes(skill) ? 'disabled' : ''}`}
                onClick={() => addSuggestedSkill(skill)}
              >
                <span>{skill}</span>
                {!allSkills.includes(skill) && (
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