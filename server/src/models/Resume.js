const mongoose = require('mongoose');

const resumeSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    default: 'Untitled Resume'
  },
  personalInfo: {
    firstName: String,
    lastName: String,
    email: String,
    phone: String,
    location: String,
    linkedin: String,
    github: String,
    website: String
  },
  summary: String,
  skills: {
    technical: [String],
    soft: [String]
  },
  workExperience: [{
    company: String,
    position: String,
    location: String,
    startDate: Date,
    endDate: Date,
    current: Boolean,
    description: [String],
    achievements: [String]
  }],
  education: [{
    institution: String,
    degree: String,
    fieldOfStudy: String,
    location: String,
    startDate: Date,
    endDate: Date,
    gpa: String,
    honors: [String]
  }],
  projects: [{
    name: String,
    description: String,
    technologies: [String],
    url: String
  }],
  certifications: [{
    name: String,
    issuer: String,
    date: Date,
    credentialId: String
  }],
  atsScore: {
    overall: Number,
    breakdown: {
      keywords: Number,
      experience: Number,
      skills: Number,
      formatting: Number
    },
    lastChecked: Date
  }
}, { timestamps: true });

module.exports = mongoose.model('Resume', resumeSchema);
