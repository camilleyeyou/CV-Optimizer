/**
 * JSON-LD for the landing page, shared verbatim between the prerenderer
 * (scripts/prerender.mjs, plain Node) and the client (<Seo> on LandingPage) —
 * one builder, so the HTML a crawler receives and the DOM after hydration
 * carry byte-identical structured data.
 *
 * Keep this module free of Vite defines, JSX and imports: Node has to be able
 * to load it directly. That is also why prices are mirrored from
 * config/pricing.js instead of imported — pricing.js bakes template counts in
 * through Vite defines and cannot resolve outside a Vite build. If a price
 * changes there, it changes here.
 *
 * Same rule as everywhere else in the SEO surface: no invented data. No
 * aggregateRating, no reviews, nothing we do not actually have —
 * verify-seo.mjs fails the build if any sneak in.
 */
export function homepageJsonLd({ siteUrl, description, freeTemplateCount, templateCount }) {
  return [
    {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: 'CV Optimizer',
      url: `${siteUrl}/`,
    },
    {
      '@context': 'https://schema.org',
      '@type': 'SoftwareApplication',
      name: 'CV Optimizer',
      description,
      url: `${siteUrl}/`,
      applicationCategory: 'BusinessApplication',
      applicationSubCategory: 'Résumé Builder',
      operatingSystem: 'Web browser',
      image: `${siteUrl}/og-image.png`,
      inLanguage: 'en',
      isAccessibleForFree: true,
      offers: [
        {
          '@type': 'Offer',
          name: 'Free',
          price: '0',
          priceCurrency: 'USD',
          description: `5 AI credits a month, ${freeTemplateCount} templates, the ATS score checker, a job tracker and unlimited PDF and DOCX export.`,
        },
        {
          '@type': 'Offer',
          name: 'Pro — monthly',
          price: '24',
          priceCurrency: 'USD',
          description: `Unlimited AI credits, all ${templateCount} templates, cover letter export, shareable links and resume translation. Billed monthly.`,
        },
        {
          '@type': 'Offer',
          name: 'Pro — quarterly',
          price: '54',
          priceCurrency: 'USD',
          description: 'Everything in Pro, billed once per quarter.',
        },
        {
          '@type': 'Offer',
          name: 'Pro — weekly',
          price: '9',
          priceCurrency: 'USD',
          description: 'Everything in Pro, billed weekly for a short, focused push.',
        },
      ],
      publisher: { '@type': 'Organization', name: 'CV Optimizer', url: siteUrl },
    },
  ];
}

export default homepageJsonLd;
