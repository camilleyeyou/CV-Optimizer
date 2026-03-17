import { useState } from 'react';
import { FileText, Briefcase, Sparkles, Loader, Copy, Check, Download, RotateCcw, FileDown } from 'lucide-react';
import toast from 'react-hot-toast';
import { useResume } from '../context/ResumeContext';
import { generateCoverLetter, generateCoverLetterPDF, generateCoverLetterDOCX } from '../services/api';
import './CoverLetter.css';

const CoverLetter = () => {
  const { resumes, resumeData } = useResume();
  const [selectedResumeId, setSelectedResumeId] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [coverLetter, setCoverLetter] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const getResumeForGeneration = () => {
    if (selectedResumeId) {
      return resumes.find((r) => r.id === selectedResumeId) || resumeData;
    }
    return resumeData;
  };

  const handleGenerate = async () => {
    if (!jobDescription.trim()) {
      toast.error('Please paste a job description');
      return;
    }

    const resume = getResumeForGeneration();
    const hasContent = resume?.personal_info?.first_name || resume?.summary || resume?.work_experience?.length;
    if (!hasContent) {
      toast.error('Please select a resume with content');
      return;
    }

    setLoading(true);
    setCoverLetter('');

    try {
      const result = await generateCoverLetter(resume, jobDescription.trim());
      setCoverLetter(result.coverLetter);
      toast.success('Cover letter generated!');
    } catch (err) {
      const message = err.response?.data?.error || 'Failed to generate cover letter';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(coverLetter);
      setCopied(true);
      toast.success('Copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Failed to copy');
    }
  };

  const handleDownloadTxt = () => {
    const blob = new Blob([coverLetter], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'Cover_Letter.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadPDF = async () => {
    try {
      const resume = getResumeForGeneration();
      const blob = await generateCoverLetterPDF(
        coverLetter,
        resume?.personal_info,
        '',
        '',
      );
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'Cover_Letter.pdf';
      a.click();
      URL.revokeObjectURL(url);
      toast.success('PDF downloaded');
    } catch {
      toast.error('Failed to generate PDF');
    }
  };

  const handleDownloadDOCX = async () => {
    try {
      const resume = getResumeForGeneration();
      const blob = await generateCoverLetterDOCX(
        coverLetter,
        resume?.personal_info,
        '',
        '',
      );
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'Cover_Letter.docx';
      a.click();
      URL.revokeObjectURL(url);
      toast.success('DOCX downloaded');
    } catch {
      toast.error('Failed to generate DOCX');
    }
  };

  const handleReset = () => {
    setCoverLetter('');
    setJobDescription('');
    setSelectedResumeId('');
  };

  return (
    <div className="cl-page">
      <div className="cl-header">
        <h1>Cover Letter Generator</h1>
        <p>Generate a tailored cover letter from your resume and a job description</p>
      </div>

      <div className="cl-content">
        {/* Input Panel */}
        <div className="cl-input-panel">
          {/* Resume Selector */}
          <div className="form-group">
            <label className="form-label" htmlFor="cl-resume">
              <FileText size={14} /> Select a resume
            </label>
            <select
              id="cl-resume"
              className="form-select"
              value={selectedResumeId}
              onChange={(e) => setSelectedResumeId(e.target.value)}
            >
              <option value="">
                {resumeData?.id ? `Current: ${resumeData.title || 'Untitled Resume'}` : '-- Select a resume --'}
              </option>
              {resumes.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.title || `${r.personal_info?.first_name || ''} ${r.personal_info?.last_name || ''}`.trim() || 'Untitled'}
                </option>
              ))}
            </select>
          </div>

          {/* Job Description */}
          <div className="form-group">
            <label className="form-label" htmlFor="cl-job-desc">
              <Briefcase size={14} /> Job description
            </label>
            <textarea
              id="cl-job-desc"
              className="form-textarea"
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              placeholder="Paste the full job description here..."
              rows={10}
            />
            <span className="form-hint">{jobDescription.length}/10,000 characters</span>
          </div>

          <button
            className="btn btn-primary btn-lg cl-generate-btn"
            onClick={handleGenerate}
            disabled={loading || !jobDescription.trim()}
          >
            {loading ? (
              <><Loader size={16} className="spin" /> Generating...</>
            ) : (
              <><Sparkles size={16} /> Generate Cover Letter</>
            )}
          </button>
        </div>

        {/* Loading */}
        {loading && (
          <div className="cl-loading">
            <Loader size={32} className="spin" />
            <p>Writing your cover letter...</p>
            <span>Matching your experience to the job requirements</span>
          </div>
        )}

        {/* Result */}
        {coverLetter && !loading && (
          <div className="cl-result">
            <div className="cl-result-header">
              <h3>Your Cover Letter</h3>
              <div className="cl-result-actions">
                <button className="btn btn-ghost btn-sm" onClick={handleCopy}>
                  {copied ? <><Check size={14} /> Copied</> : <><Copy size={14} /> Copy</>}
                </button>
                <button className="btn btn-ghost btn-sm" onClick={handleDownloadPDF}>
                  <FileDown size={14} /> PDF
                </button>
                <button className="btn btn-ghost btn-sm" onClick={handleDownloadDOCX}>
                  <FileDown size={14} /> DOCX
                </button>
                <button className="btn btn-ghost btn-sm" onClick={handleDownloadTxt}>
                  <Download size={14} /> TXT
                </button>
                <button className="btn btn-ghost btn-sm" onClick={handleReset}>
                  <RotateCcw size={14} /> Start Over
                </button>
              </div>
            </div>
            <div className="cl-letter">
              {coverLetter.split('\n').map((paragraph, i) => (
                <p key={i}>{paragraph}</p>
              ))}
            </div>
            <textarea
              className="cl-editor"
              value={coverLetter}
              onChange={(e) => setCoverLetter(e.target.value)}
              rows={12}
            />
            <span className="form-hint cl-edit-hint">Edit the text above to customize your cover letter</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default CoverLetter;
