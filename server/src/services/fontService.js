// Embedded-font text engine for the PDF renderer.
//
// PDFKit's built-in Helvetica/Times are Latin-1 only: every codepoint outside
// that range is silently dropped (widthOfString returns 0, no exception), which
// made Polish, Turkish, Greek, Cyrillic, Hebrew, Arabic and CJK resumes export
// as blank or mangled text. This module embeds Noto fonts and routes every
// string through a script-aware renderer so each run is drawn with a font that
// actually has the glyphs.
//
// Two rendering paths:
//   * fast path  - the string is a single script and left-to-right, which is
//     the overwhelming majority. Delegates straight to doc.text() so PDFKit's
//     native wrapping, alignment and link handling are preserved exactly.
//   * layout path - the string mixes scripts or contains RTL. PDFKit's text()
//     re-splits a string on spaces and emits each word separately, which throws
//     away fontkit's paragraph-level RTL reordering and swallows the word
//     spaces. We therefore do our own tokenisation, line breaking and bidi
//     reordering, then place each token at an explicit x.
const fs = require('fs');
const path = require('path');
const fontkit = require('fontkit');
const { getFonts } = require('../templateRegistry');

const REGISTRY_FONTS = getFonts();
// Resolved from the repo root so the preview and the PDF load byte-identical
// files; the path itself lives in the registry.
const FONT_DIR = path.join(__dirname, '../../..', REGISTRY_FONTS.sourceDir);

// script -> family -> variant -> filename, built from the shared registry.
// Hebrew, Arabic and CJK ship sans-only; serif templates fall back to the sans
// face for those scripts rather than losing the glyphs.
const CATALOGUE = {
  latin: {
    sans: REGISTRY_FONTS.families.sans,
    serif: REGISTRY_FONTS.families.serif,
  },
  hebrew: { sans: REGISTRY_FONTS.families.hebrew },
  arabic: { sans: REGISTRY_FONTS.families.arabic },
  cjk: { sans: REGISTRY_FONTS.families.cjk },
};

/** Registry family name for a script + template family, for metrics lookups. */
function metricsKeyFor(script, family) {
  if (script === 'latin') return family === 'serif' ? 'serif' : 'sans';
  return script;
}

// Logical font key used by the templates -> variant in the catalogue.
const VARIANTS = {
  body: 'regular',
  bodyBold: 'bold',
  bodyItalic: 'italic',
  heading: 'regular',
  headingBold: 'bold',
  headingItalic: 'italic',
};

const HEADING_KEYS = new Set(['heading', 'headingBold', 'headingItalic']);

// Read each face at most once per process; PDFKit re-parses per document but
// re-reading 5 MB of CJK off disk for every export would not be acceptable.
const bufferCache = new Map();

function loadFont(file) {
  if (!bufferCache.has(file)) {
    bufferCache.set(file, fs.readFileSync(path.join(FONT_DIR, file)));
  }
  return bufferCache.get(file);
}

// Which scripts have a font available on disk. Missing files degrade to the
// Latin face rather than throwing, so a partial install still renders.
const available = (() => {
  const set = new Set();
  Object.entries(CATALOGUE).forEach(([script, families]) => {
    const ok = Object.values(families).some((variants) =>
      Object.values(variants).every((f) => fs.existsSync(path.join(FONT_DIR, f))));
    if (ok) set.add(script);
  });
  return set;
})();

// ---- Script detection -----------------------------------------------------
function scriptOfCodePoint(cp) {
  // Hebrew + Hebrew presentation forms
  if ((cp >= 0x0590 && cp <= 0x05ff) || (cp >= 0xfb1d && cp <= 0xfb4f)) return 'hebrew';
  // Arabic, Arabic Supplement/Extended-A, presentation forms A/B
  if ((cp >= 0x0600 && cp <= 0x06ff) || (cp >= 0x0750 && cp <= 0x077f)
    || (cp >= 0x08a0 && cp <= 0x08ff) || (cp >= 0xfb50 && cp <= 0xfdff)
    || (cp >= 0xfe70 && cp <= 0xfeff)) return 'arabic';
  // CJK ideographs, kana, bopomofo, compatibility, fullwidth forms
  if ((cp >= 0x2e80 && cp <= 0x303f) || (cp >= 0x3040 && cp <= 0x33ff)
    || (cp >= 0x3400 && cp <= 0x4dbf) || (cp >= 0x4e00 && cp <= 0x9fff)
    || (cp >= 0xa000 && cp <= 0xa4cf) || (cp >= 0xf900 && cp <= 0xfaff)
    || (cp >= 0xfe30 && cp <= 0xfe4f) || (cp >= 0xff00 && cp <= 0xffef)
    || (cp >= 0x20000 && cp <= 0x2fa1f)) return 'cjk';
  // Latin, Latin Extended (Polish/Turkish/Vietnamese), Greek and Cyrillic all
  // live in the Noto Sans/Serif faces.
  return 'latin';
}

// Characters that should join whichever run surrounds them instead of forcing
// a font switch: spaces, ASCII punctuation, digits, common symbols.
function isNeutral(cp) {
  return cp <= 0x40 || (cp >= 0x5b && cp <= 0x60) || (cp >= 0x7b && cp <= 0xbf)
    || cp === 0x2013 || cp === 0x2014 || cp === 0x2018 || cp === 0x2019
    || cp === 0x201c || cp === 0x201d || cp === 0x2022 || cp === 0x00b7;
}

// Parsed faces, used only to ask whether a face actually has a glyph. Noto's
// Hebrew face has no ASCII parentheses or digits and the Arabic face has no
// parentheses, so a neutral character cannot simply inherit the surrounding
// script - it would render as a .notdef box.
const parsedCache = new Map();

function parsedFont(file) {
  if (!parsedCache.has(file)) parsedCache.set(file, fontkit.create(loadFont(file)));
  return parsedCache.get(file);
}

const coverageCache = new Map();

/** Does the regular face for `script` have a glyph for this codepoint? */
function scriptCovers(script, cp) {
  const key = `${script}:${cp}`;
  if (coverageCache.has(key)) return coverageCache.get(key);
  let ok = false;
  try {
    const families = CATALOGUE[available.has(script) ? script : 'latin'];
    const variants = families.sans || families.serif;
    ok = parsedFont(variants.regular).hasGlyphForCodePoint(cp);
  } catch {
    ok = script === 'latin';
  }
  coverageCache.set(key, ok);
  return ok;
}

const RTL_SCRIPTS = new Set(['hebrew', 'arabic']);

function isRTLScript(s) { return RTL_SCRIPTS.has(s); }

/** Scripts genuinely present in a string (neutrals ignored). */
function scriptsIn(text) {
  const set = new Set();
  for (const ch of String(text)) {
    const cp = ch.codePointAt(0);
    if (isNeutral(cp)) continue;
    set.add(scriptOfCodePoint(cp));
  }
  return set;
}

function containsRTL(text) {
  for (const ch of String(text)) {
    const cp = ch.codePointAt(0);
    if (!isNeutral(cp) && isRTLScript(scriptOfCodePoint(cp))) return true;
  }
  return false;
}

/** Base paragraph direction: direction of the first strong character (UBA P2/P3). */
function baseDirection(text) {
  for (const ch of String(text)) {
    const cp = ch.codePointAt(0);
    if (isNeutral(cp)) continue;
    return isRTLScript(scriptOfCodePoint(cp)) ? 'rtl' : 'ltr';
  }
  return 'ltr';
}

// ---- Font resolution ------------------------------------------------------
function resolve(script, family, variant) {
  const scriptKey = available.has(script) ? script : 'latin';
  const families = CATALOGUE[scriptKey];
  const fam = families[family] ? family : 'sans';
  const variants = families[fam];
  // Hebrew/Arabic/CJK have no italic face; italic degrades to regular, and
  // boldItalic to bold, rather than rendering nothing.
  const chain = {
    regular: ['regular'],
    bold: ['bold', 'regular'],
    italic: ['italic', 'regular'],
    boldItalic: ['boldItalic', 'bold', 'regular'],
  }[variant] || ['regular'];
  const picked = chain.find((v) => variants[v]) || 'regular';
  return { name: `${scriptKey}-${fam}-${picked}`, file: variants[picked] };
}

/**
 * Register a face on the document on first use and return its PDFKit name.
 * registerFont() only records the source, so unused faces are never parsed.
 */
function ensure(doc, script, family, variant) {
  const { name, file } = resolve(script, family, variant);
  if (!doc._cvFontsRegistered) doc._cvFontsRegistered = new Set();
  if (!doc._cvFontsRegistered.has(name)) {
    doc.registerFont(name, loadFont(file));
    doc._cvFontsRegistered.add(name);
  }
  return name;
}

/**
 * Bind a template spec to the document so logical keys ('body', 'headingBold')
 * resolve to the right family.
 *
 * `rtlDocument` marks a resume whose content is predominantly Hebrew/Arabic.
 * Only then do RTL paragraphs right-align, which is correct typography for
 * those languages. A lone RTL field inside an otherwise Latin resume keeps the
 * caller's alignment so the template layout stays intact.
 */
function attach(doc, { fontFamily = 'sans', headingFamily = 'sans', rtlDocument = false } = {}) {
  doc._cvFamilies = {
    body: fontFamily === 'serif' ? 'serif' : 'sans',
    heading: headingFamily === 'serif' ? 'serif' : 'sans',
  };
  doc._cvRTLDocument = !!rtlDocument;
}

/**
 * True when RTL characters outnumber Latin letters across the resume's text,
 * i.e. the document as a whole reads right-to-left.
 */
function isPredominantlyRTL(strings) {
  let rtl = 0;
  let ltr = 0;
  const walk = (v) => {
    if (v == null) return;
    if (Array.isArray(v)) { v.forEach(walk); return; }
    if (typeof v === 'object') { Object.values(v).forEach(walk); return; }
    if (typeof v !== 'string') return;
    for (const ch of v) {
      const cp = ch.codePointAt(0);
      if (isNeutral(cp)) continue;
      if (isRTLScript(scriptOfCodePoint(cp))) rtl += 1;
      else if (/\p{L}/u.test(ch)) ltr += 1;
    }
  };
  walk(strings);
  return rtl > ltr;
}

function familyFor(doc, key) {
  const fams = doc._cvFamilies || { body: 'sans', heading: 'sans' };
  return HEADING_KEYS.has(key) ? fams.heading : fams.body;
}

/** PDFKit font name for a logical key, chosen for the dominant script of `text`. */
function fontFor(doc, key, text = '') {
  const variant = VARIANTS[key] || 'regular';
  const family = familyFor(doc, key);
  const scripts = scriptsIn(text);
  // Prefer a non-Latin script when present so the run is drawn with a face that
  // actually covers it.
  const script = [...scripts].find((s) => s !== 'latin') || 'latin';
  return ensure(doc, script, family, variant);
}

/** Apply a logical font + size + colour to the document. */
function apply(doc, { font = 'body', size, color }, text = '') {
  doc.font(fontFor(doc, font, text));
  if (size != null) doc.fontSize(size);
  if (color != null) doc.fillColor(color);
  return doc;
}

// ---- Tokenisation & bidi --------------------------------------------------
function tokenize(text) {
  const out = [];
  // Split into whitespace and non-whitespace chunks, then split non-whitespace
  // further whenever the font has to change so each token has exactly one face.
  const parts = String(text).split(/(\s+)/).filter((s) => s !== '');
  parts.forEach((part) => {
    if (/^\s+$/.test(part)) {
      out.push({ s: part, space: true, script: 'latin', dir: null });
      return;
    }
    const chars = [...part];
    // Pass 1 - strong scripts; neutrals stay undecided.
    const scripts = chars.map((ch) => {
      const cp = ch.codePointAt(0);
      return isNeutral(cp) ? null : scriptOfCodePoint(cp);
    });
    // Pass 2 - a neutral inherits the nearest strong script, but only if that
    // face actually covers it; otherwise it falls back to Latin.
    for (let i = 0; i < chars.length; i += 1) {
      if (scripts[i] !== null) continue;
      let inherited = null;
      for (let k = i - 1; k >= 0 && inherited === null; k -= 1) inherited = scripts[k];
      if (inherited === null) {
        for (let k = i + 1; k < chars.length && inherited === null; k += 1) inherited = scripts[k];
      }
      const cp = chars[i].codePointAt(0);
      scripts[i] = inherited && scriptCovers(inherited, cp) ? inherited : 'latin';
    }
    // Pass 3 - group runs of the same face into tokens.
    let cur = '';
    let curScript = scripts[0] || 'latin';
    const push = () => {
      if (!cur) return;
      out.push({ s: cur, space: false, script: curScript, dir: isRTLScript(curScript) ? 'rtl' : 'ltr' });
      cur = '';
    };
    chars.forEach((ch, i) => {
      if (i > 0 && scripts[i] !== curScript) {
        push();
        curScript = scripts[i];
      }
      cur += ch;
      // CJK has no inter-word spaces: UAX #14 allows a line break between
      // ideographs, which is what browsers do. Emitting one token per character
      // keeps this wrapper's line breaking identical to the preview's.
      if (scripts[i] === 'cjk') push();
    });
    push();
  });
  return out;
}

/**
 * Reorder one line's tokens from logical to visual order.
 *
 * A simplified Unicode Bidi resolution that covers the cases a resume actually
 * produces: a paragraph in one direction with runs of the other embedded
 * (Latin names, dates and numbers inside Hebrew/Arabic text, or the reverse).
 */
function reorder(tokens, baseDir) {
  // Neutral tokens (spaces) inherit the direction of the preceding strong token.
  const dirs = [];
  let last = baseDir;
  tokens.forEach((t) => {
    if (t.dir) last = t.dir;
    dirs.push(t.dir || last);
  });
  // Spaces sitting between two runs of the base direction stay with the base.
  tokens.forEach((t, i) => {
    if (!t.space) return;
    const prev = i > 0 ? dirs[i - 1] : baseDir;
    const next = i < tokens.length - 1 ? dirs[i + 1] : baseDir;
    dirs[i] = prev === next ? prev : baseDir;
  });

  const idx = tokens.map((_, i) => i);
  const opposite = baseDir === 'rtl' ? 'ltr' : 'rtl';
  let order = baseDir === 'rtl' ? idx.slice().reverse() : idx;
  // Re-reverse each maximal run of the opposite direction so it reads correctly.
  const out = [];
  let run = [];
  order.forEach((i) => {
    if (dirs[i] === opposite) {
      run.push(i);
    } else {
      if (run.length) { out.push(...run.reverse()); run = []; }
      out.push(i);
    }
  });
  if (run.length) out.push(...run.reverse());
  return out.map((i) => tokens[i]);
}

// ---- Measurement ----------------------------------------------------------
function tokenWidth(doc, tok, style) {
  doc.font(ensure(doc, tok.script, familyFor(doc, style.font || 'body'), VARIANTS[style.font || 'body'] || 'regular'));
  doc.fontSize(style.size || 10);
  return doc.widthOfString(tok.s, { characterSpacing: style.characterSpacing || 0 });
}

/** Width of a string, measured per script run. */
function widthOfString(doc, text, style = {}) {
  const toks = tokenize(text);
  return toks.reduce((sum, t) => sum + tokenWidth(doc, t, style), 0);
}

/**
 * Shorten `text` with an ellipsis until it fits `maxWidth`.
 * Used by the fixed-width chip and tag renderers so an unusually long skill
 * degrades gracefully instead of spilling outside its box.
 */
function fit(doc, text, maxWidth, style = {}) {
  const s = String(text);
  if (maxWidth <= 0) return '';
  if (widthOfString(doc, s, style) <= maxWidth) return s;
  const chars = [...s];
  let lo = 0;
  let hi = chars.length;
  while (lo < hi) {
    const mid = Math.ceil((lo + hi) / 2);
    if (widthOfString(doc, `${chars.slice(0, mid).join('')}…`, style) <= maxWidth) lo = mid;
    else hi = mid - 1;
  }
  return lo > 0 ? `${chars.slice(0, lo).join('')}…` : '';
}

function lineHeightFor(doc, tokens, style) {
  let h = 0;
  const seen = new Set();
  const list = tokens.length ? tokens : [{ s: '', script: 'latin' }];
  list.forEach((t) => {
    if (seen.has(t.script)) return;
    seen.add(t.script);
    doc.font(ensure(doc, t.script, familyFor(doc, style.font || 'body'), VARIANTS[style.font || 'body'] || 'regular'));
    doc.fontSize(style.size || 10);
    h = Math.max(h, doc.currentLineHeight());
  });
  return h;
}

/** Break tokens into lines that fit `width`. */
function wrapTokens(doc, tokens, width, style) {
  const lines = [];
  let cur = [];
  let curW = 0;
  tokens.forEach((tok) => {
    const w = tokenWidth(doc, tok, style);
    if (tok.space) {
      if (cur.length) { cur.push(tok); curW += w; }
      return;
    }
    if (curW + w > width && cur.length) {
      // Drop trailing spaces from the finished line.
      while (cur.length && cur[cur.length - 1].space) cur.pop();
      lines.push(cur);
      cur = [tok];
      curW = w;
    } else {
      cur.push(tok);
      curW += w;
    }
  });
  while (cur.length && cur[cur.length - 1].space) cur.pop();
  if (cur.length) lines.push(cur);
  return lines;
}

/** Height a string will occupy, mirroring doc.heightOfString for mixed text. */
function heightOfString(doc, text, style = {}) {
  const width = style.width || (doc.page.width - doc.page.margins.left - doc.page.margins.right);
  const lineGap = style.lineGap || 0;
  let total = 0;
  String(text).split('\n').forEach((para) => {
    const toks = tokenize(para);
    const lines = toks.length ? wrapTokens(doc, toks, width, style) : [[]];
    lines.forEach((ln) => { total += lineHeightFor(doc, ln, style) + lineGap; });
  });
  return total;
}

// ---- Rendering ------------------------------------------------------------
/** True when PDFKit's own text layout can be trusted with this string. */
function isSimple(text) {
  const s = String(text);
  if (containsRTL(s)) return false;
  const scripts = scriptsIn(s);
  return scripts.size <= 1;
}

/**
 * Draw text with the correct embedded font(s).
 *
 * `style` carries both the logical font (font/size/color) and the usual PDFKit
 * text options (width/align/lineGap/link/continued/lineBreak). Returns the
 * document so calls can be chained like doc.text().
 */
function text(doc, str, x, y, style = {}) {
  const s = str == null ? '' : String(str);
  const {
    font = 'body', size, color, ...opts
  } = style;

  // PDFKit's line wrapper breaks when the text width is *equal* to the box
  // width, not just greater, so a box measured to fit its own text wraps onto a
  // second line. lineBreak:false means "one line", so give it a hair of slack.
  if (opts.lineBreak === false && typeof opts.width === 'number') {
    opts.width += 1;
  }

  if (isSimple(s) || opts.continued) {
    // Fast path: single script (or an explicit continued chain the caller is
    // managing). Preserves PDFKit's native wrapping and alignment exactly.
    apply(doc, { font, size, color }, s);
    if (x == null) doc.text(s, opts);
    else doc.text(s, x, y, opts);
    return doc;
  }

  return layoutText(doc, s, x, y, { font, size, color, ...opts });
}

/**
 * Mixed-script / RTL layout. Places every token at an explicit x so that
 * PDFKit's word splitter cannot undo fontkit's bidi reordering or drop the
 * inter-word spaces.
 */
function layoutText(doc, s, x, y, style) {
  const startX = x != null ? x : doc.x;
  let curY = y != null ? y : doc.y;
  const width = style.width
    || (doc.page.width - doc.page.margins.right - startX);
  const lineGap = style.lineGap || 0;
  const align = style.align || 'left';

  /**
   * Flowing text has to break pages itself.
   *
   * Every token below is drawn with lineBreak:false so that PDFKit's word
   * splitter cannot undo the bidi reordering - but that also opts out of
   * PDFKit's pagination, which the simple path gets from LineWrapper for free.
   * Without this, a mixed-script paragraph starting near the bottom kept
   * advancing curY past the page edge and PDFKit began a new page for *every
   * token*, producing a run of pages holding one glyph each.
   *
   * Only wrappable text paginates. Callers that place a single line at explicit
   * coordinates (skill chips and tags, entry dates, contact items, the sidebar
   * band) pass lineBreak:false and have already reserved their own space; a
   * page break there would tear the layout apart.
   */
  const canPaginate = style.lineBreak !== false;
  const pageBottom = () => doc.page.height - doc.page.margins.bottom;

  String(s).split('\n').forEach((para) => {
    const toks = tokenize(para);
    if (!toks.length) {
      curY += lineHeightFor(doc, [], style) + lineGap;
      return;
    }
    const baseDir = baseDirection(para);
    const lines = style.lineBreak === false ? [toks] : wrapTokens(doc, toks, width, style);

    lines.forEach((lineToks) => {
      const lh = lineHeightFor(doc, lineToks, style);
      if (canPaginate && curY + lh > pageBottom()) {
        doc.addPage();
        curY = doc.page.margins.top;
      }
      const visual = reorder(lineToks, baseDir);
      const lineW = visual.reduce((sum, t) => sum + tokenWidth(doc, t, style), 0);

      let cx = startX;
      if (align === 'center') cx = startX + (width - lineW) / 2;
      else if (align === 'right' || (baseDir === 'rtl' && doc._cvRTLDocument)) {
        cx = startX + width - lineW;
      }

      visual.forEach((tok) => {
        const w = tokenWidth(doc, tok, style);
        if (!tok.space) {
          apply(doc, { font: style.font, size: style.size, color: style.color }, tok.s);
          doc.text(tok.s, cx, curY, {
            lineBreak: false,
            width: w + 2,
            link: style.link || null,
            characterSpacing: style.characterSpacing || 0,
          });
        }
        cx += w;
      });
      curY += lh + lineGap;
    });
  });

  doc.x = startX;
  doc.y = curY;
  return doc;
}

module.exports = {
  attach,
  isPredominantlyRTL,
  fontFor,
  apply,
  text,
  fit,
  widthOfString,
  heightOfString,
  scriptsIn,
  containsRTL,
  baseDirection,
  isSimple,
  availableScripts: available,
  metricsKeyFor,
  FONT_DIR,
  // exported for tests
  _internal: { tokenize, reorder, scriptOfCodePoint, resolve },
};
