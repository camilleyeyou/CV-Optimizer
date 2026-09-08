import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Target, PenTool, Briefcase, MessageSquare, Mail, Globe, Check, ArrowRight,
  Loader, Sparkles, Wand2, ListChecks, LineChart, FileDown,
  Link2, ShieldCheck, Lock,
} from 'lucide-react';
import toast from 'react-hot-toast';
import Seo from '../components/common/Seo';
import { SITE_URL } from '../config/site';
import { homepageJsonLd } from '../config/structuredData.mjs';
import { startCheckout } from '../services/api';
import { useAuth } from '../context/AuthContext';
import HeroProductVisual from '../components/landing/HeroProductVisual';
import AtsQuickCheck from '../components/landing/AtsQuickCheck';
import { INTERVALS, FREE_PLAN, PRO_PLAN, DEFAULT_INTERVAL } from '../config/pricing';
import './LandingPage.css';

/* ---------------------------------------------------------------------------
   Counted from template-registry.json at build time (see vite.config.js), so
   these cannot drift when a template ships — and the registry itself never
   reaches this bundle. The landing page is eager-loaded; 18KB of JSON to
   derive two integers is not a trade worth making.
   ------------------------------------------------------------------------ */
const TEMPLATE_COUNT = __TEMPLATE_COUNT__;
const FREE_TEMPLATE_COUNT = __FREE_TEMPLATE_COUNT__;

const SEO_DESCRIPTION = `Score your resume against applicant tracking systems, fix what they flag, and export a clean PDF or DOCX. 11 AI tools and ${TEMPLATE_COUNT} templates, free to start.`;

// Built once at module scope: same inputs as the prerenderer's copy, so the
// blocks <Seo> writes after hydration are identical to the ones already there.
const SEO_JSON_LD = homepageJsonLd({
  siteUrl: SITE_URL,
  description: SEO_DESCRIPTION,
  freeTemplateCount: FREE_TEMPLATE_COUNT,
  templateCount: TEMPLATE_COUNT,
});

/* ---------------------------------------------------------------------------
   SOCIAL PROOF — intentionally empty.

   Each section below renders only when its array has entries, so nothing
   unverified can ship by accident. Fill these in with real material and the
   sections appear; leave them empty and the page skips them cleanly.

   LOGOS expects:  { name: 'Company', src: '/logos/company.svg' }
   QUOTES expects: { quote, name, role, company, avatar? }

   Both are rendered as placeholders during local development so the layout
   stays reviewable — see import.meta.env.DEV below.
   ------------------------------------------------------------------------ */
const LOGOS = [];
const QUOTES = [];

/* Verifiable product facts only. No usage or outcome metrics — we cannot
   substantiate them, and an unbacked number on a trust-led page costs more
   than it earns. */
const FACTS = [
  { value: String(TEMPLATE_COUNT), label: 'Resume templates' },
  { value: '11', label: 'AI-powered tools' },
  { value: '2', label: 'Export formats — PDF and DOCX' },
  { value: 'Free', label: 'To start, no card required' },
];

/* Every entry maps to a shipping endpoint or route. */
const TOOLS = [
  { icon: Sparkles, title: 'AI resume builder', desc: 'Generate a first draft from a job description, then edit it line by line.' },
  { icon: Target, title: 'ATS score checker', desc: 'Score a resume against applicant tracking systems and see the keywords it is missing.' },
  { icon: Wand2, title: 'Job tailoring', desc: 'Rewrite an existing resume against a specific posting without starting over.' },
  { icon: PenTool, title: 'Summary and bullet writer', desc: 'Turn plain notes into achievement bullets that lead with the result.' },
  { icon: ListChecks, title: 'Skill suggestions', desc: 'Surface the skills a role expects that your resume does not yet mention.' },
  { icon: Mail, title: 'Cover letters', desc: 'Draft a letter that matches your resume to the posting, then export it.' },
  { icon: MessageSquare, title: 'Interview prep', desc: 'Practice role-specific questions and get your answers assessed.' },
  { icon: Mail, title: 'Follow-up emails', desc: 'Write thank-you, check-in and negotiation emails in your own register.' },
  { icon: Globe, title: 'Resume translation', desc: 'Translate a finished resume while keeping its layout intact.' },
  { icon: Briefcase, title: 'Job tracker', desc: 'Move applications through stages on a board so nothing goes quiet.' },
  { icon: LineChart, title: 'Score history', desc: 'Watch your ATS scores move over time and see which keywords keep recurring.' },
];

const STEPS = [
  {
    n: '01',
    title: 'Start from anywhere',
    desc: 'Import an existing resume, paste a job description and let AI draft one, or begin from a blank template.',
  },
  {
    n: '02',
    title: 'Fix what the filter flags',
    desc: 'Score against applicant tracking systems, add the keywords you are missing, and tighten weak bullets.',
  },
  {
    n: '03',
    title: 'Export and apply',
    desc: 'Download a clean PDF or DOCX, generate a matching cover letter, and track every application in one place.',
  },
];

/* Plans come from config/pricing.js so this teaser and /pricing can never
   disagree. The quarterly rate is quoted here because it is the period most
   job searches actually run. */
const QUARTERLY = INTERVALS.find((i) => i.id === 'quarterly') ?? INTERVALS[0];

const LandingPage = () => {
  const [checkoutPlan, setCheckoutPlan] = useState(null);
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const handleUpgrade = async (plan) => {
    if (!isAuthenticated) {
      navigate(`/register?plan=${plan}&interval=${DEFAULT_INTERVAL}`);
      return;
    }
    setCheckoutPlan(plan);
    try {
      // The teaser quotes the quarterly rate, so it must check out at that rate.
      const { url } = await startCheckout(plan, DEFAULT_INTERVAL);
      if (url) window.location.href = url;
      else throw new Error('No checkout URL');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Could not start checkout. Please try again.');
      setCheckoutPlan(null);
    }
  };

  const showProofPlaceholders = import.meta.env.DEV;

  return (
    <div className="lp">
      <Seo
        title="CV Optimizer — Build ATS-Optimized Resumes with AI"
        description={SEO_DESCRIPTION}
        path="/"
        jsonLd={SEO_JSON_LD}
      />

      {/* ================= HERO ================= */}
      <section className="lp-hero">
        <div className="lp-hero-inner">
          <div className="lp-hero-copy">
            <a className="lp-pill" href="#ats-checker">
              <span className="lp-pill-dot" aria-hidden="true" />
              Free ATS check, no account needed
              <ArrowRight size={13} aria-hidden="true" />
            </a>

            <h1 className="display-1">
              Build a resume that clears the filter
            </h1>

            <p className="lead lp-hero-lead">
              Most applications are read by software before a person sees them. CV Optimizer
              scores your resume the way those systems do, shows you what is missing, and
              helps you fix it.
            </p>

            <div className="lp-hero-actions">
              <Link to="/register" className="btn btn-primary btn-xl">
                Start building — free <ArrowRight size={17} aria-hidden="true" />
              </Link>
              <a href="#ats-checker" className="btn btn-secondary btn-xl">
                <Target size={17} aria-hidden="true" /> Check my score
              </a>
            </div>

            <p className="lp-hero-trust">
              <ShieldCheck size={15} aria-hidden="true" />
              No card required. 5 AI credits every month on the free plan.
            </p>
          </div>

          <div className="lp-hero-visual">
            <HeroProductVisual />
          </div>
        </div>
      </section>

      {/* ================= FACTS ================= */}
      <section className="lp-facts" aria-label="Product at a glance">
        <div className="lp-facts-inner">
          {FACTS.map(({ value, label }) => (
            <div key={label} className="lp-fact">
              <span className="lp-fact-value">{value}</span>
              <span className="lp-fact-label">{label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ================= SOCIAL PROOF =================
          Renders only when LOGOS / QUOTES are populated. In development the
          empty slots are drawn so the layout can be reviewed before real
          material exists. */}
      {(LOGOS.length > 0 || showProofPlaceholders) && (
        <section className="lp-logos" aria-label="Where our users work">
          <p className="lp-logos-label">
            {LOGOS.length > 0 ? 'Used by people hired at' : 'Logo strip — add entries to LOGOS in LandingPage.jsx'}
          </p>
          <div className="lp-logos-strip">
            {LOGOS.length > 0
              ? LOGOS.map(({ name, src }) => (
                  <img key={name} className="lp-logo" src={src} alt={name} height={26} loading="lazy" />
                ))
              : Array.from({ length: 5 }, (_, i) => (
                  <span key={i} className="lp-logo-placeholder" aria-hidden="true" />
                ))}
          </div>
        </section>
      )}

      {/* ================= TOOLS ================= */}
      <section className="lp-section" id="features">
        <header className="lp-section-head">
          <span className="eyebrow">The toolkit</span>
          <h2 className="display-3">Eleven tools, one job search</h2>
          <p className="lead">
            Everything between a blank page and a signed offer, in a single workspace.
          </p>
        </header>

        <div className="lp-tools">
          {TOOLS.map(({ icon: Icon, title, desc }) => (
            <article key={title} className="lp-tool">
              <span className="lp-tool-icon">
                <Icon size={18} aria-hidden="true" />
              </span>
              <h3 className="lp-tool-title">{title}</h3>
              <p className="lp-tool-desc">{desc}</p>
            </article>
          ))}
        </div>
      </section>

      {/* ================= ATS CHECKER ================= */}
      <section className="lp-ats" id="ats-checker">
        <div className="lp-ats-card">
          <div className="lp-ats-intro">
            <span className="eyebrow">Try it now</span>
            <h2 className="display-3">Score your resume in seconds</h2>
            <p className="lead">
              Paste your resume text and the role you are targeting. You will get a
              compatibility score and the keywords the posting expects but your resume
              does not mention. No account, no card.
            </p>
            <ul className="lp-ats-points">
              <li><Check size={15} aria-hidden="true" /> Runs on the same scoring engine as the app</li>
              <li><Check size={15} aria-hidden="true" /> Nothing you paste here is saved to an account</li>
              <li><Check size={15} aria-hidden="true" /> Works with any resume, wherever you built it</li>
            </ul>
            <p className="lp-ats-more">
              <Link to="/free-ats-resume-checker">How the score works and how to raise it</Link>
            </p>
          </div>

          <AtsQuickCheck />
        </div>
      </section>

      {/* ================= HOW IT WORKS ================= */}
      <section className="lp-section">
        <header className="lp-section-head">
          <span className="eyebrow">How it works</span>
          <h2 className="display-3">Three steps to a stronger application</h2>
        </header>

        <ol className="lp-steps">
          {STEPS.map(({ n, title, desc }) => (
            <li key={n} className="lp-step">
              <span className="lp-step-n mono">{n}</span>
              <h3 className="lp-step-title">{title}</h3>
              <p className="lp-step-desc">{desc}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* ================= TESTIMONIALS (structure only) ================= */}
      {(QUOTES.length > 0 || showProofPlaceholders) && (
        <section className="lp-section">
          <header className="lp-section-head">
            <span className="eyebrow">Testimonials</span>
            <h2 className="display-3">
              {QUOTES.length > 0 ? 'What people say' : 'Testimonial grid — add entries to QUOTES'}
            </h2>
          </header>
          <div className="lp-quotes">
            {QUOTES.length > 0
              ? QUOTES.map((q) => (
                  <figure key={q.name} className="lp-quote card">
                    <blockquote>{q.quote}</blockquote>
                    <figcaption>
                      <span className="lp-quote-name">{q.name}</span>
                      <span className="lp-quote-role">{q.role} · {q.company}</span>
                    </figcaption>
                  </figure>
                ))
              : Array.from({ length: 3 }, (_, i) => (
                  <figure key={i} className="lp-quote card" aria-hidden="true">
                    <div className="skeleton skeleton-text" style={{ width: '100%' }} />
                    <div className="skeleton skeleton-text" style={{ width: '88%' }} />
                    <div className="skeleton skeleton-text" style={{ width: '62%' }} />
                    <figcaption style={{ marginTop: 'var(--space-5)' }}>
                      <div className="skeleton skeleton-text" style={{ width: 110 }} />
                    </figcaption>
                  </figure>
                ))}
          </div>
        </section>
      )}

      {/* ================= PRICING ================= */}
      <section className="lp-section" id="pricing">
        <header className="lp-section-head">
          <span className="eyebrow">Pricing</span>
          <h2 className="display-3">Free to build. Pro when you are applying.</h2>
          <p className="lead">
            Unlimited PDF and DOCX export on every plan, including free. Cancel any time.
          </p>
        </header>

        <div className="lp-plans lp-plans-two">
          <div className="lp-plan card">
            <h3 className="lp-plan-name">{FREE_PLAN.name}</h3>
            <p className="lp-plan-price">
              <span className="lp-plan-amount">{FREE_PLAN.price}</span>
            </p>
            <p className="lp-plan-desc">{FREE_PLAN.tagline}</p>

            <ul className="lp-plan-features">
              {FREE_PLAN.features.map((f) => (
                <li key={f}><Check size={15} aria-hidden="true" /> {f}</li>
              ))}
            </ul>

            <Link to={FREE_PLAN.ctaLink} className="btn btn-secondary btn-lg btn-block">
              {FREE_PLAN.cta}
            </Link>
          </div>

          <div className="lp-plan card card-featured">
            <span className="lp-plan-flag">Most popular</span>
            <h3 className="lp-plan-name">{PRO_PLAN.name}</h3>
            <p className="lp-plan-price">
              <span className="lp-plan-amount">{QUARTERLY.price}</span>
              <span className="lp-plan-period">{QUARTERLY.unit}</span>
            </p>
            <p className="lp-plan-desc">{PRO_PLAN.tagline}</p>

            <ul className="lp-plan-features">
              {PRO_PLAN.features.map((f) => (
                <li key={f}><Check size={15} aria-hidden="true" /> {f}</li>
              ))}
            </ul>

            <button
              type="button"
              className="btn btn-primary btn-lg btn-block"
              onClick={() => handleUpgrade('pro')}
              data-loading={checkoutPlan === 'pro' || undefined}
              disabled={checkoutPlan === 'pro'}
            >
              {PRO_PLAN.cta} <ArrowRight size={15} aria-hidden="true" />
            </button>
          </div>
        </div>

        <p className="lp-plans-more">
          <Link to="/pricing">Compare plans in full, and see weekly and monthly rates</Link>
        </p>
      </section>

      {/* ================= CLOSING CTA ================= */}
      <section className="lp-cta">
        <div className="lp-cta-inner">
          <h2 className="display-2">Your next application deserves better odds</h2>
          <p className="lead">
            Build it, score it, and send it in the same afternoon.
          </p>
          <div className="lp-hero-actions">
            <Link to="/register" className="btn btn-primary btn-xl">
              Create your free account <ArrowRight size={17} aria-hidden="true" />
            </Link>
            <Link to="/templates" className="btn btn-secondary btn-xl">
              Browse {TEMPLATE_COUNT} templates
            </Link>
          </div>
          <ul className="lp-cta-points">
            <li><FileDown size={14} aria-hidden="true" /> PDF and DOCX export on every plan</li>
            <li><Link2 size={14} aria-hidden="true" /> Shareable links on Pro</li>
            <li><Lock size={14} aria-hidden="true" /> Delete your data whenever you want</li>
          </ul>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;
