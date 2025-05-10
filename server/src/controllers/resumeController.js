const Resume = require('../models/Resume');
const atsService = require('../services/atsService');

const createResume = async (req, res) => {
  try {
    const resume = new Resume({
      ...req.body,
      user: req.user._id
    });
    await resume.save();
    res.status(201).json({ resume });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const getResumes = async (req, res) => {
  try {
    const resumes = await Resume.find({ user: req.user._id });
    res.json({ resumes });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

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

const updateResume = async (req, res) => {
  try {
    const resume = await Resume.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      req.body,
      { new: true }
    );
    if (!resume) {
      return res.status(404).json({ error: 'Resume not found' });
    }
    res.json({ resume });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const deleteResume = async (req, res) => {
  try {
    const resume = await Resume.findOneAndDelete({ 
      _id: req.params.id, 
      user: req.user._id 
    });
    if (!resume) {
      return res.status(404).json({ error: 'Resume not found' });
    }
    res.json({ message: 'Resume deleted successfully' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const getTemplates = async (req, res) => {
  res.json({ 
    templates: ['modern', 'professional', 'minimal'] 
  });
};

const duplicateResume = async (req, res) => {
  try {
    const original = await Resume.findOne({ 
      _id: req.params.id, 
      user: req.user._id 
    });
    if (!original) {
      return res.status(404).json({ error: 'Resume not found' });
    }
    
    const duplicate = new Resume({
      ...original.toObject(),
      _id: undefined,
      name: `${original.name} (Copy)`,
      createdAt: undefined,
      updatedAt: undefined
    });
    await duplicate.save();
    res.status(201).json({ resume: duplicate });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const analyzeResume = async (req, res) => {
  try {
    const { jobDescription } = req.body;
    
    if (!jobDescription) {
      return res.status(400).json({ error: 'Job description is required' });
    }

    const resume = await Resume.findOne({
      _id: req.params.id,
      user: req.user._id
    });

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
    res.status(400).json({ error: error.message });
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
  analyzeResume
};
