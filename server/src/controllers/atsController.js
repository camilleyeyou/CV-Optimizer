const multer = require('multer');
const atsService = require('../services/atsService');

// Configure multer for PDF uploads (in memory)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'), false);
    }
  },
}).single('resume');

const MAX_RESUME_TEXT_LENGTH = 50000; // ~50k chars is more than enough for any resume

const analyzeResume = async (req, res) => {
  upload(req, res, async (err) => {
    if (err) {
      if (err instanceof multer.MulterError) {
        return res.status(400).json({ error: 'File too large. Max 5MB.' });
      }
      return res.status(400).json({ error: err.message });
    }

    try {
      const { jobTitle, jobDescription } = req.body;

      if (!req.file) {
        return res.status(400).json({ error: 'Please upload a PDF resume.' });
      }

      if (!jobTitle || typeof jobTitle !== 'string' || jobTitle.trim().length < 2) {
        return res.status(400).json({ error: 'Job title is required (at least 2 characters).' });
      }

      if (jobDescription && typeof jobDescription === 'string' && jobDescription.length > 10000) {
        return res.status(400).json({ error: 'Job description is too long (max 10000 characters).' });
      }

      // Extract text from PDF
      const resumeText = await atsService.extractTextFromPDF(req.file.buffer);

      if (!resumeText || resumeText.length < 50) {
        return res.status(400).json({
          error: 'Could not extract enough text from the PDF. Make sure it is not a scanned image.',
        });
      }

      // Truncate excessively long text to prevent API abuse
      const truncatedText = resumeText.slice(0, MAX_RESUME_TEXT_LENGTH);

      // Analyze with OpenAI
      const analysis = await atsService.analyzeATS(truncatedText, jobTitle.trim(), (jobDescription || '').trim());

      res.json(analysis);
    } catch (error) {
      res.status(500).json({ error: 'Failed to analyze resume. Please try again.' });
    }
  });
};

module.exports = { analyzeResume };
