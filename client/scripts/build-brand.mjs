/**
 * Builds every brand asset from the one mark path.
 * Re-run after changing the geometry in generate-mark.mjs: `node scripts/generate-mark.mjs`
 * rewrites mark-path.txt, then `node scripts/build-brand.mjs` rewrites every asset.
 */
import { writeFileSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const PUB = fileURLToPath(new URL('../public', import.meta.url));
const MARK = readFileSync(new URL('./mark-path.txt', import.meta.url), 'utf8').trim();

const A = '#818cf8', B = '#c084fc', INK = '#0a0b0f';

const tileSvg = (radiusRatio = 0.219) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${A}"/>
      <stop offset="1" stop-color="${B}"/>
    </linearGradient>
  </defs>
  <rect width="32" height="32" rx="${(32 * radiusRatio).toFixed(2)}" fill="url(#g)"/>
  <g transform="translate(4.48 4.48) scale(0.72)">
    <path fill="${INK}" fill-rule="evenodd" d="${MARK}"/>
  </g>
</svg>`;

// Maskable/App icon: Android and iOS crop to their own shape, so the tile is
// full-bleed and the mark is inset to stay inside the safe zone.
const appIconSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
  <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0" stop-color="${A}"/><stop offset="1" stop-color="${B}"/></linearGradient></defs>
  <rect width="32" height="32" fill="url(#g)"/>
  <g transform="translate(5.92 5.92) scale(0.63)">
    <path fill="${INK}" fill-rule="evenodd" d="${MARK}"/>
  </g>
</svg>`;

writeFileSync(`${PUB}/favicon.svg`, tileSvg() + '\n');
writeFileSync(`${PUB}/logo-mark.svg`,
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" role="img" aria-label="CV Optimizer">
  <path fill="currentColor" fill-rule="evenodd" d="${MARK}"/>
</svg>\n`);

/* ---------- OG card: rendered from HTML so it uses the real typefaces ------- */
const b64 = f => readFileSync(`${PUB}/fonts/${f}`).toString('base64');
const SATOSHI = b64('Satoshi-Variable.woff2');
const INTER = b64('Inter-latin.woff2');

const ogHtml = `<!doctype html><html><head><meta charset="utf-8"><style>
@font-face{font-family:Satoshi;src:url(data:font/woff2;base64,${SATOSHI}) format('woff2-variations');font-weight:300 900}
@font-face{font-family:InterVar;src:url(data:font/woff2;base64,${INTER}) format('woff2-variations');font-weight:100 900}
*{margin:0;padding:0;box-sizing:border-box}
body{width:1200px;height:630px;font-family:InterVar,system-ui;color:#f5f6f8;overflow:hidden;position:relative;
  background-color:#08090c;
  background-image:radial-gradient(ellipse 70% 62% at 42% -14%, rgba(91,91,214,.40) 0%, transparent 64%);
  background-repeat:no-repeat}
.grid{position:absolute;inset:0;
  background-image:linear-gradient(rgba(255,255,255,.022) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.022) 1px,transparent 1px);
  background-size:56px 56px;
  -webkit-mask-image:radial-gradient(ellipse 90% 90% at 26% 30%,#000 0%,rgba(0,0,0,.35) 45%,transparent 78%)}
.wrap{position:relative;height:100%;padding:60px 72px 58px;display:flex;flex-direction:column;justify-content:space-between}
.brand{display:flex;align-items:center;gap:14px}
.brand .tile{width:52px;height:52px;border-radius:12px;background:linear-gradient(135deg,${A},${B});
  display:flex;align-items:center;justify-content:center;box-shadow:0 8px 28px rgba(91,91,214,.35)}
.brand .name{font-family:Satoshi;font-weight:700;font-size:29px;letter-spacing:-.02em}
h1{font-family:Satoshi;font-weight:900;font-size:78px;line-height:1.02;letter-spacing:-.038em;max-width:15ch}
p{font-size:25px;line-height:1.5;color:#b6bcc8;max-width:34ch;margin-top:20px}
.foot{display:flex;align-items:center;justify-content:space-between}
.chips{display:flex;gap:10px}
.chip{font-size:17px;font-weight:500;color:#b6bcc8;background:rgba(255,255,255,.045);
  border:1px solid rgba(255,255,255,.11);border-radius:999px;padding:9px 18px}
.url{font-family:ui-monospace,monospace;font-size:17px;color:#8b92a1;letter-spacing:.02em}
.score{position:absolute;right:72px;top:196px;width:236px;padding:22px;
  background:#1a1c22;border:1px solid rgba(255,255,255,.12);border-radius:20px;
  box-shadow:inset 0 1px 0 rgba(255,255,255,.06),0 28px 64px rgba(0,0,0,.62)}
.score .lbl{font-family:ui-monospace,monospace;font-size:12px;letter-spacing:.09em;text-transform:uppercase;color:#8b92a1}
.score .val{font-family:Satoshi;font-weight:700;font-size:52px;line-height:1;letter-spacing:-.035em;margin-top:10px;
  display:flex;align-items:baseline;gap:3px}
.score .max{font-size:20px;color:#8b92a1;font-weight:500}
.bar{height:6px;background:#0a0b0f;border-radius:99px;margin-top:16px;overflow:hidden}
.bar i{display:block;height:100%;width:92%;background:#4ade80;border-radius:99px}
.score ul{list-style:none;margin-top:15px;display:flex;flex-direction:column;gap:8px}
.score li{font-size:14px;color:#b6bcc8;display:flex;align-items:center;gap:9px}
.score li::before{content:'';width:14px;height:14px;border-radius:50%;background:rgba(74,222,128,.16);
  border:1px solid rgba(74,222,128,.45)}
</style></head><body>
<div class="grid"></div>
<div class="wrap">
  <div class="brand">
    <span class="tile"><svg viewBox="0 0 32 32" width="34" height="34"><path fill="${INK}" fill-rule="evenodd" d="${MARK}"/></svg></span>
    <span class="name">CV&nbsp;Optimizer</span>
  </div>
  <div>
    <h1>Build a resume that clears the filter</h1>
    <p>Score it against applicant tracking systems, fix what they flag, export a clean PDF.</p>
  </div>
  <div class="foot">
    <div class="chips"><span class="chip">11 AI tools</span><span class="chip">21 templates</span><span class="chip">Free to start</span></div>
    <span class="url">cv-optimizer.vercel.app</span>
  </div>
</div>
<div class="score">
  <div class="lbl">ATS score</div>
  <div class="val">92<span class="max">/100</span></div>
  <div class="bar"><i></i></div>
  <ul><li>Keywords matched</li><li>Parsable structure</li><li>Dates consistent</li></ul>
</div>
</body></html>`;

const browser = await chromium.launch();

// OG card
const og = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
await og.setContent(ogHtml, { waitUntil: 'load' });
await og.evaluate(() => document.fonts.ready);
await og.waitForTimeout(400);
await og.screenshot({ path: `${PUB}/og-image.png` });
await og.close();

// Raster icons from the SVG tiles
async function raster(svg, size, out) {
  const p = await browser.newPage({ viewport: { width: size, height: size }, deviceScaleFactor: 1 });
  await p.setContent(
    `<style>html,body{margin:0;background:transparent}svg{display:block;width:${size}px;height:${size}px}</style>${svg}`,
    { waitUntil: 'load' }
  );
  await p.waitForTimeout(80);
  await p.screenshot({ path: out, omitBackground: true });
  await p.close();
  return out;
}

// Two sets, because the manifest purposes mean different things: "any" can be
// drawn unmasked (so it needs its own rounding) while "maskable" is cropped by
// the platform (so it must bleed to the edge).
await raster(tileSvg(), 192, `${PUB}/logo192.png`);
await raster(tileSvg(), 512, `${PUB}/logo512.png`);
await raster(appIconSvg, 192, `${PUB}/logo192-maskable.png`);
await raster(appIconSvg, 512, `${PUB}/logo512-maskable.png`);
await raster(tileSvg(), 180, `${PUB}/apple-touch-icon.png`);

// favicon.ico — a container of PNGs (supported since Vista), for old crawlers
// and pinned tabs that ignore favicon.svg.
const tmp = [];
for (const s of [16, 32, 48]) tmp.push([s, await raster(tileSvg(), s, `/tmp/fav-${s}.png`)]);

const entries = tmp.map(([s, f]) => ({ s, buf: readFileSync(f) }));
const header = Buffer.alloc(6);
header.writeUInt16LE(0, 0); header.writeUInt16LE(1, 2); header.writeUInt16LE(entries.length, 4);
let offset = 6 + entries.length * 16;
const dir = [];
for (const e of entries) {
  const d = Buffer.alloc(16);
  d.writeUInt8(e.s === 256 ? 0 : e.s, 0);
  d.writeUInt8(e.s === 256 ? 0 : e.s, 1);
  d.writeUInt8(0, 2); d.writeUInt8(0, 3);
  d.writeUInt16LE(1, 4); d.writeUInt16LE(32, 6);
  d.writeUInt32LE(e.buf.length, 8); d.writeUInt32LE(offset, 12);
  offset += e.buf.length;
  dir.push(d);
}
writeFileSync(`${PUB}/favicon.ico`, Buffer.concat([header, ...dir, ...entries.map(e => e.buf)]));

await browser.close();
console.log('wrote favicon.svg, favicon.ico, logo-mark.svg, logo192/512.png, apple-touch-icon.png, og-image.png');
