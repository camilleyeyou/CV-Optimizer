// Preview vs PDF layout parity harness.
//
// Boots the Vite dev server, renders the real ResumePreview in Chromium against
// the stress fixture, and writes both the exported PDFs and the measured
// preview line boxes to disk. Run the reporter afterwards to diff them:
//
//   node scripts/verify-preview-parity.mjs
//   python3 scripts/preview-parity-report.py        # needs pymupdf
//
// Requires playwright (client devDependency) and a local Chrome.
import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';

const require = createRequire(import.meta.url);
const REPO = path.resolve(new URL('..', import.meta.url).pathname);
const OUT = process.env.PARITY_OUT || path.join(REPO, '.parity-out');
const PORT = Number(process.env.PARITY_PORT || 5199);

const pdfService = require(`${REPO}/server/src/services/pdfService`);
const { listTemplates } = require(`${REPO}/server/src/templateRegistry`);
const { STRESS_RESUME } = require(`${REPO}/server/__tests__/fixtures/stressResume`);
const { chromium } = require(`${REPO}/client/node_modules/playwright`);

fs.mkdirSync(OUT, { recursive: true });

const waitForServer = async (url, timeoutMs = 60000) => {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const r = await fetch(url);
      if (r.ok) return true;
    } catch { /* not up yet */ }
    await new Promise((r) => setTimeout(r, 300));
  }
  throw new Error(`vite did not start at ${url}`);
};

const vite = spawn('npx', ['vite', '--port', String(PORT), '--strictPort'], {
  cwd: `${REPO}/client`, stdio: ['ignore', 'pipe', 'pipe'],
});
vite.stderr.on('data', (d) => { const s = String(d); if (/error/i.test(s)) process.stderr.write(s); });

try {
  await waitForServer(`http://localhost:${PORT}/parity-harness.html`);
  // Use the locally installed Chrome rather than downloading a bundled build.
  const browser = await chromium.launch({ channel: 'chrome' });
  const results = [];

  for (const tpl of listTemplates()) {
    // PDF side
    const buf = await pdfService.generatePDF(STRESS_RESUME, tpl.id);
    fs.writeFileSync(path.join(OUT, `${tpl.id}.pdf`), buf);

    // Preview side
    const page = await browser.newPage({ viewport: { width: 1400, height: 1200 } });
    await page.addInitScript(
      ([resume, template]) => { window.__PARITY__ = { resume, template }; },
      [STRESS_RESUME, tpl.id],
    );
    const errors = [];
    page.on('pageerror', (e) => errors.push(String(e)));
    await page.goto(`http://localhost:${PORT}/parity-harness.html?template=${tpl.id}`, { waitUntil: 'load' });
    await page.waitForSelector('.preview-sheet', { timeout: 20000 }).catch(() => {});
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(350);
    const report = await page.evaluate(() => window.__parityReport());
    if (errors.length) report.pageErrors = errors;
    await page.close();

    results.push({ id: tpl.id, maxPages: tpl.maxPages, preview: report });
    process.stdout.write(`  rendered ${tpl.id}\n`);
  }

  await browser.close();
  fs.writeFileSync(path.join(OUT, 'preview.json'), JSON.stringify(results, null, 2));
  console.log(`\nwrote ${results.length} preview reports + PDFs to ${OUT}`);
} finally {
  vite.kill('SIGTERM');
}
