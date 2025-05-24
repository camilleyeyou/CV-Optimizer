const express = require('express');
const router = express.Router();
const resumeController = require('../controllers/resumeController');
const { auth, optionalAuth } = require('../middleware/auth');

// Routes that don't require authentication (for development/testing)
router.get('/templates', resumeController.getTemplates);

// Routes with optional authentication - work with or without auth
router.post('/', optionalAuth, resumeController.createResume);
router.get('/', optionalAuth, resumeController.getResumes);
router.get('/:id', optionalAuth, resumeController.getResume);
router.put('/:id', optionalAuth, resumeController.updateResume);
router.delete('/:id', optionalAuth, resumeController.deleteResume);
router.post('/:id/duplicate', optionalAuth, resumeController.duplicateResume);
router.post('/:id/analyze', optionalAuth, resumeController.analyzeResume);
router.post('/:id/download', optionalAuth, resumeController.incrementDownloadCount);

// If you want to keep strict authentication for production, 
// uncomment these routes and comment out the optional auth routes above:
/*
router.use(auth); // Require authentication for all routes below

router.post('/', resumeController.createResume);
router.get('/', resumeController.getResumes);
router.get('/:id', resumeController.getResume);
router.put('/:id', resumeController.updateResume);
router.delete('/:id', resumeController.deleteResume);
router.post('/:id/duplicate', resumeController.duplicateResume);
router.post('/:id/analyze', resumeController.analyzeResume);
router.post('/:id/download', resumeController.incrementDownloadCount);
*/

module.exports = router;