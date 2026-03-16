const pdfService = require('../services/pdfService');
const docxService = require('../services/docxService');

// Sanitize filename: allow only alphanumeric, spaces, hyphens, underscores
const sanitizeFilename = (str) =>
  (str || '').replace(/[^a-zA-Z0-9 _-]/g, '').trim().slice(0, 50);

const getFilename = (resumeData, ext) => {
  const firstName = sanitizeFilename(resumeData.personal_info?.first_name) || 'Resume';
  const lastName = sanitizeFilename(resumeData.personal_info?.last_name);
  return `${firstName}${lastName ? '_' + lastName : ''}_Resume.${ext}`;
};

const generatePDF = async (req, res) => {
  try {
    const { resumeData, template } = req.body;
    const pdfBuffer = await pdfService.generatePDF(resumeData, template);
    const filename = getFilename(resumeData, 'pdf');

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(pdfBuffer);
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate PDF' });
  }
};

const generateDOCX = async (req, res) => {
  try {
    const { resumeData, template } = req.body;
    const docxBuffer = await docxService.generate(resumeData, template);
    const filename = getFilename(resumeData, 'docx');

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(Buffer.from(docxBuffer));
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate DOCX' });
  }
};

module.exports = { generatePDF, generateDOCX };
