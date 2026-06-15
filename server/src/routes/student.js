const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const { requireAuth } = require('../middleware/auth');
const studentController = require('../controllers/studentController');

// Tight limit — student verification should happen rarely per user/IP.
const verifyLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5,
  message: { error: 'Too many verification attempts. Please try again later.' },
});

router.post('/verify', verifyLimiter, requireAuth, studentController.verifyStudent);

module.exports = router;
