const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const studentController = require('../controllers/studentController');

router.post('/verify', requireAuth, studentController.verifyStudent);

module.exports = router;
