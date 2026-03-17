import { useState, useCallback } from 'react';
import { Wand2, Loader, X, Check, RotateCcw, ChevronDown, ChevronUp, Sparkles } from 'lucide-react';
import { tailorResume } from '../../services/api';
import { useResume } from '../../context/ResumeContext';
import toast from 'react-hot-toast';
import './TailorModal.css';

const TailorModal = ({ open, onClose }) => {
  const { resumeData, updateField, updateResume } = useResume();
  const [jobDescription, setJobDescription] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [accepted, setAccepted] = useState({});
  const [expandedChange, setExpandedChange] = useState(null);

  const handleTailor = useCallback(async () => {
    if (!jobDescription.trim() || jobDescription.trim().length < 10) {
      toast.error('Paste a job description (at least 10 characters)');
      return;
    }

    setLoading(true);
    setResult(null);
    setAccepted({});
    try {
      const data = await tailorResume(resumeData, jobDescription.trim());
      setResult(data);
      // Auto-accept all changes by default
      const initial = {};
      (data.changes || []).forEach((c) => { initial[c.id] = true; });
      setAccepted(initial);
    } catch {
      toast.error('Failed to tailor resume. Try again.');
    } finally {
      setLoading(false);
    }
  }, [resumeData, jobDescription]);

  const toggleChange = (id) => {
    setAccepted((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const acceptAll = () => {
    const all = {};
    (result?.changes || []).forEach((c) => { all[c.id] = true; });
    setAccepted(all);
  };

  const rejectAll = () => {
    setAccepted({});
  };

  const applyChanges = () => {
    if (!result) return;

    const acceptedIds = new Set(Object.keys(accepted).filter((k) => accepted[k]));
    const changes = (result.changes || []).filter((c) => acceptedIds.has(c.id));

    if (changes.length === 0) {
      toast.error('Select at least one change to apply');
      return;
    }

    const updates = {};
    let hasSummary = false;
    let hasSkills = false;
    const expIndexes = new Set();

    changes.forEach((c) => {
      if (c.section === 'summary') hasSummary = true;
      if (c.section === 'skills') hasSkills = true;
      if (c.section === 'experience') {
        // Find which experience index this change references
        const tailoredExp = result.tailored_experience || [];
        tailoredExp.forEach((te) => expIndexes.add(te.index));
      }
    });

    if (hasSummary && result.tailored_summary) {
      updates.summary = result.tailored_summary;
    }

    if (hasSkills && result.tailored_skills) {
      updates.skills = result.tailored_skills;
    }

    if (expIndexes.size > 0 && result.tailored_experience) {
      const currentExp = [...(resumeData.work_experience || [])];
      result.tailored_experience.forEach((te) => {
        if (expIndexes.has(te.index) && currentExp[te.index]) {
          currentExp[te.index] = {
            ...currentExp[te.index],
            description: Array.isArray(te.description) ? te.description : currentExp[te.index].description,
          };
        }
      });
      updates.work_experience = currentExp;
    }

    if (Object.keys(updates).length > 0) {
      updateResume(updates);
      toast.success(`Applied ${changes.length} change${changes.length > 1 ? 's' : ''}`);
      onClose();
    }
  };

  const acceptedCount = Object.values(accepted).filter(Boolean).length;
  const totalChanges = result?.changes?.length || 0;

  if (!open) return null;

  return (
    <div className="tailor-overlay" onClick={onClose}>
      <div className="tailor-modal" onClick={(e) => e.stopPropagation()}>
        <div className="tailor-header">
          <div className="tailor-header-title">
            <Wand2 size={18} />
            <span>Tailor to Job</span>
          </div>
          <button className="tailor-close" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {!result && !loading && (
          <div className="tailor-input-section">
            <p className="tailor-desc">
              Paste a job description and AI will tailor your resume to match. You can review and accept or reject each change.
            </p>
            <textarea
              className="tailor-textarea"
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              placeholder="Paste the full job description here..."
              rows={8}
            />
            <button
              className="btn btn-primary tailor-submit-btn"
              onClick={handleTailor}
              disabled={loading || jobDescription.trim().length < 10}
            >
              <Sparkles size={16} /> Tailor My Resume
            </button>
          </div>
        )}

        {loading && (
          <div className="tailor-loading">
            <Loader size={32} className="spin" />
            <p>Analyzing job description and tailoring your resume...</p>
          </div>
        )}

        {result && !loading && (
          <div className="tailor-results">
            <div className="tailor-score-bar">
              <div className="tailor-score-info">
                <span className="tailor-score-label">ATS Match Score</span>
                <span
                  className="tailor-score-value"
                  style={{ color: result.score >= 80 ? 'var(--success)' : result.score >= 60 ? 'var(--warning)' : 'var(--error)' }}
                >
                  {result.score}/100
                </span>
              </div>
              <div className="tailor-score-track">
                <div
                  className="tailor-score-fill"
                  style={{
                    width: `${result.score}%`,
                    background: result.score >= 80 ? 'var(--success)' : result.score >= 60 ? 'var(--warning)' : 'var(--error)',
                  }}
                />
              </div>
            </div>

            <div className="tailor-changes-header">
              <span className="tailor-changes-count">{acceptedCount}/{totalChanges} changes selected</span>
              <div className="tailor-changes-actions">
                <button className="btn btn-ghost btn-xs" onClick={acceptAll}>Accept All</button>
                <button className="btn btn-ghost btn-xs" onClick={rejectAll}>Reject All</button>
              </div>
            </div>

            <div className="tailor-changes-list">
              {(result.changes || []).map((change) => (
                <div key={change.id} className={`tailor-change ${accepted[change.id] ? 'accepted' : 'rejected'}`}>
                  <div className="tailor-change-top" onClick={() => setExpandedChange(expandedChange === change.id ? null : change.id)}>
                    <button
                      className={`tailor-change-toggle ${accepted[change.id] ? 'on' : ''}`}
                      onClick={(e) => { e.stopPropagation(); toggleChange(change.id); }}
                    >
                      {accepted[change.id] ? <Check size={12} /> : null}
                    </button>
                    <div className="tailor-change-info">
                      <span className="tailor-change-section">{change.section}</span>
                      <span className="tailor-change-label">{change.label}</span>
                    </div>
                    {expandedChange === change.id ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  </div>

                  {expandedChange === change.id && (
                    <div className="tailor-change-diff">
                      <div className="tailor-diff-before">
                        <span className="tailor-diff-tag">Before</span>
                        <div className="tailor-diff-content">{change.before || '(empty)'}</div>
                      </div>
                      <div className="tailor-diff-after">
                        <span className="tailor-diff-tag">After</span>
                        <div className="tailor-diff-content">{change.after || '(empty)'}</div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="tailor-footer">
              <button className="btn btn-ghost" onClick={() => { setResult(null); setAccepted({}); }}>
                <RotateCcw size={14} /> Start Over
              </button>
              <button className="btn btn-primary" onClick={applyChanges} disabled={acceptedCount === 0}>
                <Check size={14} /> Apply {acceptedCount} Change{acceptedCount !== 1 ? 's' : ''}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TailorModal;
