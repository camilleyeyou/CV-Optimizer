const express = require('express');
const router = express.Router();

router.get('/test', (req, res) => {
  res.json({ message: 'PDF routes are working!' });
});

module.exports = router;
