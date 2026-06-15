// Exercise the shared (Supabase-backed) rate-limit store + public-score
// hardening through the real Express app, simulating the store via a mocked
// Supabase rpc that counts hits per key. (Vars referenced inside jest.mock must
// be prefixed with `mock`.)

process.env.SUPABASE_URL = 'http://localhost:54321';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-key';
process.env.OPENAI_API_KEY = 'test-openai-key';
delete process.env.UPSTASH_REDIS_REST_URL;
delete process.env.UPSTASH_REDIS_REST_TOKEN;

const mockCounters = new Map();

const mockRpc = jest.fn(async (fn, params) => {
  if (fn === 'increment_rate_limit') {
    const count = (mockCounters.get(params.p_key) || 0) + 1;
    mockCounters.set(params.p_key, count);
    return {
      data: [{ total_hits: count, reset_at: new Date(Date.now() + params.p_window_ms).toISOString() }],
      error: null,
    };
  }
  return { data: null, error: null };
});

const mockMakeChain = () => {
  const chain = {};
  ['select', 'eq', 'update', 'delete', 'insert', 'upsert'].forEach((m) => {
    chain[m] = jest.fn(() => chain);
  });
  chain.single = jest.fn(async () => ({ data: null, error: null }));
  return chain;
};

jest.mock('@supabase/supabase-js', () => ({
  createClient: () => ({
    rpc: mockRpc,
    from: () => mockMakeChain(),
    auth: { getUser: jest.fn(async () => ({ data: { user: null }, error: null })) },
  }),
}));

const request = require('supertest');
const app = require('../src/server');
const atsService = require('../src/services/atsService');

const validBody = { resumeText: 'Experienced engineer. '.repeat(20), jobTitle: 'Software Engineer' };

describe('/api/ats/public-score — shared rate limit + hardening', () => {
  beforeEach(() => {
    mockCounters.clear();
    jest.clearAllMocks();
  });

  test('6th request from the same IP within the hour returns 429 consistently', async () => {
    const spy = jest.spyOn(atsService, 'quickScoreFromText');

    const statuses = [];
    for (let i = 0; i < 6; i++) {
      const res = await request(app).post('/api/ats/public-score').send(validBody);
      statuses.push(res.status);
    }

    expect(statuses.slice(0, 5)).toEqual([200, 200, 200, 200, 200]);
    expect(statuses[5]).toBe(429);
    // The blocked 6th request never reached the scorer.
    expect(spy).toHaveBeenCalledTimes(5);
  });

  test('the limit is served from the shared store (rpc), not in-memory', async () => {
    await request(app).post('/api/ats/public-score').send(validBody);
    expect(mockRpc).toHaveBeenCalledWith('increment_rate_limit', expect.objectContaining({
      p_key: expect.stringContaining('rl:ats-hour:'),
    }));
  });

  test('oversized resume text is rejected (400) before any scoring', async () => {
    const spy = jest.spyOn(atsService, 'quickScoreFromText');
    const res = await request(app)
      .post('/api/ats/public-score')
      .send({ resumeText: 'x'.repeat(15001), jobTitle: 'Engineer' });

    expect(res.status).toBe(400);
    expect(spy).not.toHaveBeenCalled();
  });

  test('oversized request body is rejected (413) before any scoring', async () => {
    const spy = jest.spyOn(atsService, 'quickScoreFromText');
    const res = await request(app)
      .post('/api/ats/public-score')
      .send({ resumeText: 'x'.repeat(40 * 1024), jobTitle: 'Engineer' });

    expect(res.status).toBe(413);
    expect(spy).not.toHaveBeenCalled();
  });
});
