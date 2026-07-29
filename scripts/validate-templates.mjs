// Template shipping gate.
//
// Runs every registry template against the stress fixture and asserts the five
// properties a template must have before it can ship. See TEMPLATES.md §9.
//
//   1. no content drawn outside the page box   (PDF geometry, PyMuPDF)
//   2. page count <= the declared maxPages
//   3. non-Latin text renders and is extractable
//   4. preview page count === PDF page count   (Chromium)
//   5. DOCX exports and retains all content
//
//   node scripts/validate-templates.mjs
//   node scripts/validate-templates.mjs --templates=modern,nordic
//   node scripts/validate-templates.mjs --no-preview
//
// Requires python3 + pymupdf for (1)-(3), and playwright + local Chrome for (4).
import { spawn, spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const require = createRequire(import.meta.url);
const REPO = path.resolve(new URL('..', import.meta.url).pathname);

const pdfService = require(`${REPO}/server/src/services/pdfService`);
const docxService = require(`${REPO}/server/src/services/docxService`);
const { listTemplates, getTemplate } = require(`${REPO}/server/src/templateRegistry`);
const {
  STRESS_RESUME, SCRIPT_SAMPLES,
} = require(`${REPO}/server/__tests__/fixtures/stressResume`);

// ---- args ------------------------------------------------------------------
const argv = process.argv.slice(2);
const flag = (name) => argv.includes(`--${name}`);
const opt = (name) => {
  const hit = argv.find((a) => a.startsWith(`--${name}=`));
  return hit ? hit.slice(name.length + 3) : null;
};

const only = opt('templates')?.split(',').map((s) => s.trim()).filter(Boolean);
const withPreview = !flag('no-preview');
const keepArtifacts = flag('keep');
const OUT = opt('out') || fs.mkdtempSync(path.join(os.tmpdir(), 'validate-templates-'));
const PORT = Number(opt('port') || 5210);

const templates = listTemplates().filter((t) => !only || only.includes(t.id));
if (only) {
  const missing = only.filter((id) => !listTemplates().some((t) => t.id === id));
  if (missing.length) {
    console.error(`unknown template(s): ${missing.join(', ')}`);
    process.exit(2);
  }
}

fs.mkdirSync(OUT, { recursive: true });

// ---- helpers ---------------------------------------------------------------
const C = process.stdout.isTTY
  ? { ok: '\x1b[32m', bad: '\x1b[31m', warn: '\x1b[33m', dim: '\x1b[2m', off: '\x1b[0m' }
  : { ok: '', bad: '', warn: '', dim: '', off: '' };

const waitForServer = async (url, timeoutMs = 60000) => {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try { if ((await fetch(url)).ok) return true; } catch { /* not up yet */ }
    await new Promise((r) => setTimeout(r, 300));
  }
  throw new Error(`vite did not start at ${url}`);
};

/**
 * Every text run in the résumé that a renderer is expected to reproduce
 * verbatim, so DOCX can be checked for content loss.
 *
 * Dates are excluded: every renderer deliberately reformats "2022-01" into
 * "Jan 2022", so the raw value is absent by design, not by loss.
 */
const DATE_KEY = /(^|_)date$/i;
const resumeStrings = (resume) => {
  const out = [];
  const walk = (v, key) => {
    if (v == null) return;
    if (Array.isArray(v)) { v.forEach((x) => walk(x, key)); return; }
    if (typeof v === 'object') { Object.entries(v).forEach(([k, x]) => walk(x, k)); return; }
    if (typeof v !== 'string' || !v.trim()) return;
    if (DATE_KEY.test(key || '') || /^\d{4}(-\d{2}){0,2}$/.test(v.trim())) return;
    out.push(v.trim());
  };
  walk(resume, null);
  return out;
};

// ---- 1. render PDFs and DOCX ----------------------------------------------
console.log(`\nvalidating ${templates.length} template(s) against the stress fixture`);
console.log(`${C.dim}artifacts: ${OUT}${C.off}\n`);

const renders = [];
const docxResults = {};
const JSZip = require(`${REPO}/server/node_modules/jszip`);

for (const tpl of templates) {
  const spec = getTemplate(tpl.id);
  const pdfPath = path.join(OUT, `${tpl.id}.pdf`);
  const row = { id: tpl.id, pdf: pdfPath, maxPages: spec.maxPages };
  try {
    fs.writeFileSync(pdfPath, await pdfService.generatePDF(STRESS_RESUME, tpl.id));
  } catch (err) {
    row.pdfError = String(err?.message || err);
  }
  renders.push(row);

  // DOCX: unzip word/document.xml and confirm the résumé's text survived.
  try {
    const buf = await docxService.generate(STRESS_RESUME, tpl.id);
    fs.writeFileSync(path.join(OUT, `${tpl.id}.docx`), buf);
    const xml = await (await JSZip.loadAsync(buf)).file('word/document.xml').async('string');
    // XML-escaped entities and split runs would create false misses, so compare
    // on a whitespace- and markup-free projection of both sides.
    const flat = xml.replace(/<[^>]+>/g, '')
      .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"').replace(/&#39;/g, "'")
      .replace(/\s+/g, '');
    const missing = resumeStrings(STRESS_RESUME)
      .filter((s) => !flat.includes(s.replace(/\s+/g, '')));
    const scripts = Object.fromEntries(Object.entries(SCRIPT_SAMPLES)
      .map(([k, v]) => [k, flat.includes(v.replace(/\s+/g, ''))]));

    // Section order: DOCX must lay sections out the way the template declares,
    // otherwise a publications-first CV silently exports experience-first.
    const readable = xml.replace(/<[^>]+>/g, ' ');
    const heads = {
      summary: 'PROFESSIONAL SUMMARY', experience: 'EXPERIENCE', education: 'EDUCATION',
      skills: 'SKILLS', projects: 'PROJECTS', certifications: 'CERTIFICATIONS',
      languages: 'LANGUAGES',
    };
    const labelFor = (key) => (spec.sectionLabels?.[key] || heads[key]).toUpperCase();
    const seen = Object.keys(heads)
      .map((key) => ({ key, at: readable.indexOf(labelFor(key)) }))
      .filter((x) => x.at >= 0)
      .sort((a, b) => a.at - b.at)
      .map((x) => x.key);
    const expected = spec.sectionOrder.filter((k) => seen.includes(k));
    docxResults[tpl.id] = {
      bytes: buf.length, missing, scripts, order: seen, expectedOrder: expected,
    };
  } catch (err) {
    docxResults[tpl.id] = { error: String(err?.message || err) };
  }
  process.stdout.write(`  rendered ${tpl.id}\n`);
}

// ---- 2. preview page counts (Chromium) -------------------------------------
const previewPages = {};
if (withPreview) {
  const { chromium } = require(`${REPO}/client/node_modules/playwright`);
  const vite = spawn('npx', ['vite', '--port', String(PORT), '--strictPort'], {
    cwd: `${REPO}/client`, stdio: ['ignore', 'pipe', 'pipe'],
  });
  try {
    await waitForServer(`http://localhost:${PORT}/parity-harness.html`);
    const browser = await chromium.launch({ channel: 'chrome' });
    for (const tpl of templates) {
      const page = await browser.newPage({ viewport: { width: 1400, height: 1200 } });
      const errors = [];
      page.on('pageerror', (e) => errors.push(String(e)));
      await page.addInitScript(
        ([resume, template]) => { window.__PARITY__ = { resume, template }; },
        [STRESS_RESUME, tpl.id],
      );
      await page.goto(`http://localhost:${PORT}/parity-harness.html`, { waitUntil: 'load' });
      await page.waitForSelector('.preview-sheet', { timeout: 20000 }).catch(() => {});
      // Metrics measured before the embedded faces land are meaningless.
      await page.evaluate(() => document.fonts.ready);
      await page.waitForTimeout(400);
      const r = await page.evaluate(() => {
        const el = document.querySelector('.preview-name') || document.querySelector('.preview-text');
        const cs = el && window.getComputedStyle(el);
        return {
          pages: document.querySelectorAll('.preview-sheet').length,
          fontsLoaded: cs ? document.fonts.check(`400 10pt ${cs.fontFamily.split(',')[0]}`) : false,
        };
      });
      await page.close();
      previewPages[tpl.id] = { ...r, errors };
      process.stdout.write(`  previewed ${tpl.id}\n`);
    }
    await browser.close();
  } finally {
    vite.kill('SIGTERM');
  }
}

// ---- 3. PDF geometry pass (PyMuPDF) ----------------------------------------
const manifestPath = path.join(OUT, 'manifest.json');
fs.writeFileSync(manifestPath, JSON.stringify({ renders, scriptSamples: SCRIPT_SAMPLES }));

const py = spawnSync('python3', [path.join(REPO, 'scripts/validate_templates_geometry.py'), manifestPath],
  { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
if (py.status !== 0) {
  console.error(`\n${C.bad}geometry pass failed${C.off}\n${py.stderr || py.error?.message}`);
  console.error('scripts/validate_templates_geometry.py needs python3 with pymupdf:  pip install pymupdf');
  process.exit(2);
}
const geo = JSON.parse(py.stdout);

// ---- 4. report -------------------------------------------------------------
const results = [];
for (const tpl of templates) {
  const spec = getTemplate(tpl.id);
  const g = geo[tpl.id] || {};
  const d = docxResults[tpl.id] || {};
  const pv = previewPages[tpl.id];
  const failures = [];
  const warnings = [];

  const row = renders.find((r) => r.id === tpl.id);
  if (row?.pdfError) failures.push(`PDF render threw: ${row.pdfError}`);
  if (g.error) failures.push(`PDF unreadable: ${g.error}`);

  // 1. bounds
  if (g.outOfBounds?.length) {
    const worst = g.outOfBounds.slice(0, 3).map((o) => {
      const [side, by] = Object.entries(o.over)[0];
      return `p${o.page} ${o.kind} ${by}pt past ${side}${o.detail ? ` ("${o.detail}")` : ''}`;
    });
    failures.push(`${g.outOfBounds.length} element(s) outside the page box: ${worst.join('; ')}`);
  }

  // 2. page budget
  if (g.pages != null && g.pages > spec.maxPages) {
    failures.push(`${g.pages} pages exceeds maxPages ${spec.maxPages}`);
  }

  // 3. non-Latin
  const deadScripts = Object.entries(g.scripts || {}).filter(([, ok]) => !ok).map(([k]) => k);
  if (deadScripts.length) failures.push(`script(s) missing from the PDF: ${deadScripts.join(', ')}`);

  // 4. preview / PDF parity
  if (pv) {
    if (pv.errors.length) failures.push(`preview threw: ${pv.errors[0]}`);
    else if (!pv.fontsLoaded) failures.push('preview fonts did not load — page count is not trustworthy');
    else if (pv.pages !== g.pages) failures.push(`preview ${pv.pages} pages vs PDF ${g.pages}`);
  }

  // 5. DOCX
  if (d.error) failures.push(`DOCX render threw: ${d.error}`);
  else {
    if (d.missing?.length) {
      failures.push(`DOCX dropped ${d.missing.length} string(s), e.g. "${d.missing[0].slice(0, 40)}"`);
    }
    const deadDocx = Object.entries(d.scripts || {}).filter(([, ok]) => !ok).map(([k]) => k);
    if (deadDocx.length) failures.push(`DOCX lost script(s): ${deadDocx.join(', ')}`);
    if (d.order && JSON.stringify(d.order) !== JSON.stringify(d.expectedOrder)) {
      failures.push(`DOCX section order ${d.order.join('>')} != declared ${d.expectedOrder.join('>')}`);
    }
  }

  results.push({
    id: tpl.id,
    premium: !!tpl.premium,
    pages: g.pages,
    maxPages: spec.maxPages,
    previewPages: pv?.pages,
    oob: g.outOfBounds?.length ?? 0,
    scripts: g.scripts || {},
    docxBytes: d.bytes,
    failures,
    warnings,
  });
}

const pad = (s, n) => String(s ?? '-').padEnd(n);
const scriptCell = (s) => {
  const keys = Object.keys(SCRIPT_SAMPLES);
  const ok = keys.filter((k) => s[k]).length;
  return `${ok}/${keys.length}`;
};

console.log(`\n${'template'.padEnd(14)}${'tier'.padEnd(9)}${'pdf'.padEnd(6)}${'max'.padEnd(6)}${'prev'.padEnd(6)}${'oob'.padEnd(6)}${'scripts'.padEnd(9)}${'docx'.padEnd(9)}result`);
console.log('-'.repeat(78));
for (const r of results) {
  const bad = r.failures.length > 0;
  const mark = bad ? `${C.bad}FAIL${C.off}` : `${C.ok}pass${C.off}`;
  console.log(
    pad(r.id, 14)
    + pad(r.premium ? 'premium' : 'free', 9)
    + pad(r.pages, 6)
    + pad(r.maxPages, 6)
    + pad(r.previewPages ?? 'skip', 6)
    + pad(r.oob, 6)
    + pad(scriptCell(r.scripts), 9)
    + pad(r.docxBytes ? `${Math.round(r.docxBytes / 1024)}kB` : 'ERR', 9)
    + mark,
  );
}

const failed = results.filter((r) => r.failures.length);
const warned = results.filter((r) => r.warnings.length);

for (const r of failed) {
  console.log(`\n${C.bad}FAIL ${r.id}${C.off}`);
  r.failures.forEach((f) => console.log(`  - ${f}`));
}
for (const r of warned) {
  console.log(`\n${C.warn}warn ${r.id}${C.off}`);
  r.warnings.forEach((w) => console.log(`  - ${w}`));
}

console.log('');
if (!withPreview) console.log(`${C.warn}preview/PDF parity skipped (--no-preview)${C.off}`);
console.log(`${results.length - failed.length}/${results.length} template(s) passed`);

if (!keepArtifacts && !opt('out')) fs.rmSync(OUT, { recursive: true, force: true });
else console.log(`${C.dim}artifacts kept in ${OUT}${C.off}`);

process.exit(failed.length ? 1 : 0);
