import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, FileText, Briefcase, BarChart3, AlertTriangle, CheckCircle, XCircle, ChevronDown, ChevronUp, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api';
import { useResume } from '../context/ResumeContext';
import './ATSChecker.css';

/** Band a score falls into. Drives colour everywhere, from one place. */
const bandOf = (score) => (score >= 80 ? 'good' : score >= 60 ? 'fair' : 'poor');

/**
 * The score, as a ring.
 *
 * Colours come from the token layer via data-band rather than hex literals —
 * the track used to be #e5e7eb, a light-mode grey, which read as a bright
 * halo on a near-black page.
 */
const ScoreRing = ({ score }) => {
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="ats-ring" data-band={bandOf(score)}>
      <svg width="140" height="140" viewBox="0 0 140 140" aria-hidden="true">
        <circle className="ats-ring-track" cx="70" cy="70" r={radius} fill="none" strokeWidth="8" />
        <circle
          className="ats-ring-value"
          cx="70" cy="70" r={radius} fill="none"
          strokeWidth="8" strokeLinecap="round"
          strokeDasharray={circumference} strokeDashoffset={offset}
          transform="rotate(-90 70 70)"
        />
      </svg>
      <p className="ats-ring-label">
        <span className="ats-ring-number">{score}</span>
        <span className="ats-ring-max">/ 100</span>
      </p>
    </div>
  );
};

const SectionScore = ({ name, data, id }) => {
  const [expanded, setExpanded] = useState(false);
  const score = data?.score ?? 0;
  const weightPct = data?.weight != null ? Math.round(data.weight * 100) : null;
  const hasFeedback = !!data?.feedback;

  return (
    <div className="ats-band" data-band={bandOf(score)}>
      <button
        type="button"
        className="ats-band-head"
        onClick={() => setExpanded((e) => !e)}
        aria-expanded={expanded}
        aria-controls={`${id}-feedback`}
        disabled={!hasFeedback}
      >
        <span className="ats-band-name">
          {name}
          {weightPct != null && <span className="ats-band-weight">{weightPct}% of score</span>}
        </span>

        <span
          className="ats-band-meter"
          role="progressbar"
          aria-valuenow={score}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`${name} score`}
        >
          <span style={{ width: `${score}%` }} />
        </span>

        <span className="ats-band-value">{score}</span>
        {hasFeedback && (expanded
          ? <ChevronUp size={15} aria-hidden="true" />
          : <ChevronDown size={15} aria-hidden="true" />)}
      </button>

      {expanded && hasFeedback && (
        <p className="ats-band-feedback" id={`${id}-feedback`}>{data.feedback}</p>
      )}
    </div>
  );
};

const ATSChecker = () => {
  const [file, setFile] = useState(null);
  const [jobTitle, setJobTitle] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [optimizing, setOptimizing] = useState(false);
  const [results, setResults] = useState(null);
  const fileInputRef = useRef(null);
  const navigate = useNavigate();
  const { createResume, updateResume } = useResume();

  const handleFileDrop = (e) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile?.type === 'application/pdf') {
      setFile(droppedFile);
    } else {
      toast.error('Please upload a PDF file');
    }
  };

  const handleFileSelect = (e) => {
    const selected = e.target.files[0];
    if (selected) setFile(selected);
  };

  const handleAnalyze = async () => {
    if (!file) {
      toast.error('Please upload your resume');
      return;
    }
    if (!jobTitle.trim()) {
      toast.error('Please enter a job title');
      return;
    }

    setLoading(true);
    setResults(null);

    try {
      const formData = new FormData();
      formData.append('resume', file);
      formData.append('jobTitle', jobTitle.trim());
      if (jobDescription.trim()) {
        formData.append('jobDescription', jobDescription.trim());
      }

      const response = await api.post('/api/ats/analyze', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setResults(response.data);
      toast.success('Analysis complete');
    } catch (err) {
      const message = err.response?.data?.error || 'Analysis failed. Please try again.';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setJobTitle('');
    setJobDescription('');
    setResults(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleOptimize = async () => {
    if (!file || !results) return;

    setOptimizing(true);
    try {
      const formData = new FormData();
      formData.append('resume', file);
      formData.append('jobTitle', jobTitle.trim());
      if (jobDescription.trim()) {
        formData.append('jobDescription', jobDescription.trim());
      }
      formData.append('atsResults', JSON.stringify(results));

      const response = await api.post('/api/ats/optimize', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const optimizedData = response.data;

      // Create a new resume and populate it with optimized data
      const newResume = await createResume('modern');
      if (newResume) {
        updateResume({
          title: `${jobTitle.trim()} - Optimized`,
          personal_info: optimizedData.personal_info || {},
          summary: optimizedData.summary || '',
          work_experience: optimizedData.work_experience || [],
          education: optimizedData.education || [],
          skills: optimizedData.skills || [],
          projects: optimizedData.projects || [],
          certifications: optimizedData.certifications || [],
          languages: optimizedData.languages || [],
        });

        toast.success('Resume optimized! Redirecting to builder...');
        navigate('/builder');
      }
    } catch (err) {
      const message = err.response?.data?.error || 'Optimization failed. Please try again.';
      toast.error(message);
    } finally {
      setOptimizing(false);
    }
  };

  return (
    <div className="ats">
      <header className="ats-head">
        <h1 className="ats-title">ATS score checker</h1>
        <p className="ats-sub">
          Upload a resume and a job title. You get the same signals an applicant
          tracking system reads: keyword overlap, parse-ability, and what is missing.
        </p>
      </header>

      <div className="ats-content">
        {/* Upload Panel */}
        <div className="ats-panel">
          {/* File Upload */}
          <div
            className="ats-drop"
            data-has-file={!!file || undefined}
            role="button"
            tabIndex={0}
            aria-label={file ? `Selected file: ${file.name}. Click to change.` : 'Upload your resume PDF. Click or drag and drop.'}
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleFileDrop}
            onClick={() => fileInputRef.current?.click()}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fileInputRef.current?.click(); } }}
          >
            {/* The dropzone above is the labelled control; this is only the
                mechanism. Named anyway so it is never an anonymous field. */}
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf"
              onChange={handleFileSelect}
              aria-label="Choose a resume PDF"
              hidden
            />
            {file ? (
              <div className="ats-drop-file">
                <FileText size={22} aria-hidden="true" />
                <span className="ats-drop-name">{file.name}</span>
                <span className="ats-drop-size">{(file.size / 1024).toFixed(0)} KB · click to replace</span>
              </div>
            ) : (
              <div className="ats-drop-empty">
                <span className="ats-drop-icon"><Upload size={20} aria-hidden="true" /></span>
                <span className="ats-drop-title">Drop a resume here</span>
                <span className="ats-drop-hint">or click to browse — PDF, up to 5MB</span>
              </div>
            )}
          </div>

          {/* Job Details */}
          <div className="ats-fields">
            <div className="form-group">
              <label className="form-label" htmlFor="ats-job-title">
                <Briefcase size={14} /> Job title you're applying for
              </label>
              <input
                id="ats-job-title"
                type="text"
                className="form-input"
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
                placeholder="e.g. Registered Nurse, Project Manager"
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="ats-job-desc">
                <FileText size={14} /> Job description (optional but recommended)
              </label>
              <textarea
                id="ats-job-desc"
                className="form-textarea"
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                placeholder="Paste the full job description here for a more accurate analysis..."
                rows={6}
              />
            </div>

            <div className="ats-actions">
              <button
                type="button"
                className="btn btn-primary btn-lg"
                onClick={handleAnalyze}
                disabled={loading || !file || !jobTitle.trim()}
                data-loading={loading || undefined}
              >
                <BarChart3 size={16} aria-hidden="true" />
                {loading ? 'Analysing…' : 'Check my score'}
              </button>
              {results && (
                <button type="button" className="btn btn-secondary btn-lg" onClick={handleReset}>
                  Start over
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Results Panel */}
        {/* A skeleton of the result, not a spinner: it reserves the space the
            results will take, so nothing below jumps when they land. */}
        {loading && (
          <div className="ats-results" aria-busy="true">
            <div className="ats-score-card">
              <div className="skeleton ats-skel-ring" />
              <div className="ats-skel-lines">
                <div className="skeleton" style={{ height: 22, width: '58%' }} />
                <div className="skeleton" style={{ height: 13, width: '100%', marginTop: 14 }} />
                <div className="skeleton" style={{ height: 13, width: '82%', marginTop: 8 }} />
              </div>
            </div>
            <p className="ats-skel-note" role="status">
              Reading your resume the way an ATS would. This takes a few seconds.
            </p>
            <div className="ats-block">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="skeleton" style={{ height: 46, marginTop: i === 1 ? 0 : 10 }} />
              ))}
            </div>
          </div>
        )}

        {results && !loading && (
          <div className="ats-results">
            {/* Overall Score */}
            <div className="ats-score-card">
              <ScoreRing score={results.overall_score} />
              <div className="ats-score-copy">
                <h2 className="ats-score-verdict">
                  {results.overall_score >= 80
                    ? 'Strong match for this role'
                    : results.overall_score >= 60
                      ? 'Workable, with gaps worth closing'
                      : 'This will struggle to get through'}
                </h2>
                <p>{results.summary}</p>
              </div>
            </div>

            {/* Optimize CTA */}
            <div className="ats-cta">
              <div>
                <h3 className="ats-cta-title">Have AI close the gaps</h3>
                <p className="ats-cta-desc">
                  Rewrites your bullets to carry the missing keywords and opens the
                  result in the builder as a new resume. The original is untouched.
                </p>
              </div>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleOptimize}
                disabled={optimizing}
                data-loading={optimizing || undefined}
              >
                <Sparkles size={15} aria-hidden="true" />
                {optimizing ? 'Rewriting…' : 'Optimise with AI'}
              </button>
            </div>

            {/* Section Breakdown — the engine's true rubric categories */}
            {results.sections && (
              <section className="ats-block">
                <h3 className="ats-block-title">Score breakdown</h3>
                <div className="ats-bands">
                  <SectionScore id="ats-keywords" name="Keyword Match" data={results.sections.keywords} />
                  <SectionScore id="ats-formatting" name="Formatting & Parse-ability" data={results.sections.formatting} />
                  <SectionScore id="ats-content" name="Content Quality" data={results.sections.content} />
                  <SectionScore id="ats-completeness" name="Completeness" data={results.sections.completeness} />
                </div>
              </section>
            )}

            {/* Keywords */}
            {results.keyword_match && (
              <section className="ats-block">
                <h3 className="ats-block-title">Keywords</h3>
                <div className="ats-kw-grid">
                  {results.keyword_match.found?.length > 0 && (
                    <div className="ats-kw" data-kind="found">
                      <h4><CheckCircle size={14} aria-hidden="true" /> In your resume</h4>
                      <div className="ats-kw-tags">
                        {results.keyword_match.found.map((kw, i) => (
                          <span key={kw} className="ats-tag" data-kind="found">{kw}</span>
                        ))}
                      </div>
                    </div>
                  )}
                  {results.keyword_match.missing?.length > 0 && (
                    <div className="ats-kw" data-kind="missing">
                      <h4><XCircle size={14} aria-hidden="true" /> Missing</h4>
                      <div className="ats-kw-tags">
                        {results.keyword_match.missing.map((kw, i) => (
                          <span key={kw} className="ats-tag" data-kind="missing">{kw}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </section>
            )}

            {/* Improvements */}
            {results.improvements?.length > 0 && (
              <section className="ats-block">
                <h3 className="ats-block-title">What to change</h3>
                <ul className="ats-fixes">
                  {results.improvements.map((item, i) => (
                    <li key={item.suggestion} className="ats-fix" data-priority={item.priority}>
                      <AlertTriangle size={14} aria-hidden="true" />
                      <div>
                        <span className="ats-priority">{item.priority} priority</span>
                        <p>{item.suggestion}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {/* Strengths */}
            {results.strengths?.length > 0 && (
              <section className="ats-block">
                <h3 className="ats-block-title">Working well</h3>
                <ul className="ats-strengths">
                  {results.strengths.map((s, i) => (
                    <li key={s}><CheckCircle size={14} aria-hidden="true" /> {s}</li>
                  ))}
                </ul>
              </section>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ATSChecker;
