import React from 'react';
import { useResume } from '../../context/ResumeContext';
import PersonalInfoForm from './PersonalInfoForm';
import SummaryForm from './SummaryForm';
import WorkExperienceForm from './WorkExperienceForm';
import EducationForm from './EducationForm';
import SkillsForm from './SkillsForm';

const BuilderForm = () => {
  const { activeSection } = useResume();
  
  // Render the appropriate form section based on activeSection
  const renderFormSection = () => {
    switch (activeSection) {
      case 'personalInfo':
        return <PersonalInfoForm />;
      case 'summary':
        return <SummaryForm />;
      case 'workExperience':
        return <WorkExperienceForm />;
      case 'education':
        return <EducationForm />;
      case 'skills':
        return <SkillsForm />;
      default:
        return <PersonalInfoForm />;
    }
  };

  return (
    <div className="builder-form">
      <div className="form-container">
        <h2>{getSectionTitle(activeSection)}</h2>
        {renderFormSection()}
      </div>
    </div>
  );
};

// Helper function to get section titles
const getSectionTitle = (section) => {
  switch (section) {
    case 'personalInfo':
      return 'Personal Information';
    case 'summary':
      return 'Professional Summary';
    case 'workExperience':
      return 'Work Experience';
    case 'education':
      return 'Education';
    case 'skills':
      return 'Skills';
    default:
      return 'Personal Information';
  }
};

export default BuilderForm;
