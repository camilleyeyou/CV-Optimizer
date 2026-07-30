import { Link } from 'react-router-dom';
import { Lock, ArrowRight, Check } from 'lucide-react';

/**
 * What a locked feature says instead of failing.
 *
 * Gated actions used to stay fully operable, fire a request, and come back with
 * a generic "Failed to…" toast from a 403. This says up front what the feature
 * is, what unlocks it, and where to go — and links to /pricing rather than
 * starting a checkout, so the billing period stays a choice and the
 * not-yet-configured case is handled in one place.
 *
 * Composes the .locked primitives from the design system.
 */
const UpgradeNotice = ({ title, description, bullets = [], onDismiss }) => (
  <div className="locked">
    <span className="locked-icon">
      <Lock size={18} aria-hidden="true" />
    </span>

    <h3 className="locked-title">{title}</h3>
    {description && <p className="locked-description">{description}</p>}

    {bullets.length > 0 && (
      <ul className="locked-list">
        {bullets.map((b) => (
          <li key={b}><Check size={13} aria-hidden="true" /> {b}</li>
        ))}
      </ul>
    )}

    <div className="locked-actions">
      <Link to="/pricing" className="btn btn-primary btn-sm">
        See what Pro includes <ArrowRight size={14} aria-hidden="true" />
      </Link>
      {onDismiss && (
        <button type="button" className="btn btn-ghost btn-sm" onClick={onDismiss}>
          Not now
        </button>
      )}
    </div>
  </div>
);

export default UpgradeNotice;
