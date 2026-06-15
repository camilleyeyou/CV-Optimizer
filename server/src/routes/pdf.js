const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const { enforceTemplateAccess } = require('../middleware/templateAccess');
const pdfController = require('../controllers/pdfController');
const { validatePDF, validateCoverLetterPDF } = require('../middleware/validate');

router.use(requireAuth);

router.post('/generate', validatePDF, enforceTemplateAccess, pdfController.generatePDF);
router.post('/generate-docx', validatePDF, enforceTemplateAccess, pdfController.generateDOCX);
router.post('/cover-letter-pdf', validateCoverLetterPDF, pdfController.generateCoverLetterPDF);
router.post('/cover-letter-docx', validateCoverLetterPDF, pdfController.generateCoverLetterDOCX);

module.exports = router;
