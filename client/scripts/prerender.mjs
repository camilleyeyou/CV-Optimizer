// Deterministic post-build prerender for the public routes.
//
// We intentionally do NOT use react-snap / vite-plugin-prerender: those spin up
// headless Chromium during the build, which is fragile on Vercel and can break
// production deploys. Instead we inject route-specific <head> SEO tags and a
// static hero/content block into copies of the built index.html. Crawlers and
// social scrapers (which don't run JS) get real HTML; in the browser, React's
// createRoot replaces the #root content as usual.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const BUILD = join(ROOT, 'build');
const SITE_URL = (process.env.VITE_SITE_URL || 'https://cv-optimizer.vercel.app').replace(/\/$/, '');
const OG_IMAGE = `${SITE_URL}/og-image.png`;

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;');

const routes = [
  {
    out: ['index.html'],
    path: '/',
    title: 'CV Optimizer — Build ATS-Optimized Resumes with AI',
    description:
      'Build professional, ATS-optimized resumes with 11 AI tools. Score your resume against ATS systems, generate tailored cover letters, track applications, and prepare for interviews.',
    hero: `
      <section class="landing-hero">
        <h1>Build ATS-Optimized Resumes with AI</h1>
        <p>11 AI-powered tools to build your resume, score it against ATS systems, generate cover letters, and land more interviews.</p>
        <div class="landing-hero-actions">
          <a class="btn btn-primary btn-lg" href="/register">Get Started Free</a>
          <a class="btn btn-secondary btn-lg" href="#ats-checker">Try ATS Checker</a>
        </div>
      </section>`,
  },
  {
    out: ['login.html', 'login/index.html'],
    path: '/login',
    title: 'Sign In — CV Optimizer',
    description: 'Sign in to CV Optimizer to build, score, and tailor your ATS-optimized resume.',
    hero: `
      <section class="auth-page">
        <div class="auth-card">
          <h1>Welcome back</h1>
          <p>Sign in to continue building your resume.</p>
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
      <section class="auth-page">
        <div class="auth-card">
          <h1>Create your account</h1>
          <p>Start building an ATS-optimized resume with AI — free to start, no credit card required.</p>
        </div>
      </section>`,
  },
];

function seoBlock({ title, description, path }) {
  const url = `${SITE_URL}${path}`;
  return `<!--SEO-START-->
    <title>${esc(title)}</title>
    <meta name="description" content="${esc(description)}" />
    <link rel="canonical" href="${url}" />
    <meta property="og:type" content="website" />
    <meta property="og:site_name" content="CV Optimizer" />
    <meta property="og:title" content="${esc(title)}" />
    <meta property="og:description" content="${esc(description)}" />
    <meta property="og:url" content="${url}" />
    <meta property="og:image" content="${OG_IMAGE}" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${esc(title)}" />
    <meta name="twitter:description" content="${esc(description)}" />
    <meta name="twitter:image" content="${OG_IMAGE}" />
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

console.log(`prerender: wrote ${files} HTML file(s) across ${routes.length} public routes (site: ${SITE_URL})`);
