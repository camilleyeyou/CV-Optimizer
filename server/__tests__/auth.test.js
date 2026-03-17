const request = require('supertest');

process.env.NODE_ENV = 'test';
process.env.OPENAI_API_KEY = 'test-key';
process.env.SUPABASE_URL = 'https://test.supabase.co';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-key';

const app = require('../src/server');

describe('Authentication middleware', () => {
  describe('Protected routes without token', () => {
    it('rejects /api/ai/summary without auth', async () => {
      const res = await request(app)
        .post('/api/ai/summary')
        .send({ resumeData: {} });
      expect(res.status).toBe(401);
      expect(res.body.error).toBe('Authentication required');
    });

    it('rejects /api/ats/analyze without auth', async () => {
      const res = await request(app).post('/api/ats/analyze');
      expect(res.status).toBe(401);
      expect(res.body.error).toBe('Authentication required');
    });

    it('rejects /api/pdf/generate without auth', async () => {
      const res = await request(app)
        .post('/api/pdf/generate')
        .send({ resumeData: {} });
      expect(res.status).toBe(401);
      expect(res.body.error).toBe('Authentication required');
    });

    it('rejects /api/credits without auth', async () => {
      const res = await request(app).get('/api/credits');
      expect(res.status).toBe(401);
      expect(res.body.error).toBe('Authentication required');
    });
  });

  describe('Protected routes with invalid token', () => {
    it('rejects /api/ai/summary with invalid token', async () => {
      const res = await request(app)
        .post('/api/ai/summary')
        .set('Authorization', 'Bearer invalid-token-123')
        .send({ resumeData: {} });
      expect(res.status).toBe(401);
    });
  });
});
