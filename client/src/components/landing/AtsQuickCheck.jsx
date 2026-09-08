import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Target, ArrowRight } from 'lucide-react';
import api from '../../services/api';
import './AtsQuickCheck.css';

/* Same bands the checker page copy quotes: 70+ passes, 50–69 needs work,
   below 50 is likely filtered out. */
const scoreBand = (score) => {
  if (score >= 70) return 'is-high';
  if (score >= 50) return 'is-mid';
  return 'is-low';
};

/**
 * The public paste-and-score form, shared by the landing page's #ats-checker
 * section and the /free-ats-resume-checker page. One implementation so the
 * two entry points can never behave differently.
 */
const AtsQuickCheck = () => {
  const [atsText, setAtsText] = useState('');
  const [atsJobTitle, setAtsJobTitle] = useState('');
  const [atsResult, setAtsResult] = useState(null);
  const [atsLoading, setAtsLoading] = useState(false);
  const [atsError, setAtsError] = useState('');

  const handleAtsCheck = async (e) => {
    e.preventDefault();
    if (!atsText.trim() || !atsJobTitle.trim()) {
      setAtsError('Add both a job title and your resume text.');
      return;
    }
    setAtsLoading(true);
    setAtsError('');
    setAtsResult(null);

    try {
      const res = await api.post('/api/ats/public-score', {
        resumeText: atsText.trim(),
        jobTitle: atsJobTitle.trim(),
      });
      setAtsResult(res.data);
    } catch (err) {
      setAtsError(err.response?.data?.error || 'Could not score that resume. Please try again.');
    } finally {
      setAtsLoading(false);
    }
  };

  return (
    <form className="lp-ats-form" onSubmit={handleAtsCheck}>
      <div className="form-group">
        <label className="form-label" htmlFor="ats-job-title">
          Target job title
        </label>
        <input
          id="ats-job-title"
          className="form-input"
          value={atsJobTitle}
          onChange={(e) => setAtsJobTitle(e.target.value)}
          placeholder="Marketing Manager"
          autoComplete="organization-title"
        />
      </div>

      <div className="form-group">
        <label className="form-label" htmlFor="ats-resume-text">
          Resume text
        </label>
        <textarea
          id="ats-resume-text"
          className="form-textarea lp-ats-textarea"
          value={atsText}
          onChange={(e) => setAtsText(e.target.value)}
          placeholder="Paste the full text of your resume here."
          rows={7}
          aria-describedby={atsError ? 'ats-error' : undefined}
          aria-invalid={atsError ? 'true' : undefined}
        />
      </div>

      {atsError && (
        <div className="alert alert-error" id="ats-error" role="alert">
          {atsError}
        </div>
      )}

      <button
        type="submit"
        className="btn btn-primary btn-lg btn-block"
        data-loading={atsLoading || undefined}
        disabled={atsLoading || !atsText.trim() || !atsJobTitle.trim()}
      >
        {atsLoading ? 'Scoring' : <><Target size={16} aria-hidden="true" /> Check ATS score</>}
      </button>

      {atsLoading && !atsResult && (
        <div className="lp-ats-result" aria-hidden="true">
          <div className="skeleton" style={{ width: 96, height: 56, margin: '0 auto' }} />
          <div className="skeleton skeleton-text" style={{ width: 180, margin: '12px auto 0' }} />
        </div>
      )}

      {atsResult && (
        <div className="lp-ats-result" role="status">
          <div className={`lp-ats-score ${scoreBand(atsResult.score)}`}>
            <span className="lp-ats-score-value tabular">{atsResult.score}</span>
            <span className="lp-ats-score-max">/100</span>
          </div>
          <p className="lp-ats-score-label">ATS compatibility</p>

          {atsResult.missing_keywords?.length > 0 && (
            <div className="lp-ats-missing">
              <p className="lp-ats-missing-label">
                Missing keywords for this role
              </p>
              <div className="lp-ats-keywords">
                {atsResult.missing_keywords.map((kw) => (
                  <span key={kw} className="badge badge-warning">{kw}</span>
                ))}
              </div>
            </div>
          )}

          <Link to="/register" className="btn btn-accent btn-block">
            Fix these with AI <ArrowRight size={15} aria-hidden="true" />
          </Link>
        </div>
      )}
    </form>
  );
};

export default AtsQuickCheck;
