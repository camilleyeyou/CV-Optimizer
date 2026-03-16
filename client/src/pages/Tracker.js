import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../config/supabase';
import { useAuth } from '../context/AuthContext';
import { Briefcase, Plus, X, GripVertical, ExternalLink, Trash2, Edit3, Loader } from 'lucide-react';
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
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [dragItem, setDragItem] = useState(null);
  const [form, setForm] = useState({ company: '', position: '', url: '', status: 'saved', notes: '', applied_at: '' });

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
    setForm({ company: '', position: '', url: '', status, notes: '', applied_at: '' });
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
    });
    setModalOpen(true);
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
    </div>
  );
};

export default Tracker;
