import { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Plus, FileText, Clock, Trash2, Edit3, Copy, MoreVertical,
  Upload, Sparkles, Settings, ArrowRight, Linkedin,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useResume } from '../context/ResumeContext';
import { useAuth } from '../context/AuthContext';
import api, { getCredits, openBillingPortal } from '../services/api';
import Spotlight from '../components/onboarding/Spotlight';
import { tours } from '../components/onboarding/tourSteps';
import TemplateThumbnail from '../components/builder/TemplateThumbnail';
import Modal from '../components/ui/Modal';
import './Dashboard.css';

// Injected at build time from template-registry.json (see vite.config.js) so a
// newly shipped template cannot leave this page quoting a stale number.
const TEMPLATE_COUNT = __TEMPLATE_COUNT__;

const COMPLETENESS_CHECKS = [
  (r) => r.personal_info?.first_name,
  (r) => r.personal_info?.email,
  (r) => r.personal_info?.phone,
  (r) => r.summary?.length > 20,
  (r) => r.work_experience?.length > 0,
  (r) => r.education?.length > 0,
  (r) => r.skills?.length > 0,
];

const Dashboard = () => {
  const navigate = useNavigate();
  const {
    resumes, loading, deleteResume, duplicateResume, createResume, updateResume,
  } = useResume();
  const { user } = useAuth();
  const [menuOpen, setMenuOpen] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importSource, setImportSource] = useState('resume');
  const [billing, setBilling] = useState(null); // { plan, credits, max_credits }
  const [billingBusy, setBillingBusy] = useState(false);
  const menuRef = useRef(null);
  const importInputRef = useRef(null);
  // The delete dialog is opened from a menu item that unmounts as it opens, so
  // there is nothing left to hand focus back to. Keep the card's own trigger.
  const triggerRefs = useRef({});
  const restoreFocusRef = useRef(null);

  const displayName =
    user?.user_metadata?.first_name || user?.email?.split('@')[0] || 'there';

  const refreshBilling = useCallback(() => {
    getCredits().then(setBilling).catch(() => {});
  }, []);

  useEffect(() => {
    refreshBilling();
    // Surface the result of a Stripe Checkout redirect.
    const params = new URLSearchParams(window.location.search);
    if (params.get('upgrade') === 'success') {
      toast.success('Welcome to Pro. Your plan is now active.');
      // Plan sync happens via webhook; poll briefly so the banner updates.
      setTimeout(refreshBilling, 1500);
      setTimeout(refreshBilling, 4000);
      window.history.replaceState({}, '', '/dashboard');
    }
  }, [refreshBilling]);

  const handleManageBilling = async () => {
    setBillingBusy(true);
    try {
      const { url } = await openBillingPortal();
      if (url) window.location.href = url;
      else throw new Error('No portal URL');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Could not open billing portal.');
      setBillingBusy(false);
    }
  };

  const isPaid = billing?.plan === 'pro' || billing?.plan === 'premium';

  // Close card menu on click outside or Escape
  const closeMenu = useCallback(() => setMenuOpen(null), []);

  useEffect(() => {
    if (!menuOpen) return undefined;
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) closeMenu();
    };
    const handleEscape = (e) => { if (e.key === 'Escape') closeMenu(); };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [menuOpen, closeMenu]);

  const handleCreate = () => navigate('/templates');

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteResume(deleteTarget.id);
      setDeleteTarget(null);
    } finally {
      setDeleting(false);
    }
  };

  const handleDuplicate = async (id) => {
    closeMenu();
    await duplicateResume(id);
  };

  const handleImport = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type !== 'application/pdf') {
      toast.error('Please upload a PDF file.');
      return;
    }

    const source = importSource;
    setImporting(true);
    try {
      const formData = new FormData();
      formData.append('resume', file);
      formData.append('source', source);

      const response = await api.post('/api/ats/parse', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const parsed = response.data;
      const name = `${parsed.personal_info?.first_name || ''} ${parsed.personal_info?.last_name || ''}`.trim();
      const newResume = await createResume('modern');

      if (newResume) {
        updateResume({ title: name || 'Imported Resume', ...parsed });
        toast.success('Resume imported. Opening the builder.');
        navigate(`/builder/${newResume.id}`);
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to import resume.');
    } finally {
      setImporting(false);
      if (importInputRef.current) importInputRef.current.value = '';
    }
  };

  const pickFile = (source) => {
    setImportSource(source);
    importInputRef.current?.click();
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const diffDays = Math.floor((new Date() - date) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const getResumeTitle = (resume) => {
    if (resume.title) return resume.title;
    const first = resume.personal_info?.first_name || '';
    const last = resume.personal_info?.last_name || '';
    if (first || last) return `${first} ${last}`.trim();
    return 'Untitled resume';
  };

  const getCompleteness = (resume) => Math.round(
    (COMPLETENESS_CHECKS.filter((check) => check(resume)).length
      / COMPLETENESS_CHECKS.length) * 100
  );

  const creditsLeft = billing?.credits ?? 0;
  const creditsMax = billing?.max_credits ?? 5;

  return (
    <div className="db">
      <div className="db-container">
        {/* ------------------------------------------------ page header --- */}
        <header className="db-head" data-tour="dashboard-welcome">
          <div className="db-head-copy">
            <h1 className="db-title">Your resumes</h1>
            <p className="db-sub">
              {loading
                ? 'Loading your resumes…'
                : resumes.length === 0
                  ? `Hi ${displayName}. Pick a template to build your first one.`
                  : `${resumes.length} resume${resumes.length === 1 ? '' : 's'}. Pick one up where you left off, or start another.`}
            </p>
          </div>

          <div className="db-head-actions">
            <input
              ref={importInputRef}
              type="file"
              accept=".pdf"
              onChange={handleImport}
              className="sr-only"
              tabIndex={-1}
              aria-hidden="true"
            />
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => pickFile('resume')}
              disabled={importing}
              data-loading={(importing && importSource === 'resume') || undefined}
              data-tour="dashboard-import"
            >
              <Upload size={15} aria-hidden="true" /> Import PDF
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => pickFile('linkedin')}
              disabled={importing}
              data-loading={(importing && importSource === 'linkedin') || undefined}
            >
              <Linkedin size={15} aria-hidden="true" /> LinkedIn PDF
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleCreate}
              data-tour="dashboard-create"
            >
              <Plus size={16} aria-hidden="true" /> New resume
            </button>
          </div>
        </header>

        {/* ------------------------------------------------- plan strip --- */}
        {billing && (
          <section className={`db-plan${isPaid ? ' db-plan-paid' : ''}`} aria-label="Your plan">
            <span className="db-plan-icon">
              <Sparkles size={16} aria-hidden="true" />
            </span>

            <div className="db-plan-copy">
              {isPaid ? (
                <>
                  <p className="db-plan-title">
                    {billing.plan === 'premium' ? 'Premium' : 'Pro'}
                  </p>
                  <p className="db-plan-desc">
                    Unlimited AI credits and all {TEMPLATE_COUNT} templates.
                  </p>
                </>
              ) : (
                <>
                  <p className="db-plan-title">
                    Free plan — {creditsLeft} of {creditsMax} AI credits left this month
                  </p>
                  <p className="db-plan-desc">
                    Pro removes the cap and unlocks all {TEMPLATE_COUNT} templates.
                  </p>
                </>
              )}
            </div>

            {isPaid ? (
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={handleManageBilling}
                data-loading={billingBusy || undefined}
                disabled={billingBusy}
              >
                <Settings size={14} aria-hidden="true" /> Manage
              </button>
            ) : (
              /* Goes to /pricing rather than straight into Checkout: the plan
                 is sold by the week, month and quarter, and that page is also
                 the one that degrades honestly when no price is configured. */
              <Link to="/pricing" className="btn btn-primary btn-sm">
                See Pro <ArrowRight size={14} aria-hidden="true" />
              </Link>
            )}

            {!isPaid && creditsMax > 0 && (
              <div
                className="db-plan-meter"
                role="progressbar"
                aria-valuenow={creditsLeft}
                aria-valuemin={0}
                aria-valuemax={creditsMax}
                aria-label="AI credits remaining this month"
              >
                <span style={{ width: `${Math.max(0, Math.min(100, (creditsLeft / creditsMax) * 100))}%` }} />
              </div>
            )}
          </section>
        )}

        {/* ---------------------------------------------------- content --- */}
        {loading ? (
          <ul className="db-grid" aria-busy="true">
            {[1, 2, 3].map((i) => (
              <li key={i} className="db-card db-card-loading">
                <div className="skeleton db-card-shot" />
                <div className="db-card-body">
                  <div className="skeleton" style={{ height: 16, width: '62%' }} />
                  <div className="skeleton" style={{ height: 12, width: '38%', marginTop: 10 }} />
                  <div className="skeleton" style={{ height: 4, width: '100%', marginTop: 20 }} />
                </div>
              </li>
            ))}
          </ul>
        ) : resumes.length === 0 ? (
          <div className="empty-state db-empty">
            <span className="empty-state-icon">
              <FileText size={22} aria-hidden="true" />
            </span>
            <h2 className="empty-state-title">Nothing here yet</h2>
            <p className="empty-state-description">
              Start from one of {TEMPLATE_COUNT} templates, or import a PDF you already
              have and we will pull the content across.
            </p>
            <div className="empty-state-actions">
              <button type="button" className="btn btn-primary btn-lg" onClick={handleCreate}>
                <Plus size={16} aria-hidden="true" /> Browse templates
              </button>
              <button
                type="button"
                className="btn btn-secondary btn-lg"
                onClick={() => pickFile('resume')}
                disabled={importing}
                data-loading={importing || undefined}
              >
                <Upload size={16} aria-hidden="true" /> Import a PDF
              </button>
            </div>
          </div>
        ) : (
          <ul className="db-grid">
            {resumes.map((resume) => {
              const title = getResumeTitle(resume);
              const completeness = getCompleteness(resume);
              const open = menuOpen === resume.id;

              return (
                <li key={resume.id} className="db-card">
                  <div className="db-card-shot">
                    <TemplateThumbnail templateId={resume.template} data={resume} height={188} />
                    <span className="db-card-tpl">{resume.template || 'modern'}</span>
                  </div>

                  <div className="db-card-body">
                    {/* The link covers the card via ::after, so the whole tile
                        is clickable while remaining one real, keyboard-
                        reachable target with a sensible accessible name. */}
                    <h2 className="db-card-title">
                      <Link to={`/builder/${resume.id}`} className="db-card-link">{title}</Link>
                    </h2>

                    <p className="db-card-meta">
                      <Clock size={12} aria-hidden="true" />
                      Edited {formatDate(resume.updated_at).toLowerCase()}
                    </p>

                    <div className="db-card-progress">
                      <div
                        className="db-meter"
                        role="progressbar"
                        aria-valuenow={completeness}
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-label={`${title} is ${completeness}% complete`}
                      >
                        <span style={{ width: `${completeness}%` }} data-full={completeness === 100 || undefined} />
                      </div>
                      <span className="db-card-pct">{completeness}%</span>
                    </div>
                  </div>

                  <div className="db-card-menu" ref={open ? menuRef : null}>
                    <button
                      type="button"
                      className="btn btn-ghost btn-icon btn-sm"
                      ref={(el) => { triggerRefs.current[resume.id] = el; }}
                      aria-label={`Actions for ${title}`}
                      aria-expanded={open}
                      aria-haspopup="menu"
                      onClick={() => setMenuOpen(open ? null : resume.id)}
                    >
                      <MoreVertical size={16} aria-hidden="true" />
                    </button>

                    {open && (
                      <div className="db-menu" role="menu" aria-label={`Actions for ${title}`}>
                        <button
                          type="button"
                          className="db-menu-item"
                          role="menuitem"
                          onClick={() => { closeMenu(); navigate(`/builder/${resume.id}`); }}
                        >
                          <Edit3 size={14} aria-hidden="true" /> Edit
                        </button>
                        <button
                          type="button"
                          className="db-menu-item"
                          role="menuitem"
                          onClick={() => handleDuplicate(resume.id)}
                        >
                          <Copy size={14} aria-hidden="true" /> Duplicate
                        </button>
                        <button
                          type="button"
                          className="db-menu-item db-menu-danger"
                          role="menuitem"
                          onClick={() => {
                            restoreFocusRef.current = triggerRefs.current[resume.id];
                            closeMenu();
                            setDeleteTarget({ id: resume.id, title });
                          }}
                        >
                          <Trash2 size={14} aria-hidden="true" /> Delete
                        </button>
                      </div>
                    )}
                  </div>
                </li>
              );
            })}

            <li className="db-card db-card-new">
              <button type="button" className="db-new" onClick={handleCreate}>
                <span className="db-new-icon"><Plus size={20} aria-hidden="true" /></span>
                <span className="db-new-label">New resume</span>
                <span className="db-new-hint">{TEMPLATE_COUNT} templates to start from</span>
              </button>
            </li>
          </ul>
        )}
      </div>

      <Spotlight tour={tours.dashboard} />

      {/* Replaces a hand-rolled overlay that handled Escape but not focus.
          Modal traps Tab, restores focus to the trigger, and locks scroll. */}
      <Modal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Delete this resume?"
        description={
          deleteTarget
            ? `“${deleteTarget.title}” and its content will be removed. This cannot be undone.`
            : undefined
        }
        size="sm"
        restoreFocusRef={restoreFocusRef}
        footer={
          <>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setDeleteTarget(null)}
              disabled={deleting}
            >
              Keep it
            </button>
            <button
              type="button"
              className="btn btn-danger-solid"
              onClick={handleDeleteConfirm}
              data-loading={deleting || undefined}
              disabled={deleting}
            >
              <Trash2 size={14} aria-hidden="true" /> Delete resume
            </button>
          </>
        }
      />
    </div>
  );
};

export default Dashboard;
