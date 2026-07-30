// Billing periods: price resolution per interval, and the gating change that
// came with collapsing three plans to two.
//
// This is money-handling code with no type checking behind it, so the mapping
// between a plan, a billing period and a Stripe price id is asserted directly.

const ENV_KEYS = [
  'STRIPE_PRICE_PRO',
  'STRIPE_PRICE_PRO_QUARTERLY',
  'STRIPE_PRICE_PRO_WEEKLY',
  'STRIPE_PRICE_PREMIUM',
];

let saved;

beforeEach(() => {
  saved = Object.fromEntries(ENV_KEYS.map((k) => [k, process.env[k]]));
  ENV_KEYS.forEach((k) => delete process.env[k]);
  jest.resetModules();
});

afterEach(() => {
  ENV_KEYS.forEach((k) => {
    if (saved[k] === undefined) delete process.env[k];
    else process.env[k] = saved[k];
  });
});

const load = () => require('../src/services/stripeService');

describe('priceForPlan', () => {
  test('resolves a distinct price per billing period', () => {
    process.env.STRIPE_PRICE_PRO = 'price_mo';
    process.env.STRIPE_PRICE_PRO_QUARTERLY = 'price_qtr';
    process.env.STRIPE_PRICE_PRO_WEEKLY = 'price_wk';
    const s = load();

    expect(s.priceForPlan('pro', 'monthly')).toBe('price_mo');
    expect(s.priceForPlan('pro', 'quarterly')).toBe('price_qtr');
    expect(s.priceForPlan('pro', 'weekly')).toBe('price_wk');
  });

  test('defaults to monthly when no period is given', () => {
    process.env.STRIPE_PRICE_PRO = 'price_mo';
    expect(load().priceForPlan('pro')).toBe('price_mo');
  });

  test('returns null for a period with no price configured', () => {
    process.env.STRIPE_PRICE_PRO = 'price_mo';
    // Guards the checkout endpoint: a period we have not created in Stripe must
    // be refused up front rather than 500ing inside the Stripe call.
    expect(load().priceForPlan('pro', 'weekly')).toBeNull();
  });

  test('returns null for an unknown plan', () => {
    process.env.STRIPE_PRICE_PRO = 'price_mo';
    expect(load().priceForPlan('enterprise', 'monthly')).toBeNull();
  });

  test('reads the environment per call, so a late-added key is picked up', () => {
    const s = load();
    expect(s.priceForPlan('pro', 'quarterly')).toBeNull();
    process.env.STRIPE_PRICE_PRO_QUARTERLY = 'price_qtr';
    expect(s.priceForPlan('pro', 'quarterly')).toBe('price_qtr');
  });
});

describe('availableIntervals', () => {
  test('lists only periods that have a price behind them', () => {
    process.env.STRIPE_PRICE_PRO = 'price_mo';
    process.env.STRIPE_PRICE_PRO_QUARTERLY = 'price_qtr';
    expect(load().availableIntervals('pro')).toEqual(['monthly', 'quarterly']);
  });

  test('is empty when nothing is configured, so the UI offers nothing', () => {
    expect(load().availableIntervals('pro')).toEqual([]);
  });
});

describe('planForPrice', () => {
  test('maps any period of a plan back to that plan', () => {
    process.env.STRIPE_PRICE_PRO = 'price_mo';
    process.env.STRIPE_PRICE_PRO_QUARTERLY = 'price_qtr';
    process.env.STRIPE_PRICE_PRO_WEEKLY = 'price_wk';
    const s = load();

    // The webhook resolves a subscription's plan from its price id, so every
    // period has to map home or a quarterly subscriber silently drops to free.
    for (const id of ['price_mo', 'price_qtr', 'price_wk']) {
      expect(s.planForPrice(id)).toBe('pro');
    }
  });

  test('still resolves legacy premium subscriptions', () => {
    process.env.STRIPE_PRICE_PREMIUM = 'price_premium';
    // Premium is retired but existing subscribers keep billing; their webhooks
    // must not fall through to null and revert them to free.
    expect(load().planForPrice('price_premium')).toBe('premium');
  });

  test('returns null for an unknown or missing price', () => {
    process.env.STRIPE_PRICE_PRO = 'price_mo';
    const s = load();
    expect(s.planForPrice('price_unknown')).toBeNull();
    expect(s.planForPrice(null)).toBeNull();
    expect(s.planForPrice(undefined)).toBeNull();
  });
});

describe('plan gating after the two-tier collapse', () => {
  const routeSource = () =>
    require('fs').readFileSync(require('path').join(__dirname, '../src/routes/ai.js'), 'utf8');

  test('resume translation is available to pro, not premium-only', () => {
    const line = routeSource()
      .split('\n')
      .find((l) => l.includes('/translate-resume'));

    expect(line).toBeDefined();
    expect(line).toContain("requirePlan(['pro', 'premium'])");
  });

  test('cover letter export and share links stay pro-and-above', () => {
    const read = (f) =>
      require('fs').readFileSync(require('path').join(__dirname, '../src', f), 'utf8');

    expect(read('routes/pdf.js')).toContain("requirePlan(['pro', 'premium'])");
    expect(read('routes/share.js')).toContain("requirePlan(['pro', 'premium'])");
  });
});
