const { effectivePlan } = require('../src/middleware/effectivePlan');

const PAST = new Date(Date.now() - 86400000).toISOString();
const FUTURE = new Date(Date.now() + 86400000).toISOString();

describe('effectivePlan', () => {
  test('null/missing profile -> free', () => {
    expect(effectivePlan(null)).toBe('free');
    expect(effectivePlan({})).toBe('free');
  });

  test('manual premium survives an expired student grant with no Stripe sub', () => {
    // The exact bug: a manually-upgraded premium row that still has stale
    // student flags was being treated as free.
    expect(effectivePlan({
      plan: 'premium', is_student: true, student_expires_at: PAST, stripe_subscription_id: null,
    })).toBe('premium');
  });

  test('expired student "pro" with no Stripe sub still reverts to free', () => {
    expect(effectivePlan({
      plan: 'pro', is_student: true, student_expires_at: PAST, stripe_subscription_id: null,
    })).toBe('free');
  });

  test('expired student kept on plan when backed by a Stripe subscription', () => {
    expect(effectivePlan({
      plan: 'pro', is_student: true, student_expires_at: PAST, stripe_subscription_id: 'sub_1',
    })).toBe('pro');
  });

  test('active (non-expired) student grant keeps pro', () => {
    expect(effectivePlan({
      plan: 'pro', is_student: true, student_expires_at: FUTURE, stripe_subscription_id: null,
    })).toBe('pro');
  });

  test('plain free / pro (no student flags) pass through', () => {
    expect(effectivePlan({ plan: 'free' })).toBe('free');
    expect(effectivePlan({ plan: 'pro' })).toBe('pro');
  });
});
