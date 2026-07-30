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
    <div className="em">
      <header className="em-head">
        <h1 className="em-title">Follow-up emails</h1>
        <p className="em-sub">
          Thank-you notes, nudges and replies, written from the details of the
          role. You edit the draft before it goes anywhere.
        </p>
      </header>

      <div className="em-layout">
        <div className="em-form">
          <fieldset className="em-types">
            <legend className="form-label">What kind of email?</legend>
            {EMAIL_TYPES.map((t) => (
              <button
                key={t.id}
                type="button"
                className="em-type"
                aria-pressed={type === t.id}
                onClick={() => { setType(t.id); setResult(null); }}
              >
                <span className="em-type-label">{t.label}</span>
                <span className="em-type-desc">{t.desc}</span>
              </button>
            ))}
          </fieldset>

          <div className="em-fields">
            <div className="form-row">
              <div className="form-group">
                <label className="form-label" htmlFor="em-company">
                  Company <span className="form-required" aria-hidden="true">*</span>
                </label>
                <input
                  id="em-company"
                  required
                  className="form-input"
                  value={context.company}
                  onChange={(e) => setContext({ ...context, company: e.target.value })}
                  placeholder="Google"
                />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="em-position">
                  Position <span className="form-required" aria-hidden="true">*</span>
                </label>
                <input
                  id="em-position"
                  required
                  className="form-input"
                  value={context.position}
                  onChange={(e) => setContext({ ...context, position: e.target.value })}
                  placeholder="Frontend Engineer"
                />
              </div>
            </div>

            {showInterviewer && (
              <div className="form-group">
                <label className="form-label" htmlFor="em-interviewer">Interviewer name</label>
                <input
                  id="em-interviewer"
                  className="form-input"
                  value={context.interviewerName}
                  onChange={(e) => setContext({ ...context, interviewerName: e.target.value })}
                  placeholder="Jane Smith"
                />
              </div>
            )}

            {showAppliedDate && (
              <div className="form-group">
                <label className="form-label" htmlFor="em-applied">Applied on</label>
                <input
                  id="em-applied"
                  className="form-input"
                  type="date"
                  value={context.appliedDate}
                  onChange={(e) => setContext({ ...context, appliedDate: e.target.value })}
                />
              </div>
            )}

            {showStartDate && (
              <div className="form-group">
                <label className="form-label" htmlFor="em-start">Start date</label>
                <input
                  id="em-start"
                  className="form-input"
                  type="date"
                  value={context.startDate}
                  onChange={(e) => setContext({ ...context, startDate: e.target.value })}
                />
              </div>
            )}

            <div className="form-group">
              <label className="form-label" htmlFor="em-notes">
                Anything to mention <span className="form-label-optional">optional</span>
              </label>
              <textarea
                id="em-notes"
                className="form-textarea"
                value={context.notes}
                onChange={(e) => setContext({ ...context, notes: e.target.value })}
                placeholder={type === 'thank-you' ? 'What you discussed, anything you want to reinforce' : 'Anything that should shape the tone'}
                rows={3}
              />
            </div>

            <button
              type="button"
              className="btn btn-primary btn-lg btn-block"
              onClick={handleGenerate}
              disabled={loading || !context.company.trim() || !context.position.trim()}
              data-loading={loading || undefined}
            >
              <Mail size={16} aria-hidden="true" />
              {loading ? 'Writing…' : 'Write the email'}
            </button>
          </div>
        </div>

        <div className="em-result">
          {!result && !loading && (
            <div className="empty-state em-empty">
              <span className="empty-state-icon">
                <Mail size={22} aria-hidden="true" />
              </span>
              <h2 className="empty-state-title">Nothing written yet</h2>
              <p className="empty-state-description">
                Fill in the company and role on the left. The draft lands here,
                fully editable, before you send it anywhere.
              </p>
            </div>
          )}

          {/* Skeleton rather than a spinner, sized like the draft it replaces
              so the panel does not resize when the text arrives. */}
          {loading && (
            <div className="em-output" aria-busy="true">
              <div className="skeleton" style={{ height: 38 }} />
              <div className="skeleton" style={{ height: 260, marginTop: 12 }} />
              <p className="em-loading-note" role="status">Writing your email…</p>
            </div>
          )}

          {result && !loading && (
            <div className="em-output">
              <p className="em-subject">
                <span className="em-subject-label">Subject</span>
                <span className="em-subject-text">{result.subject}</span>
              </p>

              <div className="form-group">
                <label className="form-label sr-only" htmlFor="em-body">Email body</label>
                <textarea
                  id="em-body"
                  className="form-textarea em-body"
                  value={editedBody}
                  onChange={(e) => setEditedBody(e.target.value)}
                  rows={12}
                />
              </div>

              <div className="em-actions">
                <button type="button" className="btn btn-ghost btn-sm" onClick={handleGenerate}>
                  <RefreshCw size={14} aria-hidden="true" /> Write another
                </button>
                <div className="em-actions-right">
                  <button type="button" className="btn btn-secondary btn-sm" onClick={handleDownload}>
                    <Download size={14} aria-hidden="true" /> Download
                  </button>
                  <button type="button" className="btn btn-primary btn-sm" onClick={handleCopy}>
                    <Copy size={14} aria-hidden="true" /> Copy
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
