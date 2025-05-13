import React from 'react';
import { useResume } from '../../context/ResumeContext';
import { FaUser, FaFileAlt, FaBriefcase, FaGraduationCap, FaTools } from 'react-icons/fa';

const BuilderSidebar = () => {
  const { activeSection, setActiveSection, resumeData } = useResume();
  
  // Calculate completion percentage for each section
  const getCompletionPercentage = (section) => {
    // Add safety checks to prevent errors
    if (!resumeData) return 0;
    
    switch (section) {
      case 'personalInfo': {
        if (!resumeData.personalInfo) return 0;
        const totalFields = Object.keys(resumeData.personalInfo).length;
        const filledFields = Object.values(resumeData.personalInfo).filter(v => v && v.trim()).length;
        return Math.round((filledFields / totalFields) * 100);
      }
      case 'summary':
        return resumeData.summary?.trim() ? 100 : 0;
      case 'workExperience': {
        if (!resumeData.workExperience || resumeData.workExperience.length === 0) return 0;
        
        const requiredFields = ['company', 'position', 'startDate', 'description'];
        let completedFields = 0;
        let totalFields = 0;
        
        resumeData.workExperience.forEach(exp => {
          requiredFields.forEach(field => {
            totalFields++;
            if (exp[field] && exp[field].trim()) {
              completedFields++;
            }
          });
        });
        
        return Math.round((completedFields / totalFields) * 100);
      }
      case 'education': {
        if (!resumeData.education || resumeData.education.length === 0) return 0;
        
        const requiredFields = ['institution', 'degree', 'startDate'];
        let completedFields = 0;
        let totalFields = 0;
        
        resumeData.education.forEach(edu => {
          requiredFields.forEach(field => {
            totalFields++;
            if (edu[field] && edu[field].trim()) {
              completedFields++;
            }
          });
        });
        
        return Math.round((completedFields / totalFields) * 100);
      }
      case 'skills':
        return resumeData.skills && resumeData.skills.length > 0 ? 100 : 0;
      default:
        return 0;
    }
  };
  
  // Define the navigation items
  const navItems = [
    { id: 'personalInfo', label: 'Personal Info', icon: <FaUser /> },
    { id: 'summary', label: 'Summary', icon: <FaFileAlt /> },
    { id: 'workExperience', label: 'Work Experience', icon: <FaBriefcase /> },
    { id: 'education', label: 'Education', icon: <FaGraduationCap /> },
    { id: 'skills', label: 'Skills', icon: <FaTools /> }
  ];
  
  return (
    <div className="builder-sidebar">
      <div className="sidebar-header">
        <h3>Build Your Resume</h3>
        <p>Complete all sections</p>
      </div>
      
      <nav className="sidebar-nav">
        <ul>
          {navItems.map(item => (
            <li 
              key={item.id}
              className={activeSection === item.id ? 'active' : ''}
              onClick={() => setActiveSection(item.id)}
            >
              <div className="nav-item">
                <div className="nav-icon">{item.icon}</div>
                <span>{item.label}</span>
              </div>
              <div className="progress-container">
                <div 
                  className="progress-bar" 
                  style={{ width: `${getCompletionPercentage(item.id)}%` }}
                ></div>
              </div>
            </li>
          ))}
        </ul>
      </nav>
      
      <div className="sidebar-footer">
        <p>Overall Completion</p>
        <div className="progress-container">
          <div 
            className="progress-bar" 
            style={{ 
              width: `${navItems.reduce((acc, item) => 
                acc + getCompletionPercentage(item.id), 0) / navItems.length}%` 
            }}
          ></div>
        </div>
      </div>
    </div>
  );
};

export default BuilderSidebar;
