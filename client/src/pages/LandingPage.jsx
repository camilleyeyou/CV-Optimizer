import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import {
  FileText, Target, PenTool, Briefcase, MessageSquare,
  Mail, Layout, Globe, Check, ArrowRight, Loader, Sparkles,
  GraduationCap,
} from 'lucide-react';
import toast from 'react-hot-toast';
import api, { startCheckout } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { SITE_URL, OG_IMAGE } from '../config/site';
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

const HOW_IT_WORKS = [
  { step: '1', title: 'Build or import', desc: 'Start from scratch with AI, or import an existing resume or LinkedIn PDF in seconds.' },
  { step: '2', title: 'Optimize for the job', desc: 'Score against ATS systems, tailor to a job description, and fill gaps with AI suggestions.' },
  { step: '3', title: 'Export and apply', desc: 'Download a polished PDF or DOCX, generate a matching cover letter, and track every application.' },
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
    cta: 'Upgrade to Pro',
    plan: 'pro',
    popular: true,
  },
  {
    name: 'Premium',
    price: '$24',
    period: '/mo',
    desc: 'For power users and teams',
    features: ['Everything in Pro', 'Resume translation', 'Advanced analytics', 'Custom branding', 'API access'],
    cta: 'Get Premium',
    plan: 'premium',
    popular: false,
  },
];

const LandingPage = () => {
  const [atsText, setAtsText] = useState('');
  const [atsJobTitle, setAtsJobTitle] = useState('');
  const [atsResult, setAtsResult] = useState(null);
  const [atsLoading, setAtsLoading] = useState(false);
  const [atsError, setAtsError] = useState('');
  const [checkoutPlan, setCheckoutPlan] = useState(null);
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const handleUpgrade = async (plan) => {
    if (!isAuthenticated) {
      // Send to sign-up; they can upgrade from the app once registered.
      navigate(`/register?plan=${plan}`);
      return;
    }
    setCheckoutPlan(plan);
    try {
      const { url } = await startCheckout(plan);
      if (url) window.location.href = url;
      else throw new Error('No checkout URL');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Could not start checkout. Please try again.');
      setCheckoutPlan(null);
    }
  };

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
        <title>CV Optimizer — Build ATS-Optimized Resumes with AI</title>
        <meta name="description" content="Build professional, ATS-optimized resumes with 11 AI tools. Score your resume against ATS systems, generate tailored cover letters, track applications, and prepare for interviews." />
        <link rel="canonical" href={`${SITE_URL}/`} />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="CV Optimizer" />
        <meta property="og:title" content="CV Optimizer — Build ATS-Optimized Resumes with AI" />
        <meta property="og:description" content="Build professional, ATS-optimized resumes with 11 AI tools — ATS scoring, tailored cover letters, application tracking, and interview prep." />
        <meta property="og:url" content={`${SITE_URL}/`} />
        <meta property="og:image" content={OG_IMAGE} />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="CV Optimizer — Build ATS-Optimized Resumes with AI" />
        <meta name="twitter:description" content="Build professional, ATS-optimized resumes with 11 AI tools — ATS scoring, tailored cover letters, application tracking, and interview prep." />
        <meta name="twitter:image" content={OG_IMAGE} />
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

      {/* Stats — verifiable product facts only (no usage metrics we can't back) */}
      <section className="landing-stats">
        <div className="landing-stat">
          <span className="landing-stat-value">16</span>
          <p className="landing-stat-label">Resume templates</p>
        </div>
        <div className="landing-stat">
          <span className="landing-stat-value">11</span>
          <p className="landing-stat-label">AI-powered tools</p>
        </div>
        <div className="landing-stat">
          <span className="landing-stat-value">Free</span>
          <p className="landing-stat-label">to get started</p>
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
                <button
                  className={`btn btn-lg ${plan.popular ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => handleUpgrade(plan.plan)}
                  disabled={checkoutPlan === plan.plan}
                >
                  {checkoutPlan === plan.plan ? <span className="spinner" /> : <>{plan.cta} <ArrowRight size={14} /></>}
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

      {/* How it works */}
      <section className="landing-testimonials">
        <h2>How it works</h2>
        <div className="landing-testimonials-grid">
          {HOW_IT_WORKS.map((s) => (
            <div key={s.step} className="testimonial-card">
              <div className="testimonial-avatar">{s.step}</div>
              <div className="testimonial-name" style={{ marginTop: '0.75rem' }}>{s.title}</div>
              <p className="testimonial-text" style={{ marginTop: '0.5rem' }}>{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Final CTA */}
      <section className="landing-cta">
        <h2>Ready to land your dream job?</h2>
        <p>Build an ATS-ready resume with AI — free to start, no credit card required.</p>
        <Link to="/register" className="btn btn-primary btn-lg">
          Create Your Free Account <ArrowRight size={16} />
        </Link>
      </section>
    </div>
  );
};

export default LandingPage;
