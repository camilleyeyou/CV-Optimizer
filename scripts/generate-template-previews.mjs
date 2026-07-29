// Static preview images for the public template pages.
//
// Renders the real ResumePreview component (same component the builder uses)
// against the shared sample résumé, so the image on /templates/<slug> is the
// template as it actually renders - not a mockup that can drift from the code.
//
//   node scripts/generate-template-previews.mjs
//   node scripts/generate-template-previews.mjs --templates=modern,ats-max
//
// Writes, per template, into client/public/template-previews/:
//   <id>.png     A4 page 1, for the page itself and the gallery card
//   <id>-og.png  1200x630 social card built from that screenshot
//
// Requires playwright (client devDependency) and a local Chrome.
import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';

const require = createRequire(import.meta.url);
const REPO = path.resolve(new URL('..', import.meta.url).pathname);
const OUT = path.join(REPO, 'client/public/template-previews');
const PORT = Number(process.env.PREVIEW_PORT || 5212);

const { listTemplates } = require(`${REPO}/server/src/templateRegistry`);
const { chromium } = require(`${REPO}/client/node_modules/playwright`);

const argv = process.argv.slice(2);
const only = argv.find((a) => a.startsWith('--templates='))?.slice(12)
  .split(',').map((s) => s.trim()).filter(Boolean);
const templates = listTemplates().filter((t) => !only || only.includes(t.id));

// The sample résumé lives in client source as an ES module; read the literal out
// rather than duplicating it, so the images always match the gallery thumbnails.
const sampleSrc = fs.readFileSync(
  path.join(REPO, 'client/src/components/builder/sampleResume.js'), 'utf8',
);
const SAMPLE_RESUME = (new Function(
  `${sampleSrc.replace(/^export\s+const/m, 'const')}\nreturn SAMPLE_RESUME;`,
))();

const waitForServer = async (url, timeoutMs = 60000) => {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try { if ((await fetch(url)).ok) return true; } catch { /* not up yet */ }
    await new Promise((r) => setTimeout(r, 300));
  }
  throw new Error(`vite did not start at ${url}`);
};

const ogCard = (dataUri, name, tagline) => `<!doctype html>
<html><head><meta charset="utf-8"><style>
  *{margin:0;padding:0;box-sizing:border-box}
  body{width:1200px;height:630px;display:flex;align-items:center;gap:56px;
       padding:0 72px;background:#08080a;color:#fafafa;
       font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;overflow:hidden}
  .copy{flex:1;min-width:0}
  .eyebrow{font-size:15px;letter-spacing:.18em;text-transform:uppercase;
           color:#a1a1aa;font-weight:600;margin-bottom:18px}
  h1{font-size:60px;line-height:1.05;font-weight:700;letter-spacing:-.02em;margin-bottom:20px}
  p{font-size:23px;line-height:1.45;color:#a1a1aa}
  .shot{width:340px;flex:none;border-radius:10px;overflow:hidden;
        box-shadow:0 24px 70px rgba(0,0,0,.6);background:#fff}
  .shot img{display:block;width:100%}
</style></head>
<body>
  <div class="copy">
    <div class="eyebrow">Résumé template</div>
    <h1>${name}</h1>
    <p>${tagline}</p>
  </div>
  <div class="shot"><img src="${dataUri}"></div>
</body></html>`;

fs.mkdirSync(OUT, { recursive: true });

const vite = spawn('npx', ['vite', '--port', String(PORT), '--strictPort'], {
  cwd: `${REPO}/client`, stdio: ['ignore', 'pipe', 'pipe'],
});

let written = 0;
try {
  await waitForServer(`http://localhost:${PORT}/parity-harness.html`);
  const browser = await chromium.launch({ channel: 'chrome' });

  for (const tpl of templates) {
    const page = await browser.newPage({
      viewport: { width: 1000, height: 1300 },
      // 1.5x lands at ~1190px wide: still retina-sharp at the ~600px the page
      // renders it, but roughly half the bytes of a 2x shot. These images are
      // above the fold on pages whose whole point is to rank, so weight counts.
      deviceScaleFactor: 1.5,
    });
    await page.addInitScript(
      ([resume, template]) => { window.__PARITY__ = { resume, template }; },
      [SAMPLE_RESUME, tpl.id],
    );
    await page.goto(`http://localhost:${PORT}/parity-harness.html`, { waitUntil: 'load' });
    await page.waitForSelector('.preview-sheet', { timeout: 20000 });
    // Screenshotting before the embedded faces land bakes in fallback metrics.
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(450);

    // Page 1 only, without the pagination chrome the builder adds.
    await page.evaluate(() => {
      document.querySelectorAll('.preview-page-badge, .preview-break-line')
        .forEach((el) => el.remove());
      const sheet = document.querySelector('.preview-sheet');
      sheet.style.boxShadow = 'none';
      sheet.style.borderRadius = '0';
    });

    const sheet = await page.$('.preview-sheet');
    const png = await sheet.screenshot({ type: 'png' });
    fs.writeFileSync(path.join(OUT, `${tpl.id}.png`), png);

    // Social card, built from the shot we just took.
    const og = await browser.newPage({ viewport: { width: 1200, height: 630 } });
    await og.setContent(
      ogCard(`data:image/png;base64,${png.toString('base64')}`, tpl.name, tpl.description),
      { waitUntil: 'load' },
    );
    await og.waitForTimeout(150);
    fs.writeFileSync(path.join(OUT, `${tpl.id}-og.png`), await og.screenshot({ type: 'png' }));
    await og.close();
    await page.close();

    written += 2;
    const kb = (n) => `${Math.round(fs.statSync(path.join(OUT, n)).size / 1024)}kB`;
    process.stdout.write(`  ${tpl.id.padEnd(15)} ${kb(`${tpl.id}.png`).padStart(7)}  og ${kb(`${tpl.id}-og.png`)}\n`);
  }
  await browser.close();
} finally {
  vite.kill('SIGTERM');
}

const total = fs.readdirSync(OUT)
  .reduce((sum, f) => sum + fs.statSync(path.join(OUT, f)).size, 0);
console.log(`\nwrote ${written} image(s) to client/public/template-previews (${(total / 1024 / 1024).toFixed(1)}MB total)`);
