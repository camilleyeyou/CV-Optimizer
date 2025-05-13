import React, { useState, useEffect } from 'react';
import './SkillMatchAnalytics.css';

const SkillMatchAnalytics = ({ resumeSkills, jobSkills }) => {
  const [matchPercentage, setMatchPercentage] = useState(0);
  const [matchedSkills, setMatchedSkills] = useState([]);
  const [missingSkills, setMissingSkills] = useState([]);
  const [additionalSkills, setAdditionalSkills] = useState([]);

  useEffect(() => {
    if (resumeSkills && jobSkills) {
      analyzeSkills();
    }
  }, [resumeSkills, jobSkills]);

  const analyzeSkills = () => {
    // Convert to lowercase and trim for better matching
    const normalizedResumeSkills = resumeSkills.map(skill => skill.toLowerCase().trim());
    const normalizedJobSkills = jobSkills.map(skill => skill.toLowerCase().trim());

    // Find matched skills
    const matched = normalizedResumeSkills.filter(skill => 
      normalizedJobSkills.some(jobSkill => jobSkill.includes(skill) || skill.includes(jobSkill))
    );
    
    // Find missing skills
    const missing = normalizedJobSkills.filter(skill => 
      !normalizedResumeSkills.some(resumeSkill => resumeSkill.includes(skill) || skill.includes(resumeSkill))
    );
    
    // Find additional skills not in job description
    const additional = normalizedResumeSkills.filter(skill => 
      !normalizedJobSkills.some(jobSkill => jobSkill.includes(skill) || skill.includes(jobSkill))
    );
    
    // Calculate match percentage
    const matchPercent = jobSkills.length > 0 
      ? Math.round((matched.length / jobSkills.length) * 100) 
      : 0;
    
    setMatchPercentage(matchPercent);
    setMatchedSkills(matched);
    setMissingSkills(missing);
    setAdditionalSkills(additional);
  };

  return (
    <div className="skill-match-analytics">
      <div className="analytics-header">
        <h3>Skill Match Analysis</h3>
        <div className="match-percentage-circle" style={{ '--percentage': matchPercentage }}>
          <div className="percentage-text">
            <span className="percentage-value">{matchPercentage}%</span>
            <span className="percentage-label">Match</span>
          </div>
        </div>
      </div>
      
      <div className="skills-breakdown">
        <div className="skills-column matched">
          <h4>Matched Skills ({matchedSkills.length})</h4>
          {matchedSkills.length > 0 ? (
            <ul className="skills-list">
              {matchedSkills.map((skill, index) => (
                <li key={index} className="skill-item matched">
                  {skill}
                </li>
              ))}
            </ul>
          ) : (
            <p className="no-skills-message">No matched skills found.</p>
          )}
        </div>
        
        <div className="skills-column missing">
          <h4>Missing Skills ({missingSkills.length})</h4>
          {missingSkills.length > 0 ? (
            <ul className="skills-list">
              {missingSkills.map((skill, index) => (
                <li key={index} className="skill-item missing">
                  {skill}
                  <button 
                    className="add-skill-button" 
                    title="Add to your resume"
                  >
                    +
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="no-skills-message">No missing skills found.</p>
          )}
        </div>
        
        <div className="skills-column additional">
          <h4>Additional Skills ({additionalSkills.length})</h4>
          {additionalSkills.length > 0 ? (
            <ul className="skills-list">
              {additionalSkills.map((skill, index) => (
                <li key={index} className="skill-item additional">
                  {skill}
                </li>
              ))}
            </ul>
          ) : (
            <p className="no-skills-message">No additional skills found.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default SkillMatchAnalytics;
