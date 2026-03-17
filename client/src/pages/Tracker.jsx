import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../config/supabase';
import { useAuth } from '../context/AuthContext';
import { useResume } from '../context/ResumeContext';
import { tailorResume } from '../services/api';
import { Briefcase, Plus, X, GripVertical, ExternalLink, Trash2, Edit3, Loader, Sparkles, FileText } from 'lucide-react';
import toast from 'react-hot-toast';
import './Tracker.css';

const COLUMNS = [
  { id: 'saved', label: 'Saved', color: '#6366f1' },
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
      <div className="tracker-loading">
        <Loader size={24} className="spin" />
        <span>Loading applications...</span>
      </div>
    );
  }

  return (
    <div className="tracker">
      <div className="tracker-header">
        <div>
          <h1 className="tracker-title"><Briefcase size={22} /> Job Tracker</h1>
          <p className="tracker-subtitle">{apps.length} application{apps.length !== 1 ? 's' : ''} tracked</p>
        </div>
        <button className="btn btn-primary" onClick={() => openNew()}>
          <Plus size={16} /> Add Application
        </button>
      </div>

      <div className="kanban">
        {COLUMNS.map((col) => (
          <div
            key={col.id}
            className="kanban-column"
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => handleDrop(col.id)}
          >
            <div className="kanban-column-header">
              <span className="kanban-column-dot" style={{ background: col.color }} />
              <span className="kanban-column-label">{col.label}</span>
              <span className="kanban-column-count">{countByStatus(col.id)}</span>
            </div>

            <div className="kanban-cards">
              {apps.filter((a) => a.status === col.id).map((app) => (
                <div
                  key={app.id}
                  className="kanban-card"
                  draggable
                  onDragStart={() => handleDragStart(app)}
                >
                  <div className="kanban-card-drag"><GripVertical size={12} /></div>
                  <div className="kanban-card-body">
                    <div className="kanban-card-company">{app.company}</div>
                    <div className="kanban-card-position">{app.position}</div>
                    {app.applied_at && (
                      <div className="kanban-card-date">Applied {app.applied_at}</div>
                    )}
                  </div>
                  <div className="kanban-card-actions">
                    <button className="kanban-card-action" onClick={() => openTailorModal(app)} title="Tailor Resume">
                      <Sparkles size={12} />
                    </button>
                    {app.url && (
                      <a href={app.url} target="_blank" rel="noopener noreferrer" className="kanban-card-action" title="Open URL">
                        <ExternalLink size={12} />
                      </a>
                    )}
                    <button className="kanban-card-action" onClick={() => openEdit(app)} title="Edit">
                      <Edit3 size={12} />
                    </button>
                    <button className="kanban-card-action danger" onClick={() => handleDelete(app.id)} title="Delete">
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              ))}

              <button className="kanban-add-btn" onClick={() => openNew(col.id)}>
                <Plus size={12} /> Add
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add/Edit Modal */}
      {modalOpen && (
        <div className="tracker-overlay" onClick={() => setModalOpen(false)}>
          <div className="tracker-modal" onClick={(e) => e.stopPropagation()}>
            <div className="tracker-modal-header">
              <h3>{editing ? 'Edit Application' : 'New Application'}</h3>
              <button className="tailor-close" onClick={() => setModalOpen(false)}><X size={18} /></button>
            </div>

            <div className="tracker-modal-body">
              <div className="tracker-form-row">
                <label>Company *</label>
                <input
                  className="form-input"
                  value={form.company}
                  onChange={(e) => setForm({ ...form, company: e.target.value })}
                  placeholder="Google, Stripe, etc."
                />
              </div>
              <div className="tracker-form-row">
                <label>Position *</label>
                <input
                  className="form-input"
                  value={form.position}
                  onChange={(e) => setForm({ ...form, position: e.target.value })}
                  placeholder="Frontend Engineer"
                />
              </div>
              <div className="tracker-form-row">
                <label>Job URL</label>
                <input
                  className="form-input"
                  value={form.url}
                  onChange={(e) => setForm({ ...form, url: e.target.value })}
                  placeholder="https://..."
                />
              </div>
              <div className="tracker-form-row-half">
                <div className="tracker-form-row">
                  <label>Status</label>
                  <select
                    className="form-input"
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value })}
                  >
                    {COLUMNS.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
                  </select>
                </div>
                <div className="tracker-form-row">
                  <label>Applied Date</label>
                  <input
                    className="form-input"
                    type="date"
                    value={form.applied_at}
                    onChange={(e) => setForm({ ...form, applied_at: e.target.value })}
                  />
                </div>
              </div>
              <div className="tracker-form-row">
                <label>Job Description</label>
                <textarea
                  className="form-textarea"
                  value={form.job_description}
                  onChange={(e) => setForm({ ...form, job_description: e.target.value })}
                  placeholder="Paste the job description to enable AI resume tailoring..."
                  rows={4}
                />
              </div>
              <div className="tracker-form-row">
                <label>Notes</label>
                <textarea
                  className="form-textarea"
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  placeholder="Recruiter name, interview notes..."
                  rows={3}
                />
              </div>
            </div>

            <div className="tracker-modal-footer">
              <button className="btn btn-ghost" onClick={() => setModalOpen(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSave}>
                {editing ? 'Update' : 'Add Application'}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Tailor Resume Modal */}
      {tailorModalOpen && tailorApp && (
        <div className="tracker-overlay" onClick={() => setTailorModalOpen(false)}>
          <div className="tracker-modal" onClick={(e) => e.stopPropagation()}>
            <div className="tracker-modal-header">
              <h3><Sparkles size={16} /> Tailor Resume</h3>
              <button className="tailor-close" onClick={() => setTailorModalOpen(false)}><X size={18} /></button>
            </div>

            <div className="tracker-modal-body">
              <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', margin: 0 }}>
                Tailor a resume for <strong>{tailorApp.position}</strong> at <strong>{tailorApp.company}</strong>
              </p>

              <div className="tracker-form-row">
                <label><FileText size={12} /> Select a resume to tailor</label>
                <select
                  className="form-input"
                  value={tailorResumeId}
                  onChange={(e) => setTailorResumeId(e.target.value)}
                >
                  <option value="">-- Select a resume --</option>
                  {resumes.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.title || `${r.personal_info?.first_name || ''} ${r.personal_info?.last_name || ''}`.trim() || 'Untitled'}
                    </option>
                  ))}
                </select>
              </div>

              {!tailorApp.job_description && (
                <div className="alert alert-warning" style={{ fontSize: 'var(--text-xs)' }}>
                  No job description saved. Edit the application to add one for better results.
                </div>
              )}
            </div>

            <div className="tracker-modal-footer">
              <button className="btn btn-ghost" onClick={() => setTailorModalOpen(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleTailor} disabled={tailoring || !tailorResumeId}>
                {tailoring ? <><Loader size={14} className="spin" /> Tailoring...</> : <><Sparkles size={14} /> Tailor Resume</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Tracker;
