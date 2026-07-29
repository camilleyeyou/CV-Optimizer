import { lazy, Suspense, useEffect, useRef, useState, useCallback } from 'react';
import { Target, Check } from 'lucide-react';
import { SAMPLE_RESUME } from '../builder/sampleResume';
import './HeroProductVisual.css';

/**
 * Hero visual: the real product, not a drawing of it.
 *
 * The sheet inside the frame is rendered by the same <ResumePreview> the
 * builder uses, driven by the shared template registry — so what the landing
 * page promises and what the app exports cannot drift apart.
 *
 * <ResumePreview> is code-split. It pulls in the registry and the preview
 * stylesheet, which is real weight for a visitor who bounces from the hero.
 * The frame, chrome and score card are plain CSS and paint immediately; only
 * the sheet streams in, into a box whose height is already reserved, so
 * nothing shifts when it lands.
 */
const ResumePreview = lazy(() => import('../builder/ResumePreview'));

// Natural width of the rendered A4 page (210mm at 96dpi).
const PAGE_WIDTH = 794;

const HeroProductVisual = () => {
  const ref = useRef(null);
  const [scale, setScale] = useState(0.55);

  const measure = useCallback(() => {
    const el = ref.current;
    if (el?.clientWidth) setScale(el.clientWidth / PAGE_WIDTH);
  }, []);

  useEffect(() => {
    measure();
    const el = ref.current;
    if (!el || typeof ResizeObserver === 'undefined') return undefined;
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [measure]);

  // `inert` rather than aria-hidden: the rendered resume carries real contact
  // links, and an aria-hidden subtree holding focusable children lets keyboard
  // users tab into content screen readers cannot see — which is the violation
  // aria-hidden was meant to avoid. inert removes the whole visual from both
  // the tab order and the accessibility tree in one attribute.
  //
  // Must be inert={true}: React renders `inert=""` as falsy and drops it.
  return (
    <div className="hpv" inert={true}>
      <div className="hpv-frame">
        <div className="hpv-chrome">
          <span className="hpv-dot" />
          <span className="hpv-dot" />
          <span className="hpv-dot" />
          <span className="hpv-chrome-title">Senior Product Designer — Resume</span>
        </div>

        <div className="hpv-sheet" ref={ref}>
          <div className="hpv-page" style={{ width: PAGE_WIDTH, transform: `scale(${scale})` }}>
            <Suspense fallback={<div className="hpv-page-fallback" />}>
              <ResumePreview
                templateId="modern"
                data={SAMPLE_RESUME}
                paginate={false}
                nameTag="div"
              />
            </Suspense>
          </div>
        </div>
      </div>

      {/* Score card — the app's actual output shape, with the sample resume's
          score. Decorative here; the real thing is one section down. */}
      <div className="hpv-score">
        <div className="hpv-score-head">
          <span className="hpv-score-icon"><Target size={13} /></span>
          ATS score
        </div>
        <div className="hpv-score-value">
          <span className="tabular">92</span>
          <span className="hpv-score-max">/100</span>
        </div>
        <div className="hpv-score-bar">
          <span style={{ width: '92%' }} />
        </div>
        <ul className="hpv-score-list">
          <li><Check size={11} /> Keywords matched</li>
          <li><Check size={11} /> Parsable structure</li>
          <li><Check size={11} /> Dates consistent</li>
        </ul>
      </div>
    </div>
  );
};

export default HeroProductVisual;
