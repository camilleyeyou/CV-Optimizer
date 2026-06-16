// ─────────────────────────────────────────────────────────────────────────────
// FILL THESE IN before launch. They are the only company-specific values used
// across the Privacy Policy, Terms of Service, and Refund Policy pages and the
// footer. The legal copy itself is drafted in client/src/pages/legal/*.
//
// NOTE: These pages are reasonable, app-accurate drafts — NOT legal advice.
// Have a lawyer review them and confirm your obligations for your jurisdiction.
// ─────────────────────────────────────────────────────────────────────────────
import { SITE_URL } from './site';

export const LEGAL = {
  // Your legal/business name. Using the product name while operating as an
  // individual is fine; switch to a registered entity name if you form one.
  companyName: 'CV Optimizer',

  // The product/brand name shown to users.
  productName: 'CV Optimizer',

  // Support / privacy / legal contact inbox.
  supportEmail: 'ghislainyeyou@gmail.com',

  // Mailing address (optional — leave '' to omit it from the policies; add one
  // if a payment processor or app store requires it).
  contactAddress: '',

  // Governing law / jurisdiction for the Terms. Soft default for now — you can
  // narrow this to a specific US state (e.g. "the State of Delaware, USA").
  governingLaw: 'the United States',

  // Last-updated date shown on each policy. Update when you change the policies.
  effectiveDate: 'June 16, 2026',

  // Public site URL (from config/site.js — set VITE_SITE_URL in production).
  siteUrl: SITE_URL,
};
