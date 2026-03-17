const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const pdfController = require('../controllers/pdfController');
const { validatePDF, validateCoverLetterPDF } = require('../middleware/validate');

router.use(requireAuth);

router.post('/generate', validatePDF, pdfController.generatePDF);
router.post('/generate-docx', validatePDF, pdfController.generateDOCX);
router.post('/cover-letter-pdf', validateCoverLetterPDF, pdfController.generateCoverLetterPDF);
router.post('/cover-letter-docx', validateCoverLetterPDF, pdfController.generateCoverLetterDOCX);

module.exports = router;
