require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const app = express();
const PORT = process.env.PORT || 5002;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use('/api/', limiter);

// Logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Basic routes
app.get('/', (req, res) => {
  res.json({ message: 'CV Optimizer API is running' });
});

app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    database: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected'
  });
});

// API Routes
try {
  app.use('/api/auth', require('./routes/auth-simple'));
  
  // FIXED: Use plural 'resumes' to match frontend expectations
  app.use('/api/resumes', require('./routes/resume'));
  
  app.use('/api/ai', require('./routes/ai'));
  app.use("/api/ai-test", require("./routes/ai-test"));
  app.use('/api/pdf', require('./routes/pdf'));
  
  console.log('All routes loaded successfully');
} catch (error) {
  console.error('Error loading routes:', error);
}

// 404 handler - this must come after all routes
app.use((req, res) => {
  console.log('404 - Route not found:', req.url);
  res.status(404).json({ error: 'Route not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Something went wrong!' });
});

// Database connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/cv-optimizer')
  .then(() => {
    console.log('MongoDB connected successfully');
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
  });

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log('Available routes:');
  console.log('  /api/auth');
  console.log('  /api/resumes');  // Updated to plural
  console.log('  /api/ai');
  console.log('  /api/pdf');
});