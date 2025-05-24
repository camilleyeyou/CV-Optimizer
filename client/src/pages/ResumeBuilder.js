import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useResume } from '../context/ResumeContext';
import PersonalInfoForm from '../components/forms/PersonalInfoForm';
import SummaryForm from '../components/forms/SummaryForm';
import WorkExperienceForm from '../components/forms/WorkExperienceForm';
import EducationForm from '../components/forms/EducationForm';
import SkillsForm from '../components/forms/SkillsForm';
import ModernTemplate from '../components/templates/ModernTemplate';
import ClassicTemplate from '../components/templates/ClassicTemplate';
import MinimalTemplate from '../components/templates/MinimalTemplate';
import CreativeTemplate from '../components/templates/CreativeTemplate';
import { generatePDF, printResume } from '../utils/pdfGenerator';
import { FaUser, FaFileAlt, FaBriefcase, FaGraduationCap, FaCog, FaEye, FaDownload, FaPrint, FaSave } from 'react-icons/fa';
import '../styles/ResumeBuilder.css';

const ResumeBuilder = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { resumeData, setResumeData, saveResume, getResume } = useResume();
  const [activeSection, setActiveSection] = useState('personal');
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  useEffect(() => {
    if (id) {
      const resume = getResume(id);
      if (resume) {
        setResumeData(resume);
      } else {
        // Resume not found, redirect to templates
        navigate('/templates');
      }
    }
  }, [id, getResume, setResumeData, navigate]);

  const sections = [
    { id: 'personal', label: 'Personal Info', icon: FaUser },
    { id: 'summary', label: 'Summary', icon: FaFileAlt },
    { id: 'experience', label: 'Experience', icon: FaBriefcase },
    { id: 'education', label: 'Education', icon: FaGraduationCap },
    { id: 'skills', label: 'Skills', icon: FaCog },
  ];

  const templates = {
    modern: ModernTemplate,
    classic: ClassicTemplate,
    minimal: MinimalTemplate,
    creative: CreativeTemplate,
  };

  const TemplateComponent = templates[resumeData?.template || 'modern'];

  const handleSave = async () => {
    if (!resumeData?.id) return;
    
    setIsSaving(true);
    try {
      await saveResume(resumeData.id, resumeData);
      // You could add a success toast here
    } catch (error) {
      console.error('Error saving resume:', error);
      // You could add an error toast here
    } finally {
      setIsSaving(false);
    }
  };

  const handleDownloadPDF = async () => {
    setIsGeneratingPDF(true);
    try {
      const fileName = `${resumeData?.personalInfo?.firstName || 'Resume'}_${resumeData?.personalInfo?.lastName || 'Resume'}.pdf`;
      const result = await generatePDF('resume-preview', fileName);
      
      if (!result.success) {
        alert(result.message);
      }
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Failed to generate PDF. Please try again.');
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const handlePrint = () => {
    printResume();
  };

  const renderForm = () => {
    switch (activeSection) {
      case 'personal':
        return <PersonalInfoForm />;
      case 'summary':
        return <SummaryForm />;
      case 'experience':
        return <WorkExperienceForm />;
      case 'education':
        return <EducationForm />;
      case 'skills':
        return <SkillsForm />;
      default:
        return <PersonalInfoForm />;
    }
  };

  if (!resumeData) {
    return (
      <div className="loading-container">
        <div className="loading-spinner">Loading...</div>
      </div>
    );
  }

  return (
    <div className="resume-builder">
      <div className="builder-header">
        <h1>Resume Builder</h1>
        <div className="header-actions">
          <button
            className="action-btn save-btn"
            onClick={handleSave}
            disabled={isSaving}
          >
            <FaSave />
            {isSaving ? 'Saving...' : 'Save'}
          </button>
          <button
            className="action-btn preview-btn"
            onClick={() => setIsPreviewMode(!isPreviewMode)}
          >
            <FaEye />
            {isPreviewMode ? 'Edit' : 'Preview'}
          </button>
          <button
            className="action-btn download-btn"
            onClick={handleDownloadPDF}
            disabled={isGeneratingPDF}
          >
            <FaDownload />
            {isGeneratingPDF ? 'Generating...' : 'Download PDF'}
          </button>
          <button
            className="action-btn print-btn"
            onClick={handlePrint}
          >
            <FaPrint />
            Print
          </button>
        </div>
      </div>

      <div className="builder-content">
        {!isPreviewMode && (
          <div className="builder-sidebar">
            <nav className="section-nav">
              {sections.map((section) => {
                const IconComponent = section.icon;
                return (
                  <button
                    key={section.id}
                    className={`nav-item ${activeSection === section.id ? 'active' : ''}`}
                    onClick={() => setActiveSection(section.id)}
                  >
                    <IconComponent className="nav-icon" />
                    <span>{section.label}</span>
                  </button>
                );
              })}
            </nav>

            <div className="form-section">
              {renderForm()}
            </div>
          </div>
        )}

        <div className={`preview-section ${isPreviewMode ? 'full-width' : ''}`}>
          <div id="resume-preview" className="resume-preview">
            {TemplateComponent && <TemplateComponent />}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResumeBuilder;
