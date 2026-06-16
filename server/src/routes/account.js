const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const accountController = require('../controllers/accountController');

router.use(requireAuth);

router.get('/export', accountController.exportData);
router.post('/delete', accountController.deleteAccount);

module.exports = router;
