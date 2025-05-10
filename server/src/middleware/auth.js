const jwt = require('jsonwebtoken');
const User = require('../models/User');

const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      throw new Error();
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');

    if (!user) {
      throw new Error();
    }

    req.user = user;
    req.token = token;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Please authenticate.' });
  }
};

const premiumAuth = async (req, res, next) => {
  try {
    if (req.user.subscription.plan === 'free') {
      return res.status(403).json({ 
        error: 'This feature requires a premium subscription.' 
      });
    }
    next();
  } catch (error) {
    res.status(500).json({ error: 'Authentication error.' });
  }
};

module.exports = { auth, premiumAuth };
