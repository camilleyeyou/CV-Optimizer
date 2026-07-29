#!/usr/bin/env node
/**
 * Re-download the embedded Noto font set.
 *
 * The fonts are committed to the repo so that installs and serverless cold
 * starts never depend on the network. This script exists to refresh them or to
 * restore a partial checkout:
 *
 *   node server/src/fonts/fetch-fonts.js          # fetch anything missing
 *   node server/src/fonts/fetch-fonts.js --force  # re-fetch everything
 *   node server/src/fonts/fetch-fonts.js --check  # verify, download nothing
 *
 * All faces are SIL Open Font License 1.1. PDFKit subsets on embed, so the
 * 11 MB CJK face contributes only the glyphs a given resume actually uses
 * (typically a few KB).
 */
const fs = require('fs');
const path = require('path');
const https = require('https');

const NOTO = 'https://raw.githubusercontent.com/notofonts/notofonts.github.io/main/fonts';
const CJK = 'https://raw.githubusercontent.com/notofonts/noto-cjk/main/Sans/SubsetOTF/TC';

const FILES = [
  // Latin / Latin Extended (Polish, Turkish, Vietnamese) / Greek / Cyrillic
  ['NotoSans-Regular.ttf', `${NOTO}/NotoSans/hinted/ttf/NotoSans-Regular.ttf`],
  ['NotoSans-Bold.ttf', `${NOTO}/NotoSans/hinted/ttf/NotoSans-Bold.ttf`],
  ['NotoSans-Italic.ttf', `${NOTO}/NotoSans/hinted/ttf/NotoSans-Italic.ttf`],
  ['NotoSans-BoldItalic.ttf', `${NOTO}/NotoSans/hinted/ttf/NotoSans-BoldItalic.ttf`],
  // Serif faces for the serif templates (professional, executive, elegant, academic)
  ['NotoSerif-Regular.ttf', `${NOTO}/NotoSerif/hinted/ttf/NotoSerif-Regular.ttf`],
  ['NotoSerif-Bold.ttf', `${NOTO}/NotoSerif/hinted/ttf/NotoSerif-Bold.ttf`],
  ['NotoSerif-Italic.ttf', `${NOTO}/NotoSerif/hinted/ttf/NotoSerif-Italic.ttf`],
  ['NotoSerif-BoldItalic.ttf', `${NOTO}/NotoSerif/hinted/ttf/NotoSerif-BoldItalic.ttf`],
  // Hebrew
  ['NotoSansHebrew-Regular.ttf', `${NOTO}/NotoSansHebrew/hinted/ttf/NotoSansHebrew-Regular.ttf`],
  ['NotoSansHebrew-Bold.ttf', `${NOTO}/NotoSansHebrew/hinted/ttf/NotoSansHebrew-Bold.ttf`],
  // Arabic
  ['NotoSansArabic-Regular.ttf', `${NOTO}/NotoSansArabic/hinted/ttf/NotoSansArabic-Regular.ttf`],
  ['NotoSansArabic-Bold.ttf', `${NOTO}/NotoSansArabic/hinted/ttf/NotoSansArabic-Bold.ttf`],
  // CJK (Traditional Chinese; also covers most Japanese kanji)
  ['NotoSansTC-Regular.otf', `${CJK}/NotoSansTC-Regular.otf`],
  ['NotoSansTC-Bold.otf', `${CJK}/NotoSansTC-Bold.otf`],
];

const get = (url, redirects = 0) => new Promise((resolve, reject) => {
  if (redirects > 5) return reject(new Error('too many redirects'));
  https.get(url, (res) => {
    if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
      res.resume();
      return resolve(get(res.headers.location, redirects + 1));
    }
    if (res.statusCode !== 200) {
      res.resume();
      return reject(new Error(`HTTP ${res.statusCode} for ${url}`));
    }
    const chunks = [];
    res.on('data', (c) => chunks.push(c));
    res.on('end', () => resolve(Buffer.concat(chunks)));
    res.on('error', reject);
  }).on('error', reject);
});

(async () => {
  const force = process.argv.includes('--force');
  const checkOnly = process.argv.includes('--check');
  let missing = 0;
  let fetched = 0;

  for (const [name, url] of FILES) {
    const dest = path.join(__dirname, name);
    const exists = fs.existsSync(dest);
    if (exists && !force) {
      const kb = Math.round(fs.statSync(dest).size / 1024);
      console.log(`  ok      ${name} (${kb} KB)`);
      continue;
    }
    if (checkOnly) {
      console.log(`  MISSING ${name}`);
      missing += 1;
      continue;
    }
    process.stdout.write(`  fetch   ${name} ... `);
    const buf = await get(url);
    fs.writeFileSync(dest, buf);
    fetched += 1;
    console.log(`${Math.round(buf.length / 1024)} KB`);
  }

  if (checkOnly && missing) {
    console.error(`\n${missing} font file(s) missing - run without --check to download.`);
    process.exit(1);
  }
  console.log(fetched ? `\nDone: ${fetched} file(s) written.` : '\nDone: all fonts present.');
})().catch((err) => {
  console.error('Font fetch failed:', err.message);
  process.exit(1);
});
