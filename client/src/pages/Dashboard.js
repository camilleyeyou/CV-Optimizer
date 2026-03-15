import { useNavigate } from 'react-router-dom';
import { useResume } from '../context/ResumeContext';
import { useAuth } from '../context/AuthContext';
import {
  Plus,
  FileText,
  Clock,
  Trash2,
  Edit3,
  Copy,
  MoreVertical,
  AlertTriangle,
} from 'lucide-react';
import { useState, useEffect, useRef, useCallback } from 'react';
import './Dashboard.css';

const Dashboard = () => {
  const navigate = useNavigate();
  const { resumes, loading, deleteResume, duplicateResume } = useResume();
  const { user } = useAuth();
  const [menuOpen, setMenuOpen] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const menuRef = useRef(null);

  const displayName =
    user?.user_metadata?.first_name || user?.email?.split('@')[0] || 'there';

  // Close card menu on click outside or Escape
  const closeMenu = useCallback(() => setMenuOpen(null), []);

  useEffect(() => {
    if (!menuOpen) return;
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

  // Close confirm dialog on Escape
  useEffect(() => {
    if (!deleteTarget) return;
    const handleEscape = (e) => { if (e.key === 'Escape') setDeleteTarget(null); };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [deleteTarget]);

  const handleCreate = () => navigate('/templates');
  const handleEdit = (id) => navigate(`/builder/${id}`);

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    await deleteResume(deleteTarget.id);
    setDeleteTarget(null);
  };

  const handleDuplicate = async (id) => {
    closeMenu();
    await duplicateResume(id);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now - date;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

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
    return 'Untitled Resume';
  };

  const getCompleteness = (resume) => {
    let score = 0;
    const checks = [
      resume.personal_info?.first_name,
      resume.personal_info?.email,
      resume.personal_info?.phone,
      resume.summary?.length > 20,
      resume.work_experience?.length > 0,
      resume.education?.length > 0,
      resume.skills?.length > 0,
    ];
    checks.forEach((c) => { if (c) score++; });
    return Math.round((score / checks.length) * 100);
  };

  return (
    <div className="dashboard">
      <div className="dashboard-container">
        {/* Header */}
        <div className="dashboard-header">
          <div>
            <h1>Hi, {displayName}</h1>
            <p className="dashboard-subtitle">
              {resumes.length === 0
                ? 'Create your first resume to get started.'
                : `You have ${resumes.length} resume${resumes.length !== 1 ? 's' : ''}.`}
            </p>
          </div>
          <button className="btn btn-primary btn-lg" onClick={handleCreate}>
            <Plus size={18} aria-hidden="true" />
            New Resume
          </button>
        </div>

        {/* Content */}
        {loading ? (
          <div className="dashboard-grid">
            {[1, 2, 3].map((i) => (
              <div key={i} className="resume-card-skeleton">
                <div className="skeleton" style={{ height: 140 }} />
                <div style={{ padding: 20 }}>
                  <div className="skeleton" style={{ height: 20, width: '60%', marginBottom: 8 }} />
                  <div className="skeleton" style={{ height: 14, width: '40%' }} />
                </div>
              </div>
            ))}
          </div>
        ) : resumes.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">
              <FileText size={48} strokeWidth={1} aria-hidden="true" />
            </div>
            <h3>No resumes yet</h3>
            <p>Create your first resume and start applying to jobs with confidence.</p>
            <button className="btn btn-primary btn-lg" onClick={handleCreate}>
              <Plus size={18} aria-hidden="true" />
              Create Resume
            </button>
          </div>
        ) : (
          <div className="dashboard-grid">
            {resumes.map((resume) => {
              const completeness = getCompleteness(resume);
              return (
                <div
                  key={resume.id}
                  className="resume-card"
                  onClick={() => handleEdit(resume.id)}
                >
                  {/* Preview */}
                  <div className="resume-card-preview">
                    <div className="preview-mock">
                      <div className="preview-mock-header" />
                      <div className="preview-mock-line w-60" />
                      <div className="preview-mock-line w-40" />
                      <div className="preview-mock-gap" />
                      <div className="preview-mock-line w-80" />
                      <div className="preview-mock-line w-70" />
                      <div className="preview-mock-line w-90" />
                    </div>
                    <div className="resume-card-template">
                      {resume.template || 'modern'}
                    </div>
                  </div>

                  {/* Info */}
                  <div className="resume-card-body">
                    <div className="resume-card-info">
                      <h3 className="resume-card-title">{getResumeTitle(resume)}</h3>
                      <span className="resume-card-date">
                        <Clock size={12} aria-hidden="true" />
                        {formatDate(resume.updated_at)}
                      </span>
                    </div>

                    {/* Completeness */}
                    <div className="resume-card-progress">
                      <div className="progress-bar" role="progressbar" aria-valuenow={completeness} aria-valuemin={0} aria-valuemax={100}>
                        <div
                          className="progress-fill"
                          style={{ width: `${completeness}%` }}
                        />
                      </div>
                      <span className="progress-label">{completeness}% complete</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="resume-card-actions" ref={menuOpen === resume.id ? menuRef : null}>
                    <button
                      className="btn btn-ghost btn-icon"
                      aria-label={`Actions for ${getResumeTitle(resume)}`}
                      aria-expanded={menuOpen === resume.id}
                      aria-haspopup="true"
                      onClick={(e) => {
                        e.stopPropagation();
                        setMenuOpen(menuOpen === resume.id ? null : resume.id);
                      }}
                    >
                      <MoreVertical size={16} />
                    </button>

                    {menuOpen === resume.id && (
                      <div className="card-menu" role="menu" onClick={(e) => e.stopPropagation()}>
                        <button className="card-menu-item" role="menuitem" onClick={() => { closeMenu(); handleEdit(resume.id); }}>
                          <Edit3 size={14} aria-hidden="true" /> Edit
                        </button>
                        <button className="card-menu-item" role="menuitem" onClick={() => handleDuplicate(resume.id)}>
                          <Copy size={14} aria-hidden="true" /> Duplicate
                        </button>
                        <button
                          className="card-menu-item card-menu-danger"
                          role="menuitem"
                          onClick={() => {
                            closeMenu();
                            setDeleteTarget({ id: resume.id, title: getResumeTitle(resume) });
                          }}
                        >
                          <Trash2 size={14} aria-hidden="true" /> Delete
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Add card */}
            <button className="resume-card resume-card-add" onClick={handleCreate}>
              <Plus size={32} strokeWidth={1.5} aria-hidden="true" />
              <span>New Resume</span>
            </button>
          </div>
        )}
      </div>

      {/* Delete confirmation dialog */}
      {deleteTarget && (
        <div className="confirm-overlay" onClick={() => setDeleteTarget(null)}>
          <div className="confirm-dialog" role="alertdialog" aria-labelledby="confirm-title" onClick={(e) => e.stopPropagation()}>
            <h3 id="confirm-title">
              <AlertTriangle size={18} style={{ color: 'var(--error)', verticalAlign: 'text-bottom' }} aria-hidden="true" />{' '}
              Delete resume?
            </h3>
            <p>
              Are you sure you want to delete <strong>{deleteTarget.title}</strong>? This action cannot be undone.
            </p>
            <div className="confirm-actions">
              <button className="btn btn-secondary" onClick={() => setDeleteTarget(null)}>
                Cancel
              </button>
              <button className="btn btn-danger" onClick={handleDeleteConfirm}>
                <Trash2 size={14} aria-hidden="true" /> Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
