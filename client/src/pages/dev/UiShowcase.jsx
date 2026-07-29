import { useState } from 'react';
import toast from 'react-hot-toast';
import {
  Search, Mail, Check, AlertTriangle, Info, XCircle, Lock,
  FileText, Sparkles, ArrowRight, Trash2, Plus,
} from 'lucide-react';
import Modal from '../../components/ui/Modal';
import Seo from '../../components/common/Seo';
import './UiShowcase.css';

/**
 * Design system reference, served at /dev/ui.
 *
 * Not linked from any navigation and marked noindex. Its purpose is to make
 * every token and component state visible in one place so regressions are
 * obvious and new screens have something to copy from.
 */

const SURFACES = [
  ['--surface-canvas', 'Page background'],
  ['--surface-inset', 'Wells, inputs'],
  ['--surface-base', 'Page panels'],
  ['--surface-raised', 'Cards'],
  ['--surface-overlay', 'Modals, popovers'],
];

const TEXT_TONES = [
  ['--text-primary', 'Headings, key values', '16.9:1'],
  ['--text-secondary', 'Body copy', '9.6:1'],
  ['--text-tertiary', 'Captions, helper text', '5.9:1'],
  ['--text-disabled', 'Disabled controls only', '3.0:1'],
];

const SEMANTIC = [
  ['accent', 'Accent', '8.9:1'],
  ['success', 'Success', '10.5:1'],
  ['warning', 'Warning', '11.0:1'],
  ['error', 'Error', '6.8:1'],
  ['info', 'Info', '11.0:1'],
];

const TYPE_SCALE = [
  ['display-1', 'Display XL', 'Land the interview'],
  ['display-2', 'Display L', 'Land the interview'],
  ['display-3', 'Display M', 'Land the interview'],
];

const SPACING = [1, 2, 3, 4, 5, 6, 8, 10, 12, 16];
const RADII = ['xs', 'sm', 'md', 'lg', 'xl', '2xl', '3xl'];
const SHADOWS = ['xs', 'sm', 'md', 'lg', 'xl'];

const Section = ({ id, title, description, children }) => (
  <section className="ds-section" id={id}>
    <header className="ds-section-head">
      <h2 className="ds-section-title">{title}</h2>
      {description && <p className="ds-section-desc">{description}</p>}
    </header>
    {children}
  </section>
);

const Row = ({ label, children }) => (
  <div className="ds-row">
    <span className="ds-row-label">{label}</span>
    <div className="ds-row-items">{children}</div>
  </div>
);

const UiShowcase = () => {
  const [modalOpen, setModalOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [tab, setTab] = useState('overview');
  const [segment, setSegment] = useState('monthly');
  const [switched, setSwitched] = useState(true);
  const [loading, setLoading] = useState(false);

  const fakeSubmit = () => {
    setLoading(true);
    setTimeout(() => setLoading(false), 1600);
  };

  return (
    <div className="ds">
      <Seo title="UI Reference — CV Optimizer" path="/dev/ui" noindex />

      <header className="ds-hero">
        <span className="eyebrow">Internal reference</span>
        <h1 className="display-2">Design system</h1>
        <p className="lead">
          Every token and component state in the CV Optimizer interface. Not linked from
          navigation and excluded from search indexing. Contrast figures are measured
          against the surface each tone is permitted to sit on.
        </p>
      </header>

      {/* ---------------------------------------------------------------- */}
      <Section
        id="surfaces"
        title="Surfaces"
        description="Five elevation steps, each a real colour rather than an alpha wash, so nested surfaces never mud together."
      >
        <div className="ds-swatch-grid">
          {SURFACES.map(([token, use]) => (
            <div key={token} className="ds-swatch">
              <div className="ds-swatch-chip" style={{ background: `var(${token})` }} />
              <code className="ds-swatch-token">{token}</code>
              <span className="ds-swatch-use">{use}</span>
            </div>
          ))}
        </div>
      </Section>

      {/* ---------------------------------------------------------------- */}
      <Section
        id="text"
        title="Text tones"
        description="Four tiers. The disabled tier is reserved for inert controls — it never carries body copy."
      >
        <div className="ds-list">
          {TEXT_TONES.map(([token, use, ratio]) => (
            <div key={token} className="ds-list-item">
              <span style={{ color: `var(${token})`, fontSize: 'var(--text-md)', fontWeight: 500 }}>
                The quick brown fox
              </span>
              <code className="ds-swatch-token">{token}</code>
              <span className="ds-swatch-use">{use}</span>
              <span className="badge badge-neutral tabular">{ratio}</span>
            </div>
          ))}
        </div>
      </Section>

      {/* ---------------------------------------------------------------- */}
      <Section
        id="semantic"
        title="Accent and semantic colour"
        description="One accent, used sparingly. Each semantic role ships a foreground, a tint and an edge so it can be applied consistently."
      >
        <div className="ds-swatch-grid">
          {SEMANTIC.map(([key, label, ratio]) => (
            <div key={key} className="ds-swatch">
              <div
                className="ds-swatch-chip ds-swatch-chip-semantic"
                style={{
                  background: `var(--${key}-bg)`,
                  borderColor: `var(--${key}-border)`,
                  color: `var(--${key}-fg)`,
                }}
              >
                Aa
              </div>
              <code className="ds-swatch-token">--{key}-fg</code>
              <span className="ds-swatch-use">
                {label} · {ratio}
              </span>
            </div>
          ))}
        </div>
      </Section>

      {/* ---------------------------------------------------------------- */}
      <Section
        id="type"
        title="Typography"
        description="Satoshi for display, Inter for interface. Both self-hosted and variable. Display sizes are fluid — they scale with the viewport instead of snapping at breakpoints."
      >
        <div className="ds-type-stack">
          {TYPE_SCALE.map(([cls, label, sample]) => (
            <div key={cls} className="ds-type-row">
              <span className="ds-type-label">{label}</span>
              <span className={cls}>{sample}</span>
            </div>
          ))}
          <div className="ds-type-row">
            <span className="ds-type-label">Heading L / h2</span>
            <h2>Everything you need to land the job</h2>
          </div>
          <div className="ds-type-row">
            <span className="ds-type-label">Heading M / h3</span>
            <h3>ATS compatibility score</h3>
          </div>
          <div className="ds-type-row">
            <span className="ds-type-label">Lead</span>
            <p className="lead">
              Build a resume that clears applicant tracking systems, then tailor it to each
              role in a couple of minutes.
            </p>
          </div>
          <div className="ds-type-row">
            <span className="ds-type-label">Body</span>
            <p>
              Body copy runs at 16px with a 1.65 line height and is capped at roughly 68
              characters so lines stay comfortable to scan.
            </p>
          </div>
          <div className="ds-type-row">
            <span className="ds-type-label">Eyebrow</span>
            <span className="eyebrow">Try it free</span>
          </div>
          <div className="ds-type-row">
            <span className="ds-type-label">Mono / tabular</span>
            <span className="mono">score 82 · credits 5/10</span>
          </div>
        </div>
      </Section>

      {/* ---------------------------------------------------------------- */}
      <Section id="buttons" title="Buttons" description="One primary action per view. Everything else steps down from there.">
        <Row label="Variants">
          <button className="btn btn-primary">Primary</button>
          <button className="btn btn-accent">Accent</button>
          <button className="btn btn-secondary">Secondary</button>
          <button className="btn btn-ghost">Ghost</button>
          <button className="btn btn-danger">Destructive</button>
          <button className="btn btn-danger-solid">Delete forever</button>
        </Row>

        <Row label="Sizes">
          <button className="btn btn-primary btn-sm hit-area">Small</button>
          <button className="btn btn-primary">Default</button>
          <button className="btn btn-primary btn-lg">Large</button>
          <button className="btn btn-primary btn-xl">Extra large</button>
        </Row>

        <Row label="With icons">
          <button className="btn btn-primary">
            <Sparkles size={15} aria-hidden="true" /> Generate
          </button>
          <button className="btn btn-secondary">
            Continue <ArrowRight size={15} aria-hidden="true" />
          </button>
          <button className="btn btn-secondary btn-icon" aria-label="Add section">
            <Plus size={16} aria-hidden="true" />
          </button>
          <button className="btn btn-ghost btn-icon" aria-label="Delete resume">
            <Trash2 size={16} aria-hidden="true" />
          </button>
        </Row>

        <Row label="States">
          <button className="btn btn-primary" disabled>
            Disabled
          </button>
          <button className="btn btn-secondary" disabled>
            Disabled
          </button>
          <button className="btn btn-primary" data-loading={loading} onClick={fakeSubmit}>
            {loading ? 'Saving' : 'Click to load'}
          </button>
          <span className="ds-note">Loading keeps the button's width so the layout never jumps.</span>
        </Row>

        <Row label="Full width">
          <div style={{ width: '100%', maxWidth: 320 }}>
            <button className="btn btn-primary btn-lg btn-block">Create free account</button>
          </div>
        </Row>
      </Section>

      {/* ---------------------------------------------------------------- */}
      <Section id="forms" title="Form controls" description="Every field carries a real label. Errors are announced, not just coloured.">
        <div className="ds-grid-2">
          <div className="form-group">
            <label className="form-label" htmlFor="ds-name">
              Full name
            </label>
            <input id="ds-name" className="form-input" placeholder="Ada Lovelace" />
            <span className="form-hint">Appears at the top of your resume.</span>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="ds-email">
              Email <span className="form-required" aria-hidden="true">*</span>
            </label>
            <div className="input-wrap">
              <Mail size={15} aria-hidden="true" />
              <input id="ds-email" className="form-input" type="email" placeholder="you@company.com" />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="ds-search">
              With leading icon
            </label>
            <div className="input-wrap">
              <Search size={15} aria-hidden="true" />
              <input id="ds-search" className="form-input" placeholder="Search templates" />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="ds-role">
              Target role
            </label>
            <select id="ds-role" className="form-select" defaultValue="pm">
              <option value="pm">Product Manager</option>
              <option value="eng">Software Engineer</option>
              <option value="design">Product Designer</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="ds-invalid">
              Error state
            </label>
            <input
              id="ds-invalid"
              className="form-input"
              aria-invalid="true"
              aria-describedby="ds-invalid-err"
              defaultValue="not-an-email"
            />
            <span className="form-error" id="ds-invalid-err" role="alert">
              <XCircle size={13} aria-hidden="true" /> Enter a valid email address.
            </span>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="ds-disabled">
              Disabled
            </label>
            <input id="ds-disabled" className="form-input" defaultValue="Locked while saving" disabled />
          </div>
        </div>

        <div className="form-group" style={{ marginTop: 'var(--space-6)' }}>
          <label className="form-label" htmlFor="ds-summary">
            Professional summary
          </label>
          <textarea
            id="ds-summary"
            className="form-textarea"
            placeholder="Two or three lines on what you do and the results you have delivered."
          />
        </div>

        <Row label="Checks">
          <label className="form-check" htmlFor="ds-check">
            <input type="checkbox" id="ds-check" defaultChecked />
            <span className="form-check-label">Include a photo on this template</span>
          </label>

          <button
            type="button"
            role="switch"
            aria-checked={switched}
            aria-label="Auto-save"
            className="switch"
            onClick={() => setSwitched((v) => !v)}
          />
          <span className="ds-note">Auto-save</span>
        </Row>
      </Section>

      {/* ---------------------------------------------------------------- */}
      <Section id="cards" title="Cards" description="Raised surface, hairline border, and a 1px top highlight so it reads as lit from above.">
        <div className="ds-grid-3">
          <div className="card">
            <div className="card-header">
              <div>
                <h3 className="card-title">Static card</h3>
                <p className="card-description">Default resting surface for grouped content.</p>
              </div>
            </div>
            <p className="text-muted" style={{ fontSize: 'var(--text-sm)' }}>
              Used for panels that hold content but are not themselves clickable.
            </p>
          </div>

          <button className="card card-interactive">
            <div className="card-header">
              <div>
                <h3 className="card-title">Interactive card</h3>
                <p className="card-description">Lifts on hover, settles on press.</p>
              </div>
              <ArrowRight size={16} aria-hidden="true" />
            </div>
            <p className="text-muted" style={{ fontSize: 'var(--text-sm)' }}>
              Only applied when the whole card is a link or button.
            </p>
          </button>

          <div className="card card-featured">
            <div className="card-header">
              <div>
                <h3 className="card-title">Featured card</h3>
                <p className="card-description">Accent edge for a recommended option.</p>
              </div>
              <span className="badge badge-accent">Popular</span>
            </div>
            <p className="text-muted" style={{ fontSize: 'var(--text-sm)' }}>
              Reserved for one item in a set — otherwise nothing stands out.
            </p>
          </div>
        </div>
      </Section>

      {/* ---------------------------------------------------------------- */}
      <Section id="badges" title="Badges and alerts">
        <Row label="Badges">
          <span className="badge badge-neutral">Draft</span>
          <span className="badge badge-accent">Pro</span>
          <span className="badge badge-success">
            <span className="badge-dot" aria-hidden="true" /> Passing
          </span>
          <span className="badge badge-warning">Needs work</span>
          <span className="badge badge-error">Failing</span>
          <span className="badge badge-info">Beta</span>
          <span className="badge badge-accent badge-pill">Pill variant</span>
        </Row>

        <div className="stack stack-3" style={{ marginTop: 'var(--space-6)' }}>
          <div className="alert alert-info">
            <Info size={16} aria-hidden="true" />
            <div>
              <strong className="alert-title">Scoring is approximate</strong>
              Results reflect common ATS parsing rules, not any single vendor's algorithm.
            </div>
          </div>
          <div className="alert alert-success">
            <Check size={16} aria-hidden="true" />
            <div>Resume saved. Your last export is still available in the dashboard.</div>
          </div>
          <div className="alert alert-warning">
            <AlertTriangle size={16} aria-hidden="true" />
            <div>Two work entries have no end date. Recruiters usually read this as an error.</div>
          </div>
          <div className="alert alert-error">
            <XCircle size={16} aria-hidden="true" />
            <div>Export failed. Check your connection and try again.</div>
          </div>
        </div>
      </Section>

      {/* ---------------------------------------------------------------- */}
      <Section id="nav" title="Tabs and segmented controls">
        <div className="tabs" role="tablist" aria-label="Example tabs">
          {['overview', 'keywords', 'formatting', 'history'].map((t) => (
            <button
              key={t}
              className="tab"
              role="tab"
              aria-selected={tab === t}
              onClick={() => setTab(t)}
              style={{ textTransform: 'capitalize' }}
            >
              {t}
            </button>
          ))}
        </div>

        <div className="segmented" role="tablist" aria-label="Billing period" style={{ marginTop: 'var(--space-6)' }}>
          {['monthly', 'annual'].map((s) => (
            <button
              key={s}
              className="segmented-item"
              role="tab"
              aria-selected={segment === s}
              onClick={() => setSegment(s)}
              style={{ textTransform: 'capitalize' }}
            >
              {s}
            </button>
          ))}
        </div>
      </Section>

      {/* ---------------------------------------------------------------- */}
      <Section
        id="overlays"
        title="Overlays"
        description="Modals trap focus, close on Escape, restore focus to the trigger, and become bottom sheets under 640px."
      >
        <Row label="Modals">
          <button className="btn btn-secondary" onClick={() => setModalOpen(true)}>
            Open dialog
          </button>
          <button className="btn btn-danger" onClick={() => setConfirmOpen(true)}>
            Open destructive confirm
          </button>
        </Row>

        <Row label="Tooltips">
          <span className="tooltip" data-tooltip="Exports keep your original formatting">
            <button className="btn btn-secondary btn-icon" aria-label="Download">
              <FileText size={16} aria-hidden="true" />
            </button>
          </span>
          <span className="ds-note">Hover or focus the button.</span>
        </Row>

        <Row label="Toasts">
          <button className="btn btn-secondary" onClick={() => toast.success('Resume saved')}>
            Success
          </button>
          <button className="btn btn-secondary" onClick={() => toast.error('Export failed')}>
            Error
          </button>
          <button className="btn btn-secondary" onClick={() => toast('Draft restored')}>
            Neutral
          </button>
        </Row>
      </Section>

      {/* ---------------------------------------------------------------- */}
      <Section
        id="loading"
        title="Loading"
        description="Content areas use skeletons that mirror the shape of what is arriving. Spinners are reserved for actions inside a control."
      >
        <div className="ds-grid-2">
          <div className="card">
            <div className="skeleton skeleton-title" />
            <div className="skeleton skeleton-text" style={{ width: '92%' }} />
            <div className="skeleton skeleton-text" style={{ width: '78%' }} />
            <div className="skeleton skeleton-text" style={{ width: '85%' }} />
            <div className="row" style={{ marginTop: 'var(--space-5)' }}>
              <div className="skeleton skeleton-circle" style={{ width: 32, height: 32 }} />
              <div className="skeleton skeleton-text" style={{ width: 120 }} />
            </div>
          </div>

          <div className="card row" style={{ justifyContent: 'center', gap: 'var(--space-4)' }}>
            <span className="spinner" />
            <span className="spinner spinner-lg" />
            <span className="ds-note">In-control spinners only</span>
          </div>
        </div>
      </Section>

      {/* ---------------------------------------------------------------- */}
      <Section
        id="empty"
        title="Empty and gated states"
        description="An empty state names the thing that is missing and offers the action that fixes it. A gated feature always shows the way to unlock it — never a dead control."
      >
        <div className="ds-grid-2">
          <div className="card">
            <div className="empty-state" style={{ padding: 'var(--space-10) var(--space-4)' }}>
              <span className="empty-state-icon">
                <FileText size={20} aria-hidden="true" />
              </span>
              <h3 className="empty-state-title">No resumes yet</h3>
              <p className="empty-state-description">
                Start from a template, or let AI draft one from a job description.
              </p>
              <div className="empty-state-actions">
                <button className="btn btn-primary">Create a resume</button>
                <button className="btn btn-secondary">Browse templates</button>
              </div>
            </div>
          </div>

          <div className="stack stack-4">
            <div className="locked">
              <span className="locked-icon">
                <Lock size={17} aria-hidden="true" />
              </span>
              <span className="locked-title">Resume translation is a Premium feature</span>
              <span className="locked-description">
                Translate your resume into any language while keeping its layout intact.
              </span>
              <button className="btn btn-accent btn-sm">See plans</button>
            </div>

            <div className="row row-wrap">
              <button className="btn btn-secondary">
                Translate
                <span className="lock-chip">
                  <Lock size={10} aria-hidden="true" /> Premium
                </span>
              </button>
              <span className="ds-note">Inline lock chip on a gated action</span>
            </div>
          </div>
        </div>
      </Section>

      {/* ---------------------------------------------------------------- */}
      <Section id="scales" title="Spacing, radius and elevation">
        <Row label="Spacing">
          <div className="ds-scale-strip">
            {SPACING.map((s) => (
              <div key={s} className="ds-scale-item">
                <div className="ds-scale-bar" style={{ width: `var(--space-${s})` }} />
                <code className="ds-scale-label">{s}</code>
              </div>
            ))}
          </div>
        </Row>

        <Row label="Radius">
          {RADII.map((r) => (
            <div key={r} className="ds-radius-item">
              <div className="ds-radius-box" style={{ borderRadius: `var(--radius-${r})` }} />
              <code className="ds-scale-label">{r}</code>
            </div>
          ))}
        </Row>

        <Row label="Elevation">
          {SHADOWS.map((s) => (
            <div key={s} className="ds-radius-item">
              <div
                className="ds-radius-box"
                style={{ boxShadow: `var(--highlight-top), var(--shadow-${s})`, borderRadius: 'var(--radius-lg)' }}
              />
              <code className="ds-scale-label">{s}</code>
            </div>
          ))}
        </Row>
      </Section>

      {/* ---------------------------------------------------------------- */}
      <Section
        id="motion"
        title="Motion"
        description="150–250ms, easing out. Motion communicates a state change; it never gates content. All of it is disabled under prefers-reduced-motion."
      >
        <div className="ds-list">
          {[
            ['--duration-instant', '100ms', 'Press feedback'],
            ['--duration-fast', '150ms', 'Colour and border changes'],
            ['--duration-base', '200ms', 'Transforms, hover lift'],
            ['--duration-slow', '250ms', 'Entrances — modals, panels'],
          ].map(([token, ms, use]) => (
            <div key={token} className="ds-list-item">
              <span className="ds-motion-demo" />
              <code className="ds-swatch-token">{token}</code>
              <span className="ds-swatch-use">{use}</span>
              <span className="badge badge-neutral tabular">{ms}</span>
            </div>
          ))}
        </div>
      </Section>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Rename resume"
        description="This only changes the name in your dashboard."
        footer={
          <>
            <button className="btn btn-ghost" onClick={() => setModalOpen(false)}>
              Cancel
            </button>
            <button className="btn btn-primary" onClick={() => setModalOpen(false)}>
              Save changes
            </button>
          </>
        }
      >
        <div className="form-group">
          <label className="form-label" htmlFor="ds-modal-name">
            Resume name
          </label>
          <input id="ds-modal-name" className="form-input" defaultValue="Senior Product Manager — 2026" />
          <span className="form-hint">Try Tab and Shift+Tab — focus stays inside. Escape closes.</span>
        </div>
      </Modal>

      <Modal
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title="Delete this resume?"
        description="This cannot be undone. Exported files you already downloaded are unaffected."
        footer={
          <>
            <button className="btn btn-ghost" onClick={() => setConfirmOpen(false)}>
              Keep it
            </button>
            <button className="btn btn-danger-solid" onClick={() => setConfirmOpen(false)}>
              <Trash2 size={15} aria-hidden="true" /> Delete resume
            </button>
          </>
        }
      >
        <p style={{ fontSize: 'var(--text-sm)' }}>
          The resume, its version history and any share links will be removed.
        </p>
      </Modal>
    </div>
  );
};

export default UiShowcase;
