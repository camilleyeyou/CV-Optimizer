console.log('Detailed diagnostic...\n');

// Test loading the auth controller directly
console.log('1. Testing auth controller:');
try {
  const authController = require('./src/controllers/authController');
  console.log('   Type:', typeof authController);
  console.log('   Keys:', Object.keys(authController));
  console.log('   Functions:', Object.keys(authController).map(key => `${key}: ${typeof authController[key]}`));
} catch (e) {
  console.log('   Error:', e.message);
  console.log('   Stack:', e.stack);
}

// Test loading the User model
console.log('\n2. Testing User model:');
try {
  const User = require('./src/models/User');
  console.log('   Type:', typeof User);
  console.log('   Is function:', typeof User === 'function');
} catch (e) {
  console.log('   Error:', e.message);
}

// Test JWT
console.log('\n3. Testing JWT:');
try {
  const jwt = require('jsonwebtoken');
  console.log('   Type:', typeof jwt);
  console.log('   Has sign method:', typeof jwt.sign === 'function');
} catch (e) {
  console.log('   Error:', e.message);
}

// Test auth middleware
console.log('\n4. Testing auth middleware:');
try {
  const authMiddleware = require('./src/middleware/auth');
  console.log('   Type:', typeof authMiddleware);
  console.log('   Keys:', Object.keys(authMiddleware));
  console.log('   Has auth:', typeof authMiddleware.auth);
} catch (e) {
  console.log('   Error:', e.message);
}

// Test validation middleware
console.log('\n5. Testing validation middleware:');
try {
  const validate = require('./src/middleware/validation');
  console.log('   Type:', typeof validate);
} catch (e) {
  console.log('   Error:', e.message);
}

// Test auth routes
console.log('\n6. Testing auth routes:');
try {
  // Clear require cache
  delete require.cache[require.resolve('./src/routes/auth')];
  
  const authRoutes = require('./src/routes/auth');
  console.log('   Type:', typeof authRoutes);
  console.log('   Is router:', authRoutes && authRoutes.stack ? 'Yes' : 'No');
} catch (e) {
  console.log('   Error:', e.message);
  console.log('   Stack:', e.stack);
}

// Test environment variables
console.log('\n7. Environment variables:');
console.log('   JWT_SECRET exists:', !!process.env.JWT_SECRET);
console.log('   JWT_SECRET length:', process.env.JWT_SECRET ? process.env.JWT_SECRET.length : 0);

// Test creating an Express router
console.log('\n8. Testing Express router:');
try {
  const express = require('express');
  const router = express.Router();
  console.log('   Router created:', typeof router);
  console.log('   Has post method:', typeof router.post === 'function');
} catch (e) {
  console.log('   Error:', e.message);
}
