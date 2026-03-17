require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const app = express();
const PORT = process.env.PORT || 5002;

// Validate required env vars — fail hard in production
const requiredEnvVars = ['OPENAI_API_KEY', 'SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY'];
const missing = requiredEnvVars.filter((v) => !process.env[v]);
if (missing.length > 0) {
  if (process.env.NODE_ENV === 'production') {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
  // eslint-disable-next-line no-console
  console.warn(`Warning: Missing env vars: ${missing.join(', ')}`);
}

// CORS — on Vercel (same-origin), CLIENT_URL is optional
const clientUrl = process.env.CLIENT_URL;
if (process.env.NODE_ENV === 'production' && clientUrl && clientUrl.includes('localhost')) {
  throw new Error('CLIENT_URL must not be localhost in production');
}

// Security middleware
app.use(helmet());
app.use(cors({
  origin: clientUrl || true, // true = reflect request origin (safe when behind auth)
  credentials: true,
}));
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: false, limit: '2mb' }));

// Rate limiting
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { error: 'Too many requests, please try again later.' },
});

const aiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: { error: 'AI request limit reached. Please try again later.' },
});

app.use('/api/', apiLimiter);
app.use('/api/ai', aiLimiter);
app.use('/api/ats', aiLimiter);

// Health check — no sensitive info
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Credits endpoint
const { requireAuth } = require('./middleware/auth');
const { getCredits } = require('./middleware/credits');
app.get('/api/credits', requireAuth, getCredits);

// Routes
app.use('/api/ai', require('./routes/ai'));
app.use('/api/pdf', require('./routes/pdf'));
app.use('/api/ats', require('./routes/ats'));

// 404
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error handler
app.use((err, req, res, _next) => {
  const status = err.status || 500;
  const message = status === 500 ? 'Internal server error' : err.message;
  res.status(status).json({ error: message });
});

// Start server (non-production uses direct listen; production uses module export)
if (process.env.NODE_ENV !== 'production' && process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    // eslint-disable-next-line no-console
    console.log(`Server running on port ${PORT}`);
  });
}

module.exports = app;
