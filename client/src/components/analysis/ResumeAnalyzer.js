import React from 'react';
import { useResume } from '../../context/ResumeContext';
import './ResumeAnalyzer.css';

const ResumeAnalyzer = ({ jobDescription }) => {
  const { resumeData } = useResume();
  
  // Helper function to safely get skills as an array
  const getSkillsArray = () => {
    // If skills is undefined or null, return empty array
    if (!resumeData.skills) return [];
    
    // If skills is already an array, return it
    if (Array.isArray(resumeData.skills)) {
      return resumeData.skills;
    }
    
    // If skills is an object with technical and soft properties
    // Convert it to a flat array of skill objects
    const technicalSkills = Array.isArray(resumeData.skills.technical) ? 
      resumeData.skills.technical : [];
    const softSkills = Array.isArray(resumeData.skills.soft) ?
      resumeData.skills.soft : [];
    
    // Create a flat array of all skills
    return [...technicalSkills, ...softSkills];
  };

  // Get skills as an array for rendering
  const skillsArray = getSkillsArray();
  
  // Extract skills names for analysis
  const skillNames = skillsArray.map(skill => 
    typeof skill === 'object' ? (skill.name || '') : skill
  );
  
  return (
    <div className="resume-analyzer">
      <h2>Resume Analysis</h2>
      
      <div className="analysis-container">
        <div className="analysis-section">
          <h3>Skills Analysis</h3>
          <div className="analysis-content">
            {skillNames.length > 0 ? (
              <ul>
                {skillNames.map((skill, index) => (
                  <li key={index}>{skill}</li>
                ))}
              </ul>
            ) : (
              <p>No skills found. Add skills to your resume for analysis.</p>
            )}
          </div>
        </div>
        
        <div className="analysis-section">
          <h3>Experience Analysis</h3>
          <div className="analysis-content">
            {resumeData.workExperience && resumeData.workExperience.length > 0 ? (
              <ul>
                {resumeData.workExperience.map((exp, index) => (
                  <li key={index}>
                    {exp.title} at {exp.company} ({exp.startDate} - {exp.endDate || 'Present'})
                  </li>
                ))}
              </ul>
            ) : (
              <p>No work experience found. Add work experience to your resume for analysis.</p>
            )}
          </div>
        </div>
        
        <div className="analysis-section">
          <h3>Education Analysis</h3>
          <div className="analysis-content">
            {resumeData.education && resumeData.education.length > 0 ? (
              <ul>
                {resumeData.education.map((edu, index) => (
                  <li key={index}>
                    {edu.degree} in {edu.fieldOfStudy} from {edu.institution}
                  </li>
                ))}
              </ul>
            ) : (
              <p>No education found. Add education to your resume for analysis.</p>
            )}
          </div>
        </div>
        
        <div className="analysis-section">
          <h3>Content Analysis</h3>
          <div className="analysis-content">
            <p>Resume sections completed: {Object.keys(resumeData).filter(key => 
              resumeData[key] && 
              (typeof resumeData[key] !== 'object' || 
               (Array.isArray(resumeData[key]) && resumeData[key].length > 0) ||
               Object.keys(resumeData[key]).length > 0)
            ).length} / {Object.keys(resumeData).length}</p>
          </div>
        </div>
        
        {jobDescription && (
          <div className="analysis-section">
            <h3>Keyword Analysis</h3>
            <div className="analysis-content">
              <p>A job description has been provided. Your resume will be analyzed against these keywords.</p>
              {/* Simple keyword matching logic */}
              {jobDescription.split(/\s+/).filter(word => 
                word.length > 5 && 
                JSON.stringify(resumeData).toLowerCase().includes(word.toLowerCase())
              ).length > 0 ? (
                <p>Some keywords from the job description appear in your resume!</p>
              ) : (
                <p>Consider adding more relevant keywords from the job description to your resume.</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ResumeAnalyzer;
