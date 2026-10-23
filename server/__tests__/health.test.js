const request = require('supertest');

// Stub environment before loading app
process.env.NODE_ENV = 'test';
process.env.OPENAI_API_KEY = 'test-key';
process.env.SUPABASE_URL = 'https://test.supabase.co';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-key';

const app = require('../src/server');

describe('GET /api/health', () => {
  it('returns status ok', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.timestamp).toBeDefined();
  });
});

describe('404 handling', () => {
  it('returns 404 for unknown routes', async () => {
    const res = await request(app).get('/api/nonexistent');
    expect(res.status).toBe(404);
    expect(res.body.error).toBe('Route not found');
  });
});

describe('GET /api/cron/keepalive', () => {
  it('rejects calls without the cron secret', async () => {
    process.env.CRON_SECRET = 'cron-test-secret';
    const res = await request(app).get('/api/cron/keepalive');
    expect(res.status).toBe(401);
  });

  it('stays closed when no secret is configured', async () => {
    delete process.env.CRON_SECRET;
    const res = await request(app)
      .get('/api/cron/keepalive')
      .set('Authorization', 'Bearer undefined');
    expect(res.status).toBe(401);
  });
});
