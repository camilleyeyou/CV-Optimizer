const Resume = require('../models/Resume');
const atsService = require('../services/atsService');

// Create new resume
const createResume = async (req, res) => {
  try {
    const resume = new Resume({
      ...req.body,
      user: req.user._id
    });

    await resume.save();

    // Add resume to user's resumes array
    req.user.resumes.push(resume._id);
    await req.user.save();

    res.status(201).json({ resume });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Get all resumes for user
const getResumes = async (req, res) => {
  try {
    const resumes = await Resume.find({ user: req.user._id })
      .select('name template atsScore metadata createdAt')
      .sort('-createdAt');

    res.json({ resumes });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Get single resume
const getResume = async (req, res) => {
  try {
    const resume = await Resume.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!resume) {
      return res.status(404).json({ error: 'Resume not found' });
    }

    res.json({ resume });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Update resume
const updateResume = async (req, res) => {
  try {
    const resume = await Resume.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      req.body,
      { new: true, runValidators: true }
    );

    if (!resume) {
      return res.status(404).json({ error: 'Resume not found' });
    }

    res.json({ resume });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Delete resume
const deleteResume = async (req, res) => {
  try {
    const resume = await Resume.findOneAndDelete({
      _id: req.params.id,
      user: req.user._id
    });

    if (!resume) {
      return res.status(404).json({ error: 'Resume not found' });
    }

    // Remove from user's resumes array
    req.user.resumes = req.user.resumes.filter(
      resumeId => resumeId.toString() !== req.params.id
    );
    await req.user.save();

    res.json({ message: 'Resume deleted successfully' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Duplicate resume
const duplicateResume = async (req, res) => {
  try {
    const originalResume = await Resume.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!originalResume) {
      return res.status(404).json({ error: 'Resume not found' });
    }

    // Create a copy
    const resumeCopy = new Resume({
      ...originalResume.toObject(),
      _id: undefined,
      name: `${originalResume.name} (Copy)`,
      createdAt: undefined,
      updatedAt: undefined
    });

    await resumeCopy.save();

    // Add to user's resumes
    req.user.resumes.push(resumeCopy._id);
    await req.user.save();

    res.status(201).json({ resume: resumeCopy });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Analyze resume with ATS
const analyzeResume = async (req, res) => {
  try {
    const { jobDescription } = req.body;

    const resume = await Resume.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!resume) {
      return res.status(404).json({ error: 'Resume not found' });
    }

    // Analyze resume
    const scores = atsService.analyzeResume(resume, jobDescription);
    const suggestions = atsService.generateSuggestions(scores, jobDescription);

    // Update resume with ATS score
    resume.atsScore = {
      ...scores,
      lastChecked: new Date()
    };

    if (jobDescription) {
      resume.targetJob.description = jobDescription;
    }

    await resume.save();

    res.json({ scores, suggestions });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Get resume templates
const getTemplates = async (req, res) => {
  try {
    const templates = [
      { id: 'modern', name: 'Modern', description: 'Clean and contemporary design' },
      { id: 'professional', name: 'Professional', description: 'Traditional business format' },
      { id: 'creative', name: 'Creative', description: 'Unique and eye-catching layout' },
      { id: 'minimal', name: 'Minimal', description: 'Simple and elegant design' },
      { id: 'executive', name: 'Executive', description: 'Senior-level professional format' }
    ];

    res.json({ templates });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

module.exports = {
  createResume,
  getResumes,
  getResume,
  updateResume,
  deleteResume,
  duplicateResume,
  analyzeResume,
  getTemplates
};