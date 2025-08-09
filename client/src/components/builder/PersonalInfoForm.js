import React from 'react';
import { useResume } from '../../context/ResumeContext';

const PersonalInfoForm = () => {
  const { resumeData, updatePersonalInfo } = useResume();
  const { personalInfo } = resumeData;
  
  // 🔧 MINIMAL FIX: Ensure all values are strings (prevents controlled component issues)
  const safePersonalInfo = {
    firstName: personalInfo?.firstName || '',
    lastName: personalInfo?.lastName || '',
    email: personalInfo?.email || '',
    phone: personalInfo?.phone || '',
    title: personalInfo?.title || '',
    location: personalInfo?.location || '',
    linkedIn: personalInfo?.linkedIn || '',
    website: personalInfo?.website || ''
  };
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    updatePersonalInfo({ [name]: value });
  };
  
  return (
    <div className="form-section">
      <div className="form-row">
        <div className="form-group">
          <label htmlFor="firstName">First Name *</label>
          <input
            type="text"
            id="firstName"
            name="firstName"
            value={safePersonalInfo.firstName}
            onChange={handleChange}
            placeholder="Enter your first name"
            required
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="lastName">Last Name *</label>
          <input
            type="text"
            id="lastName"
            name="lastName"
            value={safePersonalInfo.lastName}
            onChange={handleChange}
            placeholder="Enter your last name"
            required
          />
        </div>
      </div>
      
      <div className="form-row">
        <div className="form-group">
          <label htmlFor="email">Email Address *</label>
          <input
            type="email"
            id="email"
            name="email"
            value={safePersonalInfo.email}
            onChange={handleChange}
            placeholder="Enter your email"
            required
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="phone">Phone Number *</label>
          <input
            type="tel"
            id="phone"
            name="phone"
            value={safePersonalInfo.phone}
            onChange={handleChange}
            placeholder="Enter your phone number"
            required
          />
        </div>
      </div>
      
      <div className="form-group">
        <label htmlFor="title">Professional Title *</label>
        <input
          type="text"
          id="title"
          name="title"
          value={safePersonalInfo.title}
          onChange={handleChange}
          placeholder="e.g., Software Developer, Marketing Manager"
          required
        />
      </div>
      
      <div className="form-group">
        <label htmlFor="location">Location *</label>
        <input
          type="text"
          id="location"
          name="location"
          value={safePersonalInfo.location}
          onChange={handleChange}
          placeholder="City, State/Province, Country"
          required
        />
      </div>
      
      <div className="form-row">
        <div className="form-group">
          <label htmlFor="linkedIn">LinkedIn (optional)</label>
          <input
            type="url"
            id="linkedIn"
            name="linkedIn"
            value={safePersonalInfo.linkedIn}
            onChange={handleChange}
            placeholder="https://linkedin.com/in/username"
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="website">Website/Portfolio (optional)</label>
          <input
            type="url"
            id="website"
            name="website"
            value={safePersonalInfo.website}
            onChange={handleChange}
            placeholder="https://yourwebsite.com"
          />
        </div>
      </div>
      
      <div className="form-hint">
        <p>* Required fields</p>
        <p>This information will appear at the top of your resume. Make sure your contact information is accurate.</p>
      </div>
    </div>
  );
};

export default PersonalInfoForm;