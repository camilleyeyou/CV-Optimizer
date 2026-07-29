/**
 * Generates the CV Optimizer mark from parametric geometry.
 *
 * Everything downstream — favicon, app tiles, OG card, the React component —
 * is built from the single path this emits, so the mark can be retuned in one
 * place and regenerated rather than redrawn.
 */
import { writeFileSync } from 'node:fs';

const P = n => +n.toFixed(2);
const pt = (cx, cy, r, d) => [P(cx + r * Math.cos(d * Math.PI / 180)), P(cy + r * Math.sin(d * Math.PI / 180))];

/** C drawn as a ring segment; terminals are cut on the radius. */
function cArc(cx, cy, rOuter, weight, gap) {
  const rI = rOuter - weight, a0 = gap / 2, a1 = 360 - gap / 2;
  const [ox0, oy0] = pt(cx, cy, rOuter, a0), [ox1, oy1] = pt(cx, cy, rOuter, a1);
  const [ix1, iy1] = pt(cx, cy, rI, a1), [ix0, iy0] = pt(cx, cy, rI, a0);
  const lg = 360 - gap > 180 ? 1 : 0;
  return `M${ox0} ${oy0}A${rOuter} ${rOuter} 0 ${lg} 1 ${ox1} ${oy1}L${ix1} ${iy1}A${rI} ${rI} 0 ${lg} 0 ${ix0} ${iy0}Z`;
}

/** V with flat top terminals and a mitred apex. */
function vee(cx, yTop, yBot, halfW, w) {
  return `M${P(cx - halfW)} ${yTop}L${P(cx - halfW + w)} ${yTop}L${cx} ${P(yBot - w * 0.62)}`
       + `L${P(cx + halfW - w)} ${yTop}L${P(cx + halfW)} ${yTop}L${P(cx + w * 0.52)} ${yBot}L${P(cx - w * 0.52)} ${yBot}Z`;
}

/* Tuning notes:
   - aperture 104 pulls the C's terminals back off the V, killing the spike
     where the two upper terminals previously touched.
   - the V sits at cx 25.6 with halfW 6.3, leaving a consistent counter between
     the letters at every size.
   - both strokes are 5.0 so the pair reads as one weight. */
const C_CX = 11.4, C_CY = 16, C_R = 11.4, WEIGHT = 5.0, APERTURE = 104;
const V_CX = 25.6, V_TOP = 7.9, V_BOT = 24.6, V_HALF = 6.3;

export const MARK_PATH = `${cArc(C_CX, C_CY, C_R, WEIGHT, APERTURE)}${vee(V_CX, V_TOP, V_BOT, V_HALF, WEIGHT)}`;
// Mark occupies x 0..31.9, y 4.6..27.4 on a 32 grid.
export const MARK_VIEWBOX = '0 0 32 32';

const ACCENT_A = '#818cf8';
const ACCENT_B = '#c084fc';
const INK = '#0a0b0f';

/** Bare mark, inherits colour from its host. */
const markSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${MARK_VIEWBOX}" fill="none" role="img" aria-label="CV Optimizer">
  <path fill="currentColor" fill-rule="evenodd" d="${MARK_PATH}"/>
</svg>
`;

/**
 * Tile for the favicon and app icons. A gradient tile keeps the mark legible
 * against both light and dark browser chrome — a mono mark disappears into one
 * or the other.
 */
function tileSvg(size = 32, radius = 7) {
  // Inset the mark to ~72% so it has proper optical padding inside the tile.
  const s = 0.72, off = (32 - 32 * s) / 2;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="${size}" height="${size}">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${ACCENT_A}"/>
      <stop offset="1" stop-color="${ACCENT_B}"/>
    </linearGradient>
  </defs>
  <rect width="32" height="32" rx="${radius}" fill="url(#g)"/>
  <g transform="translate(${P(off)} ${P(off)}) scale(${s})">
    <path fill="${INK}" fill-rule="evenodd" d="${MARK_PATH}"/>
  </g>
</svg>
`;
}

writeFileSync(new URL('./out-mark.svg', import.meta.url), markSvg);
writeFileSync(new URL('./out-tile.svg', import.meta.url), tileSvg(512, 7));
writeFileSync(new URL('./mark-path.txt', import.meta.url), MARK_PATH);
console.log('MARK_PATH:\n' + MARK_PATH);
