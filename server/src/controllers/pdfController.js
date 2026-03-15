const pdfService = require('../services/pdfService');

const generatePDF = async (req, res) => {
  try {
    const { resumeData, template } = req.body;

    if (!resumeData) {
      return res.status(400).json({ error: 'Resume data is required' });
    }

    const pdfBuffer = await pdfService.generatePDF(resumeData, template);

    const firstName = resumeData.personal_info?.first_name || 'Resume';
    const lastName = resumeData.personal_info?.last_name || '';
    const filename = `${firstName}${lastName ? '_' + lastName : ''}_Resume.pdf`;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(pdfBuffer);
  } catch (error) {
    console.error('PDF generation error:', error.message);
    res.status(500).json({ error: 'Failed to generate PDF' });
  }
};

module.exports = { generatePDF };
