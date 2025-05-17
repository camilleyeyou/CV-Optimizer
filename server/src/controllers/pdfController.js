const pdfService = require('../services/pdfService');
const Resume = require('../models/Resume');

// Generate PDF
const generatePDF = async (req, res) => {
  try {
    const { resumeId, template } = req.body;

    // Validate required parameters
    if (!resumeId) {
      return res.status(400).json({ error: 'Resume ID is required' });
    }

    // Find the resume by ID
    const resume = await Resume.findOne({
      _id: resumeId,
      user: req.user._id
    });

    if (!resume) {
      return res.status(404).json({ error: 'Resume not found' });
    }

    // Generate the PDF
    const pdfBuffer = await pdfService.generatePDF(resume, template);

    // Set response headers for file download
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${resume.name || 'resume'}.pdf"`);
    
    // Send the PDF buffer
    res.send(pdfBuffer);
  } catch (error) {
    console.error('PDF generation error:', error);
    res.status(400).json({ error: error.message });
  }
};

// Preview PDF (returns base64)
const previewPDF = async (req, res) => {
  try {
    const { resumeId, template } = req.body;

    // Validate required parameters
    if (!resumeId) {
      return res.status(400).json({ error: 'Resume ID is required' });
    }

    // Find the resume by ID
    const resume = await Resume.findOne({
      _id: resumeId,
      user: req.user._id
    });

    if (!resume) {
      return res.status(404).json({ error: 'Resume not found' });
    }

    // Generate the PDF
    const pdfBuffer = await pdfService.generatePDF(resume, template);

    // Convert to base64 for preview
    const base64 = pdfBuffer.toString('base64');

    // Return the base64 encoded PDF
    res.json({ 
      pdf: base64,
      filename: `${resume.name || 'resume'}.pdf`
    });
  } catch (error) {
    console.error('PDF preview error:', error);
    res.status(400).json({ error: error.message });
  }
};

module.exports = {
  generatePDF,
  previewPDF
};
