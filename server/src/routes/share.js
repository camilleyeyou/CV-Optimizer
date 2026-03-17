const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const shareController = require('../controllers/shareController');

router.post('/create', requireAuth, shareController.createShare);
router.get('/:token', shareController.getShare);
router.delete('/:shareId', requireAuth, shareController.deleteShare);

module.exports = router;
