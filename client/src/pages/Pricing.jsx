import { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Check, Minus, ArrowRight, GraduationCap, ShieldCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import Seo from '../components/common/Seo';
import { startCheckout, getBillingPlans } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { SITE_URL } from '../config/site';
import {
  INTERVALS, DEFAULT_INTERVAL, FREE_PLAN, PRO_PLAN, COMPARISON, FAQ,
} from '../config/pricing';
import './Pricing.css';

const Cell = ({ value }) => {
  if (value === true) {
    return (
      <span className="pr-cell pr-cell-yes">
        <Check size={16} aria-hidden="true" />
        <span className="sr-only">Included</span>
      </span>
    );
  }
  if (value === false || value == null) {
    return (
      <span className="pr-cell pr-cell-no">
        <Minus size={16} aria-hidden="true" />
        <span className="sr-only">Not included</span>
      </span>
    );
  }
  return <span className="pr-cell pr-cell-text">{value}</span>;
};

const Pricing = () => {
  const [interval, setInterval] = useState(DEFAULT_INTERVAL);
  const [available, setAvailable] = useState(null);
  const [pending, setPending] = useState(false);
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  /* Only offer periods that have a Stripe price configured. Until the check
     resolves we show the full set optimistically — a period that turns out to
     be unconfigured is filtered out rather than failing at checkout. */
  useEffect(() => {
    let cancelled = false;
    getBillingPlans()
      .then(({ plans }) => {
        if (cancelled) return;
        const pro = plans?.find((p) => p.id === 'pro');
        if (pro?.intervals?.length) setAvailable(pro.intervals);
      })
      .catch(() => { /* leave the default set in place */ });
    return () => { cancelled = true; };
  }, []);

  const intervals = useMemo(
    () => (available ? INTERVALS.filter((i) => available.includes(i.id)) : INTERVALS),
    [available]
  );

  // If the selected period turns out not to be configured, fall back to the
  // first one that is, so the CTA never points at a price that cannot exist.
  useEffect(() => {
    if (intervals.length && !intervals.some((i) => i.id === interval)) {
      setInterval(intervals[0].id);
    }
  }, [intervals, interval]);

  const active = intervals.find((i) => i.id === interval) ?? INTERVALS[0];

  const handleUpgrade = async () => {
    if (!isAuthenticated) {
      navigate(`/register?plan=pro&interval=${interval}`);
      return;
    }
    setPending(true);
    try {
      const { url } = await startCheckout('pro', interval);
      if (url) window.location.href = url;
      else throw new Error('No checkout URL');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Could not start checkout. Please try again.');
      setPending(false);
    }
  };

  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: FAQ.map(({ q, a }) => ({
      '@type': 'Question',
      name: q,
      acceptedAnswer: { '@type': 'Answer', text: a },
    })),
  };

  const productJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: 'CV Optimizer Pro',
    description: PRO_PLAN.tagline,
    brand: { '@type': 'Brand', name: 'CV Optimizer' },
    offers: INTERVALS.map((i) => ({
      '@type': 'Offer',
      price: i.price.replace('$', ''),
      priceCurrency: 'USD',
      url: `${SITE_URL}/pricing`,
      availability: 'https://schema.org/InStock',
    })),
  };

  return (
    <div className="pr">
      <Seo
        title="Pricing — CV Optimizer"
        description="Start free with 5 AI credits a month, 8 templates and unlimited PDF and DOCX export. Pro unlocks unlimited AI, all 21 templates and resume translation."
        path="/pricing"
        jsonLd={[productJsonLd, faqJsonLd]}
      />

      <header className="pr-head">
        <span className="eyebrow">Pricing</span>
        <h1 className="display-2">One plan, priced for a job search</h1>
        <p className="lead">
          Everything you need to build and export a resume is free. Pro is for when you
          are applying often enough that tailoring each one matters.
        </p>

        {intervals.length > 1 && (
          <div className="segmented pr-toggle" role="tablist" aria-label="Billing period">
            {intervals.map((i) => (
              <button
                key={i.id}
                type="button"
                role="tab"
                className="segmented-item"
                aria-selected={interval === i.id}
                onClick={() => setInterval(i.id)}
              >
                {i.label}
                {i.badge && <span className="pr-toggle-badge">{i.badge}</span>}
              </button>
            ))}
          </div>
        )}
      </header>

      {/* ---------------- Plan cards ---------------- */}
      <section className="pr-plans" aria-label="Plans">
        <div className="card pr-plan">
          <h2 className="pr-plan-name">{FREE_PLAN.name}</h2>
          <p className="pr-plan-price">
            <span className="pr-plan-amount">{FREE_PLAN.price}</span>
          </p>
          <p className="pr-plan-note">Free forever, no card required</p>
          <p className="pr-plan-tagline">{FREE_PLAN.tagline}</p>

          <ul className="pr-plan-features">
            {FREE_PLAN.features.map((f) => (
              <li key={f}><Check size={15} aria-hidden="true" /> {f}</li>
            ))}
          </ul>

          <Link to={FREE_PLAN.ctaLink} className="btn btn-secondary btn-lg btn-block">
            {FREE_PLAN.cta}
          </Link>
        </div>

        <div className="card card-featured pr-plan">
          <span className="pr-plan-flag">Most popular</span>
          <h2 className="pr-plan-name">{PRO_PLAN.name}</h2>
          <p className="pr-plan-price">
            <span className="pr-plan-amount">{active.price}</span>
            <span className="pr-plan-unit">{active.unit}</span>
          </p>
          <p className="pr-plan-note">{active.note}</p>
          <p className="pr-plan-tagline">{PRO_PLAN.tagline}</p>

          <ul className="pr-plan-features">
            {PRO_PLAN.features.map((f) => (
              <li key={f}><Check size={15} aria-hidden="true" /> {f}</li>
            ))}
          </ul>

          <button
            type="button"
            className="btn btn-primary btn-lg btn-block"
            onClick={handleUpgrade}
            data-loading={pending || undefined}
            disabled={pending}
          >
            {PRO_PLAN.cta} <ArrowRight size={15} aria-hidden="true" />
          </button>
          <p className="pr-plan-fineprint">
            <ShieldCheck size={13} aria-hidden="true" /> Cancel any time from your account.
          </p>
        </div>
      </section>

      {/* ---------------- Student ---------------- */}
      <section className="pr-student">
        <span className="pr-student-icon">
          <GraduationCap size={20} aria-hidden="true" />
        </span>
        <div>
          <h2 className="pr-student-title">Students get Pro free for six months</h2>
          <p className="pr-student-desc">
            Verify a .edu address from your account and Pro unlocks straight away. No card.
          </p>
        </div>
        <Link to="/register" className="btn btn-secondary">Get started</Link>
      </section>

      {/* ---------------- Comparison ---------------- */}
      <section className="pr-compare" aria-labelledby="compare-heading">
        <h2 id="compare-heading" className="display-3">Compare plans</h2>

        <div className="scroll-x pr-table-wrap">
          <table className="pr-table">
            <caption className="sr-only">
              Feature comparison between the Free and Pro plans
            </caption>
            <thead>
              <tr>
                <th scope="col">Feature</th>
                <th scope="col">Free</th>
                <th scope="col">Pro</th>
              </tr>
            </thead>
            {COMPARISON.map(({ group, rows }) => (
              <tbody key={group}>
                <tr className="pr-group">
                  <th scope="colgroup" colSpan={3}>{group}</th>
                </tr>
                {rows.map(({ label, free, pro, hint }) => (
                  <tr key={label}>
                    <th scope="row">
                      {label}
                      {hint && <span className="pr-hint">{hint}</span>}
                    </th>
                    <td><Cell value={free} /></td>
                    <td><Cell value={pro} /></td>
                  </tr>
                ))}
              </tbody>
            ))}
          </table>
        </div>
      </section>

      {/* ---------------- FAQ ---------------- */}
      <section className="pr-faq" aria-labelledby="faq-heading">
        <h2 id="faq-heading" className="display-3">Questions</h2>
        <div className="pr-faq-list">
          {FAQ.map(({ q, a }) => (
            <details key={q} className="pr-faq-item">
              <summary>{q}</summary>
              <p>{a}</p>
            </details>
          ))}
        </div>
      </section>

      <section className="pr-cta">
        <h2 className="display-3">Start free, upgrade when it pays for itself</h2>
        <div className="pr-cta-actions">
          <Link to="/register" className="btn btn-primary btn-xl">
            Create a free account <ArrowRight size={17} aria-hidden="true" />
          </Link>
          <Link to="/templates" className="btn btn-secondary btn-xl">Browse templates</Link>
        </div>
      </section>
    </div>
  );
};

export default Pricing;
