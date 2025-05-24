const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const resumeSchema = new mongoose.Schema({
  _id: {
    type: String,
    default: uuidv4  // Use UUID instead of ObjectId
  },
  user: {
    type: String, // Changed to String to match UUID format
    ref: 'User',
    required: false // Made optional since you might not have users yet
  },
  name: {
    type: String,
    default: 'Untitled Resume'
  },
  // Map your existing personalInfo to match frontend expectations
  personalInfo: {
    firstName: String,
    lastName: String,
    email: String,
    phone: String,
    location: String,
    linkedin: String,
    github: String,
    website: String,
    // Add fields that your frontend expects
    address: String,
    city: String,
    state: String,
    zipCode: String,
    country: String,
    linkedIn: String // Alternative name for linkedin
  },
  summary: String,
  // Modified skills to support both formats
  skills: {
    type: mongoose.Schema.Types.Mixed, // Allow both array and object format
    default: []
  },
  workExperience: [{
    id: { type: String, default: uuidv4 }, // Add ID for frontend compatibility
    company: String,
    jobTitle: String, // Add alternative name
    position: String,
    location: String,
    startDate: mongoose.Schema.Types.Mixed, // Allow both Date and String
    endDate: mongoose.Schema.Types.Mixed,
    current: Boolean,
    isCurrentJob: Boolean, // Alternative name
    description: [String],
    achievements: [String]
  }],
  education: [{
    id: { type: String, default: uuidv4 }, // Add ID for frontend compatibility
    institution: String,
    degree: String,
    fieldOfStudy: String,
    location: String,
    startDate: mongoose.Schema.Types.Mixed, // Allow both Date and String
    endDate: mongoose.Schema.Types.Mixed,
    graduationDate: String, // Alternative name
    gpa: String,
    honors: [String],
    relevantCoursework: [String] // Add field from frontend
  }],
  projects: [{
    id: { type: String, default: uuidv4 },
    name: String,
    description: String,
    technologies: [String],
    url: String
  }],
  certifications: [{
    id: { type: String, default: uuidv4 }, // Add ID for frontend compatibility
    name: String,
    issuer: String,
    date: Date,
    issueDate: String, // Alternative name
    expirationDate: String, // Add field from frontend
    credentialId: String,
    credentialURL: String // Add field from frontend
  }],
  // Add fields that your frontend expects
  title: {
    type: String,
    default: function() { return this.name || 'Untitled Resume'; }
  },
  template: {
    type: String,
    default: 'modern'
  },
  downloads: {
    type: Number,
    default: 0
  },
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
}, { 
  timestamps: true,
  _id: false // Disable automatic ObjectId generation
});

// Pre-save middleware to handle skills format conversion
resumeSchema.pre('save', function(next) {
  // Convert skills object to array if needed (for frontend compatibility)
  if (this.skills && typeof this.skills === 'object' && !Array.isArray(this.skills)) {
    const technical = this.skills.technical || [];
    const soft = this.skills.soft || [];
    this.skills = [...technical, ...soft];
  }
  
  // Ensure title matches name
  if (this.name && !this.title) {
    this.title = this.name;
  }
  
  next();
});

// Method to get skills in object format (for backward compatibility)
resumeSchema.methods.getSkillsAsObject = function() {
  if (Array.isArray(this.skills)) {
    return {
      technical: this.skills.filter(skill => 
        // You can add logic here to categorize skills
        // For now, just return all skills as technical
        skill
      ),
      soft: []
    };
  }
  return this.skills;
};

// Method to increment download count
resumeSchema.methods.incrementDownloadCount = function() {
  this.downloads += 1;
  return this.save();
};

// Static method to find by user
resumeSchema.statics.findByUser = function(userId) {
  return this.find({ user: userId }).sort({ updatedAt: -1 });
};

// Add indexes for better performance
resumeSchema.index({ user: 1 });
resumeSchema.index({ 'personalInfo.email': 1 });
resumeSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Resume', resumeSchema);