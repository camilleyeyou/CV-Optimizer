const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const DeepSeekClient = require('../services/deepseekClient');

// Apply auth middleware
router.use(auth);

// Test DeepSeek connectivity
router.get('/test', async (req, res) => {
  try {
    const deepseek = new DeepSeekClient(process.env.DEEPSEEK_API_KEY);

    // Simple test completion
    const response = await deepseek.createChatCompletion({
      model: 'deepseek-chat',
      messages: [
        { role: 'system', content: 'You are a helpful assistant.' },
        { role: 'user', content: 'Say hello!' }
      ],
      max_tokens: 10
    });

    res.json({ 
      message: 'DeepSeek connection successful',
      response: response.choices[0].message.content
    });
  } catch (error) {
    console.error('DeepSeek test error:', error);
    res.status(500).json({ 
      error: 'DeepSeek connection failed',
      details: error.message
    });
  }
});

module.exports = router;
