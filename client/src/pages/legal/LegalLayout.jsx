import { Link } from 'react-router-dom';
import { LEGAL } from '../../config/legal';
import Seo from '../../components/common/Seo';
import './legal.css';

/**
 * Shared shell for the Privacy / Terms / Refund pages: SEO head, title,
 * last-updated line, prose content, and a contact footer.
 */
const LegalLayout = ({ title, description, slug, children }) => (
  <div className="legal-page">
    {/* Interpolated as one string: Helmet reads only the first child of
        <title>, so `{title} — {name}` used to render an empty title. */}
    <Seo
      title={`${title} — ${LEGAL.productName}`}
      description={description}
      path={`/${slug}`}
    />

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
