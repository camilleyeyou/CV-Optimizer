// Client-side loader for the shared template registry (repo-root template-registry.json).
// The same file drives the server PDF/DOCX renderers, so the preview and the
// downloaded document stay in sync. Vite serves the root file via server.fs.allow: ['..'].
//
// Everything geometric - page box, margins, font faces and their metrics, the
// type scale and block spacing - comes from the registry. The preview must not
// introduce its own values: a font or margin that differs from the PDF is
// exactly how a resume looks like 2 pages on screen and exports as 3.
import registry from '../../../template-registry.json';

export const DEFAULT_SECTION_ORDER = [
  'summary',
  'experience',
  'education',
  'skills',
  'projects',
  'certifications',
  'languages',
];

const FALLBACK = {
  id: 'modern',
  name: 'Modern',
  premium: false,
  archetype: 'classic-centered',
  accent: '#2563eb',
  fontFamily: 'sans',
  headingFamily: 'sans',
  sectionTitle: 'underline',
  skillsStyle: 'tags',
  maxPages: 4,
};

export const TEMPLATES = registry.templates;

const byId = new Map(registry.templates.map((t) => [t.id, t]));

export function getTemplate(id) {
  const t = byId.get(id) || FALLBACK;
  return {
    ...t,
    sectionOrder: t.sectionOrder || DEFAULT_SECTION_ORDER,
    maxPages: t.maxPages || FALLBACK.maxPages,
  };
}

// ---- Shared layout contract -----------------------------------------------
export const PAGE = registry.page;
export const FONTS = registry.fonts;
export const TYPOGRAPHY = registry.typography;
export const SPACING = registry.spacing;
// Exact join strings, shared so the preview cannot introduce different
// whitespace and move a line break.
export const SEPARATORS = registry.separators;

/** Mirrors templateRegistry.layoutKeyFor() on the server. */
export function layoutKeyFor(archetype) {
  if (archetype === 'sidebar') return 'sidebar';
  if (archetype === 'compact') return 'compact';
  return 'default';
}

export function getLayout(archetype) {
  const key = layoutKeyFor(archetype);
  return { ...registry.layout[key], key, headerBand: registry.layout.headerBand };
}

/** The line advance PDFKit produces - used directly as CSS line-height. */
export function lineHeightRatio(family = 'sans') {
  const m = FONTS.metrics[family] || FONTS.metrics.sans;
  return m.lineHeightRatio;
}

/**
 * A type role with its colour token resolved against the template palette.
 * @param {string} role
 * @param {object} palette
 */
export function getType(role, palette = {}) {
  const spec = TYPOGRAPHY[role];
  if (!spec) throw new Error(`Unknown typography role: ${role}`);
  const color = spec.color && !spec.color.startsWith('#')
    ? (palette[spec.color] ?? spec.color)
    : spec.color;
  return { ...spec, color };
}

// ---- Web font wiring -------------------------------------------------------
// The registry lists the canonical TTF/OTF the PDF embeds; the browser loads the
// same faces re-encoded as woff2 (lossless, so metrics are identical).
const webUrl = (file) => `${FONTS.webPath}/${file.replace(/\.(ttf|otf)$/i, '')}.${FONTS.webFormat}`;

export const CSS_FAMILY = {
  sans: 'CVNotoSans',
  serif: 'CVNotoSerif',
  hebrew: 'CVNotoHebrew',
  arabic: 'CVNotoArabic',
  cjk: 'CVNotoCJK',
};

const VARIANT_CSS = {
  regular: { weight: 400, style: 'normal' },
  bold: { weight: 700, style: 'normal' },
  italic: { weight: 400, style: 'italic' },
  boldItalic: { weight: 700, style: 'italic' },
};

/**
 * @font-face rules for every face in the registry.
 *
 * Declaring them all is cheap: a browser only downloads a face when text
 * actually uses it, so a Latin resume never pulls the 4 MB CJK file.
 * font-display:block avoids a flash of fallback text whose different metrics
 * would momentarily paginate the preview wrongly.
 */
export function fontFaceCss() {
  const rules = [];
  Object.entries(FONTS.families).forEach(([family, variants]) => {
    const cssName = CSS_FAMILY[family];
    if (!cssName) return;
    Object.entries(variants).forEach(([variant, file]) => {
      const v = VARIANT_CSS[variant];
      if (!v) return;
      rules.push(
        `@font-face{font-family:'${cssName}';src:url('${webUrl(file)}') format('${FONTS.webFormat}');`
        + `font-weight:${v.weight};font-style:${v.style};font-display:block;}`,
      );
    });
  });
  return rules.join('\n');
}

/**
 * The CSS font-family stack for a template.
 *
 * Order matters: the Latin face first, then the script-specific faces as
 * fallbacks. That reproduces fontService's per-script routing on the server,
 * where each run is drawn with the first face that has the glyph.
 */
export function fontStack(family) {
  const base = CSS_FAMILY[family === 'serif' ? 'serif' : 'sans'];
  return [base, CSS_FAMILY.hebrew, CSS_FAMILY.arabic, CSS_FAMILY.cjk]
    .map((n) => `'${n}'`)
    .join(', ');
}

/**
 * True when RTL characters outnumber Latin letters across the resume.
 *
 * Mirrors fontService.isPredominantlyRTL() on the server, which is what decides
 * whether the PDF right-aligns RTL paragraphs. `dir="auto"` alone would flip
 * block alignment for a single Hebrew field inside an otherwise Latin resume,
 * which the PDF does not do.
 */
export function isPredominantlyRTL(value) {
  let rtl = 0;
  let ltr = 0;
  const walk = (v) => {
    if (v == null) return;
    if (Array.isArray(v)) { v.forEach(walk); return; }
    if (typeof v === 'object') { Object.values(v).forEach(walk); return; }
    if (typeof v !== 'string') return;
    for (const ch of v) {
      const cp = ch.codePointAt(0);
      const isRTL = (cp >= 0x0590 && cp <= 0x05ff) || (cp >= 0xfb1d && cp <= 0xfb4f)
        || (cp >= 0x0600 && cp <= 0x06ff) || (cp >= 0x0750 && cp <= 0x077f)
        || (cp >= 0x08a0 && cp <= 0x08ff) || (cp >= 0xfb50 && cp <= 0xfdff)
        || (cp >= 0xfe70 && cp <= 0xfeff);
      if (isRTL) rtl += 1;
      else if (/\p{L}/u.test(ch)) ltr += 1;
    }
  };
  walk(value);
  return rtl > ltr;
}
