// Deterministic post-build prerender for the public routes.
//
// We intentionally do NOT use react-snap / vite-plugin-prerender: those spin up
// headless Chromium during the build, which is fragile on Vercel and can break
// production deploys. Instead we inject route-specific <head> SEO tags and a
// static hero/content block into copies of the built index.html. Crawlers and
// social scrapers (which don't run JS) get real HTML; in the browser, React's
// createRoot replaces the #root content as usual.
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { resolveSiteOrigin } from './site-origin.mjs';
import { homepageJsonLd } from '../src/config/structuredData.mjs';

const require = createRequire(import.meta.url);
const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const BUILD = join(ROOT, 'build');
const SITE_URL = resolveSiteOrigin();
const OG_IMAGE = `${SITE_URL}/og-image.png`;

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;');
// Strip tags for use inside attributes/JSON-LD without dragging in a parser.
const text = (s) => String(s).replace(/<[^>]*>/g, '');

const registry = require(join(ROOT, '../template-registry.json'));
const TEMPLATES = registry.templates;

/**
 * The page copy, loaded from the very module the React pages render.
 *
 * templateContent.js is an ES module that imports the registry through Vite's
 * JSON handling, which plain Node can't resolve - so its imports are swapped
 * for the server-side registry loader (same data, CommonJS) and the body is
 * evaluated. Duplicating the copy here instead would guarantee the prerendered
 * HTML and the rendered page drift apart.
 */
const { getTemplate } = require(join(ROOT, '../server/src/templateRegistry'));
const contentSrc = readFileSync(join(ROOT, 'src/config/templateContent.js'), 'utf8')
  .replace(/^import[\s\S]*?from '\.\/templates';\n/m, '')
  .replace(/^export /gm, '');
const { templateContent, templateFacts } = (new Function(
  'getTemplate', 'TEMPLATES',
  `${contentSrc}\nreturn { templateContent, templateFacts };`,
))(getTemplate, TEMPLATES);

const HOME_DESC = `Score your resume against applicant tracking systems, fix what they flag, and export a clean PDF or DOCX. 11 AI tools and ${TEMPLATES.length} templates, free to start.`;

const routes = [
  {
    out: ['index.html'],
    path: '/',
    title: 'CV Optimizer — Build ATS-Optimized Resumes with AI',
    description: HOME_DESC,
    // Same builder LandingPage.jsx hands to <Seo>, so the crawler HTML and the
    // hydrated DOM carry identical structured data.
    jsonLd: homepageJsonLd({
      siteUrl: SITE_URL,
      description: HOME_DESC,
      freeTemplateCount: TEMPLATES.filter((t) => !t.premium).length,
      templateCount: TEMPLATES.length,
    }),
    // Must mirror the hero in LandingPage.jsx — same copy, same class names.
    // A crawler that does not run JS sees only this, so drift here means the
    // indexed page and the real page make different promises.
    hero: `
      <section class="lp-hero">
        <div class="lp-hero-inner">
          <div class="lp-hero-copy">
            <a class="lp-pill" href="#ats-checker">Free ATS check, no account needed</a>
            <h1 class="display-1">Build a resume that clears the filter</h1>
            <p class="lead lp-hero-lead">Most applications are read by software before a person sees them. CV Optimizer scores your resume the way those systems do, shows you what is missing, and helps you fix it.</p>
            <div class="lp-hero-actions">
              <a class="btn btn-primary btn-xl" href="/register">Start building — free</a>
              <a class="btn btn-secondary btn-xl" href="#ats-checker">Check my score</a>
            </div>
            <p class="lp-hero-trust">No card required. 5 AI credits every month on the free plan.</p>
          </div>
        </div>
      </section>`,
  },
  {
    out: ['pricing.html', 'pricing/index.html'],
    path: '/pricing',
    title: 'Pricing — CV Optimizer',
    description:
      'Start free with 5 AI credits a month, 8 templates and unlimited PDF and DOCX export. '
      + 'Pro unlocks unlimited AI, every template and resume translation.',
    hero: `
      <section class="pr-head">
        <h1>One plan, priced for a job search</h1>
        <p>Everything you need to build and export a resume is free. Pro is for when you are applying often enough that tailoring each one matters.</p>
        <div class="pr-plans">
          <div class="pr-plan"><h2>Free</h2><p>$0 — 5 AI credits a month, ${TEMPLATES.filter((t) => !t.premium).length} templates, ATS score checker, job tracker, unlimited PDF and DOCX export.</p></div>
          <div class="pr-plan"><h2>Pro</h2><p>$54 per quarter, $24 monthly or $9 weekly — unlimited AI credits, all ${TEMPLATES.length} templates, cover letter export, shareable links and resume translation.</p></div>
        </div>
        <a class="btn btn-primary btn-lg" href="/register">Create a free account</a>
      </section>`,
  },
  {
    out: ['login.html', 'login/index.html'],
    path: '/login',
    title: 'Sign In — CV Optimizer',
    description: 'Sign in to CV Optimizer to build, score, and tailor your ATS-optimized resume.',
    hero: `
      <section class="au">
        <div class="au-inner">
          <div class="au-card">
            <h1 class="au-title">Welcome back</h1>
            <p class="au-sub">Sign in to pick up where you left off.</p>
          </div>
          <p class="au-alt">New here? <a href="/register">Create a free account</a></p>
        </div>
      </section>`,
  },
  {
    out: ['register.html', 'register/index.html'],
    path: '/register',
    title: 'Create Your Free Account — CV Optimizer',
    description:
      'Create a free CV Optimizer account and build an ATS-optimized resume with AI — free to start, no credit card required.',
    hero: `
      <section class="au">
        <div class="au-inner">
          <div class="au-card">
            <h1 class="au-title">Create your account</h1>
            <p class="au-sub">Free to start. No card required.</p>
          </div>
          <p class="au-alt">Already have an account? <a href="/login">Sign in</a></p>
        </div>
      </section>`,
  },
];

// ---- Public template pages -------------------------------------------------
// These exist to be found in search, so the HTML a crawler receives without
// running JS has to carry the real copy, not an empty #root.

const GALLERY_DESC = `Browse ${TEMPLATES.length} professional résumé templates, each ATS-friendly `
  + 'and free to preview. Pick a design, fill it in with AI help, and export to PDF or DOCX.';

routes.push({
  out: ['templates.html', 'templates/index.html'],
  path: '/templates',
  title: `Free Résumé Templates — ATS-Friendly, ${TEMPLATES.length} Designs | CV Optimizer`,
  description: GALLERY_DESC,
  jsonLd: {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'Résumé Templates',
    description: GALLERY_DESC,
    url: `${SITE_URL}/templates`,
    isPartOf: { '@type': 'WebSite', name: 'CV Optimizer', url: SITE_URL },
    mainEntity: {
      '@type': 'ItemList',
      numberOfItems: TEMPLATES.length,
      itemListElement: TEMPLATES.map((t, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        name: `${t.name} résumé template`,
        url: `${SITE_URL}/templates/${t.id}`,
      })),
    },
  },
  hero: `
      <section class="templates-page">
        <div class="templates-container">
          <div class="templates-header">
            <h1>Résumé templates</h1>
            <p>${esc(GALLERY_DESC)}</p>
          </div>
          <ul class="templates-grid">
            ${TEMPLATES.map((t) => `<li><a href="/templates/${t.id}">
              <img src="/template-previews/${t.id}.png" alt="${esc(t.name)} résumé template preview" width="1191" height="1685" loading="lazy" />
              <h2>${esc(t.name)}</h2>
              <p>${esc(text(templateContent(t.id).tagline))}</p>
            </a></li>`).join('\n            ')}
          </ul>
        </div>
      </section>`,
});

for (const t of TEMPLATES) {
  const { tagline, intro, bestFor, faqs } = templateContent(t.id);
  const facts = templateFacts(t.id);
  const url = `${SITE_URL}/templates/${t.id}`;
  const image = `${SITE_URL}/template-previews/${t.id}-og.png`;

  routes.push({
    out: [`templates/${t.id}.html`, `templates/${t.id}/index.html`],
    path: `/templates/${t.id}`,
    title: `${t.name} Résumé Template — Free ATS-Friendly Download | CV Optimizer`,
    description: tagline,
    image,
    jsonLd: [
      {
        '@context': 'https://schema.org',
        '@type': 'SoftwareApplication',
        name: `${t.name} Résumé Template`,
        description: tagline,
        url,
        applicationCategory: 'BusinessApplication',
        applicationSubCategory: 'Résumé Builder',
        operatingSystem: 'Web browser',
        image,
        inLanguage: 'en',
        isAccessibleForFree: !t.premium,
        offers: {
          '@type': 'Offer',
          price: '0',
          priceCurrency: 'USD',
          description: t.premium
            ? 'Free to preview and edit; exporting with this template requires CV Optimizer Pro.'
            : 'Free to use, edit and export.',
        },
        featureList: facts.map(([k, v]) => `${k}: ${v}`),
        publisher: { '@type': 'Organization', name: 'CV Optimizer', url: SITE_URL },
      },
      {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: faqs.map(({ q, a }) => ({
          '@type': 'Question',
          name: q,
          acceptedAnswer: { '@type': 'Answer', text: a },
        })),
      },
      {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE_URL}/` },
          { '@type': 'ListItem', position: 2, name: 'Résumé templates', item: `${SITE_URL}/templates` },
          { '@type': 'ListItem', position: 3, name: `${t.name} template`, item: url },
        ],
      },
    ],
    hero: `
      <section class="tpl-detail">
        <div class="tpl-detail-container">
          <nav aria-label="Breadcrumb"><a href="/templates">All templates</a></nav>
          <h1>${esc(t.name)} résumé template</h1>
          <p>${esc(text(tagline))}</p>
          ${intro.map((p) => `<p>${esc(text(p))}</p>`).join('\n          ')}
          ${bestFor.length ? `<h2>Best for</h2>\n          <ul>${bestFor.map((b) => `<li>${esc(b)}</li>`).join('')}</ul>` : ''}
          <p><a class="btn btn-primary btn-lg" href="/register?template=${t.id}">Use this template</a></p>
          <img src="/template-previews/${t.id}.png" alt="${esc(t.name)} résumé template, shown with sample content" width="1191" height="1685" />
          <h2>Template details</h2>
          <dl>${facts.map(([k, v]) => `<dt>${esc(k)}</dt><dd>${esc(v)}</dd>`).join('')}</dl>
          <h2>Questions about the ${esc(t.name)} template</h2>
          ${faqs.map(({ q, a }) => `<h3>${esc(q)}</h3><p>${esc(text(a))}</p>`).join('\n          ')}
        </div>
      </section>`,
  });
}

// Every tag carries data-rh so react-helmet-async takes ownership on mount and
// *replaces* it. Without that the page ends up with the prerendered tag and the
// React one side by side - two titles, two descriptions, two canonicals.
function seoBlock({ title, description, path, image = OG_IMAGE, jsonLd }) {
  const url = `${SITE_URL}${path}`;
  const ld = (jsonLd ? [].concat(jsonLd) : [])
    .map((block) => `\n    <script type="application/ld+json">${
      JSON.stringify(block).replace(/</g, '\\u003c')
    }</script>`)
    .join('');
  return `<!--SEO-START-->
    <title data-rh="true">${esc(title)}</title>
    <meta data-rh="true" name="description" content="${esc(description)}" />
    <link data-rh="true" rel="canonical" href="${url}" />
    <meta data-rh="true" property="og:type" content="website" />
    <meta data-rh="true" property="og:site_name" content="CV Optimizer" />
    <meta data-rh="true" property="og:title" content="${esc(title)}" />
    <meta data-rh="true" property="og:description" content="${esc(description)}" />
    <meta data-rh="true" property="og:url" content="${url}" />
    <meta data-rh="true" property="og:image" content="${esc(image)}" />
    <meta data-rh="true" property="og:image:width" content="1200" />
    <meta data-rh="true" property="og:image:height" content="630" />
    <meta data-rh="true" name="twitter:card" content="summary_large_image" />
    <meta data-rh="true" name="twitter:title" content="${esc(title)}" />
    <meta data-rh="true" name="twitter:description" content="${esc(description)}" />
    <meta data-rh="true" name="twitter:image" content="${esc(image)}" />${ld}
    <!--SEO-END-->`;
}

const SEO_RE = /<!--SEO-START-->[\s\S]*?<!--SEO-END-->/;
const base = readFileSync(join(BUILD, 'index.html'), 'utf8');

if (!SEO_RE.test(base) || !base.includes('<div id="root"></div>')) {
  throw new Error('prerender: expected SEO markers and an empty #root in build/index.html');
}

let files = 0;
for (const route of routes) {
  const html = base
    .replace(SEO_RE, seoBlock(route))
    .replace('<div id="root"></div>', `<div id="root">${route.hero}</div>`);
  for (const out of route.out) {
    const file = join(BUILD, out);
    mkdirSync(dirname(file), { recursive: true });
    writeFileSync(file, html);
    files += 1;
  }
}

// ---- Sitemap ---------------------------------------------------------------
// Generated from the same route list, so a new template can never ship with a
// page but no sitemap entry (or an entry pointing at a page that isn't built).
const PRIORITY = {
  '/': '1.0', '/templates': '0.9', '/register': '0.8', '/login': '0.5',
};
const FREQ = {
  '/': 'weekly', '/templates': 'weekly', '/privacy': 'yearly', '/terms': 'yearly',
  '/refund': 'yearly',
};

const sitemapPaths = [
  ...routes.map((r) => r.path),
  // Legal pages are served by the SPA fallback rather than prerendered, but
  // they are indexable and carry their own canonical.
  '/privacy', '/terms', '/refund',
];

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${[...new Set(sitemapPaths)].map((p) => `  <url>
    <loc>${SITE_URL}${p}</loc>
    <changefreq>${FREQ[p] || (p.startsWith('/templates/') ? 'monthly' : 'monthly')}</changefreq>
    <priority>${PRIORITY[p] || (p.startsWith('/templates/') ? '0.7' : '0.3')}</priority>
  </url>`).join('\n')}
</urlset>
`;
writeFileSync(join(BUILD, 'sitemap.xml'), sitemap);

// ---- robots.txt ------------------------------------------------------------
// The file ships from public/ with a default Sitemap line, but that line is an
// absolute URL and public/ is static — it once pointed crawlers at
// cv-optimizer.vercel.app, a different site entirely. Pin it to the origin
// this build resolved, same as every canonical above.
{
  const robotsFile = join(BUILD, 'robots.txt');
  const robots = readFileSync(robotsFile, 'utf8');
  if (!/^Sitemap: .+$/m.test(robots)) {
    throw new Error('prerender: robots.txt has no Sitemap line to rewrite');
  }
  writeFileSync(robotsFile, robots.replace(/^Sitemap: .+$/m, `Sitemap: ${SITE_URL}/sitemap.xml`));
}

console.log(`prerender: wrote ${files} HTML file(s) across ${routes.length} public routes (site: ${SITE_URL})`);

/* A share card is invisible until something 404s, and then it is invisible for
   good — the platforms cache the miss. Fail the build instead. */
{
  const og = new URL('../build/og-image.png', import.meta.url);
  if (!existsSync(og)) {
    console.error('prerender: og-image.png is missing from the build output; '
      + 'every share card would render without an image.');
    process.exit(1);
  }
  if (!/^https:\/\//.test(SITE_URL) && process.env.VERCEL) {
    console.error(`prerender: refusing to ship absolute URLs pointing at ${SITE_URL}. `
      + 'Set VITE_SITE_URL to this deployment\'s domain.');
    process.exit(1);
  }
  console.log(`prerender: share image ${SITE_URL}/og-image.png`);
}
console.log(`prerender: sitemap.xml lists ${new Set(sitemapPaths).size} URLs`);
