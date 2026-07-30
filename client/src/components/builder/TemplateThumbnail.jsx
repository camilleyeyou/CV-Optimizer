import { useRef, useState, useLayoutEffect, useCallback } from 'react';
import ResumePreview from './ResumePreview';
import './TemplateThumbnail.css';

// Natural width of the rendered A4 resume page (210mm ≈ 794px at 96dpi).
const PAGE_WIDTH = 794;

/**
 * Renders a real, scaled-down preview of a resume template — a window onto the
 * top of the actual rendered page so users see what they're actually getting,
 * instead of abstract placeholder bars.
 */
const TemplateThumbnail = ({ templateId, data, height = 200 }) => {
  const ref = useRef(null);
  const [scale, setScale] = useState(0.26);

  const measure = useCallback(() => {
    const el = ref.current;
    if (el && el.clientWidth) setScale(el.clientWidth / PAGE_WIDTH);
  }, []);

  useLayoutEffect(() => {
    measure();
    const el = ref.current;
    if (!el || typeof ResizeObserver === 'undefined') return undefined;
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [measure]);

  return (
    /* inert, not aria-hidden: the rendered resume contains real links (email,
       phone, profile URLs) and aria-hidden alone leaves them in the tab order
       while hiding them from screen readers — axe's aria-hidden-focus. inert
       removes them from both. Must be `inert={true}`; React renders inert=""
       as falsy. */
    <div className="tpl-thumb" ref={ref} style={{ height }} inert={true}>
      <div
        className="tpl-thumb-page"
        style={{ width: PAGE_WIDTH, transform: `scale(${scale})` }}
      >
        {/* nameTag="div": a gallery renders many of these, and each one shipping
            an <h1> would bury the page's real heading structure. */}
        <ResumePreview templateId={templateId} data={data} paginate={false} nameTag="div" />
      </div>
    </div>
  );
};

export default TemplateThumbnail;
