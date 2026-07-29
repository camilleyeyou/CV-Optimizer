// Dev-only harness for the preview/PDF layout parity test.
//
// Playwright injects `window.__PARITY__ = { resume, template }` before load,
// renders the real ResumePreview, waits for fonts, then reads back the measured
// line boxes through window.__parityReport(). Not part of the production build
// (Vite only takes index.html as an entry).
import { createRoot } from 'react-dom/client';
import ResumePreview from './components/builder/ResumePreview';

const cfg = window.__PARITY__ || {};

/**
 * Line boxes for a text node, one rect per rendered line.
 * A Range over the node yields a client rect per line box, which is how the
 * browser reports where it actually broke the text.
 */
function linesForTextNode(node) {
  const range = document.createRange();
  const out = [];
  const text = node.textContent;
  if (!text || !text.trim()) return out;

  // Walk character offsets, cutting a new line whenever the rect's top moves.
  let start = 0;
  let lastTop = null;
  let lastBottom = null;
  let lastLeft = null;
  for (let i = 1; i <= text.length; i += 1) {
    range.setStart(node, i - 1);
    range.setEnd(node, i);
    const r = range.getBoundingClientRect();
    if (r.width === 0 && r.height === 0) continue;
    if (lastTop === null) { lastTop = r.top; lastBottom = r.bottom; lastLeft = r.left; continue; }
    if (Math.abs(r.top - lastTop) > 1) {
      out.push({ text: text.slice(start, i - 1), top: lastTop, bottom: lastBottom, left: lastLeft });
      start = i - 1;
      lastTop = r.top;
      lastBottom = r.bottom;
      lastLeft = r.left;
    }
  }
  if (lastTop !== null) out.push({ text: text.slice(start), top: lastTop, bottom: lastBottom, left: lastLeft });
  return out.map((l) => ({ ...l, text: l.text.replace(/\s+/g, ' ').trim() })).filter((l) => l.text);
}

window.__parityReport = () => {
  const root = document.querySelector('.preview-measure');
  const flow = root && (root.querySelector('.preview-flow') || root.querySelector('.preview-main'));
  if (!root || !flow) return { error: 'no measure container' };

  // Walk the whole measured document: for sidebar templates the aside carries
  // real content that the PDF also paints, so excluding it would compare
  // different documents.
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const frags = [];
  let node = walker.nextNode();
  while (node) {
    const parent = node.parentElement;
    const transform = window.getComputedStyle(parent).textTransform;
    // Two-column templates: a sidebar line and a main-column line can share a
    // baseline without being the same line, so keep the columns apart.
    const column = parent.closest('.preview-sidebar') ? 'aside' : 'main';
    frags.push(...linesForTextNode(node).map((l) => ({
      ...l,
      column,
      // CSS uppercases section titles; the PDF uppercases the string in code.
      // Report what is actually painted so the two are comparable.
      text: transform === 'uppercase' ? l.text.toUpperCase() : l.text,
    })));
    node = walker.nextNode();
  }

  // Group fragments into visual lines the way a PDF text extractor does.
  // Fragments at different font sizes share a baseline but not a top (an entry
  // title and its date, for instance), so group by vertical overlap rather than
  // by matching tops.
  const lines = [];
  ['aside', 'main'].forEach((column) => {
    const col = frags.filter((f) => f.column === column)
      .sort((a, b) => (a.top - b.top) || (a.left - b.left));
    let cur = null;
    col.forEach((f) => {
      const overlap = cur ? Math.min(cur.bottom, f.bottom) - Math.max(cur.top, f.top) : -1;
      const minH = cur ? Math.min(cur.bottom - cur.top, f.bottom - f.top) : 1;
      if (cur && overlap > minH * 0.5) {
        cur.parts.push(f);
        cur.top = Math.min(cur.top, f.top);
        cur.bottom = Math.max(cur.bottom, f.bottom);
      } else {
        cur = { top: f.top, bottom: f.bottom, column, parts: [f] };
        lines.push(cur);
      }
    });
  });
  lines.forEach((l) => {
    l.parts.sort((a, b) => a.left - b.left);
    l.text = l.parts.map((x) => x.text).join(' ');
    l.left = l.parts[0].left;
  });

  const badge = document.querySelector('.preview-page-badge');
  const sheetEls = document.querySelectorAll('.preview-sheet');
  const sheets = sheetEls.length;
  // Height of each rendered slice, so the harness can work out which page a
  // measured line lands on and compare page by page with the PDF.
  const slices = Array.from(sheetEls).map((el) => {
    const clip = el.querySelector('.preview-clip');
    return clip ? clip.getBoundingClientRect().height : 0;
  });

  // Diagnostics: if the embedded faces did not load, every metric below is
  // measured against a fallback font and the comparison is meaningless.
  const nameEl = root.querySelector('.preview-name');
  const probe = nameEl || flow.querySelector('.preview-text');
  const cs = probe ? window.getComputedStyle(probe) : null;
  const flowLeft = root.getBoundingClientRect().left;

  return {
    template: cfg.template,
    pageCount: sheets,
    badge: badge ? badge.textContent : null,
    contentHeightPx: flow.scrollHeight,
    slices,
    contentWidthPx: flow.clientWidth,
    fonts: {
      // Only the family the template actually uses gets downloaded, so check
      // whichever one this document asked for.
      loaded: cs ? document.fonts.check(`400 10pt ${cs.fontFamily.split(',')[0]}`) : false,
      sansLoaded: document.fonts.check("400 10pt 'CVNotoSans'"),
      serifLoaded: document.fonts.check("400 10pt 'CVNotoSerif'"),
      probeFamily: cs ? cs.fontFamily : null,
      probeSize: cs ? cs.fontSize : null,
      probeWidthPx: probe ? probe.getBoundingClientRect().width : null,
    },
    lines: lines.map((l) => l.text.replace(/\s+/g, ' ').trim()),
    lineTops: lines.map((l) => Math.round(l.top * 100) / 100),
    // Two-column layouts are reported column by column, aside first.
    lineColumns: lines.map((l) => l.column),
    lineLefts: lines.map((l) => Math.round((l.left - flowLeft) * 100) / 100),
  };
};

createRoot(document.getElementById('harness-root')).render(
  <ResumePreview data={cfg.resume} templateId={cfg.template} />,
);
