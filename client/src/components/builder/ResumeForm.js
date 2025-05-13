import React, { useState } from 'react';
import { useResume } from '../../context/ResumeContext';
import EnhancedField from './EnhancedField';
import EnhancedAISuggestions from '../ai/EnhancedAISuggestions';
import AISuggestionFeedback from '../feedback/AISuggestionFeedback';
import './ResumeForm.css';

const ResumeForm = () => {
  const { resumeData, updateResumeData, addListItem, updateListItem, removeListItem } = useResume();
  const [activeSection, setActiveSection] = useState('personalInfo');
  const [jobDescription, setJobDescription] = useState('');
  const [showAiSuggestions, setShowAiSuggestions] = useState(false);
  const [aiSuggestionType, setAiSuggestionType] = useState(null);
  const [aiSuggestionField, setAiSuggestionField] = useState(null);
  const [aiSuggestionIndex, setAiSuggestionIndex] = useState(null);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    updateResumeData(name, value);
  };

  const handleNestedInputChange = (section, key, value) => {
    updateResumeData(`${section}.${key}`, value);
  };

  const handleAddExperience = () => {
    addListItem('workExperience', {
      title: '',
      company: '',
      location: '',
      startDate: '',
      endDate: '',
      current: false,
      description: '',
      highlights: []
    });
  };

  const handleUpdateExperience = (index, field, value) => {
    const updatedExperience = { ...resumeData.workExperience[index], [field]: value };
    updateListItem('workExperience', index, updatedExperience);
  };

  const handleAddHighlight = (experienceIndex) => {
    const experience = resumeData.workExperience[experienceIndex];
    const updatedExperience = {
      ...experience,
      highlights: [...experience.highlights, '']
    };
    updateListItem('workExperience', experienceIndex, updatedExperience);
  };

  const handleUpdateHighlight = (experienceIndex, highlightIndex, value) => {
    const experience = resumeData.workExperience[experienceIndex];
    const updatedHighlights = [...experience.highlights];
    updatedHighlights[highlightIndex] = value;
    
    const updatedExperience = {
      ...experience,
      highlights: updatedHighlights
    };
    
    updateListItem('workExperience', experienceIndex, updatedExperience);
  };

  const handleRemoveHighlight = (experienceIndex, highlightIndex) => {
    const experience = resumeData.workExperience[experienceIndex];
    const updatedHighlights = [...experience.highlights];
    updatedHighlights.splice(highlightIndex, 1);
    
    const updatedExperience = {
      ...experience,
      highlights: updatedHighlights
    };
    
    updateListItem('workExperience', experienceIndex, updatedExperience);
  };

  const handleAddEducation = () => {
    addListItem('education', {
      institution: '',
      degree: '',
      field: '',
      location: '',
      startDate: '',
      endDate: '',
      current: false,
      gpa: '',
      achievements: []
    });
  };

  const handleUpdateEducation = (index, field, value) => {
    const updatedEducation = { ...resumeData.education[index], [field]: value };
    updateListItem('education', index, updatedEducation);
  };

  const handleAddSkill = () => {
    addListItem('skills', { name: '', level: 'Intermediate' });
  };

  const handleUpdateSkill = (index, field, value) => {
    const updatedSkill = { ...resumeData.skills[index], [field]: value };
    updateListItem('skills', index, updatedSkill);
  };

  const handleAddCertification = () => {
    addListItem('certifications', {
      name: '',
      issuer: '',
      date: '',
      url: ''
    });
  };

  const handleUpdateCertification = (index, field, value) => {
    const updatedCertification = { ...resumeData.certifications[index], [field]: value };
    updateListItem('certifications', index, updatedCertification);
  };

  const showAiSuggestion = (type, field, index = null) => {
    setAiSuggestionType(type);
    setAiSuggestionField(field);
    setAiSuggestionIndex(index);
    setShowAiSuggestions(true);
  };

  const handleApplySuggestion = (suggestion) => {
    if (aiSuggestionIndex !== null) {
      if (aiSuggestionType === 'highlight') {
        handleUpdateHighlight(aiSuggestionIndex, parseInt(aiSuggestionField), suggestion);
      } else if (aiSuggestionType === 'experience') {
        handleUpdateExperience(aiSuggestionIndex, aiSuggestionField, suggestion);
      } else if (aiSuggestionType === 'education') {
        handleUpdateEducation(aiSuggestionIndex, aiSuggestionField, suggestion);
      } else if (aiSuggestionType === 'skill') {
        handleUpdateSkill(aiSuggestionIndex, aiSuggestionField, suggestion);
      }
    } else {
      if (aiSuggestionType === 'summary') {
        updateResumeData('summary', suggestion);
      }
    }
    
    // Hide the suggestions panel after applying
    setShowAiSuggestions(false);
  };

  return (
    <div className="resume-form">
      <div className="job-description-input">
        <label htmlFor="job-description-input">Optimize for Job Description (Optional)</label>
        <textarea
          id="job-description-input"
          placeholder="Paste a job description here to get personalized AI suggestions..."
          value={jobDescription}
          onChange={(e) => setJobDescription(e.target.value)}
          rows={4}
        />
        <p className="input-help">
          Adding a job description helps our AI tailor suggestions specifically for this position
        </p>
      </div>
      
      <div className="form-navigation">
        <button 
          className={`nav-button ${activeSection === 'personalInfo' ? 'active' : ''}`}
          onClick={() => setActiveSection('personalInfo')}
        >
          Personal Info
        </button>
        <button 
          className={`nav-button ${activeSection === 'summary' ? 'active' : ''}`}
          onClick={() => setActiveSection('summary')}
        >
          Summary
        </button>
        <button 
          className={`nav-button ${activeSection === 'workExperience' ? 'active' : ''}`}
          onClick={() => setActiveSection('workExperience')}
        >
          Experience
        </button>
        <button 
          className={`nav-button ${activeSection === 'education' ? 'active' : ''}`}
          onClick={() => setActiveSection('education')}
        >
          Education
        </button>
        <button 
          className={`nav-button ${activeSection === 'skills' ? 'active' : ''}`}
          onClick={() => setActiveSection('skills')}
        >
          Skills
        </button>
        <button 
          className={`nav-button ${activeSection === 'certifications' ? 'active' : ''}`}
          onClick={() => setActiveSection('certifications')}
        >
          Certifications
        </button>
      </div>
      
      <div className="form-content">
        {/* Personal Information */}
        {activeSection === 'personalInfo' && (
          <div className="form-section">
            <h2>Personal Information</h2>
            
            <div className="form-row">
              <EnhancedField
                label="First Name"
                name="personalInfo.firstName"
                value={resumeData.personalInfo.firstName}
                onChange={(e) => handleNestedInputChange('personalInfo', 'firstName', e.target.value)}
                placeholder="Your first name"
              />
              
              <EnhancedField
                label="Last Name"
                name="personalInfo.lastName"
                value={resumeData.personalInfo.lastName}
                onChange={(e) => handleNestedInputChange('personalInfo', 'lastName', e.target.value)}
                placeholder="Your last name"
              />
            </div>
            
            <div className="form-row">
              <EnhancedField
                label="Email"
                name="personalInfo.email"
                value={resumeData.personalInfo.email}
                onChange={(e) => handleNestedInputChange('personalInfo', 'email', e.target.value)}
                placeholder="your.email@example.com"
              />
              
              <EnhancedField
                label="Phone"
                name="personalInfo.phone"
                value={resumeData.personalInfo.phone}
                onChange={(e) => handleNestedInputChange('personalInfo', 'phone', e.target.value)}
                placeholder="(123) 456-7890"
              />
            </div>
            
            <EnhancedField
              label="Address"
              name="personalInfo.address"
              value={resumeData.personalInfo.address}
              onChange={(e) => handleNestedInputChange('personalInfo', 'address', e.target.value)}
              placeholder="Your street address"
            />
            
            <div className="form-row">
              <EnhancedField
                label="City"
                name="personalInfo.city"
                value={resumeData.personalInfo.city}
                onChange={(e) => handleNestedInputChange('personalInfo', 'city', e.target.value)}
                placeholder="City"
              />
              
              <EnhancedField
                label="State/Province"
                name="personalInfo.state"
                value={resumeData.personalInfo.state}
                onChange={(e) => handleNestedInputChange('personalInfo', 'state', e.target.value)}
                placeholder="State/Province"
              />
              
              <EnhancedField
                label="Zip/Postal Code"
                name="personalInfo.zipCode"
                value={resumeData.personalInfo.zipCode}
                onChange={(e) => handleNestedInputChange('personalInfo', 'zipCode', e.target.value)}
                placeholder="Zip/Postal Code"
              />
            </div>
            
            <div className="form-row">
              <EnhancedField
                label="LinkedIn (Optional)"
                name="personalInfo.linkedIn"
                value={resumeData.personalInfo.linkedIn}
                onChange={(e) => handleNestedInputChange('personalInfo', 'linkedIn', e.target.value)}
                placeholder="linkedin.com/in/yourprofile"
              />
              
              <EnhancedField
                label="Website (Optional)"
                name="personalInfo.website"
                value={resumeData.personalInfo.website}
                onChange={(e) => handleNestedInputChange('personalInfo', 'website', e.target.value)}
                placeholder="yourwebsite.com"
              />
            </div>
          </div>
        )}
        
        {/* Professional Summary */}
        {activeSection === 'summary' && (
          <div className="form-section">
            <div className="section-header">
              <h2>Professional Summary</h2>
              <button 
                className="ai-suggestion-button"
                onClick={() => showAiSuggestion('summary', 'summary')}
              >
                Get AI Suggestions
              </button>
            </div>
            
            <EnhancedField
              label="Summary"
              name="summary"
              value={resumeData.summary}
              onChange={handleInputChange}
              placeholder="Write a compelling professional summary..."
              multiline={true}
            />
            
            {showAiSuggestions && aiSuggestionType === 'summary' && (
              <div className="ai-suggestions-panel">
                <EnhancedAISuggestions
                  type="summary"
                  currentContent={resumeData.summary}
                  jobDescription={jobDescription}
                  onApplySuggestion={handleApplySuggestion}
                />
                
                <AISuggestionFeedback
                  suggestionId="summary-general"
                  suggestionType="summary"
                />
              </div>
            )}
          </div>
        )}
        
        {/* Work Experience */}
        {activeSection === 'workExperience' && (
          <div className="form-section">
            <div className="section-header">
              <h2>Work Experience</h2>
              <button className="add-item-button" onClick={handleAddExperience}>
                Add Experience
              </button>
            </div>
            
            {resumeData.workExperience.map((experience, expIndex) => (
              <div key={expIndex} className="experience-item">
                <div className="item-header">
                  <h3>Experience {expIndex + 1}</h3>
                  <button 
                    className="remove-item-button"
                    onClick={() => removeListItem('workExperience', expIndex)}
                  >
                    Remove
                  </button>
                </div>
                
                <div className="form-row">
                  <EnhancedField
                    label="Job Title"
                    name={`workExperience[${expIndex}].title`}
                    value={experience.title}
                    onChange={(e) => handleUpdateExperience(expIndex, 'title', e.target.value)}
                    placeholder="e.g., Software Engineer"
                  />
                  
                  <EnhancedField
                    label="Company"
                    name={`workExperience[${expIndex}].company`}
                    value={experience.company}
                    onChange={(e) => handleUpdateExperience(expIndex, 'company', e.target.value)}
                    placeholder="e.g., Acme Corporation"
                  />
                </div>
                
                <div className="form-row">
                  <EnhancedField
                    label="Location"
                    name={`workExperience[${expIndex}].location`}
                    value={experience.location}
                    onChange={(e) => handleUpdateExperience(expIndex, 'location', e.target.value)}
                    placeholder="e.g., New York, NY"
                  />
                </div>
                
                <div className="form-row">
                  <EnhancedField
                    label="Start Date"
                    name={`workExperience[${expIndex}].startDate`}
                    value={experience.startDate}
                    onChange={(e) => handleUpdateExperience(expIndex, 'startDate', e.target.value)}
                    placeholder="e.g., June 2020"
                  />
                  
                  <EnhancedField
                    label="End Date"
                    name={`workExperience[${expIndex}].endDate`}
                    value={experience.endDate}
                    onChange={(e) => handleUpdateExperience(expIndex, 'endDate', e.target.value)}
                    placeholder="e.g., Present"
                    disabled={experience.current}
                  />
                  
                  <div className="checkbox-field">
                    <input
                      type="checkbox"
                      id={`current-job-${expIndex}`}
                      checked={experience.current}
                      onChange={(e) => handleUpdateExperience(expIndex, 'current', e.target.checked)}
                    />
                    <label htmlFor={`current-job-${expIndex}`}>Current Job</label>
                  </div>
                </div>
                
                <div className="description-field">
                  <div className="field-header">
                    <label>Job Description</label>
                    <button 
                      className="ai-suggestion-button"
                      onClick={() => showAiSuggestion('experience', 'description', expIndex)}
                    >
                      Get AI Suggestions
                    </button>
                  </div>
                  
                  <textarea
                    name={`workExperience[${expIndex}].description`}
                    value={experience.description}
                    onChange={(e) => handleUpdateExperience(expIndex, 'description', e.target.value)}
                    placeholder="Describe your responsibilities and the scope of your role..."
                    rows={4}
                  />
                </div>
                
                <div className="highlights-section">
                  <div className="section-header">
                    <h4>Key Achievements</h4>
                    <button 
                      className="add-highlight-button"
                      onClick={() => handleAddHighlight(expIndex)}
                    >
                      Add Achievement
                    </button>
                  </div>
                  
                  {experience.highlights.map((highlight, highlightIndex) => (
                    <div key={highlightIndex} className="highlight-item">
                      <div className="highlight-input">
                        <input
                          type="text"
                          value={highlight}
                          onChange={(e) => handleUpdateHighlight(expIndex, highlightIndex, e.target.value)}
                          placeholder="e.g., Increased revenue by 20% through..."
                        />
                        <div className="highlight-actions">
                          <button 
                            className="ai-suggestion-button sm"
                            onClick={() => showAiSuggestion('highlight', highlightIndex.toString(), expIndex)}
                            title="Get AI suggestions"
                          >
                            AI
                          </button>
                          <button 
                            className="remove-highlight-button"
                            onClick={() => handleRemoveHighlight(expIndex, highlightIndex)}
                            title="Remove achievement"
                          >
                            ×
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                {showAiSuggestions && 
                 aiSuggestionType === 'experience' && 
                 aiSuggestionIndex === expIndex && (
                  <div className="ai-suggestions-panel">
                    <EnhancedAISuggestions
                      type="bullet_point"
                      currentContent={experience[aiSuggestionField]}
                      jobDescription={jobDescription}
                      onApplySuggestion={handleApplySuggestion}
                    />
                    
                    <AISuggestionFeedback
                      suggestionId={`experience-${expIndex}-${aiSuggestionField}`}
                      suggestionType="experience_description"
                    />
                  </div>
                )}
                
                {showAiSuggestions && 
                 aiSuggestionType === 'highlight' && 
                 aiSuggestionIndex === expIndex && (
                  <div className="ai-suggestions-panel">
                    <EnhancedAISuggestions
                      type="achievement"
                      currentContent={experience.highlights[parseInt(aiSuggestionField)]}
                      jobDescription={jobDescription}
                      onApplySuggestion={handleApplySuggestion}
                    />
                    
                    <AISuggestionFeedback
                      suggestionId={`highlight-${expIndex}-${aiSuggestionField}`}
                      suggestionType="achievement"
                    />
                  </div>
                )}
              </div>
            ))}
            
            {resumeData.workExperience.length === 0 && (
              <div className="empty-section">
                <p>No work experience added yet.</p>
                <button className="add-item-button" onClick={handleAddExperience}>
                  Add Experience
                </button>
              </div>
            )}
          </div>
        )}
        
        {/* Education */}
        {activeSection === 'education' && (
          <div className="form-section">
            <div className="section-header">
              <h2>Education</h2>
              <button className="add-item-button" onClick={handleAddEducation}>
                Add Education
              </button>
            </div>
            
            {resumeData.education.map((education, eduIndex) => (
              <div key={eduIndex} className="education-item">
                <div className="item-header">
                  <h3>Education {eduIndex + 1}</h3>
                  <button 
                    className="remove-item-button"
                    onClick={() => removeListItem('education', eduIndex)}
                  >
                    Remove
                  </button>
                </div>
                
                <div className="form-row">
                  <EnhancedField
                    label="Institution"
                    name={`education[${eduIndex}].institution`}
                    value={education.institution}
                    onChange={(e) => handleUpdateEducation(eduIndex, 'institution', e.target.value)}
                    placeholder="e.g., University of California, Berkeley"
                  />
                  
                  <EnhancedField
                    label="Location"
                    name={`education[${eduIndex}].location`}
                    value={education.location}
                    onChange={(e) => handleUpdateEducation(eduIndex, 'location', e.target.value)}
                    placeholder="e.g., Berkeley, CA"
                  />
                </div>
                
                <div className="form-row">
                  <EnhancedField
                    label="Degree"
                    name={`education[${eduIndex}].degree`}
                    value={education.degree}
                    onChange={(e) => handleUpdateEducation(eduIndex, 'degree', e.target.value)}
                    placeholder="e.g., Bachelor of Science"
                  />
                  
                  <EnhancedField
                    label="Field of Study"
                    name={`education[${eduIndex}].field`}
                    value={education.field}
                    onChange={(e) => handleUpdateEducation(eduIndex, 'field', e.target.value)}
                    placeholder="e.g., Computer Science"
                  />
                </div>
                
                <div className="form-row">
                  <EnhancedField
                    label="Start Date"
                    name={`education[${eduIndex}].startDate`}
                    value={education.startDate}
                    onChange={(e) => handleUpdateEducation(eduIndex, 'startDate', e.target.value)}
                    placeholder="e.g., September 2018"
                  />
                  
                  <EnhancedField
                    label="End Date"
                    name={`education[${eduIndex}].endDate`}
                    value={education.endDate}
                    onChange={(e) => handleUpdateEducation(eduIndex, 'endDate', e.target.value)}
                    placeholder="e.g., May 2022"
                    disabled={education.current}
                  />
                  
                  <div className="checkbox-field">
                    <input
                      type="checkbox"
                      id={`current-education-${eduIndex}`}
                      checked={education.current}
                      onChange={(e) => handleUpdateEducation(eduIndex, 'current', e.target.checked)}
                    />
                    <label htmlFor={`current-education-${eduIndex}`}>Currently Studying</label>
                  </div>
                </div>
                
                <div className="form-row">
                  <EnhancedField
                    label="GPA (Optional)"
                    name={`education[${eduIndex}].gpa`}
                    value={education.gpa}
                    onChange={(e) => handleUpdateEducation(eduIndex, 'gpa', e.target.value)}
                    placeholder="e.g., 3.8/4.0"
                  />
                </div>
              </div>
            ))}
            
            {resumeData.education.length === 0 && (
              <div className="empty-section">
                <p>No education added yet.</p>
                <button className="add-item-button" onClick={handleAddEducation}>
                  Add Education
                </button>
              </div>
            )}
          </div>
        )}
        
        {/* Skills */}
        {activeSection === 'skills' && (
          <div className="form-section">
            <div className="section-header">
              <h2>Skills</h2>
              <button className="add-item-button" onClick={handleAddSkill}>
                Add Skill
              </button>
            </div>
            
            <div className="skills-grid">
              {resumeData.skills.map((skill, skillIndex) => (
                <div key={skillIndex} className="skill-item">
                  <div className="skill-input">
                    <input
                      type="text"
                      value={skill.name}
                      onChange={(e) => handleUpdateSkill(skillIndex, 'name', e.target.value)}
                      placeholder="e.g., JavaScript"
                    />
                    
                    <select
                      value={skill.level}
                      onChange={(e) => handleUpdateSkill(skillIndex, 'level', e.target.value)}
                    >
                      <option value="Beginner">Beginner</option>
                      <option value="Intermediate">Intermediate</option>
                      <option value="Advanced">Advanced</option>
                      <option value="Expert">Expert</option>
                    </select>
                    
                    <button 
                      className="remove-skill-button"
                      onClick={() => removeListItem('skills', skillIndex)}
                      title="Remove skill"
                    >
                      ×
                    </button>
                  </div>
                </div>
              ))}
              
              <div className="skill-item add-skill" onClick={handleAddSkill}>
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
              
              {showAiSuggestions && aiSuggestionType === 'skill' && (
                <div className="ai-suggestions-panel">
                  <EnhancedAISuggestions
                    type="skill"
                    currentContent=""
                    jobDescription={jobDescription}
                    onApplySuggestion={(skill) => {
                      addListItem('skills', { name: skill, level: 'Intermediate' });
                      setShowAiSuggestions(false);
                    }}
                  />
                  
                  <AISuggestionFeedback
                    suggestionId="skills-recommendation"
                    suggestionType="skill_suggestion"
                  />
                </div>
              )}
            </div>
          </div>
        )}
        
        {/* Certifications */}
        {activeSection === 'certifications' && (
          <div className="form-section">
            <div className="section-header">
              <h2>Certifications & Licenses</h2>
              <button className="add-item-button" onClick={handleAddCertification}>
                Add Certification
              </button>
            </div>
            
            {resumeData.certifications.map((cert, certIndex) => (
              <div key={certIndex} className="certification-item">
                <div className="item-header">
                  <h3>Certification {certIndex + 1}</h3>
                  <button 
                    className="remove-item-button"
                    onClick={() => removeListItem('certifications', certIndex)}
                  >
                    Remove
                  </button>
                </div>
                
                <div className="form-row">
                  <EnhancedField
                    label="Certification Name"
                    name={`certifications[${certIndex}].name`}
                    value={cert.name}
                    onChange={(e) => handleUpdateCertification(certIndex, 'name', e.target.value)}
                    placeholder="e.g., AWS Certified Solutions Architect"
                  />
                </div>
                
                <div className="form-row">
                  <EnhancedField
                    label="Issuing Organization"
                    name={`certifications[${certIndex}].issuer`}
                    value={cert.issuer}
                    onChange={(e) => handleUpdateCertification(certIndex, 'issuer', e.target.value)}
                    placeholder="e.g., Amazon Web Services"
                  />
                  
                  <EnhancedField
                    label="Date Earned"
                    name={`certifications[${certIndex}].date`}
                    value={cert.date}
                    onChange={(e) => handleUpdateCertification(certIndex, 'date', e.target.value)}
                    placeholder="e.g., May 2022"
                  />
                </div>
                
                <EnhancedField
                  label="Credential URL (Optional)"
                  name={`certifications[${certIndex}].url`}
                  value={cert.url}
                  onChange={(e) => handleUpdateCertification(certIndex, 'url', e.target.value)}
                  placeholder="e.g., https://www.credential.net/your-credential"
                />
              </div>
            ))}
            
            {resumeData.certifications.length === 0 && (
              <div className="empty-section">
                <p>No certifications added yet.</p>
                <button className="add-item-button" onClick={handleAddCertification}>
                  Add Certification
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ResumeForm;
