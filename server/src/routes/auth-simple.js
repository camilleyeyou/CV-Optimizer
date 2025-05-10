const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { auth } = require('../middleware/auth');

// Routes without validation for testing
router.post('/register', authController.register);
router.post('/login', authController.login);
router.get('/me', auth, authController.getCurrentUser);
router.patch('/profile', auth, authController.updateProfile);
router.post('/change-password', auth, authController.changePassword);

module.exports = router;
