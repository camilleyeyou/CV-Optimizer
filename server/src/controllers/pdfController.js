const Resume = require('../models/Resume');
const pdfService = require('../services/pdfService');

const generatePDF = async (req, res) => {
  try {
    const { resumeId, template = 'modern' } = req.body;

    // Validate template
    const validTemplates = ['modern', 'professional', 'minimal'];
    if (!validTemplates.includes(template)) {
      return res.status(400).json({ error: 'Invalid template' });
    }

    // Get resume
    const resume = await Resume.findOne({
      _id: resumeId,
      user: req.user._id
    });

    if (!resume) {
      return res.status(404).json({ error: 'Resume not found' });
    }

    // Generate PDF
    const pdfBuffer = await pdfService.generatePDF(resume, template);

    // Set headers for PDF download
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition', 
      `attachment; filename="${resume.personalInfo.firstName}-${resume.personalInfo.lastName}-Resume.pdf"`
    );
    res.setHeader('Content-Length', pdfBuffer.length);

    // Send PDF
    res.send(pdfBuffer);
  } catch (error) {
    console.error('PDF generation error:', error);
    res.status(500).json({ error: 'Failed to generate PDF' });
  }
};

const previewPDF = async (req, res) => {
  try {
    const { resumeId, template = 'modern' } = req.body;

    // Get resume
    const resume = await Resume.findOne({
      _id: resumeId,
      user: req.user._id
    });

    if (!resume) {
      return res.status(404).json({ error: 'Resume not found' });
    }

    // Generate PDF
    const pdfBuffer = await pdfService.generatePDF(resume, template);

    // Convert to base64 for preview
    const pdfBase64 = pdfBuffer.toString('base64');

    res.json({
      pdf: pdfBase64,
      filename: `${resume.personalInfo.firstName}-${resume.personalInfo.lastName}-Resume.pdf`
    });
  } catch (error) {
    console.error('PDF preview error:', error);
    res.status(500).json({ error: 'Failed to generate PDF preview' });
  }
};

module.exports = {
  generatePDF,
  previewPDF
};
