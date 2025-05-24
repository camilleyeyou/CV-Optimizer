import React from 'react';
import { useResume } from '../../context/ResumeContext';
import '../../styles/Forms.css';

const PersonalInfoForm = () => {
  const { resumeData, updateResumeData } = useResume();
  const personalInfo = resumeData?.personalInfo || {};

  const handleChange = (field, value) => {
    updateResumeData({
      ...resumeData,
      personalInfo: {
        ...personalInfo,
        [field]: value
      }
    });
  };

  return (
    <div className="form-container">
      <h2>Personal Information</h2>
      
      <div className="form-group">
        <label htmlFor="firstName">First Name</label>
        <input
          type="text"
          id="firstName"
          value={personalInfo.firstName || ''}
          onChange={(e) => handleChange('firstName', e.target.value)}
          placeholder="Enter your first name"
        />
      </div>

      <div className="form-group">
        <label htmlFor="lastName">Last Name</label>
        <input
          type="text"
          id="lastName"
          value={personalInfo.lastName || ''}
          onChange={(e) => handleChange('lastName', e.target.value)}
          placeholder="Enter your last name"
        />
      </div>

      <div className="form-group">
        <label htmlFor="email">Email</label>
        <input
          type="email"
          id="email"
          value={personalInfo.email || ''}
          onChange={(e) => handleChange('email', e.target.value)}
          placeholder="Enter your email address"
        />
      </div>

      <div className="form-group">
        <label htmlFor="phone">Phone</label>
        <input
          type="tel"
          id="phone"
          value={personalInfo.phone || ''}
          onChange={(e) => handleChange('phone', e.target.value)}
          placeholder="Enter your phone number"
        />
      </div>

      <div className="form-group">
        <label htmlFor="address">Address</label>
        <input
          type="text"
          id="address"
          value={personalInfo.address || ''}
          onChange={(e) => handleChange('address', e.target.value)}
          placeholder="Enter your street address"
        />
      </div>

      <div className="form-row">
        <div className="form-group">
          <label htmlFor="city">City</label>
          <input
            type="text"
            id="city"
            value={personalInfo.city || ''}
            onChange={(e) => handleChange('city', e.target.value)}
            placeholder="City"
          />
        </div>

        <div className="form-group">
          <label htmlFor="state">State</label>
          <input
            type="text"
            id="state"
            value={personalInfo.state || ''}
            onChange={(e) => handleChange('state', e.target.value)}
            placeholder="State"
          />
        </div>

        <div className="form-group">
          <label htmlFor="zipCode">ZIP Code</label>
          <input
            type="text"
            id="zipCode"
            value={personalInfo.zipCode || ''}
            onChange={(e) => handleChange('zipCode', e.target.value)}
            placeholder="ZIP"
          />
        </div>
      </div>
    </div>
  );
};

export default PersonalInfoForm;
