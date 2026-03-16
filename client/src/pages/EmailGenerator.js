import { useState } from 'react';
import { generateEmail } from '../services/api';
import { Mail, Loader, Copy, Download, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import './EmailGenerator.css';

const EMAIL_TYPES = [
  { id: 'follow-up', label: 'Follow-Up', desc: 'After submitting an application' },
  { id: 'thank-you', label: 'Thank You', desc: 'After an interview' },
  { id: 'accept', label: 'Accept Offer', desc: 'Accepting a job offer' },
  { id: 'decline', label: 'Decline Offer', desc: 'Graciously declining' },
];

const EmailGenerator = () => {
  const [type, setType] = useState('follow-up');
  const [context, setContext] = useState({
    company: '',
    position: '',
    interviewerName: '',
    appliedDate: '',
    startDate: '',
    notes: '',
  });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [editedBody, setEditedBody] = useState('');

  const handleGenerate = async () => {
    if (!context.company.trim() || !context.position.trim()) {
      toast.error('Company and position are required');
      return;
    }

    setLoading(true);
    setResult(null);
    try {
      const data = await generateEmail(type, context);
      setResult(data);
      setEditedBody(data.body || '');
    } catch {
      toast.error('Failed to generate email');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    const text = `Subject: ${result.subject}\n\n${editedBody}`;
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  const handleDownload = () => {
    const text = `Subject: ${result.subject}\n\n${editedBody}`;
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${type}-email-${context.company.replace(/\s+/g, '-').toLowerCase()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Downloaded');
  };

  const showInterviewer = type === 'thank-you';
  const showAppliedDate = type === 'follow-up';
  const showStartDate = type === 'accept';

  return (
    <div className="email-gen">
      <div className="email-gen-header">
        <Mail size={28} className="email-gen-icon" />
        <h1>Email Generator</h1>
        <p>Generate professional job-related emails in seconds.</p>
      </div>

      <div className="email-gen-layout">
        {/* Left: Form */}
        <div className="email-gen-form">
          <div className="email-type-selector">
            {EMAIL_TYPES.map((t) => (
              <button
                key={t.id}
                className={`email-type-btn ${type === t.id ? 'active' : ''}`}
                onClick={() => { setType(t.id); setResult(null); }}
              >
                <span className="email-type-label">{t.label}</span>
                <span className="email-type-desc">{t.desc}</span>
              </button>
            ))}
          </div>

          <div className="email-fields">
            <div className="email-field-row">
              <div className="email-field">
                <label>Company *</label>
                <input
                  className="form-input"
                  value={context.company}
                  onChange={(e) => setContext({ ...context, company: e.target.value })}
                  placeholder="Google"
                />
              </div>
              <div className="email-field">
                <label>Position *</label>
                <input
                  className="form-input"
                  value={context.position}
                  onChange={(e) => setContext({ ...context, position: e.target.value })}
                  placeholder="Frontend Engineer"
                />
              </div>
            </div>

            {showInterviewer && (
              <div className="email-field">
                <label>Interviewer Name</label>
                <input
                  className="form-input"
                  value={context.interviewerName}
                  onChange={(e) => setContext({ ...context, interviewerName: e.target.value })}
                  placeholder="Jane Smith"
                />
              </div>
            )}

            {showAppliedDate && (
              <div className="email-field">
                <label>Applied Date</label>
                <input
                  className="form-input"
                  type="date"
                  value={context.appliedDate}
                  onChange={(e) => setContext({ ...context, appliedDate: e.target.value })}
                />
              </div>
            )}

            {showStartDate && (
              <div className="email-field">
                <label>Start Date</label>
                <input
                  className="form-input"
                  type="date"
                  value={context.startDate}
                  onChange={(e) => setContext({ ...context, startDate: e.target.value })}
                />
              </div>
            )}

            <div className="email-field">
              <label>Notes / Context</label>
              <textarea
                className="form-textarea"
                value={context.notes}
                onChange={(e) => setContext({ ...context, notes: e.target.value })}
                placeholder={type === 'thank-you' ? 'Topics discussed, things you want to mention...' : 'Any additional context...'}
                rows={3}
              />
            </div>

            <button
              className="btn btn-primary email-gen-btn"
              onClick={handleGenerate}
              disabled={loading || !context.company.trim() || !context.position.trim()}
            >
              {loading ? <><Loader size={16} className="spin" /> Generating...</> : <><Mail size={16} /> Generate Email</>}
            </button>
          </div>
        </div>

        {/* Right: Result */}
        <div className="email-gen-result">
          {!result && !loading && (
            <div className="email-gen-empty">
              <Mail size={40} strokeWidth={1} />
              <p>Your generated email will appear here</p>
            </div>
          )}

          {loading && (
            <div className="email-gen-loading">
              <Loader size={28} className="spin" />
              <p>Writing your email...</p>
            </div>
          )}

          {result && !loading && (
            <div className="email-gen-output">
              <div className="email-subject-line">
                <span className="email-subject-label">Subject:</span>
                <span className="email-subject-text">{result.subject}</span>
              </div>

              <textarea
                className="email-body-editor"
                value={editedBody}
                onChange={(e) => setEditedBody(e.target.value)}
                rows={12}
              />

              <div className="email-gen-actions">
                <button className="btn btn-ghost btn-sm" onClick={handleGenerate}>
                  <RefreshCw size={14} /> Regenerate
                </button>
                <div className="email-gen-actions-right">
                  <button className="btn btn-secondary btn-sm" onClick={handleDownload}>
                    <Download size={14} /> Download
                  </button>
                  <button className="btn btn-primary btn-sm" onClick={handleCopy}>
                    <Copy size={14} /> Copy
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EmailGenerator;
