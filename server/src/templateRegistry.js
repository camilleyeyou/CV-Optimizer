// Server-side loader for the shared template registry (repo-root template-registry.json).
// Both the PDF and DOCX renderers resolve a template spec through getTemplate().
//
// The registry also carries the layout contract - page size, margins, font
// files and metrics, the type scale and block spacing - which the client
// preview consumes through client/src/config/templates.js. Anything hardcoded
// here instead of read from the registry silently drifts the preview out of
// sync with the exported PDF, which is the bug this module exists to prevent.
const path = require('path');
const registry = require(path.join(__dirname, '../../template-registry.json'));

const DEFAULT_SECTION_ORDER = [
  'summary',
  'experience',
  'education',
  'skills',
  'projects',
  'certifications',
  'languages',
];

// Sensible fallback so any unknown id renders cleanly instead of crashing.
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

const byId = new Map(registry.templates.map((t) => [t.id, t]));

/**
 * Resolve a template id to a fully-defaulted spec.
 * @param {string} id
 */
function getTemplate(id) {
  const t = byId.get(id) || FALLBACK;
  return {
    ...t,
    sectionOrder: t.sectionOrder || DEFAULT_SECTION_ORDER,
    maxPages: t.maxPages || FALLBACK.maxPages,
  };
}

function listTemplates() {
  return registry.templates;
}

/** A4 page box, in points. */
function getPage() {
  return registry.page;
}

/** Which layout block an archetype uses. */
function layoutKeyFor(archetype) {
  if (archetype === 'sidebar') return 'sidebar';
  if (archetype === 'compact') return 'compact';
  return 'default';
}

/**
 * Margins and archetype geometry, in points.
 * @param {string} archetype
 */
function getLayout(archetype) {
  const key = layoutKeyFor(archetype);
  return { ...registry.layout[key], key, headerBand: registry.layout.headerBand };
}

function getSpacing() {
  return registry.spacing;
}

/**
 * The exact strings used to join list content. Shared so the preview cannot
 * introduce different whitespace, which would move line breaks.
 */
function getSeparators() {
  return registry.separators;
}

function getFonts() {
  return registry.fonts;
}

/** The line advance PDFKit produces for a family at a given size. */
function lineHeight(family, size, extraGap = 0) {
  const m = registry.fonts.metrics[family] || registry.fonts.metrics.sans;
  return m.lineHeightRatio * size + extraGap;
}

/**
 * A type role from the shared scale, with colour tokens resolved against the
 * template palette.
 *
 * @param {string} role   e.g. 'summary', 'entryTitle'
 * @param {object} theme  palette produced by the renderer
 */
function getType(role, theme = {}) {
  const spec = registry.typography[role];
  if (!spec) throw new Error(`Unknown typography role: ${role}`);
  const color = spec.color && !spec.color.startsWith('#')
    ? (theme[spec.color] ?? spec.color)
    : spec.color;
  return { ...spec, color };
}

/** Logical font key ('body' | 'heading' | 'headingBold' | ...) for a role. */
function fontKeyFor(role) {
  const spec = registry.typography[role];
  if (!spec) throw new Error(`Unknown typography role: ${role}`);
  const base = spec.family === 'heading' ? 'heading' : 'body';
  if (spec.weight === 'bold') return base === 'heading' ? 'headingBold' : 'bodyBold';
  if (spec.style === 'italic') return base === 'heading' ? 'headingItalic' : 'bodyItalic';
  return base;
}

module.exports = {
  getTemplate,
  listTemplates,
  getPage,
  getLayout,
  getSpacing,
  getSeparators,
  getFonts,
  getType,
  fontKeyFor,
  lineHeight,
  layoutKeyFor,
  DEFAULT_SECTION_ORDER,
};
