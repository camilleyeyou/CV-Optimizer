import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useResume } from '../context/ResumeContext';
import { getCredits } from '../services/api';
import { TEMPLATES } from '../config/templates';
import { templateContent } from '../config/templateContent';
import { SITE_URL } from '../config/site';
import Seo from '../components/common/Seo';
import { ArrowRight, Lock, Crown } from 'lucide-react';
import toast from 'react-hot-toast';
import './TemplatesPage.css';

const TITLE = 'Free Résumé Templates — ATS-Friendly, 21 Designs | CV Optimizer';
const DESCRIPTION = 'Browse 21 professional résumé templates, each ATS-friendly and free to '
  + 'preview. Pick a design, fill it in with AI help, and export to PDF or DOCX.';

/**
 * Public template gallery.
 *
 * Indexable and reachable without an account: it is the top of the funnel, and
 * every card links to its own /templates/<id> page so crawlers have a path to
 * all 21. Signed-in visitors start building straight from a card; everyone else
 * is sent to signup with the template preselected.
 */
const Templates = () => {
  const [creatingId, setCreatingId] = useState(null);
  const [plan, setPlan] = useState('free');
  const { isAuthenticated } = useAuth();
  const { createResume } = useResume();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated) return;
    getCredits().then((data) => setPlan(data?.plan || 'free')).catch(() => {});
  }, [isAuthenticated]);

  const isPremiumUser = plan === 'pro' || plan === 'premium';
  // Mirrors the server's TEMPLATE_PAYWALL_ENABLED; off until billing is live.
  const paywallEnabled = import.meta.env.VITE_TEMPLATE_PAYWALL_ENABLED === 'true';

  const handleUse = async (template) => {
    if (creatingId) return;
    // Signed out: carry the choice through signup rather than dropping it.
    if (!isAuthenticated) {
      navigate(`/register?template=${encodeURIComponent(template.id)}`);
      return;
    }
    if (paywallEnabled && template.premium && !isPremiumUser) {
      navigate(`/templates/${template.id}`);
      return;
    }
    setCreatingId(template.id);
    try {
      const resume = await createResume(template.id);
      if (resume?.id) navigate(`/builder/${resume.id}`);
      else setCreatingId(null);
    } catch {
      toast.error('Failed to create resume. Please try again.');
      setCreatingId(null);
    }
  };

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'Résumé Templates',
    description: DESCRIPTION,
    url: `${SITE_URL}/templates`,
    isPartOf: { '@type': 'WebSite', name: 'CV Optimizer', url: SITE_URL },
    mainEntity: {
      '@type': 'ItemList',
      numberOfItems: TEMPLATES.length,
      itemListElement: TEMPLATES.map((t, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        name: `${t.name} résumé template`,
        url: `${SITE_URL}/templates/${t.id}`,
      })),
    },
  };

  return (
    <div className="templates-page">
      <Seo title={TITLE} description={DESCRIPTION} path="/templates" jsonLd={jsonLd} />

      <div className="templates-container">
        <div className="templates-header">
          <h1>Résumé templates</h1>
          <p>
            {TEMPLATES.length} professional designs, all ATS-friendly and free to preview.
            Every template exports to PDF and DOCX, and you can switch between them at any
            time without losing a word.
          </p>
        </div>

        <div className="templates-grid animate-stagger">
          {TEMPLATES.map((template) => {
            const locked = paywallEnabled && template.premium && !isPremiumUser;
            const isCreating = creatingId === template.id;
            const { tagline } = templateContent(template.id);
            return (
              <article key={template.id} className={`template-card ${locked ? 'is-locked' : ''}`}>
                {/* Whole card links to the template's own page: that is the
                    crawlable path to all 21, and the page users land on from
                    search. The button below is the direct action. */}
                <Link
                  to={`/templates/${template.id}`}
                  className="template-preview"
                  style={{ borderTopColor: template.accent }}
                  aria-label={`${template.name} résumé template — see details`}
                >
                  <img
                    src={`/template-previews/${template.id}.png`}
                    alt={`${template.name} résumé template preview`}
                    className="template-preview-img"
                    width="1191"
                    height="1685"
                    loading="lazy"
                    decoding="async"
                  />
                  {locked && (
                    <span className="template-lock-overlay"><Lock size={20} /><span>Pro</span></span>
                  )}
                </Link>

                <div className="template-info">
                  <h2>
                    <Link to={`/templates/${template.id}`}>{template.name}</Link>
                    {template.premium && <Crown size={12} className="template-crown" />}
                  </h2>
                  <p>{tagline}</p>
                  <button
                    type="button"
                    className="btn btn-primary btn-sm template-use-btn"
                    onClick={() => handleUse(template)}
                    disabled={!!creatingId}
                  >
                    {isCreating
                      ? <span className="spinner" />
                      : <>Use this template <ArrowRight size={14} /></>}
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Templates;
