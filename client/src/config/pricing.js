/**
 * Pricing — the single source of truth for the landing teaser and /pricing.
 *
 * Every entitlement listed here is enforced server-side. Before adding a line,
 * check it against the middleware that actually gates it:
 *   requirePlan()      routes/ai.js, routes/pdf.js, routes/share.js
 *   templateAccess.js  free vs paid templates
 *   credits.js         FREE_MONTHLY_CREDITS, unlimited for pro/premium
 * A feature that is not enforced there does not belong on this page.
 *
 * Template counts come from template-registry.json at build time (see
 * vite.config.js) so a newly shipped template cannot leave this page stale.
 *
 * Two tiers, not three. The old Premium differed from Pro by a single feature
 * (translation) at double the price, which is an add-on rather than a tier —
 * translation now sits in Pro and Premium is retired. Existing Premium
 * subscribers keep everything: requirePlan still allows 'premium', and
 * effectivePlan() honours an explicit premium plan.
 */

/* Billing periods. A job search is bursty and finite, so Pro is sold by the
   week and quarter as well as monthly. Only periods with a Stripe price behind
   them are offered — the pricing page filters against GET /api/billing/plans. */
const TEMPLATE_COUNT = __TEMPLATE_COUNT__;
const FREE_TEMPLATE_COUNT = __FREE_TEMPLATE_COUNT__;

export const INTERVALS = [
  {
    id: 'monthly',
    label: 'Monthly',
    price: '$24',
    unit: '/month',
    // Shown under the price to make the comparison concrete.
    note: 'Billed monthly, cancel any time',
  },
  {
    id: 'quarterly',
    label: 'Quarterly',
    price: '$54',
    unit: '/3 months',
    note: '$18 a month — most job searches run about a quarter',
    badge: 'Save 25%',
  },
  {
    id: 'weekly',
    label: 'Weekly',
    price: '$9',
    unit: '/week',
    note: 'For a short, focused push',
  },
];

export const DEFAULT_INTERVAL = 'quarterly';

export const FREE_PLAN = {
  id: 'free',
  name: 'Free',
  price: '$0',
  unit: '',
  tagline: 'Enough to build, score and export a real resume.',
  cta: 'Create a free account',
  ctaLink: '/register',
  features: [
    '5 AI credits every month',
    `${FREE_TEMPLATE_COUNT} templates`,
    'ATS score checker',
    'Job tracker and score history',
    'Unlimited PDF and DOCX resume export',
  ],
};

export const PRO_PLAN = {
  id: 'pro',
  name: 'Pro',
  tagline: 'For an active search, where you tailor every application.',
  cta: 'Upgrade to Pro',
  popular: true,
  features: [
    'Unlimited AI credits',
    `All ${TEMPLATE_COUNT} templates`,
    'Cover letter PDF and DOCX export',
    'Shareable resume links',
    'Resume translation, including Arabic, Hebrew and Chinese',
    'Everything in Free',
  ],
};

export const PLANS = [FREE_PLAN, PRO_PLAN];

/**
 * Feature matrix for the comparison table. `free` and `pro` are either a
 * boolean or a string shown in the cell.
 */
export const COMPARISON = [
  {
    group: 'Writing and AI',
    rows: [
      { label: 'AI credits per month', free: '5', pro: 'Unlimited' },
      { label: 'AI resume builder', free: true, pro: true },
      { label: 'Summary and bullet writer', free: true, pro: true },
      { label: 'Skill suggestions', free: true, pro: true },
      { label: 'Tailor a resume to a job', free: true, pro: true },
      { label: 'Cover letter writer', free: true, pro: true },
      { label: 'Follow-up email writer', free: true, pro: true },
      { label: 'Interview question practice', free: true, pro: true },
    ],
  },
  {
    group: 'Scoring',
    rows: [
      { label: 'ATS compatibility score', free: true, pro: true },
      { label: 'Missing keyword report', free: true, pro: true },
      { label: 'Score history over time', free: true, pro: true },
    ],
  },
  {
    group: 'Templates and export',
    rows: [
      { label: 'Templates', free: String(FREE_TEMPLATE_COUNT), pro: `All ${TEMPLATE_COUNT}` },
      { label: 'PDF and DOCX resume export', free: 'Unlimited', pro: 'Unlimited' },
      { label: 'Cover letter export', free: false, pro: true },
      { label: 'Shareable resume link', free: false, pro: true },
      {
        label: 'Translation and non-Latin export',
        free: false,
        pro: true,
        hint: 'Arabic and Hebrew render right-to-left; Chinese, Cyrillic and Greek are supported.',
      },
    ],
  },
  {
    group: 'Applications',
    rows: [
      { label: 'Job tracker', free: 'Unlimited', pro: 'Unlimited' },
      { label: 'Export your data', free: true, pro: true },
    ],
  },
];

export const FAQ = [
  {
    q: 'What counts as an AI credit?',
    a: 'One credit is one AI request — generating a summary, rewriting a bullet, '
      + 'scoring against a job, drafting a cover letter or an email. Editing your '
      + 'resume by hand, exporting it and using the job tracker never cost credits.',
  },
  {
    q: 'Can I export on the free plan?',
    a: 'Yes. PDF and DOCX resume export is unlimited on every plan, including free. '
      + 'Cover letter export and shareable links are Pro.',
  },
  {
    q: 'What happens when I cancel?',
    a: 'You keep access until the end of the period you have paid for, then move '
      + 'back to the free plan. Your resumes, exports and tracked applications stay '
      + 'in your account.',
  },
  {
    q: 'Do you offer a student discount?',
    a: 'Verify a .edu address from your account and Pro unlocks free for six months. '
      + 'No card required.',
  },
  {
    q: 'Is the ATS score tied to a specific system?',
    a: 'No. It estimates how applicant tracking systems commonly parse and rank a '
      + 'resume — keyword coverage, section structure, date consistency and '
      + 'formatting that parsers tend to mishandle. It is not affiliated with any '
      + 'single vendor, and no score can guarantee an interview.',
  },
];
