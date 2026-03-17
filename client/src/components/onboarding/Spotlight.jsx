import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import useTour from './useTour';
import './Spotlight.css';

const PADDING = 8;
const RADIUS = 12;
const TOOLTIP_WIDTH = 320;
const TOOLTIP_GAP = 14;

const getTooltipPosition = (rect, placement) => {
  if (!rect) return { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' };

  const style = {};
  const vw = window.innerWidth;
  const vh = window.innerHeight;

  switch (placement) {
    case 'bottom':
      style.top = rect.bottom + TOOLTIP_GAP;
      style.left = Math.max(16, Math.min(rect.left + rect.width / 2 - TOOLTIP_WIDTH / 2, vw - TOOLTIP_WIDTH - 16));
      break;
    case 'bottom-end':
      style.top = rect.bottom + TOOLTIP_GAP;
      style.left = Math.max(16, Math.min(rect.right - TOOLTIP_WIDTH, vw - TOOLTIP_WIDTH - 16));
      break;
    case 'top':
      style.left = Math.max(16, Math.min(rect.left + rect.width / 2 - TOOLTIP_WIDTH / 2, vw - TOOLTIP_WIDTH - 16));
      break;
    case 'left':
      style.top = Math.max(16, rect.top + rect.height / 2 - 80);
      style.left = Math.max(16, rect.left - TOOLTIP_WIDTH - TOOLTIP_GAP);
      break;
    case 'right':
      style.top = Math.max(16, rect.top + rect.height / 2 - 80);
      style.left = Math.min(rect.right + TOOLTIP_GAP, vw - TOOLTIP_WIDTH - 16);
      break;
    default:
      style.top = rect.bottom + TOOLTIP_GAP;
      style.left = Math.max(16, rect.left);
  }

  // For 'top', calculate from bottom
  if (placement === 'top') {
    const tooltipBottom = rect.top - TOOLTIP_GAP;
    style.top = Math.max(16, tooltipBottom - 160); // estimate height
  }

  // Clamp vertical
  if (style.top > vh - 200) style.top = rect.top - 180;
  if (style.top < 16) style.top = 16;

  return style;
};

const Spotlight = ({ tour }) => {
  const { isActive, currentStep, totalSteps, stepData, targetRect, next, prev, skip } = useTour(tour);

  if (!isActive || !stepData) return null;

  const vw = window.innerWidth;
  const vh = window.innerHeight;

  // Cutout rect with padding
  const cx = targetRect ? targetRect.left - PADDING : 0;
  const cy = targetRect ? targetRect.top - PADDING : 0;
  const cw = targetRect ? targetRect.width + PADDING * 2 : 0;
  const ch = targetRect ? targetRect.height + PADDING * 2 : 0;

  const tooltipStyle = getTooltipPosition(targetRect, stepData.placement);
  const isLast = currentStep >= totalSteps - 1;

  // Count visible step index (for display)
  const displayIdx = currentStep + 1;

  const content = (
    <div className="tour-overlay" onClick={skip}>
      {/* SVG overlay with cutout */}
      <svg className="tour-overlay-svg" width={vw} height={vh}>
        <defs>
          <mask id="tour-mask">
            <rect width={vw} height={vh} fill="white" />
            {targetRect && (
              <rect x={cx} y={cy} width={cw} height={ch} rx={RADIUS} ry={RADIUS} fill="black" />
            )}
          </mask>
        </defs>
        <rect
          width={vw}
          height={vh}
          fill="rgba(0,0,0,0.65)"
          mask="url(#tour-mask)"
        />
        {/* Glow ring around spotlight */}
        {targetRect && (
          <rect
            x={cx}
            y={cy}
            width={cw}
            height={ch}
            rx={RADIUS}
            ry={RADIUS}
            className="tour-spotlight-ring"
          />
        )}
      </svg>

      {/* Tooltip */}
      <div
        className={`tour-tooltip tour-placement-${stepData.placement || 'bottom'}`}
        style={tooltipStyle}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="tour-tooltip-header">
          <span className="tour-tooltip-step">{displayIdx} of {totalSteps}</span>
          <button className="tour-tooltip-close" onClick={skip} aria-label="Close tour">
            <X size={14} />
          </button>
        </div>
        <h4 className="tour-tooltip-title">{stepData.title}</h4>
        <p className="tour-tooltip-content">{stepData.content}</p>

        {/* Progress dots */}
        <div className="tour-tooltip-dots">
          {Array.from({ length: totalSteps }, (_, i) => (
            <span key={i} className={`tour-tooltip-dot ${i === currentStep ? 'active' : ''} ${i < currentStep ? 'done' : ''}`} />
          ))}
        </div>

        <div className="tour-tooltip-footer">
          <button className="btn btn-ghost btn-sm" onClick={skip}>Skip</button>
          <div className="tour-tooltip-nav">
            {currentStep > 0 && (
              <button className="btn btn-secondary btn-sm" onClick={prev}>Back</button>
            )}
            <button className="btn btn-primary btn-sm" onClick={isLast ? skip : next}>
              {isLast ? 'Got it!' : 'Next'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(content, document.body);
};

export default Spotlight;
