import { useState, useCallback } from 'react';
import { BarChart3, Loader, AlertTriangle, CheckCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { quickATSScore } from '../../services/api';
import { useResume } from '../../context/ResumeContext';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../config/supabase';
import toast from 'react-hot-toast';

const ATSScoreWidget = () => {
  const { resumeData } = useResume();
  const { user } = useAuth();
  const [jobTitle, setJobTitle] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(true);

  const handleScore = useCallback(async () => {
    const title = jobTitle.trim() || resumeData?.personal_info?.job_title;
    if (!title) {
      toast.error('Enter a job title to score against');
      return;
    }

    setLoading(true);
    try {
      const data = await quickATSScore(resumeData, title, jobDescription.trim());
      setResult(data);
      setExpanded(true);

      // Save score to analytics
      if (user && resumeData?.id && data.score != null) {
        supabase.from('resume_scores').insert({
          user_id: user.id,
          resume_id: resumeData.id,
          job_title: title,
          score: data.score,
          missing_keywords: data.missing_keywords || [],
        }).then(() => {});
      }
    } catch {
      toast.error('Failed to score resume');
    } finally {
      setLoading(false);
    }
  }, [resumeData, jobTitle, jobDescription]);

  const score = result?.score ?? null;
  const color = score >= 80 ? 'var(--success)' : score >= 60 ? 'var(--warning)' : score !== null ? 'var(--error)' : 'var(--text-muted)';

  return (
    <div className="ats-widget">
      <button className="ats-widget-header" onClick={() => setExpanded(!expanded)}>
        <div className="ats-widget-title">
          <BarChart3 size={15} />
          <span>ATS Score</span>
          {score !== null && (
            <span className="ats-widget-badge" style={{ background: color }}>{score}</span>
          )}
        </div>
        {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
      </button>

      {expanded && (
        <div className="ats-widget-body">
          <div className="ats-widget-field">
            <input
              className="form-input form-input-sm"
              value={jobTitle}
              onChange={(e) => setJobTitle(e.target.value)}
              placeholder={resumeData?.personal_info?.job_title || 'Target job title'}
            />
          </div>
          <div className="ats-widget-field">
            <textarea
              className="form-textarea form-textarea-sm"
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              placeholder="Paste job description (optional)"
              rows={3}
            />
          </div>
          <button
            className="btn btn-primary btn-sm ats-widget-btn"
            onClick={handleScore}
            disabled={loading}
          >
            {loading ? <><Loader size={12} className="spin" /> Scoring...</> : <><BarChart3 size={12} /> Check Score</>}
          </button>

          {result && !loading && (
            <div className="ats-widget-result">
              <div className="ats-widget-score-ring">
                <svg width="80" height="80" viewBox="0 0 80 80">
                  <circle cx="40" cy="40" r="34" fill="none" stroke="#e5e7eb" strokeWidth="6" />
                  <circle
                    cx="40" cy="40" r="34" fill="none"
                    stroke={color} strokeWidth="6" strokeLinecap="round"
                    strokeDasharray={2 * Math.PI * 34}
                    strokeDashoffset={2 * Math.PI * 34 * (1 - score / 100)}
                    transform="rotate(-90 40 40)"
                    style={{ transition: 'stroke-dashoffset 0.8s ease' }}
                  />
                </svg>
                <span className="ats-widget-score-num" style={{ color }}>{score}</span>
              </div>

              {result.missing_keywords?.length > 0 && (
                <div className="ats-widget-section">
                  <h4><AlertTriangle size={12} /> Missing Keywords</h4>
                  <div className="ats-widget-tags">
                    {result.missing_keywords.map((kw, i) => (
                      <span key={i} className="ats-widget-tag missing">{kw}</span>
                    ))}
                  </div>
                </div>
              )}

              {result.tips?.length > 0 && (
                <div className="ats-widget-section">
                  <h4><CheckCircle size={12} /> Quick Fixes</h4>
                  <ul className="ats-widget-tips">
                    {result.tips.map((tip, i) => (
                      <li key={i}>{tip}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ATSScoreWidget;
