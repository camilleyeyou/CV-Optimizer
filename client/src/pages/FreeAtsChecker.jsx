import { Link } from 'react-router-dom';
import { ArrowRight, Check } from 'lucide-react';
import Seo from '../components/common/Seo';
import AtsQuickCheck from '../components/landing/AtsQuickCheck';
import { SITE_URL } from '../config/site';
import {
  ATS_CHECKER_PATH,
  ATS_CHECKER_TITLE,
  ATS_CHECKER_DESCRIPTION,
  SCORE_FACTORS,
  ATS_EXPLAINER,
  IMPROVE_TIPS,
  ATS_CHECKER_FAQS,
  atsCheckerJsonLd,
} from '../config/atsCheckerContent.mjs';
import './FreeAtsChecker.css';

/* Built once at module scope, same inputs as the prerenderer's copy. */
const SEO_JSON_LD = atsCheckerJsonLd(SITE_URL);

/**
 * The public landing page for the free checker. All copy comes from
 * config/atsCheckerContent.mjs — shared with the prerenderer, so the HTML a
 * crawler indexes and this rendered page always match.
 */
const FreeAtsChecker = () => (
  <div className="fac">
    <Seo
      title={ATS_CHECKER_TITLE}
      description={ATS_CHECKER_DESCRIPTION}
      path={ATS_CHECKER_PATH}
      jsonLd={SEO_JSON_LD}
    />

    <section className="fac-hero">
      <div className="fac-hero-copy">
        <h1 className="display-2">Free ATS resume checker</h1>
        <p className="lead">
          Paste your resume, name the role you want, and get a compatibility score
          out of 100 — plus the keywords the posting expects that your resume does
          not mention. No account, no card, nothing saved.
        </p>
        <ul className="lp-ats-points">
          <li><Check size={15} aria-hidden="true" /> Runs on the same scoring engine as the app</li>
          <li><Check size={15} aria-hidden="true" /> Nothing you paste here is saved to an account</li>
          <li><Check size={15} aria-hidden="true" /> Works with any resume, wherever you built it</li>
        </ul>
      </div>
      <AtsQuickCheck />
    </section>

    <section className="fac-section" aria-labelledby="fac-factors">
      <h2 id="fac-factors">What the score measures</h2>
      <p>
        Four weighted checks, mirroring how applicant tracking systems read a
        resume when a target role is given:
      </p>
      <dl className="fac-factors">
        {SCORE_FACTORS.map(({ name, weight, detail }) => (
          <div key={name} className="fac-factor card">
            <dt>{name} <span className="fac-weight mono">{weight}</span></dt>
            <dd>{detail}</dd>
          </div>
        ))}
      </dl>
    </section>

    <section className="fac-section" aria-labelledby="fac-what">
      <h2 id="fac-what">What is an ATS, and why it filters you out</h2>
      {ATS_EXPLAINER.map((p) => <p key={p.slice(0, 24)}>{p}</p>)}
    </section>

    <section className="fac-section" aria-labelledby="fac-improve">
      <h2 id="fac-improve">How to raise your score</h2>
      <ol className="fac-tips">
        {IMPROVE_TIPS.map(({ title, detail }) => (
          <li key={title}>
            <h3>{title}</h3>
            <p>{detail}</p>
          </li>
        ))}
      </ol>
    </section>

    <section className="fac-section" aria-labelledby="fac-faq">
      <h2 id="fac-faq">Questions about the checker</h2>
      {ATS_CHECKER_FAQS.map(({ q, a }) => (
        <div key={q} className="fac-faq">
          <h3>{q}</h3>
          <p>{a}</p>
        </div>
      ))}
    </section>

    <section className="fac-cta">
      <h2>Scored below 70?</h2>
      <p>
        Rebuild your resume in a template designed to parse cleanly, with AI that
        works the missing keywords in honestly. Free to start — unlimited PDF and
        DOCX export on the free plan.
      </p>
      <div className="fac-cta-actions">
        <Link to="/register" className="btn btn-primary btn-lg">
          Start building — free <ArrowRight size={16} aria-hidden="true" />
        </Link>
        <Link to="/templates" className="btn btn-secondary btn-lg">
          Browse ATS-friendly templates
        </Link>
      </div>
    </section>
  </div>
);

export default FreeAtsChecker;
