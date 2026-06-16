require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const logger = require('./logger');

const app = express();
const PORT = process.env.PORT || 5002;

// Validate required env vars — fail hard in production
const requiredEnvVars = ['OPENAI_API_KEY', 'SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY'];
const missing = requiredEnvVars.filter((v) => !process.env[v]);
if (missing.length > 0) {
  if (process.env.NODE_ENV === 'production') {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
  logger.warn({ missing }, 'Missing environment variables');
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

// Stripe webhook MUST receive the raw body for signature verification, so it is
// mounted before the JSON parser (and before the rate limiter and auth).
app.post(
  '/api/billing/webhook',
  express.raw({ type: 'application/json' }),
  require('./controllers/billingController').webhook
);

app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: false, limit: '2mb' }));

// Behind Vercel's proxy: trust the first hop so req.ip / X-Forwarded-For
// resolve to the real client IP (rate limiters key on it). MUST be set before
// the rate limiters are applied.
app.set('trust proxy', 1);

// Rate limiting — backed by a SHARED store (Upstash/Supabase) so limits hold
// across serverless instances, not just per-instance memory. Each limiter gets
// its own prefixed store so their per-IP counters don't collide.
const { createRateLimitStore } = require('./rateLimitStore');

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { error: 'Too many requests, please try again later.' },
  store: createRateLimitStore('rl:api:'),
});

const aiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: { error: 'AI request limit reached. Please try again later.' },
  store: createRateLimitStore('rl:ai:'),
});

// Public ATS endpoint: hourly IP limit + a daily per-IP cap (bot/abuse guard),
// both on the shared store.
const publicAtsLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5,
  message: { error: 'Free ATS check limit reached. Sign up for more checks.' },
  store: createRateLimitStore('rl:ats-hour:'),
});

const publicAtsDailyLimiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000, // 1 day
  max: 20,
  message: { error: 'Daily free ATS check limit reached. Please try again tomorrow or sign up.' },
  store: createRateLimitStore('rl:ats-day:'),
});

// Reject oversized bodies on the public endpoint before any parsing/work.
const PUBLIC_ATS_MAX_BYTES = 32 * 1024; // 32 KB
const limitPublicAtsBody = (req, res, next) => {
  const len = Number(req.headers['content-length'] || 0);
  if (len > PUBLIC_ATS_MAX_BYTES) {
    return res.status(413).json({ error: 'Request too large.' });
  }
  next();
};

app.use('/api/', apiLimiter);
app.use('/api/ai', aiLimiter);
// Order matters: body-size guard and rate limits run BEFORE the route handler,
// so no scoring/model work happens until all checks pass.
app.use('/api/ats/public-score', limitPublicAtsBody, publicAtsDailyLimiter, publicAtsLimiter);
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
app.use('/api/share', require('./routes/share'));
app.use('/api/student', require('./routes/student'));
app.use('/api/billing', require('./routes/billing'));
app.use('/api/account', require('./routes/account'));

// 404
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error handler
app.use((err, req, res, _next) => {
  const status = err.status || 500;
  const message = status === 500 ? 'Internal server error' : err.message;
  if (status >= 500) {
    logger.error({ err, path: req.path }, 'Unhandled server error');
  }
  res.status(status).json({ error: message });
});

// Start server (non-production uses direct listen; production uses module export)
if (process.env.NODE_ENV !== 'production' && process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    logger.info({ port: PORT }, 'Server running');
  });
}

module.exports = app;
