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

      if (!jobTitle) {
        return res.status(400).json({ error: 'Job title is required.' });
      }

      // Extract text from PDF
      const resumeText = await atsService.extractTextFromPDF(req.file.buffer);

      if (!resumeText || resumeText.length < 50) {
        return res.status(400).json({
          error: 'Could not extract enough text from the PDF. Make sure it is not a scanned image.',
        });
      }

      // Analyze with OpenAI
      const analysis = await atsService.analyzeATS(resumeText, jobTitle, jobDescription || '');

      res.json(analysis);
    } catch (error) {
      console.error('ATS analysis error:', error.message);
      res.status(500).json({ error: 'Failed to analyze resume. Please try again.' });
    }
  });
};

module.exports = { analyzeResume };
