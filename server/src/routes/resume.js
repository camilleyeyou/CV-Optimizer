const express = require('express');
const router = express.Router();
const resumeController = require('../controllers/resumeController');
const { auth } = require('../middleware/auth');

// All routes require authentication
router.use(auth);

// Resume CRUD operations
router.post('/', resumeController.createResume);
router.get('/', resumeController.getResumes);
router.get('/templates', resumeController.getTemplates);
router.get('/:id', resumeController.getResume);
router.put('/:id', resumeController.updateResume);
router.delete('/:id', resumeController.deleteResume);
router.post('/:id/duplicate', resumeController.duplicateResume);
router.post('/:id/analyze', resumeController.analyzeResume);

module.exports = router;
