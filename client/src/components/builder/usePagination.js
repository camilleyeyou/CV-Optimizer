import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';

// CSS renders pt at 96dpi; PDF points are the same physical unit, so this is
// the only conversion needed between the two coordinate systems.
export const PX_PER_PT = 96 / 72;
export const ptToPx = (v) => v * PX_PER_PT;

/**
 * Where the exported PDF will break, measured off a hidden copy of the preview.
 *
 * Mirrors the server renderer: content flows continuously and a block that
 * would straddle the bottom margin is pushed whole onto the next page, which is
 * what pdfService._ensureSpace() does for headings, entries and tag rows
 * (elements opting in with [data-keep-together]).
 *
 * @param {object}  opts
 * @param {number}  opts.contentHeightPt usable height between the top and bottom margins
 * @param {number}  opts.firstPageHeightPt usable height of page 1, which differs
 *                  for the header-band archetype whose band starts at the page edge
 * @param {Array}   opts.deps            re-measure when these change
 * @returns {{ measureRef, offsets, pageCount, ready }}
 */
export default function usePagination({
  contentHeightPt, firstPageHeightPt, deps = [], enabled = true,
}) {
  const measureRef = useRef(null);
  const [offsets, setOffsets] = useState([0]);
  const [ready, setReady] = useState(false);

  const measure = useCallback(() => {
    const root = measureRef.current;
    if (!root || !enabled || !contentHeightPt) return;

    const pageH = ptToPx(contentHeightPt);
    const firstH = ptToPx(firstPageHeightPt || contentHeightPt);
    if (pageH <= 0) return;

    const rootTop = root.getBoundingClientRect().top;
    const total = root.scrollHeight;

    // Blocks that must not be split across a page boundary.
    const atomic = Array.from(root.querySelectorAll('[data-keep-together]'))
      .map((el) => {
        const r = el.getBoundingClientRect();
        return { top: r.top - rootTop, bottom: r.bottom - rootTop };
      })
      .filter((b) => b.bottom > b.top);

    /* Every line box in the flow, so a break can be snapped to one.
     *
     * The cut is otherwise a raw pixel offset and lands wherever the page
     * capacity falls — routinely through the middle of a wrapped line, so a
     * page opened on sliced glyphs. The exported PDF never does that: pdfkit
     * lays text out line by line and moves whole lines to the next page, so a
     * preview that cuts through one is not showing what gets exported.
     *
     * Range.getClientRects() returns one rect per line box, which is the only
     * way to see wrapping inside a paragraph from the DOM. */
    const lines = [];
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    const range = document.createRange();
    for (let node = walker.nextNode(); node; node = walker.nextNode()) {
      if (!node.nodeValue.trim()) continue;
      range.selectNodeContents(node);
      for (const rect of range.getClientRects()) {
        if (rect.height > 0) lines.push({ top: rect.top - rootTop, bottom: rect.bottom - rootTop });
      }
    }

    const breaks = [0];
    let guard = 0;
    const capacityAt = (i) => (i === 0 ? firstH : pageH);
    while (breaks[breaks.length - 1] + capacityAt(breaks.length - 1) < total - 0.5 && guard < 64) {
      guard += 1;
      const start = breaks[breaks.length - 1];
      let cut = start + capacityAt(breaks.length - 1);
      // Pull the cut up to the top of any keep-together block it lands inside,
      // as long as that still leaves progress on the page.
      const straddling = atomic
        .filter((b) => b.top > start + 1 && b.top < cut && b.bottom > cut)
        .sort((a, b) => a.top - b.top)[0];
      const cap = capacityAt(breaks.length - 1);
      if (straddling && straddling.top > start + cap * 0.15) cut = straddling.top;

      // Then the same rule one level down: a single line must not be sliced
      // through. Applied after the block rule so a keep-together move wins.
      const cutLine = lines
        .filter((l) => l.top > start + 1 && l.top < cut - 0.5 && l.bottom > cut + 0.5)
        .sort((a, b) => a.top - b.top)[0];
      if (cutLine && cutLine.top > start + cap * 0.15) cut = cutLine.top;

      breaks.push(cut);
    }

    setOffsets(breaks);
    setReady(true);
  }, [contentHeightPt, firstPageHeightPt, enabled]);

  // Fonts change every metric, so measuring before they land gives a page count
  // computed against a fallback face.
  useEffect(() => {
    if (typeof document === 'undefined' || !document.fonts) return undefined;
    let cancelled = false;
    document.fonts.ready.then(() => { if (!cancelled) measure(); });
    return () => { cancelled = true; };
  }, [measure]);

  useLayoutEffect(() => {
    measure();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [measure, ...deps]);

  useEffect(() => {
    const el = measureRef.current;
    if (!el || typeof ResizeObserver === 'undefined') return undefined;
    const ro = new ResizeObserver(() => measure());
    ro.observe(el);
    return () => ro.disconnect();
  }, [measure]);

  return { measureRef, offsets, pageCount: offsets.length, ready };
}
