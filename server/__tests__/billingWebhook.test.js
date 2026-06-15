// Stripe webhook: signature verification + idempotency + plan upgrade.
// (Vars referenced inside jest.mock must be prefixed with `mock`.)

const mockSeen = new Set();
const mockUpdateCalls = [];
const mockConstructEvent = jest.fn();

jest.mock('../src/services/stripeService', () => ({
  constructEvent: (...args) => mockConstructEvent(...args),
  planForPrice: () => 'pro',
  createCheckoutSession: jest.fn(),
  createPortalSession: jest.fn(),
}));

jest.mock('@supabase/supabase-js', () => ({
  createClient: () => ({
    from: (table) => {
      if (table === 'stripe_processed_events') {
        return {
          select: () => ({
            eq: (_col, id) => ({
              single: async () =>
                mockSeen.has(id)
                  ? { data: { event_id: id }, error: null }
                  : { data: null, error: { code: 'PGRST116' } },
            }),
          }),
          insert: async (row) => {
            mockSeen.add(row.event_id);
            return { error: null };
          },
        };
      }
      if (table === 'user_profiles') {
        return {
          update: (vals) => ({ eq: async () => { mockUpdateCalls.push(vals); return { error: null }; } }),
          select: () => ({ eq: () => ({ single: async () => ({ data: { id: 'u1', stripe_customer_id: null }, error: null }) }) }),
        };
      }
      return { select: () => ({ eq: () => ({ single: async () => ({ data: null, error: null }) }) }) };
    },
  }),
}));

const { webhook } = require('../src/controllers/billingController');

const makeRes = () => {
  const res = { statusCode: 200, body: null };
  res.status = jest.fn((c) => { res.statusCode = c; return res; });
  res.json = jest.fn((b) => { res.body = b; return res; });
  res.send = jest.fn((b) => { res.body = b; return res; });
  return res;
};
const makeReq = () => ({ headers: { 'stripe-signature': 'sig_test' }, body: Buffer.from('{}') });

const checkoutEvent = {
  id: 'evt_checkout_1',
  type: 'checkout.session.completed',
  data: { object: { client_reference_id: 'u1', metadata: { userId: 'u1', plan: 'pro' }, customer: 'cus_1', subscription: 'sub_1' } },
};

describe('Stripe webhook', () => {
  beforeEach(() => {
    mockSeen.clear();
    mockUpdateCalls.length = 0;
    jest.clearAllMocks();
  });

  test('rejects a request with an invalid signature (400) and does no work', async () => {
    mockConstructEvent.mockImplementation(() => { throw new Error('Webhook signature verification failed'); });
    const res = makeRes();
    await webhook(makeReq(), res);
    expect(res.statusCode).toBe(400);
    expect(mockUpdateCalls).toHaveLength(0);
  });

  test('checkout.session.completed upgrades the user free -> pro', async () => {
    mockConstructEvent.mockReturnValue(checkoutEvent);
    const res = makeRes();
    await webhook(makeReq(), res);
    expect(res.statusCode).toBe(200);
    expect(mockUpdateCalls).toHaveLength(1);
    expect(mockUpdateCalls[0]).toMatchObject({ plan: 'pro', stripe_customer_id: 'cus_1', stripe_subscription_id: 'sub_1' });
  });

  test('is idempotent: a re-delivered event is processed exactly once', async () => {
    mockConstructEvent.mockReturnValue(checkoutEvent);
    const res1 = makeRes();
    await webhook(makeReq(), res1);
    const res2 = makeRes();
    await webhook(makeReq(), res2);

    expect(mockUpdateCalls).toHaveLength(1); // not twice
    expect(res2.body).toEqual({ received: true, duplicate: true });
  });
});
