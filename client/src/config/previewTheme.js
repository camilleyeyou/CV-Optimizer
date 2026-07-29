// Turns the shared registry into the CSS the preview renders with.
//
// Every length here is emitted in `pt`, the same unit the PDF renderer works in
// (1pt = 1/72in in both PDF and CSS), so a value of 48 means the identical
// physical distance in the preview and the export. Nothing in preview.css may
// hardcode a size, margin or font - it all arrives through these variables.
import {
  PAGE, FONTS, TYPOGRAPHY, SPACING, getLayout, fontFaceCss, fontStack, lineHeightRatio,
} from './templates';

const pt = (n) => `${Number(n.toFixed(4))}pt`;

/**
 * Line box height for a role, matching PDFKit's
 *   (ascender + lineGap - descender) / 1000 * size   [+ the role's lineGap]
 */
export function roleLineHeight(role, family = 'sans') {
  const spec = TYPOGRAPHY[role];
  return lineHeightRatio(family) * spec.size + (spec.lineGap || 0);
}

/** Roles that have a `<role>Compact` sibling used by the compact archetype. */
const compactPairs = Object.keys(TYPOGRAPHY)
  .filter((r) => TYPOGRAPHY[`${r}Compact`])
  .map((r) => [r, `${r}Compact`]);

function roleVars(role, family, alias = role) {
  const s = TYPOGRAPHY[role];
  const out = [
    `--t-${alias}-size:${pt(s.size)}`,
    `--t-${alias}-lh:${pt(roleLineHeight(role, family))}`,
  ];
  if (s.weight) out.push(`--t-${alias}-weight:${s.weight === 'bold' ? 700 : 400}`);
  if (s.style) out.push(`--t-${alias}-style:${s.style}`);
  if (s.letterSpacing) out.push(`--t-${alias}-ls:${pt(s.letterSpacing)}`);
  if (s.indent) out.push(`--t-${alias}-indent:${pt(s.indent)}`);
  return out;
}

/**
 * Global stylesheet: font faces plus the template-independent type scale and
 * spacing. Emitted once; per-template values (palette, margins, family) ride on
 * inline custom properties instead.
 */
export function buildPreviewCss() {
  const typeVars = Object.keys(TYPOGRAPHY).flatMap((role) => roleVars(role, 'sans'));
  const spaceVars = Object.entries(SPACING).map(([k, v]) => `--sp-${k}:${pt(v)}`);

  const base = `.preview-doc{${[...typeVars, ...spaceVars].join(';')};`
    + `--pg-w:${pt(PAGE.width)};--pg-h:${pt(PAGE.height)};}`;

  // The compact archetype swaps in the denser roles, so downstream rules can
  // keep referring to --t-summary-* and get the right value automatically.
  const compact = `.preview-doc.arch-compact{${compactPairs
    .flatMap(([role, compactRole]) => roleVars(compactRole, 'sans', role))
    .join(';')};}`;

  // Serif templates use the serif metrics for their line boxes.
  const serifRatio = lineHeightRatio('serif');
  const serif = serifRatio === lineHeightRatio('sans')
    ? ''
    : `.preview-doc.family-serif{${Object.keys(TYPOGRAPHY)
      .flatMap((role) => [`--t-${role}-lh:${pt(roleLineHeight(role, 'serif'))}`])
      .join(';')};}`;

  return [fontFaceCss(), base, compact, serif].filter(Boolean).join('\n');
}

/**
 * Per-template custom properties: palette, page margins and the font stacks.
 * @param {object} tpl resolved template spec
 */
export function templateVars(tpl) {
  const layout = getLayout(tpl.archetype);
  const m = layout.margins;
  const vars = {
    '--tpl-accent': tpl.accent,
    '--tpl-accent-2': tpl.accent2 || tpl.accent,
    '--tpl-sidebar-bg': tpl.sidebarBg || tpl.accent,
    '--tpl-sidebar-text': tpl.sidebarText || '#ffffff',
    '--tpl-name': '#111827',
    '--tpl-text': '#374151',
    '--tpl-muted': '#6b7280',
    '--tpl-body-font': fontStack(tpl.fontFamily),
    '--tpl-heading-font': fontStack(tpl.headingFamily),
    '--pg-mt': pt(m.top),
    '--pg-mb': pt(m.bottom),
    '--pg-ml': pt(m.left),
    '--pg-mr': pt(m.right),
    // Content box: exactly the width PDFKit wraps text inside.
    '--pg-content-w': pt(PAGE.width - m.left - m.right),
    '--pg-content-h': pt(PAGE.height - m.top - m.bottom),
  };

  if (layout.key === 'sidebar') {
    vars['--pg-sidebar-w'] = pt(layout.sidebarWidth);
    vars['--pg-sidebar-pad'] = pt(layout.sidebarPad);
    vars['--pg-sidebar-top'] = pt(layout.sidebarTop);
    // Gap between the painted band and the main column's text.
    vars['--pg-main-gap'] = pt(m.left - layout.sidebarWidth);
  }
  if (tpl.archetype === 'header-band') {
    const b = layout.headerBand;
    vars['--pg-band-pad-x'] = pt(b.sidePad);
    vars['--pg-band-pad-top'] = pt(b.topPad);
    vars['--pg-band-pad-bottom'] = pt(b.bottomPad);
  }
  return vars;
}

/** Injects the generated stylesheet once per document. */
let injected = false;
export function ensurePreviewCss() {
  if (injected || typeof document === 'undefined') return;
  const el = document.createElement('style');
  el.id = 'cv-preview-registry-css';
  el.textContent = buildPreviewCss();
  document.head.appendChild(el);
  injected = true;
}

export { pt };
export const FONT_FAMILIES = FONTS.families;
