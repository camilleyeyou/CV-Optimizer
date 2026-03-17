import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useResume } from '../context/ResumeContext';
import { Sparkles, FileText, ArrowRight, ArrowLeft, Loader, Check, MessageSquare } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api';
import './AICreator.css';

const STEPS = ['job', 'questions', 'generating', 'done'];

const AICreator = () => {
  const navigate = useNavigate();
  const { createResume, updateField } = useResume();
  const [step, setStep] = useState('job');
  const [jobDescription, setJobDescription] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [company, setCompany] = useState('');
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(false);
  const [generatedResume, setGeneratedResume] = useState(null);

  const handleAnalyzeJob = async () => {
    if (!jobDescription.trim()) {
      toast.error('Please paste a job description');
      return;
    }
    setLoading(true);
    try {
      const response = await api.post('/api/ai/generate-questions', {
        jobDescription: jobDescription.trim(),
      });
      const data = response.data;
      setJobTitle(data.job_title || '');
      setCompany(data.company || '');
      setQuestions(data.questions || []);
      setStep('questions');
    } catch (err) {
      toast.error('Failed to analyze job description. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleAnswer = (questionId, value) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  const answeredCount = questions.filter((q) => answers[q.id]?.trim()).length;
  const allAnswered = answeredCount >= Math.min(questions.length, 3); // At least 3 required

  const handleGenerateResume = async () => {
    if (!allAnswered) {
      toast.error('Please answer at least 3 questions');
      return;
    }
    setStep('generating');
    setLoading(true);
    try {
      // Build answers map with question text as keys
      const answersMap = {};
      questions.forEach((q) => {
        if (answers[q.id]?.trim()) {
          answersMap[q.question] = answers[q.id].trim();
        }
      });

      const response = await api.post('/api/ai/generate-resume', {
        jobDescription: jobDescription.trim(),
        answers: answersMap,
        jobTitle,
      });

      setGeneratedResume(response.data.resume);
      setStep('done');
      toast.success('Resume generated successfully!');
    } catch (err) {
      toast.error('Failed to generate resume. Please try again.');
      setStep('questions');
    } finally {
      setLoading(false);
    }
  };

  const handleUseResume = async () => {
    if (!generatedResume) return;
    setLoading(true);
    try {
      const resume = await createResume('modern');
      // Update each field from the generated resume
      if (generatedResume.personal_info) updateField('personal_info', generatedResume.personal_info);
      if (generatedResume.summary) updateField('summary', generatedResume.summary);
      if (generatedResume.work_experience) updateField('work_experience', generatedResume.work_experience);
      if (generatedResume.education) updateField('education', generatedResume.education);
      if (generatedResume.skills) updateField('skills', generatedResume.skills);
      if (generatedResume.projects) updateField('projects', generatedResume.projects);
      if (generatedResume.certifications) updateField('certifications', generatedResume.certifications);
      if (generatedResume.languages) updateField('languages', generatedResume.languages);

      navigate(`/builder/${resume?.id || ''}`);
    } catch (err) {
      toast.error('Failed to create resume');
    } finally {
      setLoading(false);
    }
  };

  const stepIndex = STEPS.indexOf(step);

  return (
    <div className="ai-creator-page">
      <div className="ai-creator-header">
        <Sparkles size={28} className="ai-creator-icon" />
        <h1>AI Resume Creator</h1>
        <p>Paste a job description and let AI build the perfect resume for you</p>
      </div>

      {/* Progress */}
      <div className="ai-progress">
        {['Paste Job', 'Answer Questions', 'Generate'].map((label, i) => (
          <div key={i} className={`ai-progress-step ${i <= stepIndex ? 'active' : ''} ${i < stepIndex ? 'done' : ''}`}>
            <div className="progress-dot">
              {i < stepIndex ? <Check size={12} /> : i + 1}
            </div>
            <span>{label}</span>
          </div>
        ))}
      </div>

      {/* Step 1: Job Description */}
      {step === 'job' && (
        <div className="ai-step">
          <div className="ai-step-card">
            <h2><FileText size={18} /> Paste the job description</h2>
            <p>Copy the full job posting — the more detail, the better the resume</p>
            <textarea
              className="form-textarea ai-textarea"
              rows={12}
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              placeholder="Paste the full job description here...

Example:
We are looking for a Senior Software Engineer to join our team. You will be responsible for designing and building scalable microservices, mentoring junior developers, and collaborating with product managers to deliver features that serve millions of users..."
            />
            <div className="ai-step-actions">
              <button
                className="btn btn-primary btn-lg"
                onClick={handleAnalyzeJob}
                disabled={loading || !jobDescription.trim()}
              >
                {loading ? (
                  <><Loader size={16} className="spin" /> Analyzing job...</>
                ) : (
                  <><Sparkles size={16} /> Analyze & Continue <ArrowRight size={16} /></>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Step 2: Questions */}
      {step === 'questions' && (
        <div className="ai-step">
          <div className="ai-step-card">
            <div className="ai-job-badge">
              <Sparkles size={14} />
              <span>Creating resume for: <strong>{jobTitle}</strong>{company && ` at ${company}`}</span>
            </div>

            <h2><MessageSquare size={18} /> Tell us about yourself</h2>
            <p>Answer these questions so we can build a resume tailored to this role. Answer at least 3.</p>

            <div className="ai-questions">
              {questions.map((q, i) => (
                <div key={q.id} className={`ai-question ${answers[q.id]?.trim() ? 'answered' : ''}`}>
                  <label className="ai-question-label">
                    <span className="question-number">{i + 1}</span>
                    {q.question}
                  </label>
                  {q.type === 'textarea' ? (
                    <textarea
                      className="form-textarea"
                      rows={3}
                      value={answers[q.id] || ''}
                      onChange={(e) => handleAnswer(q.id, e.target.value)}
                      placeholder={q.placeholder}
                    />
                  ) : (
                    <input
                      className="form-input"
                      type="text"
                      value={answers[q.id] || ''}
                      onChange={(e) => handleAnswer(q.id, e.target.value)}
                      placeholder={q.placeholder}
                    />
                  )}
                </div>
              ))}
            </div>

            <div className="ai-step-actions">
              <button className="btn btn-secondary" onClick={() => setStep('job')}>
                <ArrowLeft size={16} /> Back
              </button>
              <div className="ai-step-right">
                <span className="answer-count">{answeredCount}/{questions.length} answered</span>
                <button
                  className="btn btn-primary btn-lg"
                  onClick={handleGenerateResume}
                  disabled={!allAnswered}
                >
                  <Sparkles size={16} /> Generate My Resume <ArrowRight size={16} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Step 3: Generating */}
      {step === 'generating' && (
        <div className="ai-step">
          <div className="ai-generating">
            <Loader size={40} className="spin" />
            <h2>Building your resume...</h2>
            <p>AI is crafting a tailored resume for <strong>{jobTitle}</strong></p>
            <div className="generating-steps">
              <div className="gen-step active">Analyzing job requirements...</div>
              <div className="gen-step">Matching your experience...</div>
              <div className="gen-step">Writing achievement bullets...</div>
              <div className="gen-step">Optimizing for ATS...</div>
            </div>
          </div>
        </div>
      )}

      {/* Step 4: Done */}
      {step === 'done' && generatedResume && (
        <div className="ai-step">
          <div className="ai-step-card ai-done-card">
            <div className="ai-done-header">
              <Check size={32} className="ai-done-check" />
              <h2>Your resume is ready!</h2>
              <p>AI has created a tailored resume for <strong>{jobTitle}</strong>. Review and customize it in the builder.</p>
            </div>

            {/* Preview summary */}
            <div className="ai-resume-preview">
              <h3>{generatedResume.personal_info?.first_name} {generatedResume.personal_info?.last_name}</h3>
              <p className="preview-title">{generatedResume.personal_info?.job_title}</p>
              {generatedResume.summary && (
                <p className="preview-summary">{generatedResume.summary}</p>
              )}
              <div className="preview-stats">
                {generatedResume.work_experience?.length > 0 && (
                  <span>{generatedResume.work_experience.length} experience{generatedResume.work_experience.length > 1 ? 's' : ''}</span>
                )}
                {generatedResume.skills?.length > 0 && (
                  <span>{generatedResume.skills.length} skills</span>
                )}
                {generatedResume.education?.length > 0 && (
                  <span>{generatedResume.education.length} education</span>
                )}
              </div>
            </div>

            <div className="ai-step-actions">
              <button className="btn btn-secondary" onClick={() => setStep('questions')}>
                <ArrowLeft size={16} /> Regenerate
              </button>
              <button
                className="btn btn-primary btn-lg"
                onClick={handleUseResume}
                disabled={loading}
              >
                {loading ? (
                  <><Loader size={16} className="spin" /> Opening builder...</>
                ) : (
                  <><ArrowRight size={16} /> Edit in Builder</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AICreator;
