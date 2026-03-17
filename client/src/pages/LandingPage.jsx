import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import {
  FileText, Target, PenTool, Briefcase, MessageSquare,
  Mail, Layout, Globe, Check, ArrowRight, Loader, Sparkles,
  GraduationCap,
} from 'lucide-react';
import api from '../services/api';
import './LandingPage.css';

const FEATURES = [
  { icon: Sparkles, title: 'AI Resume Builder', desc: 'Generate professional resumes from a job description using AI.' },
  { icon: Target, title: 'ATS Score Checker', desc: 'Score your resume against ATS systems and get keyword suggestions.' },
  { icon: PenTool, title: 'Cover Letters', desc: 'Generate tailored cover letters that match your resume to the job.' },
  { icon: Briefcase, title: 'Job Tracker', desc: 'Track applications across stages with a visual kanban board.' },
  { icon: MessageSquare, title: 'Interview Prep', desc: 'Practice with AI-generated questions based on the role.' },
  { icon: Mail, title: 'Email Generator', desc: 'Write follow-up, thank-you, and negotiation emails in seconds.' },
  { icon: Layout, title: 'Professional Templates', desc: '16 templates designed to pass ATS and impress recruiters.' },
  { icon: Globe, title: 'Resume Translation', desc: 'Translate your resume into any language while keeping formatting.' },
];

const TESTIMONIALS = [
  { name: 'Sarah K.', role: 'Software Engineer', initial: 'S', text: 'I went from getting no callbacks to 5 interviews in two weeks. The ATS scoring tool showed me exactly what I was missing.' },
  { name: 'Marcus D.', role: 'Marketing Manager', initial: 'M', text: 'The cover letter generator saved me hours. Each letter sounds unique and actually references the job description.' },
  { name: 'Priya R.', role: 'Recent Graduate', initial: 'P', text: 'As a student, the free tier gave me everything I needed. The AI Creator built my first resume from scratch in minutes.' },
];

const PRICING = [
  {
    name: 'Free',
    price: '$0',
    period: '',
    desc: 'Great for getting started',
    features: ['5 AI credits/month', '6 templates', 'ATS score checker', 'Job tracker', 'PDF & DOCX export'],
    cta: 'Get Started',
    ctaLink: '/register',
    popular: false,
  },
  {
    name: 'Pro',
    price: '$12',
    period: '/mo',
    desc: 'For active job seekers',
    features: ['Unlimited AI credits', 'All 16 templates', 'Cover letter export (PDF/DOCX)', 'Resume sharing links', 'Priority support'],
    cta: 'Coming Soon',
    ctaLink: null,
    popular: true,
  },
  {
    name: 'Premium',
    price: '$24',
    period: '/mo',
    desc: 'For power users and teams',
    features: ['Everything in Pro', 'Resume translation', 'Advanced analytics', 'Custom branding', 'API access'],
    cta: 'Coming Soon',
    ctaLink: null,
    popular: false,
  },
];

const LandingPage = () => {
  const [atsText, setAtsText] = useState('');
  const [atsJobTitle, setAtsJobTitle] = useState('');
  const [atsResult, setAtsResult] = useState(null);
  const [atsLoading, setAtsLoading] = useState(false);
  const [atsError, setAtsError] = useState('');

  const handleAtsCheck = async () => {
    if (!atsText.trim() || !atsJobTitle.trim()) {
      setAtsError('Please enter both resume text and a job title.');
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
      setAtsError(err.response?.data?.error || 'Failed to score resume. Please try again.');
    } finally {
      setAtsLoading(false);
    }
  };

  const getScoreClass = (score) => {
    if (score >= 70) return 'score-high';
    if (score >= 50) return 'score-mid';
    return 'score-low';
  };

  return (
    <div className="landing">
      <Helmet>
        <title>CV Optimizer - Build ATS-Optimized Resumes with AI</title>
        <meta name="description" content="Build professional, ATS-optimized resumes with 11 AI tools. Score your resume, generate cover letters, track applications, and prepare for interviews." />
      </Helmet>

      {/* Hero */}
      <section className="landing-hero">
        <h1>Build ATS-Optimized Resumes with AI</h1>
        <p>
          11 AI-powered tools to build your resume, score it against ATS systems,
          generate cover letters, and land more interviews.
        </p>
        <div className="landing-hero-actions">
          <Link to="/register" className="btn btn-primary btn-lg">
            Get Started Free <ArrowRight size={16} />
          </Link>
          <a href="#ats-checker" className="btn btn-secondary btn-lg">
            Try ATS Checker
          </a>
        </div>
      </section>

      {/* Stats */}
      <section className="landing-stats">
        <div className="landing-stat">
          <span className="landing-stat-value">10,000+</span>
          <p className="landing-stat-label">Resumes built</p>
        </div>
        <div className="landing-stat">
          <span className="landing-stat-value">95%</span>
          <p className="landing-stat-label">ATS pass rate</p>
        </div>
        <div className="landing-stat">
          <span className="landing-stat-value">11</span>
          <p className="landing-stat-label">AI tools</p>
        </div>
      </section>

      {/* Features */}
      <section className="landing-features">
        <h2>Everything you need to land the job</h2>
        <p>From resume building to interview prep, all in one platform.</p>
        <div className="landing-features-grid">
          {FEATURES.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="landing-feature-card">
              <div className="landing-feature-icon">
                <Icon size={22} />
              </div>
              <h3>{title}</h3>
              <p>{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Free ATS Checker */}
      <section className="landing-ats" id="ats-checker">
        <div className="landing-ats-card">
          <h2>Free ATS Score Checker</h2>
          <p>Paste your resume text and get an instant ATS compatibility score. No signup required.</p>

          <div className="landing-ats-form">
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" htmlFor="ats-job-title">Job title</label>
              <input
                id="ats-job-title"
                className="form-input"
                value={atsJobTitle}
                onChange={(e) => setAtsJobTitle(e.target.value)}
                placeholder="e.g. Software Engineer"
              />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" htmlFor="ats-resume-text">Resume text</label>
              <textarea
                id="ats-resume-text"
                className="form-textarea"
                value={atsText}
                onChange={(e) => setAtsText(e.target.value)}
                placeholder="Paste your resume text here..."
                rows={6}
              />
            </div>

            {atsError && <div className="alert alert-error">{atsError}</div>}

            <button
              className="btn btn-primary btn-lg"
              onClick={handleAtsCheck}
              disabled={atsLoading || !atsText.trim() || !atsJobTitle.trim()}
            >
              {atsLoading ? (
                <><Loader size={16} className="spin" /> Scoring...</>
              ) : (
                <><Target size={16} /> Check ATS Score</>
              )}
            </button>
          </div>

          {atsResult && (
            <div className="landing-ats-result">
              <div className={`landing-ats-score ${getScoreClass(atsResult.score)}`}>
                {atsResult.score}/100
              </div>
              <p style={{ marginBottom: 0 }}>ATS Compatibility Score</p>
              {atsResult.missing_keywords?.length > 0 && (
                <>
                  <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', marginTop: 'var(--space-3)', marginBottom: 'var(--space-2)' }}>
                    Missing keywords:
                  </p>
                  <div className="landing-ats-keywords">
                    {atsResult.missing_keywords.map((kw) => (
                      <span key={kw} className="badge badge-error">{kw}</span>
                    ))}
                  </div>
                </>
              )}
              <div style={{ marginTop: 'var(--space-6)' }}>
                <Link to="/register" className="btn btn-primary">
                  Sign up to optimize your resume <ArrowRight size={14} />
                </Link>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Pricing */}
      <section className="landing-pricing">
        <h2>Simple, transparent pricing</h2>
        <p>Start free. Upgrade when you need more power.</p>
        <div className="landing-pricing-grid">
          {PRICING.map((plan) => (
            <div key={plan.name} className={`pricing-card ${plan.popular ? 'pricing-popular' : ''}`}>
              {plan.popular && <span className="pricing-popular-badge">Most Popular</span>}
              <h3>{plan.name}</h3>
              <div className="pricing-price">
                {plan.price}<span>{plan.period}</span>
              </div>
              <p className="pricing-desc">{plan.desc}</p>
              <ul className="pricing-features">
                {plan.features.map((f) => (
                  <li key={f}><Check size={14} /> {f}</li>
                ))}
              </ul>
              {plan.ctaLink ? (
                <Link to={plan.ctaLink} className="btn btn-primary btn-lg">
                  {plan.cta} <ArrowRight size={14} />
                </Link>
              ) : (
                <button className="btn btn-secondary btn-lg" disabled>
                  {plan.cta}
                </button>
              )}
            </div>
          ))}
        </div>

        <div className="pricing-student">
          <h4><GraduationCap size={18} style={{ verticalAlign: 'middle', marginRight: '0.5rem' }} />Student Program</h4>
          <p>Sign up with your .edu email and get Pro features free for 6 months.</p>
        </div>
      </section>

      {/* Testimonials */}
      <section className="landing-testimonials">
        <h2>What our users say</h2>
        <div className="landing-testimonials-grid">
          {TESTIMONIALS.map((t) => (
            <div key={t.name} className="testimonial-card">
              <p className="testimonial-text">&ldquo;{t.text}&rdquo;</p>
              <div className="testimonial-author">
                <div className="testimonial-avatar">{t.initial}</div>
                <div>
                  <div className="testimonial-name">{t.name}</div>
                  <div className="testimonial-role">{t.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Final CTA */}
      <section className="landing-cta">
        <h2>Ready to land your dream job?</h2>
        <p>Join thousands of job seekers who optimized their resumes with AI.</p>
        <Link to="/register" className="btn btn-primary btn-lg">
          Create Your Free Account <ArrowRight size={16} />
        </Link>
      </section>
    </div>
  );
};

export default LandingPage;
