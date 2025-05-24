// server/src/middleware/auth.js
const jwt = require('jsonwebtoken');
const User = require('../models/User'); // Adjust path as needed

// Existing auth middleware (requires authentication)
const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'Access denied. No token provided.' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    const user = await User.findById(decoded.userId);
    
    if (!user) {
      return res.status(401).json({ error: 'Invalid token.' });
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token.' });
  }
};

// New optional auth middleware (works with or without authentication)
const optionalAuth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      // No token provided - continue without authentication
      req.user = null;
      return next();
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
      const user = await User.findById(decoded.userId);
      
      if (user) {
        req.user = user;
      } else {
        req.user = null;
      }
    } catch (tokenError) {
      // Invalid token - continue without authentication
      req.user = null;
    }
    
    next();
  } catch (error) {
    // Any other error - continue without authentication
    req.user = null;
    next();
  }
};

module.exports = {
  auth,
  optionalAuth
};