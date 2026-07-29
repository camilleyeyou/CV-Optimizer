/**
 * The CV Optimizer mark.
 *
 * A "CV" monogram: the C is a ring segment with a wide aperture, the V a
 * chevron with flat terminals, both at the same 5-unit weight so the pair reads
 * as one drawing. Geometry is generated rather than hand-drawn — the aperture
 * and kerning are tuned so the two letters never touch, which is what made
 * earlier drafts turn to mush below 24px.
 *
 * `variant="mark"`  bare glyph, inherits currentColor. Use in the app chrome.
 * `variant="tile"`  glyph knocked out of the brand gradient. Use where the mark
 *                   must survive an unknown background — favicons, app icons,
 *                   share cards. Matches public/favicon.svg exactly.
 *
 * The same path drives public/favicon.svg, the app icons and the OG card, so
 * retuning the mark means regenerating those, not redrawing them.
 */

const MARK_PATH =
  'M18.42 24.98A11.4 11.4 0 1 1 18.42 7.02L15.34 10.96A6.4 6.4 0 1 0 15.34 21.04Z'
  + 'M19.3 7.9L24.3 7.9L25.6 21.5L26.9 7.9L31.9 7.9L28.2 24.6L23 24.6Z';

const Logo = ({ size = 22, variant = 'mark', className, title }) => {
  const common = {
    width: size,
    height: size,
    viewBox: '0 0 32 32',
    className,
    xmlns: 'http://www.w3.org/2000/svg',
    // Decorative next to a visible wordmark; announced when it stands alone.
    ...(title ? { role: 'img' } : { 'aria-hidden': 'true', focusable: 'false' }),
  };

  if (variant === 'tile') {
    // Gradient ids must be unique per instance or a second <svg> on the page
    // reuses the first one's def and can render with the wrong fill.
    const id = `cv-grad-${size}`;
    return (
      <svg {...common}>
        {title && <title>{title}</title>}
        <defs>
          <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#818cf8" />
            <stop offset="1" stopColor="#c084fc" />
          </linearGradient>
        </defs>
        <rect width="32" height="32" rx="7" fill={`url(#${id})`} />
        <g transform="translate(4.48 4.48) scale(0.72)">
          <path fill="#0a0b0f" fillRule="evenodd" d={MARK_PATH} />
        </g>
      </svg>
    );
  }

  return (
    <svg {...common}>
      {title && <title>{title}</title>}
      <path fill="currentColor" fillRule="evenodd" d={MARK_PATH} />
    </svg>
  );
};

export default Logo;
