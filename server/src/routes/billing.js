const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const billingController = require('../controllers/billingController');

// Note: the webhook route is mounted separately in server.js (it needs the
// raw body and must NOT require auth). These routes are authenticated.
router.use(requireAuth);

router.post('/checkout', billingController.createCheckout);
router.post('/portal', billingController.createPortal);

module.exports = router;
