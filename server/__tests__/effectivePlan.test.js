const { effectivePlan } = require('../src/middleware/effectivePlan');

/* The .edu student program is gone, but its columns still exist on
   user_profiles and old rows can still carry values in them. */
const STALE_STUDENT_FLAGS = {
  is_student: true,
  student_expires_at: new Date(Date.now() - 86400000).toISOString(),
};

describe('effectivePlan', () => {
  test('null/missing profile -> free', () => {
    expect(effectivePlan(null)).toBe('free');
    expect(effectivePlan({})).toBe('free');
  });

  test('plans pass through', () => {
    expect(effectivePlan({ plan: 'free' })).toBe('free');
    expect(effectivePlan({ plan: 'pro' })).toBe('pro');
    expect(effectivePlan({ plan: 'premium' })).toBe('premium');
  });

  test('leftover student columns no longer downgrade anyone', () => {
    // These rows used to revert to free once the grant lapsed. With the program
    // removed those flags are inert data that nothing may read again.
    expect(effectivePlan({ plan: 'pro', ...STALE_STUDENT_FLAGS })).toBe('pro');
    expect(effectivePlan({ plan: 'premium', ...STALE_STUDENT_FLAGS })).toBe('premium');
  });
});
