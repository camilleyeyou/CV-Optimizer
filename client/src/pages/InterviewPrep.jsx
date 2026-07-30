import { useState } from 'react';
import { useResume } from '../context/ResumeContext';
import { generateInterviewQuestions, evaluateAnswer } from '../services/api';
import { MessageSquare, Sparkles, ChevronRight, Star, CheckCircle, AlertTriangle, ArrowLeft } from 'lucide-react';
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
    if (!q) return;
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
    <div className="iv">
      {/* Setup Step */}
      {step === STEP.SETUP && (
        <div className="iv-setup">
          <header className="iv-setup-head">
            <span className="iv-icon"><MessageSquare size={22} aria-hidden="true" /></span>
            <h1 className="iv-title">Interview practice</h1>
            <p className="iv-sub">
              Questions generated from your own resume and the role you are going
              for, with written feedback on each answer.
            </p>
          </header>

          <div className="iv-form">
            <div className="form-group">
              <label className="form-label" htmlFor="iv-resume">Which resume?</label>
              <select
                id="iv-resume"
                className="form-select"
                value={selectedResume}
                onChange={(e) => setSelectedResume(e.target.value)}
              >
                <option value="">Select a resume…</option>
                {(resumes || []).map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.title || `${r.personal_info?.first_name || 'Untitled'}'s Resume`}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="iv-jd">Job description</label>
              <textarea
                id="iv-jd"
                className="form-textarea"
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                placeholder="Paste the posting here"
                rows={8}
              />
            </div>

            <button
              type="button"
              className="btn btn-primary btn-lg btn-block"
              onClick={handleGenerate}
              disabled={loading || !selectedResume || jobDescription.trim().length < 10}
              data-loading={loading || undefined}
            >
              <Sparkles size={16} aria-hidden="true" />
              {loading ? 'Writing your questions…' : 'Start practising'}
            </button>
          </div>
        </div>
      )}

      {/* Practice Step — guard on the current item so a drifted index or a
          short/malformed questions array can't crash the page. */}
      {step === STEP.PRACTICE && questions[currentQ] && (
        <div className="iv-practice">
          <h1 className="sr-only">Interview practice</h1>

          <div
            className="iv-progress"
            role="progressbar"
            aria-valuenow={currentQ + 1}
            aria-valuemin={1}
            aria-valuemax={questions.length}
            aria-label={`Question ${currentQ + 1} of ${questions.length}`}
          >
            <span style={{ width: `${((currentQ + 1) / questions.length) * 100}%` }} />
          </div>

          <div className="iv-practice-bar">
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => setStep(STEP.SETUP)}>
              <ArrowLeft size={14} aria-hidden="true" /> Start over
            </button>
            <span className="iv-counter">Question {currentQ + 1} of {questions.length}</span>
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => setStep(STEP.REVIEW)}>
              Review all
            </button>
          </div>

          <div className="iv-card">
            <span className="iv-type" data-type={questions[currentQ].type}>
              {questions[currentQ].type}
            </span>
            <h2 className="iv-question">{questions[currentQ].question}</h2>
            {questions[currentQ].tip && <p className="iv-tip">{questions[currentQ].tip}</p>}
          </div>

          <div className="form-group iv-answer">
            <label className="form-label" htmlFor="iv-answer">Your answer</label>
            <textarea
              id="iv-answer"
              className="form-textarea"
              value={answers[questions[currentQ].id] || ''}
              onChange={(e) => setAnswers({ ...answers, [questions[currentQ].id]: e.target.value })}
              placeholder="Answer as you would out loud."
              rows={6}
            />

            <div className="iv-answer-actions">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={handleEvaluate}
                disabled={evaluating || !answers[questions[currentQ].id]?.trim()}
                data-loading={evaluating || undefined}
              >
                <Star size={14} aria-hidden="true" />
                {evaluating ? 'Reading it…' : 'Get feedback'}
              </button>
            </div>
          </div>

          {/* Evaluation Result */}
          {evaluations[questions[currentQ].id] && (
            <div className="iv-eval">
              <div
                className="iv-eval-score"
                data-band={evaluations[questions[currentQ].id].score >= 7 ? 'good' : evaluations[questions[currentQ].id].score >= 5 ? 'fair' : 'poor'}
              >
                <span className="iv-eval-num">{evaluations[questions[currentQ].id].score}</span>
                <span className="iv-eval-max">out of 10</span>
              </div>

              <div className="iv-eval-body">
                {evaluations[questions[currentQ].id].strengths?.length > 0 && (
                  <div className="iv-eval-part" data-kind="good">
                    <h3><CheckCircle size={14} aria-hidden="true" /> What worked</h3>
                    <ul>
                      {evaluations[questions[currentQ].id].strengths.map((s, i) => <li key={i}>{s}</li>)}
                    </ul>
                  </div>
                )}

                {evaluations[questions[currentQ].id].improvements?.length > 0 && (
                  <div className="iv-eval-part" data-kind="fix">
                    <h3><AlertTriangle size={14} aria-hidden="true" /> What to sharpen</h3>
                    <ul>
                      {evaluations[questions[currentQ].id].improvements.map((s, i) => <li key={i}>{s}</li>)}
                    </ul>
                  </div>
                )}

                {evaluations[questions[currentQ].id].sample_answer && (
                  <div className="iv-eval-part" data-kind="sample">
                    <h3>A stronger version</h3>
                    <p>{evaluations[questions[currentQ].id].sample_answer}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="iv-nav">
            <button type="button" className="btn btn-secondary" onClick={goPrev} disabled={currentQ === 0}>
              Previous
            </button>
            <button type="button" className="btn btn-primary" onClick={goNext}>
              {currentQ === questions.length - 1
                ? 'Finish and review'
                : <>Next <ChevronRight size={14} aria-hidden="true" /></>}
            </button>
          </div>
        </div>
      )}

      {/* Review Step */}
      {step === STEP.REVIEW && (
        <div className="iv-review">
          <header className="iv-review-head">
            <h1 className="iv-title">How that went</h1>
            <dl className="iv-stats">
              <div className="iv-stat">
                <dt>Answered</dt>
                <dd>{answeredCount}/{questions.length}</dd>
              </div>
              <div className="iv-stat">
                <dt>Reviewed</dt>
                <dd>{evaluatedCount}/{questions.length}</dd>
              </div>
              {avgScore !== null && (
                <div className="iv-stat">
                  <dt>Average</dt>
                  <dd>{avgScore}/10</dd>
                </div>
              )}
            </dl>
          </header>

          <div className="iv-review-list">
            {questions.map((q, i) => (
              <article key={q.id} className="iv-review-item">
                <div className="iv-review-q">
                  <span className="iv-review-num">{i + 1}</span>
                  <div className="iv-review-copy">
                    <span className="iv-type" data-type={q.type} data-small="">{q.type}</span>
                    <p className="iv-review-question">{q.question}</p>
                  </div>
                  {evaluations[q.id] && (
                    <span
                      className="iv-review-score"
                      data-band={evaluations[q.id].score >= 7 ? 'good' : evaluations[q.id].score >= 5 ? 'fair' : 'poor'}
                    >
                      {evaluations[q.id].score}/10
                    </span>
                  )}
                </div>
                {answers[q.id]
                  ? <p className="iv-review-answer">{answers[q.id]}</p>
                  : <p className="iv-review-skipped">Not answered</p>}
              </article>
            ))}
          </div>

          <div className="iv-nav">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => { setStep(STEP.PRACTICE); setCurrentQ(0); }}
            >
              <ArrowLeft size={14} aria-hidden="true" /> Back to the questions
            </button>
            <button type="button" className="btn btn-primary" onClick={() => setStep(STEP.SETUP)}>
              <Sparkles size={14} aria-hidden="true" /> New session
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default InterviewPrep;
