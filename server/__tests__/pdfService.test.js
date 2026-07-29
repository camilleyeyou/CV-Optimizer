const zlib = require('zlib');
const pdfService = require('../src/services/pdfService');
const fontService = require('../src/services/fontService');
const { listTemplates, getTemplate } = require('../src/templateRegistry');
const {
  SCRIPT_SAMPLES,
  STRESS_RESUME,
  TYPICAL_RESUME,
  MULTILINGUAL_RESUME,
} = require('./fixtures/stressResume');

jest.setTimeout(60000);

const TEMPLATES = listTemplates();

// ---- PDF inspection helpers ------------------------------------------------
// PDFKit leaves object dictionaries uncompressed, so page objects are countable
// straight out of the buffer without pulling in a parser.
const pageCount = (buf) => (buf.toString('latin1').match(/\/Type\s*\/Page[^s]/g) || []).length;

/**
 * Every PDF stream, inflated where it is Flate-compressed. PDFKit compresses
 * content streams and ToUnicode CMaps, so they have to be expanded before they
 * can be inspected.
 */
const inflatedStreams = (buf) => {
  const out = [];
  const marker = Buffer.from('stream');
  const endMarker = Buffer.from('endstream');
  let i = 0;
  while ((i = buf.indexOf(marker, i)) !== -1) {
    // Skip the "endstream" keyword itself.
    if (i >= 3 && buf.slice(i - 3, i).toString('latin1') === 'end') { i += marker.length; continue; }
    let start = i + marker.length;
    if (buf[start] === 0x0d) start += 1;
    if (buf[start] === 0x0a) start += 1;
    const end = buf.indexOf(endMarker, start);
    if (end === -1) break;
    const raw = buf.slice(start, end);
    try {
      out.push(zlib.inflateSync(raw).toString('latin1'));
    } catch {
      out.push(raw.toString('latin1'));
    }
    i = end + endMarker.length;
  }
  return out;
};

/**
 * Codepoints actually encoded into the PDF, read back through each embedded
 * font's ToUnicode CMap. This is what proves a character survived rendering:
 * PDFKit drops glyphs a font lacks *silently*, so "no error" means nothing.
 */
const encodedCodePoints = (buf) => {
  const points = new Set();
  const addHex = (hex) => {
    for (let i = 0; i + 4 <= hex.length; i += 4) {
      points.add(parseInt(hex.slice(i, i + 4), 16));
    }
  };
  inflatedStreams(buf).forEach((s) => {
    let m;
    const bfchar = /beginbfchar([\s\S]*?)endbfchar/g;
    while ((m = bfchar.exec(s)) !== null) {
      const pairs = m[1].match(/<([0-9a-fA-F]+)>\s*<([0-9a-fA-F]+)>/g) || [];
      pairs.forEach((pair) => {
        addHex(pair.match(/<([0-9a-fA-F]+)>\s*<([0-9a-fA-F]+)>/)[2]);
      });
    }
    // bfrange rows come in two shapes: a consecutive run "<lo> <hi> <dstStart>"
    // and an explicit list "<lo> <hi> [<d1> <d2> ...]". PDFKit emits the list
    // form for subsetted fonts, so both have to be handled.
    const bfrange = /beginbfrange([\s\S]*?)endbfrange/g;
    while ((m = bfrange.exec(s)) !== null) {
      const rowRe = /<([0-9a-fA-F]+)>\s*<([0-9a-fA-F]+)>\s*(\[[\s\S]*?\]|<[0-9a-fA-F]+>)/g;
      let row;
      while ((row = rowRe.exec(m[1])) !== null) {
        const [, lo, hi, dst] = row;
        if (dst.startsWith('[')) {
          (dst.match(/<([0-9a-fA-F]+)>/g) || []).forEach((tok) => addHex(tok.slice(1, -1)));
        } else {
          const span = parseInt(hi, 16) - parseInt(lo, 16);
          const base = parseInt(dst.slice(1, -1).slice(0, 4), 16);
          for (let k = 0; k <= span; k += 1) points.add(base + k);
        }
      }
    }
  });
  return points;
};

/** True when every non-space character of `text` was encoded into the PDF. */
const rendersAll = (buf, text) => {
  const points = encodedCodePoints(buf);
  const missing = [];
  for (const ch of text) {
    if (!ch.trim()) continue;
    const cp = ch.codePointAt(0);
    // Surrogate pairs land in the CMap as their UTF-16 units.
    if (cp > 0xffff) {
      const h = Math.floor((cp - 0x10000) / 0x400) + 0xd800;
      if (!points.has(h)) missing.push(ch);
    } else if (!points.has(cp)) {
      missing.push(ch);
    }
  }
  return { ok: missing.length === 0, missing };
};

describe('PDF export - non-Latin script coverage', () => {
  // The exact acceptance-criteria strings.
  const CASES = Object.entries(SCRIPT_SAMPLES);

  test.each(CASES)('renders %s sample with every character legible', async (name, sample) => {
    const resume = {
      ...TYPICAL_RESUME,
      summary: sample,
      skills: [sample],
    };
    const buf = await pdfService.generatePDF(resume, 'modern');
    const { ok, missing } = rendersAll(buf, sample);
    expect(ok).toBe(true);
    expect(missing).toEqual([]);
  });

  test('a single resume containing all six scripts renders every character', async () => {
    const all = Object.values(SCRIPT_SAMPLES).join(' ');
    const buf = await pdfService.generatePDF(MULTILINGUAL_RESUME, 'modern');
    const { ok, missing } = rendersAll(buf, all);
    expect(missing).toEqual([]);
    expect(ok).toBe(true);
  });

  test.each(TEMPLATES.map((t) => t.id))('template %s keeps non-Latin text legible', async (id) => {
    const buf = await pdfService.generatePDF(MULTILINGUAL_RESUME, id);
    const all = Object.values(SCRIPT_SAMPLES).join(' ');
    expect(rendersAll(buf, all).missing).toEqual([]);
  });

  test('cover letters embed fonts too', async () => {
    const body = Object.values(SCRIPT_SAMPLES).join(' ');
    const buf = await pdfService.generateCoverLetterPDF({
      coverLetterText: `Dear team,\n\n${body}`,
      personalInfo: TYPICAL_RESUME.personal_info,
      companyName: 'Acme',
      jobTitle: 'Engineer',
    });
    expect(rendersAll(buf, body).missing).toEqual([]);
  });

  test('non-Latin text is not silently dropped to zero width', () => {
    // The original failure mode: no exception, but widthOfString() === 0.
    const PDFDocument = require('pdfkit');
    const doc = new PDFDocument({ size: 'A4' });
    fontService.attach(doc, { fontFamily: 'sans', headingFamily: 'sans' });
    Object.values(SCRIPT_SAMPLES).forEach((sample) => {
      expect(fontService.widthOfString(doc, sample, { font: 'body', size: 10 })).toBeGreaterThan(0);
    });
  });
});

describe('PDF export - pagination stays within each template budget', () => {
  test('every template declares a page budget', () => {
    TEMPLATES.forEach((t) => {
      expect(typeof getTemplate(t.id).maxPages).toBe('number');
      expect(getTemplate(t.id).maxPages).toBeGreaterThan(0);
    });
  });

  test.each(TEMPLATES.map((t) => [t.id, t.maxPages]))(
    'template %s stays within %i pages for the stress resume',
    async (id, maxPages) => {
      const buf = await pdfService.generatePDF(STRESS_RESUME, id);
      const pages = pageCount(buf);
      expect(pages).toBeGreaterThan(0);
      expect(pages).toBeLessThanOrEqual(maxPages);
    },
  );

  test('mixed-script body text paginates instead of spilling one glyph per page', async () => {
    // Regression guard: fontService's manual layout path draws each token with
    // lineBreak:false, which opts out of PDFKit's own pagination. It tracked its
    // own y with no page-bottom check, so a mixed-script paragraph that started
    // low on the page ran past the edge and PDFKit opened a fresh page for every
    // remaining token - six pages of content spread over eleven, four of which
    // held a single glyph. Only some content lengths land in that window, so
    // sweep the offset rather than testing one resume.
    const base = {
      ...STRESS_RESUME, projects: [], certifications: [], education: [], languages: [], skills: [],
    };
    const blown = [];
    for (let pad = 0; pad <= 1400; pad += 50) {
      const pages = pageCount(await pdfService.generatePDF({ ...base, summary: 'S '.repeat(pad) }, 'modern'));
      if (pages > 3) blown.push({ pad, pages });
    }
    expect(blown).toEqual([]);
  });

  test.each(TEMPLATES.map((t) => t.id))(
    'template %s stays within 2 pages for a typical resume',
    async (id) => {
      const buf = await pdfService.generatePDF(TYPICAL_RESUME, id);
      expect(pageCount(buf)).toBeLessThanOrEqual(2);
    },
  );

  test.each(TEMPLATES.filter((t) => t.archetype === 'sidebar').map((t) => t.id))(
    'sidebar template %s starts its main column on page 1',
    async (id) => {
      // A long sidebar used to run past PDFKit's own page-break threshold,
      // which silently added a page and pushed the whole main column to page 2,
      // wasting the first sheet.
      const buf = await pdfService.generatePDF(STRESS_RESUME, id);
      const streams = inflatedStreams(buf);
      // The first page's content stream must contain text drawn to the right of
      // the sidebar band (which is 200pt wide).
      const firstPage = streams.find((s) => s.includes('Tm'));
      const xs = [...firstPage.matchAll(/1 0 0 1 ([-\d.]+) [-\d.]+ Tm/g)].map((m) => parseFloat(m[1]));
      expect(Math.max(...xs)).toBeGreaterThan(210);
    },
  );

  test('infographic does not explode on a long skill list', async () => {
    // Regression guard: the previous bars renderer produced 18 pages at 80
    // skills because it advanced absolute Y coordinates with no page breaks.
    const resume = {
      ...TYPICAL_RESUME,
      skills: Array.from({ length: 80 }, (_, i) => `Skill ${i + 1}`),
    };
    const buf = await pdfService.generatePDF(resume, 'infographic');
    expect(pageCount(buf)).toBeLessThanOrEqual(3);
  });
});

describe('PDF export - no invented data', () => {
  const PDFDocument = require('pdfkit');

  // A resume with no percent sign and no numeric content of its own, so
  // anything of that kind in the output can only have been invented.
  const CLEAN_RESUME = {
    personal_info: { first_name: 'Ada', last_name: 'Lovelace', email: 'ada@example.com' },
    summary: 'Engineer focused on reliability and developer experience.',
    work_experience: [{
      position: 'Staff Engineer',
      company: 'Analytical Engines',
      description: ['Improved reliability of the deployment pipeline.'],
    }],
    skills: ['React', 'Python', 'Go', 'Rust', 'Kubernetes'],
  };

  test('infographic renders no proficiency percentage the user never entered', async () => {
    const buf = await pdfService.generatePDF(CLEAN_RESUME, 'infographic');
    const points = encodedCodePoints(buf);
    expect(points.has('%'.codePointAt(0))).toBe(false);
    // No digits either: the old renderer derived a rating from the list index.
    const digits = '0123456789'.split('').filter((d) => points.has(d.codePointAt(0)));
    expect(digits).toEqual([]);
  });

  test('skill geometry depends on the label, never on its position in the list', async () => {
    // The removed formula was `(70 + ((i * 7) % 30)) / 100`, so a skill's bar
    // changed when it moved in the list. Reversing the list must not change the
    // drawn geometry of any skill.
    const widthsFor = async (skills) => {
      const original = PDFDocument.prototype.roundedRect;
      const seen = [];
      PDFDocument.prototype.roundedRect = function patched(x, y, w, h, r) {
        seen.push(`${w.toFixed(2)}x${h.toFixed(2)}`);
        return original.call(this, x, y, w, h, r);
      };
      try {
        await pdfService.generatePDF({ ...CLEAN_RESUME, skills }, 'infographic');
      } finally {
        PDFDocument.prototype.roundedRect = original;
      }
      return seen.sort();
    };

    const forward = await widthsFor(CLEAN_RESUME.skills);
    const reversed = await widthsFor([...CLEAN_RESUME.skills].reverse());
    expect(forward.length).toBeGreaterThan(0);
    expect(reversed).toEqual(forward);
  });
});

describe('PDF export - content stays inside the page box', () => {
  const PDFDocument = require('pdfkit');

  /**
   * Records every manually positioned rounded rectangle (skill tags and
   * infographic chips) and reports any drawn past the bottom of its page.
   * These bypass PDFKit's automatic pagination, so they are the ones that used
   * to run off the sheet.
   */
  const collectOverflow = async (resume, templateId) => {
    const original = PDFDocument.prototype.roundedRect;
    const offPage = [];
    PDFDocument.prototype.roundedRect = function patched(x, y, w, h, r) {
      if (this.page && y + h > this.page.height + 0.5) {
        offPage.push({ y, bottom: y + h, pageHeight: this.page.height });
      }
      return original.call(this, x, y, w, h, r);
    };
    try {
      await pdfService.generatePDF(resume, templateId);
    } finally {
      PDFDocument.prototype.roundedRect = original;
    }
    return offPage;
  };

  test.each(TEMPLATES.map((t) => t.id))('template %s draws no tags past the page bottom', async (id) => {
    expect(await collectOverflow(STRESS_RESUME, id)).toEqual([]);
  });

  test('tag sections break to a new page instead of overflowing', async () => {
    // Configurations that made the previous renderer draw up to 27.8pt past the
    // bottom edge: enough preceding content to start the tags low on the page.
    const build = (jobs, bullets, pad) => ({
      ...TYPICAL_RESUME,
      summary: 'S'.repeat(pad),
      work_experience: Array.from({ length: jobs }, (_, i) => ({
        position: `Engineer ${i + 1}`,
        company: `Company ${i + 1}`,
        location: 'Remote',
        start_date: `${2010 + i}-01`,
        end_date: `${2011 + i}-12`,
        description: Array.from({ length: bullets }, (_, k) => `Accomplishment ${k + 1} describing meaningful work performed on the team.`),
      })),
      skills: Array.from({ length: 40 }, (_, i) => `Skill${i + 1}`),
      projects: [],
      certifications: [],
      education: [],
    });

    for (let jobs = 5; jobs <= 7; jobs += 1) {
      for (let pad = 600; pad <= 900; pad += 60) {
        const overflow = await collectOverflow(build(jobs, 4, pad), 'modern');
        expect(overflow).toEqual([]);
      }
    }
  });
});

describe('fontService - script handling', () => {
  const { tokenize, reorder, scriptOfCodePoint } = fontService._internal;

  test('classifies each acceptance script correctly', () => {
    expect(scriptOfCodePoint('ż'.codePointAt(0))).toBe('latin');
    expect(scriptOfCodePoint('ü'.codePointAt(0))).toBe('latin');
    expect(scriptOfCodePoint('П'.codePointAt(0))).toBe('latin'); // Cyrillic lives in the Noto Sans face
    expect(scriptOfCodePoint('ש'.codePointAt(0))).toBe('hebrew');
    expect(scriptOfCodePoint('م'.codePointAt(0))).toBe('arabic');
    expect(scriptOfCodePoint('履'.codePointAt(0))).toBe('cjk');
  });

  test('splits a mixed string into per-script runs', () => {
    const toks = tokenize('Acme مرحبا 履歷').filter((t) => !t.space);
    expect(toks.map((t) => t.s)).toEqual(['Acme', 'مرحبا', '履', '歷']);
    expect(toks.map((t) => t.script)).toEqual(['latin', 'arabic', 'cjk', 'cjk']);
  });

  test('allows a line break between CJK ideographs', () => {
    // CJK has no inter-word spaces; UAX #14 permits breaking between
    // ideographs, which is what the browser does. Keeping a CJK run as one
    // token made the PDF wrap a character earlier than the preview.
    const toks = tokenize('履歷中文').filter((t) => !t.space);
    expect(toks).toHaveLength(4);
    expect(toks.every((t) => t.script === 'cjk')).toBe(true);
  });

  test('reorders RTL tokens into visual order and keeps the space', () => {
    const toks = tokenize('אאא בבב');
    const visual = reorder(toks, 'rtl').map((t) => t.s);
    expect(visual).toEqual(['בבב', ' ', 'אאא']);
  });

  test('keeps embedded Latin runs left-to-right inside RTL text', () => {
    const toks = tokenize('عمل في Acme Corp');
    const visual = reorder(toks, 'rtl').filter((t) => !t.space).map((t) => t.s);
    // Arabic words reverse; the Latin company name must not.
    expect(visual.slice(-2)).toEqual(['في', 'عمل']);
    expect(visual.indexOf('Acme')).toBeLessThan(visual.indexOf('Corp'));
  });

  test('detects document-level RTL', () => {
    expect(fontService.isPredominantlyRTL({ a: 'שלום עולם מהנדס' })).toBe(true);
    expect(fontService.isPredominantlyRTL(TYPICAL_RESUME)).toBe(false);
  });

  test('routes neutral characters to a face that actually has the glyph', () => {
    // Noto's Hebrew face has no ASCII parenthesis and its Arabic face has no
    // parenthesis either, so "name (proficiency)" used to render tofu boxes.
    const runs = tokenize('مرحبا (שלום)');
    const paren = runs.filter((t) => t.s.includes('(') || t.s.includes(')'));
    expect(paren.length).toBeGreaterThan(0);
    paren.forEach((t) => expect(t.script).toBe('latin'));
    // The scripts themselves still get their own face.
    expect(runs.find((t) => t.s === 'مرحبا').script).toBe('arabic');
    expect(runs.find((t) => t.s === 'שלום').script).toBe('hebrew');
  });

  test('keeps neutrals with the surrounding face when it does have the glyph', () => {
    // The Hebrew face does have a hyphen, so this must stay one run rather than
    // being split into three for no reason.
    const hebrewDash = tokenize('שלום-עולם');
    expect(hebrewDash).toHaveLength(1);
    expect(hebrewDash[0].script).toBe('hebrew');
  });

  test('text never wraps out of a box measured to fit it', () => {
    // PDFKit wraps when width == text width, so a tag sized to its own label
    // used to spill a second line outside the tag.
    const PDFDocument = require('pdfkit');
    const doc = new PDFDocument({ size: 'A4' });
    fontService.attach(doc, { fontFamily: 'sans', headingFamily: 'sans' });
    ['Zażółć gęślą jaźń', 'Ünlü müdür', 'JavaScript'].forEach((label) => {
      const w = fontService.widthOfString(doc, label, { font: 'heading', size: 9 });
      const before = doc.y;
      fontService.text(doc, label, 50, 100, {
        font: 'heading', size: 9, width: w, lineBreak: false,
      });
      const lines = (doc.y - 100) / doc.currentLineHeight();
      expect(lines).toBeLessThanOrEqual(1);
      expect(before).toBeDefined();
    });
  });

  test('fit() ellipsises a label that cannot fit its box', () => {
    const PDFDocument = require('pdfkit');
    const doc = new PDFDocument({ size: 'A4' });
    fontService.attach(doc, { fontFamily: 'sans', headingFamily: 'sans' });
    const style = { font: 'body', size: 9 };
    const long = 'CI/CD Pipeline Architecture and Release Engineering';
    const fitted = fontService.fit(doc, long, 60, style);
    expect(fitted.length).toBeLessThan(long.length);
    expect(fitted.endsWith('…')).toBe(true);
    expect(fontService.widthOfString(doc, fitted, style)).toBeLessThanOrEqual(60);
    // A label that already fits is returned untouched.
    expect(fontService.fit(doc, 'Go', 60, style)).toBe('Go');
  });

  test('uses the fast path only for single-script LTR text', () => {
    expect(fontService.isSimple('Hello world')).toBe(true);
    expect(fontService.isSimple('Zażółć gęślą jaźń')).toBe(true);
    expect(fontService.isSimple('שלום')).toBe(false);
    expect(fontService.isSimple('Acme 履歷')).toBe(false);
  });
});
