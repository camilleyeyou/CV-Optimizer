const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const billingController = require('../controllers/billingController');

// Public: the pricing page is a top-of-funnel surface, so a signed-out visitor
// has to be able to read which billing periods exist. Exposes no user data —
// only which Stripe prices are configured. Must stay above requireAuth.
router.get('/plans', billingController.getPlans);

// Note: the webhook route is mounted separately in server.js (it needs the
// raw body and must NOT require auth). Everything below is authenticated.
router.use(requireAuth);

router.post('/checkout', billingController.createCheckout);
router.post('/portal', billingController.createPortal);

module.exports = router;
