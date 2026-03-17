const request = require('supertest');

process.env.NODE_ENV = 'test';
process.env.OPENAI_API_KEY = 'test-key';
process.env.SUPABASE_URL = 'https://test.supabase.co';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-key';

const app = require('../src/server');

describe('Rate limiting', () => {
  it('includes rate limit headers on API responses', async () => {
    const res = await request(app).get('/api/health');
    // express-rate-limit sets these headers
    // express-rate-limit v7+ uses standardized headers
    const hasRateLimit = res.headers['ratelimit-limit'] || res.headers['x-ratelimit-limit'] || res.headers['ratelimit-policy'];
    expect(hasRateLimit).toBeDefined();
  });
});

describe('Security headers', () => {
  it('includes helmet security headers', async () => {
    const res = await request(app).get('/api/health');
    // Helmet sets various security headers
    expect(res.headers['x-content-type-options']).toBe('nosniff');
    expect(res.headers['x-frame-options']).toBeDefined();
  });
});

describe('CORS', () => {
  it('allows requests with credentials', async () => {
    const res = await request(app)
      .get('/api/health')
      .set('Origin', 'http://localhost:3000');
    expect(res.headers['access-control-allow-credentials']).toBe('true');
  });
});

describe('Request size limits', () => {
  it('rejects oversized JSON payloads', async () => {
    const largePayload = { data: 'x'.repeat(3 * 1024 * 1024) }; // 3MB
    const res = await request(app)
      .post('/api/ai/summary')
      .send(largePayload);
    // Should get 413 or a parsing error, not a crash
    expect([400, 401, 413]).toContain(res.status);
  });
});
