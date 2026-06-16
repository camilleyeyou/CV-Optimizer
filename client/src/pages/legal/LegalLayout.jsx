import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { LEGAL } from '../../config/legal';
import './legal.css';

/**
 * Shared shell for the Privacy / Terms / Refund pages: SEO head, title,
 * last-updated line, prose content, and a contact footer.
 */
const LegalLayout = ({ title, description, slug, children }) => (
  <div className="legal-page">
    <Helmet>
      <title>{title} — {LEGAL.productName}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={`${LEGAL.siteUrl}/${slug}`} />
    </Helmet>

    <article className="legal-prose">
      <h1>{title}</h1>
      <p className="legal-updated">Last updated: {LEGAL.effectiveDate}</p>

      {children}

      <hr />
      <p>
        Questions about this policy? Contact us at{' '}
        <a href={`mailto:${LEGAL.supportEmail}`}>{LEGAL.supportEmail}</a>.
      </p>
      <p className="legal-nav">
        <Link to="/privacy">Privacy</Link> · <Link to="/terms">Terms</Link> ·{' '}
        <Link to="/refund">Refunds</Link>
      </p>
    </article>
  </div>
);

export default LegalLayout;
