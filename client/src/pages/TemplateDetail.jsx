import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useResume } from '../context/ResumeContext';
import { TEMPLATES, getTemplate } from '../config/templates';
import { templateContent, templateFacts, isTemplateSlug } from '../config/templateContent';
import { SITE_URL } from '../config/site';
import Seo from '../components/common/Seo';
import NotFound from './NotFound';
import { ArrowRight, Check, ChevronLeft, Crown, FileText } from 'lucide-react';
import toast from 'react-hot-toast';
import './TemplateDetail.css';

/**
 * One indexable page per template.
 *
 * Carries SoftwareApplication and FAQPage structured data. Deliberately no
 * aggregateRating or review fields: we have no ratings to report, and inventing
 * them is both dishonest and a manual action from Google.
 */
const TemplateDetail = () => {
  const { slug } = useParams();
  const { isAuthenticated } = useAuth();
  const { createResume } = useResume();
  const navigate = useNavigate();
  const [creating, setCreating] = useState(false);

  // Unknown slug is a genuine 404, not a soft redirect to the gallery: render
  // the not-found page (which carries noindex) and keep the URL as requested.
  if (!isTemplateSlug(slug)) return <NotFound />;

  const tpl = getTemplate(slug);
  const { tagline, intro, bestFor, faqs } = templateContent(slug);
  const facts = templateFacts(slug);

  const title = `${tpl.name} Résumé Template — Free ATS-Friendly Download | CV Optimizer`;
  const path = `/templates/${slug}`;
  const url = `${SITE_URL}${path}`;
  const image = `${SITE_URL}/template-previews/${slug}-og.png`;

  const handleUse = async () => {
    if (creating) return;
    if (!isAuthenticated) {
      navigate(`/register?template=${encodeURIComponent(slug)}`);
      return;
    }
    setCreating(true);
    try {
      const resume = await createResume(slug);
      if (resume?.id) navigate(`/builder/${resume.id}`);
      else setCreating(false);
    } catch {
      toast.error('Failed to create resume. Please try again.');
      setCreating(false);
    }
  };

  const softwareApplication = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: `${tpl.name} Résumé Template`,
    description: tagline,
    url,
    applicationCategory: 'BusinessApplication',
    applicationSubCategory: 'Résumé Builder',
    operatingSystem: 'Web browser',
    image,
    inLanguage: 'en',
    isAccessibleForFree: !tpl.premium,
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
      description: tpl.premium
        ? 'Free to preview and edit; exporting with this template requires CV Optimizer Pro.'
        : 'Free to use, edit and export.',
    },
    featureList: facts.map(([k, v]) => `${k}: ${v}`),
    publisher: { '@type': 'Organization', name: 'CV Optimizer', url: SITE_URL },
  };

  const faqPage = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map(({ q, a }) => ({
      '@type': 'Question',
      name: q,
      acceptedAnswer: { '@type': 'Answer', text: a },
    })),
  };

  const breadcrumbs = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE_URL}/` },
      { '@type': 'ListItem', position: 2, name: 'Résumé templates', item: `${SITE_URL}/templates` },
      { '@type': 'ListItem', position: 3, name: `${tpl.name} template`, item: url },
    ],
  };

  const related = TEMPLATES.filter((t) => t.id !== slug && t.archetype === tpl.archetype).slice(0, 3);
  const alsoSee = related.length ? related : TEMPLATES.filter((t) => t.id !== slug).slice(0, 3);

  return (
    <div className="tpl-detail">
      <Seo
        title={title}
        description={tagline}
        path={path}
        image={image}
        jsonLd={[softwareApplication, faqPage, breadcrumbs]}
      />

      <div className="tpl-detail-container">
        <nav className="tpl-breadcrumb" aria-label="Breadcrumb">
          <Link to="/templates"><ChevronLeft size={14} /> All templates</Link>
        </nav>

        <div className="tpl-detail-hero">
          <div className="tpl-detail-copy">
            <h1>
              {tpl.name} résumé template
              {tpl.premium && <span className="tpl-detail-tier"><Crown size={13} /> Pro</span>}
            </h1>
            <p className="tpl-detail-tagline">{tagline}</p>

            {intro.map((para) => <p key={para.slice(0, 24)} className="tpl-detail-para">{para}</p>)}

            {bestFor.length > 0 && (
              <>
                <h2 className="tpl-detail-h2">Best for</h2>
                <ul className="tpl-detail-list">
                  {bestFor.map((item) => (
                    <li key={item}><Check size={15} aria-hidden="true" /> {item}</li>
                  ))}
                </ul>
              </>
            )}

            <div className="tpl-detail-actions">
              <button type="button" className="btn btn-primary btn-lg" onClick={handleUse} disabled={creating}>
                {creating ? <span className="spinner" /> : <>Use this template <ArrowRight size={16} /></>}
              </button>
              <Link to="/templates" className="btn btn-secondary btn-lg">Browse all {TEMPLATES.length}</Link>
            </div>
          </div>

          <div className="tpl-detail-preview">
            <img
              src={`/template-previews/${slug}.png`}
              alt={`${tpl.name} résumé template, shown with sample content`}
              width="1191"
              height="1685"
              // Above the fold and the largest element on the page, so it is the
              // LCP candidate: loaded eagerly and given high priority.
              loading="eager"
              fetchPriority="high"
              decoding="async"
            />
            <p className="tpl-detail-preview-note">
              <FileText size={13} aria-hidden="true" /> Shown with sample content
            </p>
          </div>
        </div>

        <section className="tpl-detail-section">
          <h2 className="tpl-detail-h2">Template details</h2>
          <dl className="tpl-detail-specs">
            {facts.map(([k, v]) => (
              <div key={k}>
                <dt>{k}</dt>
                <dd>{v}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section className="tpl-detail-section">
          <h2 className="tpl-detail-h2">Questions about the {tpl.name} template</h2>
          <div className="tpl-detail-faqs">
            {faqs.map(({ q, a }) => (
              <details key={q} className="tpl-detail-faq">
                <summary>{q}</summary>
                <p>{a}</p>
              </details>
            ))}
          </div>
        </section>

        <section className="tpl-detail-section">
          <h2 className="tpl-detail-h2">Similar templates</h2>
          <ul className="tpl-detail-related">
            {alsoSee.map((t) => (
              <li key={t.id}>
                <Link to={`/templates/${t.id}`}>
                  <img
                    src={`/template-previews/${t.id}.png`}
                    alt={`${t.name} résumé template preview`}
                    width="1191"
                    height="1685"
                    loading="lazy"
                    decoding="async"
                  />
                  <span>{t.name}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <section className="tpl-detail-cta">
          <h2>Start with the {tpl.name} template</h2>
          <p>
            Fill it in with AI help, check your ATS score, and export to PDF or DOCX.
            Free to start — no credit card required.
          </p>
          <button type="button" className="btn btn-primary btn-lg" onClick={handleUse} disabled={creating}>
            {creating ? <span className="spinner" /> : <>Use this template <ArrowRight size={16} /></>}
          </button>
        </section>
      </div>
    </div>
  );
};

export default TemplateDetail;
