const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const { enforceTemplateAccess } = require('../middleware/templateAccess');
const { requirePlan } = require('../middleware/requirePlan');
const pdfController = require('../controllers/pdfController');
const { validatePDF, validateCoverLetterPDF } = require('../middleware/validate');

router.use(requireAuth);

router.post('/generate', validatePDF, enforceTemplateAccess, pdfController.generatePDF);
router.post('/generate-docx', validatePDF, enforceTemplateAccess, pdfController.generateDOCX);
// Cover letter export (PDF/DOCX) is a Pro feature.
router.post('/cover-letter-pdf', requirePlan(['pro', 'premium']), validateCoverLetterPDF, pdfController.generateCoverLetterPDF);
router.post('/cover-letter-docx', requirePlan(['pro', 'premium']), validateCoverLetterPDF, pdfController.generateCoverLetterDOCX);

module.exports = router;
