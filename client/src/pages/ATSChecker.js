import { useState, useRef } from 'react';
import { Upload, FileText, Briefcase, BarChart3, AlertTriangle, CheckCircle, XCircle, Loader, ChevronDown, ChevronUp } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api';
import './ATSChecker.css';

const ScoreRing = ({ score }) => {
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const color = score >= 80 ? '#16a34a' : score >= 60 ? '#d97706' : '#dc2626';

  return (
    <div className="score-ring-container">
      <svg width="140" height="140" viewBox="0 0 140 140">
        <circle cx="70" cy="70" r={radius} fill="none" stroke="#e5e7eb" strokeWidth="8" />
        <circle
          cx="70" cy="70" r={radius} fill="none"
          stroke={color} strokeWidth="8" strokeLinecap="round"
          strokeDasharray={circumference} strokeDashoffset={offset}
          transform="rotate(-90 70 70)"
          style={{ transition: 'stroke-dashoffset 1s ease' }}
        />
      </svg>
      <div className="score-ring-value">
        <span className="score-number" style={{ color }}>{score}</span>
        <span className="score-label">/ 100</span>
      </div>
    </div>
  );
};

const SectionScore = ({ name, data }) => {
  const [expanded, setExpanded] = useState(false);
  const score = data?.score ?? 0;
  const color = score >= 80 ? 'green' : score >= 60 ? 'yellow' : 'red';

  return (
    <div className={`section-score ${color}`}>
      <button className="section-score-header" onClick={() => setExpanded(!expanded)}>
        <div className="section-score-left">
          <span className="section-score-name">{name}</span>
          <div className="section-score-bar">
            <div className="section-score-fill" style={{ width: `${score}%` }} />
          </div>
          <span className="section-score-value">{score}</span>
        </div>
        {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </button>
      {expanded && data?.feedback && (
        <p className="section-score-feedback">{data.feedback}</p>
      )}
    </div>
  );
};

const ATSChecker = () => {
  const [file, setFile] = useState(null);
  const [jobTitle, setJobTitle] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const fileInputRef = useRef(null);

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

  return (
    <div className="ats-page">
      <div className="ats-header">
        <h1>ATS Resume Checker</h1>
        <p>Upload your resume and see how well it performs against Applicant Tracking Systems</p>
      </div>

      <div className="ats-content">
        {/* Upload Panel */}
        <div className="ats-upload-panel">
          {/* File Upload */}
          <div
            className={`ats-dropzone ${file ? 'has-file' : ''}`}
            role="button"
            tabIndex={0}
            aria-label={file ? `Selected file: ${file.name}. Click to change.` : 'Upload your resume PDF. Click or drag and drop.'}
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleFileDrop}
            onClick={() => fileInputRef.current?.click()}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fileInputRef.current?.click(); } }}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf"
              onChange={handleFileSelect}
              hidden
            />
            {file ? (
              <div className="dropzone-file">
                <FileText size={24} />
                <span className="dropzone-filename">{file.name}</span>
                <span className="dropzone-size">{(file.size / 1024).toFixed(0)} KB</span>
              </div>
            ) : (
              <div className="dropzone-empty">
                <Upload size={32} />
                <span className="dropzone-title">Drop your resume here</span>
                <span className="dropzone-subtitle">or click to browse (PDF only, max 5MB)</span>
              </div>
            )}
          </div>

          {/* Job Details */}
          <div className="ats-form">
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
                placeholder="e.g. Senior Software Engineer"
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
                className="btn btn-primary btn-lg"
                onClick={handleAnalyze}
                disabled={loading || !file || !jobTitle.trim()}
              >
                {loading ? (
                  <><Loader size={16} className="spin" /> Analyzing...</>
                ) : (
                  <><BarChart3 size={16} /> Analyze Resume</>
                )}
              </button>
              {results && (
                <button className="btn btn-secondary" onClick={handleReset}>
                  Start Over
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Results Panel */}
        {loading && (
          <div className="ats-loading">
            <Loader size={32} className="spin" />
            <p>Analyzing your resume with AI...</p>
            <span>This may take a few seconds</span>
          </div>
        )}

        {results && !loading && (
          <div className="ats-results">
            {/* Overall Score */}
            <div className="ats-score-card">
              <ScoreRing score={results.overall_score} />
              <div className="ats-score-summary">
                <h2>
                  {results.overall_score >= 80
                    ? 'Great match!'
                    : results.overall_score >= 60
                    ? 'Good, but room for improvement'
                    : 'Needs significant improvement'}
                </h2>
                <p>{results.summary}</p>
              </div>
            </div>

            {/* Section Breakdown */}
            {results.sections && (
              <div className="ats-sections">
                <h3>Score Breakdown</h3>
                <div className="sections-list">
                  <SectionScore name="Keywords" data={results.sections.keywords} />
                  <SectionScore name="Experience" data={results.sections.experience} />
                  <SectionScore name="Skills" data={results.sections.skills} />
                  <SectionScore name="Summary" data={results.sections.summary} />
                  <SectionScore name="Education" data={results.sections.education} />
                  <SectionScore name="Formatting" data={results.sections.formatting} />
                </div>
              </div>
            )}

            {/* Keywords */}
            {results.keyword_match && (
              <div className="ats-keywords">
                <h3>Keyword Analysis</h3>
                <div className="keywords-grid">
                  {results.keyword_match.found?.length > 0 && (
                    <div className="keywords-group found">
                      <h4><CheckCircle size={14} /> Found in Resume</h4>
                      <div className="keywords-tags">
                        {results.keyword_match.found.map((kw, i) => (
                          <span key={i} className="keyword-tag found">{kw}</span>
                        ))}
                      </div>
                    </div>
                  )}
                  {results.keyword_match.missing?.length > 0 && (
                    <div className="keywords-group missing">
                      <h4><XCircle size={14} /> Missing Keywords</h4>
                      <div className="keywords-tags">
                        {results.keyword_match.missing.map((kw, i) => (
                          <span key={i} className="keyword-tag missing">{kw}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Improvements */}
            {results.improvements?.length > 0 && (
              <div className="ats-improvements">
                <h3>Recommended Improvements</h3>
                <ul className="improvements-list">
                  {results.improvements.map((item, i) => (
                    <li key={i} className={`improvement-item ${item.priority}`}>
                      <AlertTriangle size={14} />
                      <div>
                        <span className={`priority-badge ${item.priority}`}>{item.priority}</span>
                        <span>{item.suggestion}</span>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Strengths */}
            {results.strengths?.length > 0 && (
              <div className="ats-strengths">
                <h3>Strengths</h3>
                <ul className="strengths-list">
                  {results.strengths.map((s, i) => (
                    <li key={i}><CheckCircle size={14} /> {s}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ATSChecker;
