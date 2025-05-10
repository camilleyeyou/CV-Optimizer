const express = require('express');
const router = express.Router();
const pdfController = require('../controllers/pdfController');
const { auth } = require('../middleware/auth');

// Apply auth middleware to all routes
router.use(auth);

// PDF routes
router.post('/generate', pdfController.generatePDF);
router.post('/preview', pdfController.previewPDF);

// Test route
router.get('/test', (req, res) => {
  res.json({ message: 'PDF routes are working!' });
});

module.exports = router;
