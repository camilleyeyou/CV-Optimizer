// SEO gate for the public pages.
//
// Checks both halves of how these pages are seen:
//   * the raw HTML a crawler gets without running JS (the prerendered file)
//   * the DOM after React has rendered and the SPA has navigated
//
// The second matters because the head is now managed imperatively: a page that
// re-added a tag instead of updating it would reintroduce the duplicate
// canonical this gate exists to prevent.
//
//   node scripts/verify-seo.mjs
import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';

const require = createRequire(import.meta.url);
const REPO = path.resolve(new URL('..', import.meta.url).pathname);
const BUILD = path.join(REPO, 'client/build');
const PORT = Number(process.env.SEO_PORT || 4190);
const SITE = 'https://cv-optimizer.vercel.app';

const { listTemplates } = require(`${REPO}/server/src/templateRegistry`);
const { chromium } = require(`${REPO}/client/node_modules/playwright`);

const templates = listTemplates();
const checks = [];
const check = (name, pass, detail = '') => checks.push({ name, pass, detail });

// ---- 1. static HTML (what a crawler without JS receives) --------------------
const readBuilt = (rel) => {
  const p = path.join(BUILD, rel);
  return fs.existsSync(p) ? fs.readFileSync(p, 'utf8') : null;
};

const staticRoutes = [
  ['index.html', '/'],
  ['login/index.html', '/login'],
  ['register/index.html', '/register'],
  ['templates/index.html', '/templates'],
  ...templates.map((t) => [`templates/${t.id}/index.html`, `/templates/${t.id}`]),
];

let staticBad = [];
for (const [file, route] of staticRoutes) {
  const html = readBuilt(file);
  if (!html) { staticBad.push(`${route}: missing ${file}`); continue; }
  const canon = [...html.matchAll(/<link[^>]*rel="canonical"[^>]*href="([^"]+)"/g)].map((m) => m[1]);
  const titles = [...html.matchAll(/<title[^>]*>([\s\S]*?)<\/title>/g)].map((m) => m[1]);
  const want = `${SITE}${route}`;
  if (canon.length !== 1 || canon[0] !== want) staticBad.push(`${route}: canonical ${JSON.stringify(canon)}`);
  if (titles.length !== 1 || !titles[0].trim()) staticBad.push(`${route}: title ${JSON.stringify(titles)}`);
  // The whole point of prerendering: real copy, not an empty #root.
  if (html.includes('<div id="root"></div>')) staticBad.push(`${route}: #root is empty`);
}
check(`static HTML: ${staticRoutes.length} routes have exactly one correct canonical, a title and real content`,
  staticBad.length === 0, staticBad.slice(0, 4).join(' | '));

// ---- 2. structured data ----------------------------------------------------
const ldBad = [];
for (const t of templates) {
  const html = readBuilt(`templates/${t.id}/index.html`);
  if (!html) continue;
  const blocks = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)]
    .map((m) => { try { return JSON.parse(m[1].replace(/\\u003c/g, '<')); } catch (e) { return { __bad: String(e) }; } });
  const types = blocks.map((b) => b['@type']);
  if (blocks.some((b) => b.__bad)) ldBad.push(`${t.id}: invalid JSON`);
  if (!types.includes('SoftwareApplication')) ldBad.push(`${t.id}: no SoftwareApplication`);
  if (!types.includes('FAQPage')) ldBad.push(`${t.id}: no FAQPage`);
  const faq = blocks.find((b) => b['@type'] === 'FAQPage');
  if (faq && !(faq.mainEntity?.length >= 3)) ldBad.push(`${t.id}: only ${faq.mainEntity?.length} FAQs`);
  const app = blocks.find((b) => b['@type'] === 'SoftwareApplication');
  // Ratings we do not have must never appear: fabricated review markup is a
  // manual action, and the whole library rule is no invented data.
  if (app && (app.aggregateRating || app.review)) ldBad.push(`${t.id}: fabricated rating/review markup`);
  if (app && !app.offers) ldBad.push(`${t.id}: SoftwareApplication has no offers`);
}
check(`structured data: all ${templates.length} template pages carry valid SoftwareApplication + FAQPage, no invented ratings`,
  ldBad.length === 0, ldBad.slice(0, 4).join(' | '));

// ---- 3. assets -------------------------------------------------------------
const missingImg = templates.flatMap((t) => [
  fs.existsSync(path.join(BUILD, `template-previews/${t.id}.png`)) ? null : `${t.id}.png`,
  fs.existsSync(path.join(BUILD, `template-previews/${t.id}-og.png`)) ? null : `${t.id}-og.png`,
].filter(Boolean));
check(`preview images: ${templates.length * 2} files present in the build`, missingImg.length === 0, missingImg.slice(0, 5).join(', '));

const robots = readBuilt('robots.txt') || '';
check('robots.txt no longer disallows /templates', !/^\s*Disallow:\s*\/templates\s*$/m.test(robots));
const sitemap = readBuilt('sitemap.xml') || '';
const missingFromSitemap = templates.filter((t) => !sitemap.includes(`${SITE}/templates/${t.id}<`));
check(`sitemap lists /templates and all ${templates.length} template pages`,
  sitemap.includes(`${SITE}/templates<`) && missingFromSitemap.length === 0,
  missingFromSitemap.map((t) => t.id).join(', '));

// ---- 4. rendered DOM + SPA navigation --------------------------------------
const preview = spawn('npx', ['vite', 'preview', '--port', String(PORT), '--strictPort'], {
  cwd: `${REPO}/client`, stdio: ['ignore', 'pipe', 'pipe'],
});
try {
  const start = Date.now();
  while (Date.now() - start < 60000) {
    try { if ((await fetch(`http://localhost:${PORT}/`)).ok) break; } catch { /* not up */ }
    await new Promise((r) => setTimeout(r, 300));
  }

  const browser = await chromium.launch({ channel: 'chrome' });
  const head = (p) => p.evaluate(() => ({
    title: [...document.querySelectorAll('title')].map((e) => e.textContent),
    canonical: [...document.querySelectorAll('link[rel="canonical"]')].map((e) => e.getAttribute('href')),
    desc: document.querySelectorAll('meta[name="description"]').length,
    ogUrl: [...document.querySelectorAll('meta[property="og:url"]')].map((e) => e.content),
    ld: document.querySelectorAll('script[type="application/ld+json"]').length,
    h1: [...document.querySelectorAll('h1')].map((e) => e.textContent.trim()),
  }));

  const domBad = [];
  const sample = ['/', '/templates', '/templates/modern', '/templates/ats-max', '/templates/europass'];
  for (const route of sample) {
    const page = await browser.newPage();
    const errs = [];
    page.on('pageerror', (e) => errs.push(String(e)));
    await page.goto(`http://localhost:${PORT}${route}`, { waitUntil: 'networkidle' }).catch(() => {});
    await page.waitForTimeout(700);
    const h = await head(page);
    if (errs.length) domBad.push(`${route}: page error ${errs[0].slice(0, 60)}`);
    if (h.canonical.length !== 1 || h.canonical[0] !== `${SITE}${route}`) domBad.push(`${route}: canonical ${JSON.stringify(h.canonical)}`);
    if (h.title.length !== 1) domBad.push(`${route}: ${h.title.length} titles`);
    if (h.desc !== 1) domBad.push(`${route}: ${h.desc} descriptions`);
    if (h.h1.length !== 1) domBad.push(`${route}: ${h.h1.length} h1`);
    await page.close();
  }
  check(`rendered DOM: ${sample.length} routes have one canonical, title, description and h1`,
    domBad.length === 0, domBad.slice(0, 4).join(' | '));

  // SPA navigation must update the head in place, not append to it.
  const page = await browser.newPage();
  await page.goto(`http://localhost:${PORT}/templates`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(600);
  await page.click('a[href="/templates/tech-grid"]').catch(() => {});
  await page.waitForTimeout(900);
  const after = await head(page);
  check('SPA navigation updates the head in place (no duplicate tags after client-side nav)',
    after.canonical.length === 1 && after.canonical[0] === `${SITE}/templates/tech-grid`
      && after.title.length === 1 && after.desc === 1 && after.ld === 3,
    `canonical=${JSON.stringify(after.canonical)} titles=${after.title.length} desc=${after.desc} ld=${after.ld}`);

  // The signup CTA has to carry the template through.
  await page.click('a[href="/register?template=tech-grid"], button:has-text("Use this template")').catch(() => {});
  await page.waitForTimeout(900);
  const url = page.url();
  check('"Use this template" sends a signed-out visitor to signup with the template preselected',
    url.includes('/register') && url.includes('template=tech-grid'), url);

  await page.close();
  await browser.close();
} finally {
  preview.kill('SIGTERM');
}

console.log('');
let failed = 0;
for (const c of checks) {
  if (!c.pass) failed += 1;
  console.log(`${c.pass ? 'PASS' : 'FAIL'}  ${c.name}${c.detail ? `\n        ${c.detail}` : ''}`);
}
console.log(`\n${checks.length - failed}/${checks.length} checks passed`);
process.exit(failed ? 1 : 0);
