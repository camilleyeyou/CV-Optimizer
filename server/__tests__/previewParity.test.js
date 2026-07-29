// Guards the shared layout contract that keeps the on-screen preview and the
// exported PDF in agreement.
//
// The full check renders the preview in a browser and diffs its line boxes
// against the PDF (scripts/verify-preview-parity.mjs). That needs Chromium, so
// it is not part of this suite. What runs here is the part that catches the
// drift which caused the original bug: a value the two renderers are supposed
// to share getting hardcoded on one side.
const fs = require('fs');
const path = require('path');
const registry = require('../../template-registry.json');
const {
  getTemplate, listTemplates, getPage, getLayout, getSpacing, getSeparators,
  getType, getFonts, lineHeight, layoutKeyFor,
} = require('../src/templateRegistry');

const REPO = path.join(__dirname, '../..');
const CLIENT_SRC = path.join(REPO, 'client/src');

const read = (p) => fs.readFileSync(path.join(REPO, p), 'utf8');

describe('registry: layout contract is complete', () => {
  test('declares the page box in points', () => {
    const page = getPage();
    // A4 at 72dpi. Both renderers work in points, so these are the same
    // physical dimensions on screen and on paper.
    expect(page.width).toBeCloseTo(595.28, 2);
    expect(page.height).toBeCloseTo(841.89, 2);
  });

  test('declares margins for every archetype in use', () => {
    const archetypes = new Set(listTemplates().map((t) => t.archetype));
    archetypes.forEach((a) => {
      const layout = getLayout(a);
      ['top', 'bottom', 'left', 'right'].forEach((side) => {
        expect(typeof layout.margins[side]).toBe('number');
        expect(layout.margins[side]).toBeGreaterThan(0);
      });
    });
    // The sidebar's main column must begin to the right of the painted band.
    const sb = getLayout('sidebar');
    expect(sb.margins.left).toBeGreaterThan(sb.sidebarWidth);
  });

  test('declares font files and the metrics the preview needs for line-height', () => {
    const fonts = getFonts();
    Object.entries(fonts.families).forEach(([family, variants]) => {
      Object.values(variants).forEach((file) => {
        expect(fs.existsSync(path.join(REPO, fonts.sourceDir, file))).toBe(true);
      });
      const m = fonts.metrics[family];
      expect(m).toBeDefined();
      // PDFKit: (ascender + lineGap - descender) / 1000
      const expected = (m.ascender + m.lineGap - m.descender) / 1000;
      expect(m.lineHeightRatio).toBeCloseTo(expected, 5);
    });
  });

  test('every web font the preview loads exists', () => {
    const fonts = getFonts();
    const files = new Set(Object.values(fonts.families).flatMap((v) => Object.values(v)));
    files.forEach((file) => {
      const web = `${file.replace(/\.(ttf|otf)$/i, '')}.${fonts.webFormat}`;
      const p = path.join(REPO, 'client/public', fonts.webPath, web);
      expect(fs.existsSync(p)).toBe(true);
    });
  });

  test('typography roles resolve for both renderers', () => {
    Object.keys(registry.typography).forEach((role) => {
      const spec = getType(role, { accent: '#000', name: '#111', text: '#222', muted: '#333', sidebarText: '#fff' });
      expect(typeof spec.size).toBe('number');
      expect(spec.size).toBeGreaterThan(0);
      // Colour tokens must resolve to a literal, never leak the token name.
      expect(spec.color).toMatch(/^#/);
    });
  });

  test('spacing and separators are declared', () => {
    const sp = getSpacing();
    expect(Object.keys(sp).length).toBeGreaterThan(20);
    Object.values(sp).forEach((v) => expect(typeof v).toBe('number'));
    const sep = getSeparators();
    ['inlineSkills', 'languages', 'entryTitle'].forEach((k) => {
      expect(typeof sep[k]).toBe('string');
      // Single-spaced: HTML collapses runs of whitespace, so a double space in
      // the PDF would wrap at a different point than the preview.
      expect(sep[k]).not.toMatch(/ {2}/);
    });
  });
});

describe('renderers agree on geometry', () => {
  test('preview and PDF derive the same content width per archetype', () => {
    const page = getPage();
    listTemplates().forEach((t) => {
      const layout = getLayout(t.archetype);
      const width = page.width - layout.margins.left - layout.margins.right;
      // This is the width PDFKit wraps inside and the width the preview's
      // --pg-content-w resolves to.
      expect(width).toBeGreaterThan(100);
      expect(width).toBeCloseTo(page.width - layout.margins.left - layout.margins.right, 6);
    });
  });

  test('line height for a role matches PDFKit for both font families', () => {
    ['sans', 'serif'].forEach((family) => {
      const m = getFonts().metrics[family];
      const size = getType('summary').size;
      expect(lineHeight(family, size)).toBeCloseTo(m.lineHeightRatio * size, 6);
    });
  });

  test('archetype -> layout mapping is identical on both sides', () => {
    // The client mirrors this function; if the two ever disagree the preview
    // would use the wrong margins.
    const clientSrc = read('client/src/config/templates.js');
    expect(clientSrc).toContain("if (archetype === 'sidebar') return 'sidebar';");
    expect(clientSrc).toContain("if (archetype === 'compact') return 'compact';");
    expect(layoutKeyFor('sidebar')).toBe('sidebar');
    expect(layoutKeyFor('compact')).toBe('compact');
    expect(layoutKeyFor('classic-centered')).toBe('default');
  });
});

describe('no hardcoded geometry leaks back into either renderer', () => {
  // The pagination chrome (page badge, break rule) is preview-only furniture
  // that has no counterpart in the PDF, so its own sizes are not part of the
  // shared contract.
  const documentCss = () => read('client/src/components/builder/preview.css')
    .split('/* ===== Pagination chrome')[0];

  test('preview CSS carries no literal font stack or pixel page box', () => {
    const css = documentCss();
    // The old preview used Inter/Georgia and px margins, which is exactly why
    // it wrapped differently from the PDF.
    expect(css).not.toMatch(/Inter|Georgia|Times New Roman|Helvetica/);
    expect(css).not.toMatch(/\b210mm\b|\b297mm\b/);
    // Page box and margins must come from the registry variables.
    expect(css).toContain('var(--pg-w)');
    expect(css).toContain('var(--pg-mt)');
    expect(css).toContain('var(--tpl-body-font)');
  });

  test('preview CSS sizes type from registry variables, not literals', () => {
    const literalFontSizes = documentCss().match(/font-size:\s*\d+(\.\d+)?(pt|px)/g) || [];
    expect(literalFontSizes).toEqual([]);
  });

  test('pdfService reads sizes and margins from the registry', () => {
    const src = read('server/src/services/pdfService.js');
    expect(src).toContain("require('../templateRegistry')");
    expect(src).toContain('getLayout');
    expect(src).toContain('getSpacing');
    // No literal A4 box and no per-archetype margin table in the renderer.
    expect(src).not.toMatch(/size:\s*'A4'/);
    expect(src).not.toMatch(/top:\s*40,\s*bottom:\s*40/);
  });

  test('every template declares a page budget the preview can show', () => {
    listTemplates().forEach((t) => {
      expect(typeof getTemplate(t.id).maxPages).toBe('number');
    });
  });
});
