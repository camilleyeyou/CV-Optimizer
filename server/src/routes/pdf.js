const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const pdfController = require('../controllers/pdfController');
const { validatePDF } = require('../middleware/validate');

router.use(requireAuth);

router.post('/generate', validatePDF, pdfController.generatePDF);

module.exports = router;
