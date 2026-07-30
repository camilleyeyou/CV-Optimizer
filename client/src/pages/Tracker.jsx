import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../config/supabase';
import { useAuth } from '../context/AuthContext';
import { useResume } from '../context/ResumeContext';
import { tailorResume } from '../services/api';
import { Briefcase, Plus, GripVertical, ExternalLink, Trash2, Edit3, Sparkles, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';
import Modal from '../components/ui/Modal';
import './Tracker.css';

const COLUMNS = [
  { id: 'saved', label: 'Saved', color: '#818cf8' },
  { id: 'applied', label: 'Applied', color: '#3b82f6' },
  { id: 'interview', label: 'Interview', color: '#f59e0b' },
  { id: 'offer', label: 'Offer', color: '#22c55e' },
  { id: 'rejected', label: 'Rejected', color: '#ef4444' },
];

const Tracker = () => {
  const { user } = useAuth();
  const { resumes, createResume } = useResume();
  const navigate = useNavigate();
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [dragItem, setDragItem] = useState(null);
  const [form, setForm] = useState({ company: '', position: '', url: '', status: 'saved', notes: '', applied_at: '', job_description: '' });
  const [tailorModalOpen, setTailorModalOpen] = useState(false);
  const [tailorApp, setTailorApp] = useState(null);
  const [tailorResumeId, setTailorResumeId] = useState('');
  const [tailoring, setTailoring] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const fetchApps = useCallback(async () => {
    const { data, error } = await supabase
      .from('applications')
      .select('*')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false });

    if (error) {
      toast.error('Failed to load applications');
    } else {
      setApps(data || []);
    }
    setLoading(false);
  }, [user.id]);

  useEffect(() => { fetchApps(); }, [fetchApps]);

  const openNew = (status = 'saved') => {
    setEditing(null);
    setForm({ company: '', position: '', url: '', status, notes: '', applied_at: '', job_description: '' });
    setModalOpen(true);
  };

  const openEdit = (app) => {
    setEditing(app.id);
    setForm({
      company: app.company,
      position: app.position,
      url: app.url || '',
      status: app.status,
      notes: app.notes || '',
      applied_at: app.applied_at || '',
      job_description: app.job_description || '',
    });
    setModalOpen(true);
  };

  const openTailorModal = (app) => {
    setTailorApp(app);
    setTailorResumeId(resumes.length > 0 ? resumes[0].id : '');
    setTailorModalOpen(true);
  };

  const handleTailor = async () => {
    if (!tailorResumeId || !tailorApp) return;
    const resume = resumes.find((r) => r.id === tailorResumeId);
    if (!resume) { toast.error('Resume not found'); return; }

    const jobDesc = tailorApp.job_description || `${tailorApp.position} at ${tailorApp.company}`;
    if (jobDesc.length < 10) {
      toast.error('Add a job description to the application first');
      return;
    }

    setTailoring(true);
    try {
      const tailored = await tailorResume(resume, jobDesc);
      const newResume = await createResume(resume.template || 'modern');
      if (newResume?.id) {
        await supabase
          .from('resumes')
          .update({
            ...tailored,
            title: `${tailorApp.position} at ${tailorApp.company}`,
          })
          .eq('id', newResume.id);

        // Link resume to application
        await supabase
          .from('applications')
          .update({ resume_id: newResume.id })
          .eq('id', tailorApp.id);

        toast.success('Resume tailored! Opening builder...');
        setTailorModalOpen(false);
        navigate(`/builder/${newResume.id}`);
      }
    } catch {
      toast.error('Failed to tailor resume');
    } finally {
      setTailoring(false);
    }
  };

  const handleSave = async () => {
    if (!form.company.trim() || !form.position.trim()) {
      toast.error('Company and position are required');
      return;
    }

    const payload = {
      ...form,
      company: form.company.trim(),
      position: form.position.trim(),
      url: form.url.trim(),
      notes: form.notes.trim(),
      applied_at: form.applied_at || null,
      job_description: form.job_description.trim(),
    };

    if (editing) {
      const { error } = await supabase
        .from('applications')
        .update(payload)
        .eq('id', editing);
      if (error) { toast.error('Failed to update'); return; }
      toast.success('Updated');
    } else {
      const { error } = await supabase
        .from('applications')
        .insert({ ...payload, user_id: user.id });
      if (error) { toast.error('Failed to create'); return; }
      toast.success('Application added');
    }

    setModalOpen(false);
    fetchApps();
  };

  const handleDelete = async (id) => {
    const { error } = await supabase.from('applications').delete().eq('id', id);
    if (error) { toast.error('Failed to delete'); return; }
    setApps((prev) => prev.filter((a) => a.id !== id));
    toast.success('Deleted');
  };

  const handleDragStart = (app) => {
    setDragItem(app);
  };

  const handleDrop = async (newStatus) => {
    if (!dragItem || dragItem.status === newStatus) { setDragItem(null); return; }

    // Optimistic update
    setApps((prev) => prev.map((a) => a.id === dragItem.id ? { ...a, status: newStatus } : a));
    setDragItem(null);

    const { error } = await supabase
      .from('applications')
      .update({ status: newStatus })
      .eq('id', dragItem.id);

    if (error) {
      toast.error('Failed to move');
      fetchApps(); // revert
    }
  };

  const countByStatus = (status) => apps.filter((a) => a.status === status).length;

  if (loading) {
    return (
      <div className="tk">
        <header className="tk-head">
          <div>
            <h1 className="tk-title">Applications</h1>
            <p className="tk-sub">Loading…</p>
          </div>
        </header>
        <div className="tk-board" aria-busy="true">
          {COLUMNS.map((col) => (
            <div key={col.id} className="tk-col">
              <div className="tk-col-head">
                <span className="tk-dot" style={{ background: col.color }} />
                <span className="tk-col-label">{col.label}</span>
              </div>
              <div className="skeleton" style={{ height: 74 }} />
              <div className="skeleton" style={{ height: 74, marginTop: 8 }} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="tk">
      <header className="tk-head">
        <div>
          <h1 className="tk-title">Applications</h1>
          <p className="tk-sub">
            {apps.length === 0
              ? 'Track where every application stands, from applied to offer.'
              : `${apps.length} application${apps.length === 1 ? '' : 's'}. Drag a card to move it.`}
          </p>
        </div>
        <button type="button" className="btn btn-primary" onClick={() => openNew()}>
          <Plus size={16} aria-hidden="true" /> Add application
        </button>
      </header>

      {apps.length === 0 && (
        <div className="empty-state tk-empty">
          <span className="empty-state-icon">
            <Briefcase size={22} aria-hidden="true" />
          </span>
          <h2 className="empty-state-title">No applications yet</h2>
          <p className="empty-state-description">
            Add the first one and it lands in Saved. Paste the job description with
            it and you can tailor a resume to that role in one click.
          </p>
          <div className="empty-state-actions">
            <button type="button" className="btn btn-primary btn-lg" onClick={() => openNew()}>
              <Plus size={16} aria-hidden="true" /> Add your first application
            </button>
          </div>
        </div>
      )}

      <div className="tk-board" data-empty={apps.length === 0 || undefined}>
        {COLUMNS.map((col) => (
          <div
            key={col.id}
            className="tk-col"
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => handleDrop(col.id)}
          >
            <div className="tk-col-head">
              <span className="tk-dot" style={{ background: col.color }} />
              <span className="tk-col-label">{col.label}</span>
              <span className="tk-col-count">{countByStatus(col.id)}</span>
            </div>

            <div className="tk-cards">
              {apps.filter((a) => a.status === col.id).map((app) => (
                <article
                  key={app.id}
                  className="tk-card"
                  draggable
                  onDragStart={() => handleDragStart(app)}
                >
                  <span className="tk-grip" aria-hidden="true"><GripVertical size={12} /></span>
                  <div className="tk-card-body">
                    <p className="tk-card-company">{app.company}</p>
                    <p className="tk-card-role">{app.position}</p>
                    {app.applied_at && (
                      <p className="tk-card-date">Applied {app.applied_at}</p>
                    )}
                  </div>
                  {/* Named, not just titled: a title attribute is not an
                      accessible name on a control with no text. */}
                  <div className="tk-card-actions">
                    <button
                      type="button"
                      className="tk-act"
                      onClick={() => openTailorModal(app)}
                      aria-label={`Tailor a resume for ${app.position} at ${app.company}`}
                    >
                      <Sparkles size={12} aria-hidden="true" />
                    </button>
                    {app.url && (
                      <a
                        href={app.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="tk-act"
                        aria-label={`Open the job posting for ${app.position} at ${app.company}`}
                      >
                        <ExternalLink size={12} aria-hidden="true" />
                      </a>
                    )}
                    <button
                      type="button"
                      className="tk-act"
                      onClick={() => openEdit(app)}
                      aria-label={`Edit ${app.position} at ${app.company}`}
                    >
                      <Edit3 size={12} aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      className="tk-act tk-act-danger"
                      onClick={() => setDeleteTarget(app)}
                      aria-label={`Delete ${app.position} at ${app.company}`}
                    >
                      <Trash2 size={12} aria-hidden="true" />
                    </button>
                  </div>
                </article>
              ))}

              <button
                type="button"
                className="tk-add"
                onClick={() => openNew(col.id)}
                aria-label={`Add an application to ${col.label}`}
              >
                <Plus size={12} aria-hidden="true" /> Add
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Both dialogs use the shared Modal: the hand-rolled overlays they
          replace had no focus trap, no Escape and no focus restore. */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Edit application' : 'New application'}
        footer={
          <>
            <button type="button" className="btn btn-secondary" onClick={() => setModalOpen(false)}>
              Cancel
            </button>
            <button type="button" className="btn btn-primary" onClick={handleSave}>
              {editing ? 'Save changes' : 'Add application'}
            </button>
          </>
        }
      >
        <div className="tk-form">
          <div className="form-group">
            <label className="form-label" htmlFor="tk-company">
              Company <span className="form-required" aria-hidden="true">*</span>
            </label>
            <input
              id="tk-company"
              className="form-input"
              required
              value={form.company}
              onChange={(e) => setForm({ ...form, company: e.target.value })}
              placeholder="Acme Inc."
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="tk-position">
              Position <span className="form-required" aria-hidden="true">*</span>
            </label>
            <input
              id="tk-position"
              className="form-input"
              required
              value={form.position}
              onChange={(e) => setForm({ ...form, position: e.target.value })}
              placeholder="Frontend Engineer"
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="tk-url">
              Job URL <span className="form-label-optional">optional</span>
            </label>
            <input
              id="tk-url"
              type="url"
              className="form-input"
              value={form.url}
              onChange={(e) => setForm({ ...form, url: e.target.value })}
              placeholder="https://"
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label" htmlFor="tk-status">Status</label>
              <select
                id="tk-status"
                className="form-select"
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
              >
                {COLUMNS.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="tk-applied">Applied on</label>
              <input
                id="tk-applied"
                className="form-input"
                type="date"
                value={form.applied_at}
                onChange={(e) => setForm({ ...form, applied_at: e.target.value })}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="tk-jd">
              Job description <span className="form-label-optional">optional</span>
            </label>
            <textarea
              id="tk-jd"
              className="form-textarea"
              aria-describedby="tk-jd-hint"
              value={form.job_description}
              onChange={(e) => setForm({ ...form, job_description: e.target.value })}
              placeholder="Paste the posting here"
              rows={4}
            />
            <p className="form-hint" id="tk-jd-hint">
              Needed to tailor a resume to this role.
            </p>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="tk-notes">
              Notes <span className="form-label-optional">optional</span>
            </label>
            <textarea
              id="tk-notes"
              className="form-textarea"
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="Recruiter name, interview dates, anything worth remembering"
              rows={3}
            />
          </div>
        </div>
      </Modal>

      <Modal
        open={tailorModalOpen && !!tailorApp}
        onClose={() => setTailorModalOpen(false)}
        title="Tailor a resume"
        description={
          tailorApp ? `For ${tailorApp.position} at ${tailorApp.company}.` : undefined
        }
        footer={
          <>
            <button type="button" className="btn btn-secondary" onClick={() => setTailorModalOpen(false)}>
              Cancel
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleTailor}
              disabled={tailoring || !tailorResumeId}
              data-loading={tailoring || undefined}
            >
              <Sparkles size={14} aria-hidden="true" /> Tailor resume
            </button>
          </>
        }
      >
        <div className="tk-form">
          <div className="form-group">
            <label className="form-label" htmlFor="tk-resume">Which resume?</label>
            <select
              id="tk-resume"
              className="form-select"
              value={tailorResumeId}
              onChange={(e) => setTailorResumeId(e.target.value)}
            >
              <option value="">Select a resume…</option>
              {resumes.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.title || `${r.personal_info?.first_name || ''} ${r.personal_info?.last_name || ''}`.trim() || 'Untitled'}
                </option>
              ))}
            </select>
          </div>

          {tailorApp && !tailorApp.job_description && (
            <div className="alert alert-warning">
              <AlertTriangle size={15} aria-hidden="true" />
              <span>
                This application has no job description saved, so the result will be
                generic. Edit it and paste the posting for a real tailoring pass.
              </span>
            </div>
          )}
        </div>
      </Modal>

      <Modal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Delete this application?"
        description={
          deleteTarget
            ? `${deleteTarget.position} at ${deleteTarget.company}, and any notes on it, will be removed. This cannot be undone.`
            : undefined
        }
        size="sm"
        footer={
          <>
            <button type="button" className="btn btn-secondary" onClick={() => setDeleteTarget(null)}>
              Keep it
            </button>
            <button
              type="button"
              className="btn btn-danger-solid"
              onClick={async () => { await handleDelete(deleteTarget.id); setDeleteTarget(null); }}
            >
              <Trash2 size={14} aria-hidden="true" /> Delete
            </button>
          </>
        }
      />
    </div>
  );
};

export default Tracker;
