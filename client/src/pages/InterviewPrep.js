import { useState } from 'react';
import { useResume } from '../context/ResumeContext';
import { generateInterviewQuestions, evaluateAnswer } from '../services/api';
import { MessageSquare, Sparkles, Loader, ChevronRight, Star, CheckCircle, AlertTriangle, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import './InterviewPrep.css';

const STEP = { SETUP: 0, PRACTICE: 1, REVIEW: 2 };

const InterviewPrep = () => {
  const { resumes } = useResume();
  const [step, setStep] = useState(STEP.SETUP);
  const [jobDescription, setJobDescription] = useState('');
  const [selectedResume, setSelectedResume] = useState('');
  const [questions, setQuestions] = useState([]);
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState({});
  const [evaluations, setEvaluations] = useState({});
  const [loading, setLoading] = useState(false);
  const [evaluating, setEvaluating] = useState(false);

  const handleGenerate = async () => {
    if (jobDescription.trim().length < 10) {
      toast.error('Paste a job description (at least 10 characters)');
      return;
    }

    const resume = resumes.find((r) => r.id === selectedResume);
    if (!resume) {
      toast.error('Select a resume first');
      return;
    }

    setLoading(true);
    try {
      const data = await generateInterviewQuestions(resume, jobDescription.trim());
      setQuestions(data.questions || []);
      setCurrentQ(0);
      setAnswers({});
      setEvaluations({});
      setStep(STEP.PRACTICE);
    } catch {
      toast.error('Failed to generate questions');
    } finally {
      setLoading(false);
    }
  };

  const handleEvaluate = async () => {
    const q = questions[currentQ];
    const answer = answers[q.id];
    if (!answer?.trim()) {
      toast.error('Write an answer first');
      return;
    }

    setEvaluating(true);
    try {
      const result = await evaluateAnswer(q.question, answer.trim(), jobDescription);
      setEvaluations((prev) => ({ ...prev, [q.id]: result }));
    } catch {
      toast.error('Failed to evaluate answer');
    } finally {
      setEvaluating(false);
    }
  };

  const goNext = () => {
    if (currentQ < questions.length - 1) setCurrentQ(currentQ + 1);
    else setStep(STEP.REVIEW);
  };

  const goPrev = () => {
    if (currentQ > 0) setCurrentQ(currentQ - 1);
  };

  const answeredCount = Object.keys(answers).filter((k) => answers[k]?.trim()).length;
  const evaluatedCount = Object.keys(evaluations).length;
  const avgScore = evaluatedCount > 0
    ? Math.round(Object.values(evaluations).reduce((s, e) => s + (e.score || 0), 0) / evaluatedCount)
    : null;

  return (
    <div className="interview-prep">
      {/* Setup Step */}
      {step === STEP.SETUP && (
        <div className="interview-setup">
          <div className="interview-setup-header">
            <MessageSquare size={28} className="interview-icon" />
            <h1>AI Interview Prep</h1>
            <p>Practice with AI-generated questions tailored to your resume and target job.</p>
          </div>

          <div className="interview-setup-form">
            <div className="interview-field">
              <label>Select Resume</label>
              <select
                className="form-input"
                value={selectedResume}
                onChange={(e) => setSelectedResume(e.target.value)}
              >
                <option value="">Choose a resume...</option>
                {(resumes || []).map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.title || `${r.personal_info?.first_name || 'Untitled'}'s Resume`}
                  </option>
                ))}
              </select>
            </div>

            <div className="interview-field">
              <label>Job Description</label>
              <textarea
                className="form-textarea"
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                placeholder="Paste the full job description here..."
                rows={8}
              />
            </div>

            <button
              className="btn btn-primary btn-lg interview-start-btn"
              onClick={handleGenerate}
              disabled={loading || !selectedResume || jobDescription.trim().length < 10}
            >
              {loading ? <><Loader size={18} className="spin" /> Generating Questions...</> : <><Sparkles size={18} /> Start Practice</>}
            </button>
          </div>
        </div>
      )}

      {/* Practice Step */}
      {step === STEP.PRACTICE && questions.length > 0 && (
        <div className="interview-practice">
          <div className="interview-progress-bar">
            <div className="interview-progress-fill" style={{ width: `${((currentQ + 1) / questions.length) * 100}%` }} />
          </div>

          <div className="interview-practice-header">
            <button className="btn btn-ghost btn-sm" onClick={() => setStep(STEP.SETUP)}>
              <ArrowLeft size={14} /> Back
            </button>
            <span className="interview-counter">Question {currentQ + 1} of {questions.length}</span>
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => setStep(STEP.REVIEW)}
            >
              Review All
            </button>
          </div>

          <div className="interview-question-card">
            <div className="interview-q-type">
              <span className={`interview-type-badge ${questions[currentQ].type}`}>
                {questions[currentQ].type}
              </span>
            </div>
            <h2 className="interview-question-text">{questions[currentQ].question}</h2>
            <p className="interview-tip">Tip: {questions[currentQ].tip}</p>
          </div>

          <div className="interview-answer-section">
            <textarea
              className="interview-answer-input"
              value={answers[questions[currentQ].id] || ''}
              onChange={(e) => setAnswers({ ...answers, [questions[currentQ].id]: e.target.value })}
              placeholder="Type your answer here... Speak as you would in a real interview."
              rows={6}
            />

            <div className="interview-answer-actions">
              <button
                className="btn btn-accent"
                onClick={handleEvaluate}
                disabled={evaluating || !answers[questions[currentQ].id]?.trim()}
              >
                {evaluating ? <><Loader size={14} className="spin" /> Evaluating...</> : <><Star size={14} /> Get Feedback</>}
              </button>
            </div>
          </div>

          {/* Evaluation Result */}
          {evaluations[questions[currentQ].id] && (
            <div className="interview-evaluation">
              <div className="interview-eval-score">
                <div className="interview-score-circle" data-score={evaluations[questions[currentQ].id].score >= 7 ? 'good' : evaluations[questions[currentQ].id].score >= 5 ? 'ok' : 'low'}>
                  {evaluations[questions[currentQ].id].score}/10
                </div>
              </div>

              <div className="interview-eval-details">
                {evaluations[questions[currentQ].id].strengths?.length > 0 && (
                  <div className="interview-eval-section">
                    <h4><CheckCircle size={14} /> Strengths</h4>
                    <ul>
                      {evaluations[questions[currentQ].id].strengths.map((s, i) => <li key={i}>{s}</li>)}
                    </ul>
                  </div>
                )}

                {evaluations[questions[currentQ].id].improvements?.length > 0 && (
                  <div className="interview-eval-section">
                    <h4><AlertTriangle size={14} /> Improvements</h4>
                    <ul>
                      {evaluations[questions[currentQ].id].improvements.map((s, i) => <li key={i}>{s}</li>)}
                    </ul>
                  </div>
                )}

                {evaluations[questions[currentQ].id].sample_answer && (
                  <div className="interview-eval-section sample">
                    <h4>Sample Strong Answer</h4>
                    <p>{evaluations[questions[currentQ].id].sample_answer}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="interview-nav">
            <button className="btn btn-ghost" onClick={goPrev} disabled={currentQ === 0}>Previous</button>
            <button className="btn btn-primary" onClick={goNext}>
              {currentQ === questions.length - 1 ? 'Finish & Review' : <>Next <ChevronRight size={14} /></>}
            </button>
          </div>
        </div>
      )}

      {/* Review Step */}
      {step === STEP.REVIEW && (
        <div className="interview-review">
          <div className="interview-review-header">
            <h1>Practice Summary</h1>
            <div className="interview-review-stats">
              <div className="interview-stat">
                <span className="interview-stat-num">{answeredCount}/{questions.length}</span>
                <span className="interview-stat-label">Answered</span>
              </div>
              <div className="interview-stat">
                <span className="interview-stat-num">{evaluatedCount}/{questions.length}</span>
                <span className="interview-stat-label">Evaluated</span>
              </div>
              {avgScore !== null && (
                <div className="interview-stat">
                  <span className="interview-stat-num">{avgScore}/10</span>
                  <span className="interview-stat-label">Avg Score</span>
                </div>
              )}
            </div>
          </div>

          <div className="interview-review-list">
            {questions.map((q, i) => (
              <div key={q.id} className="interview-review-item">
                <div className="interview-review-q">
                  <span className="interview-review-num">{i + 1}</span>
                  <div>
                    <span className={`interview-type-badge ${q.type} small`}>{q.type}</span>
                    <p className="interview-review-question">{q.question}</p>
                  </div>
                  {evaluations[q.id] && (
                    <span className={`interview-review-score ${evaluations[q.id].score >= 7 ? 'good' : evaluations[q.id].score >= 5 ? 'ok' : 'low'}`}>
                      {evaluations[q.id].score}/10
                    </span>
                  )}
                </div>
                {answers[q.id] && (
                  <div className="interview-review-answer">
                    <strong>Your answer:</strong> {answers[q.id]}
                  </div>
                )}
                {!answers[q.id] && (
                  <div className="interview-review-skipped">Skipped</div>
                )}
              </div>
            ))}
          </div>

          <div className="interview-review-actions">
            <button className="btn btn-ghost" onClick={() => { setStep(STEP.PRACTICE); setCurrentQ(0); }}>
              <ArrowLeft size={14} /> Back to Practice
            </button>
            <button className="btn btn-primary" onClick={() => setStep(STEP.SETUP)}>
              <Sparkles size={14} /> New Session
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default InterviewPrep;
