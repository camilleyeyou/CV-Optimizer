const pdfService = require('../services/pdfService');

// Sanitize filename: allow only alphanumeric, spaces, hyphens, underscores
const sanitizeFilename = (str) =>
  (str || '').replace(/[^a-zA-Z0-9 _-]/g, '').trim().slice(0, 50);

const generatePDF = async (req, res) => {
  try {
    const { resumeData, template } = req.body;

    const pdfBuffer = await pdfService.generatePDF(resumeData, template);

    const firstName = sanitizeFilename(resumeData.personal_info?.first_name) || 'Resume';
    const lastName = sanitizeFilename(resumeData.personal_info?.last_name);
    const filename = `${firstName}${lastName ? '_' + lastName : ''}_Resume.pdf`;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(pdfBuffer);
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate PDF' });
  }
};

module.exports = { generatePDF };
