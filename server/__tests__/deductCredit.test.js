// Verify requireCredits uses the atomic deduct_credit RPC so concurrent
// requests can't double-spend. The mocked rpc emulates the atomic
// UPDATE ... WHERE ai_credits > 0 RETURNING (decrement-or-null).
// (Vars referenced inside jest.mock must be prefixed with `mock`.)

let mockCredits = 1;

const mockRpc = jest.fn(async (fn) => {
  if (fn === 'deduct_credit') {
    // Synchronous check-and-decrement (no await between) mirrors the
    // row-locked atomicity of the SQL function.
    if (mockCredits > 0) {
      mockCredits -= 1;
      return { data: mockCredits, error: null };
    }
    return { data: null, error: null };
  }
  return { data: null, error: null };
});

const mockProfile = {
  id: 'user-1',
  plan: 'free',
  ai_credits: 1,
  is_student: false,
  student_expires_at: null,
  credits_reset_at: new Date().toISOString(), // recent -> no monthly reset
};

const mockFrom = () => {
  const ctx = {};
  ctx.select = () => ctx;
  ctx.eq = () => ctx;
  ctx.single = async () => ({ data: { ...mockProfile }, error: null });
  ctx.update = () => ({ eq: async () => ({ data: null, error: null }) });
  ctx.insert = () => ({ select: () => ({ single: async () => ({ data: { ...mockProfile }, error: null }) }) });
  return ctx;
};

jest.mock('@supabase/supabase-js', () => ({
  createClient: () => ({ from: mockFrom, rpc: mockRpc }),
}));

const { requireCredits } = require('../src/middleware/credits');

const makeRes = () => {
  const res = { statusCode: 200 };
  res.status = jest.fn((c) => { res.statusCode = c; return res; });
  res.json = jest.fn(() => res);
  res.on = jest.fn();
  return res;
};

describe('requireCredits — atomic deduction', () => {
  beforeEach(() => {
    mockCredits = 1;
    jest.clearAllMocks();
  });

  test('two simultaneous requests for a user with 1 credit: exactly one success, one 403', async () => {
    const req1 = { user: { id: 'user-1' } };
    const req2 = { user: { id: 'user-1' } };
    const res1 = makeRes();
    const res2 = makeRes();
    const next1 = jest.fn();
    const next2 = jest.fn();

    await Promise.all([
      requireCredits(req1, res1, next1),
      requireCredits(req2, res2, next2),
    ]);

    const successes = [next1, next2].filter((n) => n.mock.calls.length === 1).length;
    const forbidden = [res1, res2].filter((r) => r.statusCode === 403).length;

    expect(successes).toBe(1);
    expect(forbidden).toBe(1);
    // Never decremented below zero.
    expect(mockCredits).toBe(0);
  });

  test('a single request with 1 credit succeeds and reports remaining = 0', async () => {
    const req = { user: { id: 'user-1' } };
    const res = makeRes();
    const next = jest.fn();

    await requireCredits(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(req.creditsRemaining).toBe(0);
    expect(mockRpc).toHaveBeenCalledWith('deduct_credit', { p_user: 'user-1' });
  });

  test('a request with 0 credits is rejected with 403 and no further deduction', async () => {
    mockCredits = 0;
    const req = { user: { id: 'user-1' } };
    const res = makeRes();
    const next = jest.fn();

    await requireCredits(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.statusCode).toBe(403);
  });
});
