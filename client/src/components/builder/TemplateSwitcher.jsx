import { useCallback, useEffect, useState } from 'react';
import { Check, Crown, LayoutTemplate, Loader, Lock, X } from 'lucide-react';
import { TEMPLATES } from '../../config/templates';
import { useResume } from '../../context/ResumeContext';
import { getCredits, startCheckout } from '../../services/api';
import TemplateThumbnail from './TemplateThumbnail';
import toast from 'react-hot-toast';
import './TemplateSwitcher.css';

// Mirrors the server's TEMPLATE_PAYWALL_ENABLED. Off until billing is live, in
// which case nothing is locked and there is no plan to look up.
const PAYWALL_ENABLED = import.meta.env.VITE_TEMPLATE_PAYWALL_ENABLED === 'true';

// Cached for the page session so re-opening the switcher doesn't re-fetch the
// plan - and premium cards don't flash a "checking" state every time.
let planPromise = null;
const fetchPlan = () => {
  if (!planPromise) {
    planPromise = getCredits()
      .then((d) => d?.plan || 'free')
      .catch(() => {
        planPromise = null; // let a later open retry
        // Fail open, exactly like the server's enforceTemplateAccess: a
        // transient profile lookup must not lock a paying user out of the
        // templates they bought. Export stays enforced server-side.
        return 'unknown';
      });
  }
  return planPromise;
};

/**
 * Switch the resume's template without touching its content.
 *
 * Every card is a real preview of the user's own resume in that template, not
 * placeholder copy, so the choice is made on what they'll actually get.
 *
 * The template is presentation only: it lives as an id on the resume row and
 * every layout decision (section order, archetype, fonts, margins) is looked up
 * from template-registry.json at render time. Switching therefore writes one
 * field and can never reorder or drop content.
 */
const TemplateSwitcher = ({ open, onClose }) => {
  const { resumeData, updateResume } = useResume();
  const [plan, setPlan] = useState(null);
  const [upgradeFor, setUpgradeFor] = useState(null);
  const [checkoutBusy, setCheckoutBusy] = useState(false);

  const currentId = resumeData?.template || 'modern';

  useEffect(() => {
    if (!open || !PAYWALL_ENABLED) return undefined;
    let cancelled = false;
    fetchPlan().then((p) => { if (!cancelled) setPlan(p); });
    return () => { cancelled = true; };
  }, [open]);

  // Close on Escape - the upgrade prompt steps back to the grid first.
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => {
      if (e.key !== 'Escape') return;
      if (upgradeFor) setUpgradeFor(null);
      else onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, upgradeFor, onClose]);

  // Reset the upgrade view when the modal is dismissed.
  useEffect(() => {
    if (!open) setUpgradeFor(null);
  }, [open]);

  // 'unknown' means the plan lookup failed - treated as entitled, see fetchPlan.
  const isPremiumUser = plan === 'pro' || plan === 'premium' || plan === 'unknown';

  /**
   * One mutually exclusive status per template, so a card can never be in two
   * states at once - in particular it can't show a lock while the plan is still
   * being resolved, which would nag a user who has already paid.
   *
   * 'pending' | 'locked' | 'available'
   */
  const statusOf = useCallback((template) => {
    if (!PAYWALL_ENABLED || !template.premium) return 'available';
    if (plan === null) return 'pending';
    return isPremiumUser ? 'available' : 'locked';
  }, [plan, isPremiumUser]);

  const handleSelect = (template) => {
    if (template.id === currentId) {
      onClose();
      return;
    }
    const status = statusOf(template);
    if (status === 'pending') return;
    if (status === 'locked') {
      setUpgradeFor(template);
      return;
    }
    // Presentation only: the content fields are untouched.
    updateResume({ template: template.id });
    toast.success(`Switched to ${template.name}`);
    onClose();
  };

  const handleUpgrade = async () => {
    setCheckoutBusy(true);
    try {
      const { url } = await startCheckout('pro');
      if (url) window.location.href = url;
      else throw new Error('No checkout URL');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Could not start checkout. Please try again.');
      setCheckoutBusy(false);
    }
  };

  if (!open) return null;

  return (
    <div className="tplsw-overlay" onClick={onClose} role="presentation">
      <div
        className="tplsw-modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Choose a template"
      >
        <div className="tplsw-header">
          <div className="tplsw-header-title">
            <LayoutTemplate size={18} />
            <span>Template</span>
          </div>
          <button className="tplsw-close" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>

        {upgradeFor ? (
          <div className="tplsw-upgrade">
            <div className="tplsw-upgrade-art">
              <TemplateThumbnail templateId={upgradeFor.id} data={resumeData} height={210} />
              <div className="tplsw-upgrade-badge"><Crown size={13} /> Pro</div>
            </div>
            <h3>{upgradeFor.name} is a Pro template</h3>
            <p>
              Upgrade to unlock all {TEMPLATES.length} templates, unlimited AI credits,
              and premium exports. Your resume content stays exactly as it is.
            </p>
            <div className="tplsw-upgrade-actions">
              <button className="btn btn-ghost" onClick={() => setUpgradeFor(null)} disabled={checkoutBusy}>
                Back to templates
              </button>
              <button className="btn btn-primary" onClick={handleUpgrade} disabled={checkoutBusy}>
                {checkoutBusy
                  ? <><Loader size={14} className="spin" /> Starting…</>
                  : <><Crown size={14} /> Upgrade to Pro</>}
              </button>
            </div>
          </div>
        ) : (
          <>
            <p className="tplsw-desc">
              Previews use your actual resume. Switching keeps all your content —
              only the design changes.
            </p>

            <div className="tplsw-grid">
              {TEMPLATES.map((template) => {
                const status = statusOf(template);
                const locked = status === 'locked';
                const pending = status === 'pending';
                const isCurrent = template.id === currentId;
                return (
                  <button
                    key={template.id}
                    type="button"
                    className={`tplsw-card ${isCurrent ? 'is-current' : ''} ${locked ? 'is-locked' : ''}`}
                    onClick={() => handleSelect(template)}
                    disabled={pending}
                    aria-current={isCurrent ? 'true' : undefined}
                    aria-label={
                      isCurrent ? `${template.name} (current template)`
                        : locked ? `${template.name} (Pro template)`
                          : `Switch to the ${template.name} template`
                    }
                  >
                    <div className="tplsw-thumb" style={{ borderTopColor: template.accent }}>
                      <TemplateThumbnail templateId={template.id} data={resumeData} height={168} />

                      {isCurrent && (
                        <div className="tplsw-current-badge"><Check size={12} /> Current</div>
                      )}

                      {pending && (
                        <div className="tplsw-thumb-veil"><Loader size={16} className="spin" /></div>
                      )}

                      {locked && (
                        <div className="tplsw-lock-badge"><Lock size={12} /> Pro</div>
                      )}
                    </div>

                    <div className="tplsw-info">
                      <span className="tplsw-name">
                        {template.name}
                        {template.premium && <Crown size={11} className="tplsw-crown" />}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default TemplateSwitcher;
