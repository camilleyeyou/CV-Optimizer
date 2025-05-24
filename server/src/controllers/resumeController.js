const Resume = require('../models/Resume');
const atsService = require('../services/atsService');
const { v4: uuidv4 } = require('uuid');

const createResume = async (req, res) => {
  try {
    const resumeData = {
      _id: uuidv4(), // Generate UUID for new resume
      ...req.body
    };
    
    // If you have user authentication, add user ID
    if (req.user) {
      resumeData.user = req.user._id;
    }
    
    // Ensure nested arrays have IDs
    if (resumeData.workExperience) {
      resumeData.workExperience = resumeData.workExperience.map(exp => ({
        ...exp,
        id: exp.id || uuidv4()
      }));
    }
    
    if (resumeData.education) {
      resumeData.education = resumeData.education.map(edu => ({
        ...edu,
        id: edu.id || uuidv4()
      }));
    }
    
    if (resumeData.certifications) {
      resumeData.certifications = resumeData.certifications.map(cert => ({
        ...cert,
        id: cert.id || uuidv4()
      }));
    }
    
    if (resumeData.projects) {
      resumeData.projects = resumeData.projects.map(proj => ({
        ...proj,
        id: proj.id || uuidv4()
      }));
    }
    
    const resume = new Resume(resumeData);
    await resume.save();
    res.status(201).json({ resume });
  } catch (error) {
    console.error('Create resume error:', error);
    res.status(400).json({ error: error.message });
  }
};

const getResumes = async (req, res) => {
  try {
    let query = {};
    
    // If you have user authentication, filter by user
    if (req.user) {
      query.user = req.user._id;
    }
    
    const resumes = await Resume.find(query).sort({ updatedAt: -1 });
    res.json({ resumes });
  } catch (error) {
    console.error('Get resumes error:', error);
    res.status(400).json({ error: error.message });
  }
};

const getResume = async (req, res) => {
  try {
    let query = { _id: req.params.id };
    
    // If you have user authentication, also filter by user
    if (req.user) {
      query.user = req.user._id;
    }
    
    const resume = await Resume.findOne(query);
    if (!resume) {
      return res.status(404).json({ error: 'Resume not found' });
    }
    res.json({ resume });
  } catch (error) {
    console.error('Get resume error:', error);
    res.status(400).json({ error: error.message });
  }
};

const updateResume = async (req, res) => {
  try {
    let query = { _id: req.params.id };
    
    // If you have user authentication, also filter by user
    if (req.user) {
      query.user = req.user._id;
    }
    
    const updateData = { ...req.body };
    
    // Ensure nested arrays have IDs when updating
    if (updateData.workExperience) {
      updateData.workExperience = updateData.workExperience.map(exp => ({
        ...exp,
        id: exp.id || uuidv4()
      }));
    }
    
    if (updateData.education) {
      updateData.education = updateData.education.map(edu => ({
        ...edu,
        id: edu.id || uuidv4()
      }));
    }
    
    if (updateData.certifications) {
      updateData.certifications = updateData.certifications.map(cert => ({
        ...cert,
        id: cert.id || uuidv4()
      }));
    }
    
    if (updateData.projects) {
      updateData.projects = updateData.projects.map(proj => ({
        ...proj,
        id: proj.id || uuidv4()
      }));
    }
    
    const resume = await Resume.findOneAndUpdate(
      query,
      updateData,
      { new: true, runValidators: true }
    );
    
    if (!resume) {
      return res.status(404).json({ error: 'Resume not found' });
    }
    res.json({ resume });
  } catch (error) {
    console.error('Update resume error:', error);
    res.status(400).json({ error: error.message });
  }
};

const deleteResume = async (req, res) => {
  try {
    let query = { _id: req.params.id };
    
    // If you have user authentication, also filter by user
    if (req.user) {
      query.user = req.user._id;
    }
    
    const resume = await Resume.findOneAndDelete(query);
    if (!resume) {
      return res.status(404).json({ error: 'Resume not found' });
    }
    res.json({ message: 'Resume deleted successfully' });
  } catch (error) {
    console.error('Delete resume error:', error);
    res.status(400).json({ error: error.message });
  }
};

const getTemplates = async (req, res) => {
  res.json({ 
    templates: ['modern', 'professional', 'minimal', 'classic', 'creative'] 
  });
};

const duplicateResume = async (req, res) => {
  try {
    let query = { _id: req.params.id };
    
    // If you have user authentication, also filter by user
    if (req.user) {
      query.user = req.user._id;
    }
    
    const original = await Resume.findOne(query);
    if (!original) {
      return res.status(404).json({ error: 'Resume not found' });
    }
    
    const duplicateData = {
      ...original.toObject(),
      _id: uuidv4(), // Generate new UUID for duplicate
      name: `${original.name} (Copy)`,
      title: `${original.title || original.name} (Copy)`,
      createdAt: undefined,
      updatedAt: undefined
    };
    
    // Generate new IDs for nested arrays
    if (duplicateData.workExperience) {
      duplicateData.workExperience = duplicateData.workExperience.map(exp => ({
        ...exp,
        id: uuidv4()
      }));
    }
    
    if (duplicateData.education) {
      duplicateData.education = duplicateData.education.map(edu => ({
        ...edu,
        id: uuidv4()
      }));
    }
    
    if (duplicateData.certifications) {
      duplicateData.certifications = duplicateData.certifications.map(cert => ({
        ...cert,
        id: uuidv4()
      }));
    }
    
    if (duplicateData.projects) {
      duplicateData.projects = duplicateData.projects.map(proj => ({
        ...proj,
        id: uuidv4()
      }));
    }
    
    const duplicate = new Resume(duplicateData);
    await duplicate.save();
    res.status(201).json({ resume: duplicate });
  } catch (error) {
    console.error('Duplicate resume error:', error);
    res.status(400).json({ error: error.message });
  }
};

const analyzeResume = async (req, res) => {
  try {
    const { jobDescription } = req.body;
    
    if (!jobDescription) {
      return res.status(400).json({ error: 'Job description is required' });
    }

    let query = { _id: req.params.id };
    
    // If you have user authentication, also filter by user
    if (req.user) {
      query.user = req.user._id;
    }

    const resume = await Resume.findOne(query);

    if (!resume) {
      return res.status(404).json({ error: 'Resume not found' });
    }

    // Analyze resume with ATS service
    const analysis = atsService.analyzeResume(resume, jobDescription);

    // Update resume with latest ATS score
    resume.atsScore = {
      overall: analysis.overall,
      breakdown: analysis.breakdown,
      lastChecked: new Date()
    };
    await resume.save();

    res.json({ 
      score: analysis.overall,
      breakdown: analysis.breakdown,
      suggestions: analysis.suggestions,
      matchedKeywords: analysis.matchedKeywords,
      missingKeywords: analysis.missingKeywords
    });
  } catch (error) {
    console.error('Analyze resume error:', error);
    res.status(400).json({ error: error.message });
  }
};

// Add method to increment download count (for compatibility with frontend)
const incrementDownloadCount = async (req, res) => {
  try {
    let query = { _id: req.params.id };
    
    // If you have user authentication, also filter by user
    if (req.user) {
      query.user = req.user._id;
    }
    
    const resume = await Resume.findOne(query);
    
    if (!resume) {
      return res.status(404).json({ error: 'Resume not found' });
    }
    
    await resume.incrementDownloadCount();
    
    res.json({ 
      message: 'Download count incremented', 
      downloads: resume.downloads,
      id: resume._id
    });
  } catch (error) {
    console.error('Error incrementing download count:', error);
    res.status(500).json({ error: 'Failed to increment download count' });
  }
};

module.exports = {
  createResume,
  getResumes,
  getResume,
  updateResume,
  deleteResume,
  getTemplates,
  duplicateResume,
  analyzeResume,
  incrementDownloadCount
};