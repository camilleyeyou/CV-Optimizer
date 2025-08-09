const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// Connect to MongoDB if URI is provided
if (process.env.MONGODB_URI) {
  mongoose.connect(process.env.MONGODB_URI).catch(err => {
    console.error('MongoDB connection error:', err);
  });
}

// GET /api/resumes
app.get('/api/resumes', async (req, res) => {
  try {
    // For now, return mock data to test if the endpoint works
    res.json({ 
      success: true, 
      resumes: [],
      message: 'Resumes endpoint is working!'
    });
  } catch (error) {
    console.error('Error fetching resumes:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/resumes
app.post('/api/resumes', async (req, res) => {
  try {
    res.json({ 
      success: true, 
      resume: { id: Date.now().toString(), ...req.body },
      message: 'Resume created successfully'
    });
  } catch (error) {
    console.error('Error creating resume:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = app;