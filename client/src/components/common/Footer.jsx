import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Logo from './Logo';
import { LEGAL } from '../../config/legal';
import './Footer.css';

/* Two sitemaps, not one filtered list.
 *
 * Nearly every tool route is behind auth, so filtering a single list left a
 * signed-out visitor with columns of one link each — which reads as broken.
 * Signed out gets a marketing sitemap pointing at pages that actually resolve;
 * signed in gets the app's own map. */

const LEGAL_COLUMN = {
  heading: 'Legal',
  links: [
    { to: '/privacy', label: 'Privacy' },
    { to: '/terms', label: 'Terms' },
    { to: '/refund', label: 'Refunds' },
  ],
};

const PUBLIC_COLUMNS = [
  {
    heading: 'Product',
    links: [
      { href: '/#features', label: 'Features' },
      { to: '/templates', label: 'Templates' },
      { to: '/pricing', label: 'Pricing' },
      { to: '/free-ats-resume-checker', label: 'Free ATS checker' },
    ],
  },
  {
    heading: 'Get started',
    links: [
      { to: '/register', label: 'Create an account' },
      { to: '/login', label: 'Sign in' },
    ],
  },
  LEGAL_COLUMN,
];

const APP_COLUMNS = [
  {
    heading: 'Build',
    links: [
      { to: '/builder', label: 'Resume builder' },
      { to: '/ai-creator', label: 'AI resume creator' },
      { to: '/templates', label: 'Templates' },
      { to: '/cover-letter', label: 'Cover letters' },
    ],
  },
  {
    heading: 'Optimize',
    links: [
      { to: '/ats-checker', label: 'ATS checker' },
      { to: '/analytics', label: 'Score history' },
      { to: '/interview-prep', label: 'Interview prep' },
      { to: '/emails', label: 'Follow-up emails' },
    ],
  },
  {
    heading: 'Track',
    links: [
      { to: '/tracker', label: 'Job tracker' },
      { to: '/dashboard', label: 'Dashboard' },
      { to: '/account', label: 'Account and data' },
    ],
  },
  LEGAL_COLUMN,
];

const Footer = () => {
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  // The Builder is a full-height editor workspace; a marketing footer below it
  // just creates a dead zone.
  if (location.pathname.startsWith('/builder')) return null;

  const columns = isAuthenticated ? APP_COLUMNS : PUBLIC_COLUMNS;

  return (
    <footer className="ft">
      <div className="ft-inner">
        <div className="ft-top">
          <div className="ft-brand">
            <Link to={isAuthenticated ? '/dashboard' : '/'} className="ft-logo">
              <Logo size={20} />
              <span>CV Optimizer</span>
            </Link>
            <p className="ft-tagline">
              Build a resume that clears applicant tracking systems, then tailor it to
              every role you apply for.
            </p>
            {!isAuthenticated && (
              <Link to="/register" className="btn btn-secondary btn-sm">
                Create a free account
              </Link>
            )}
          </div>

          <nav className="ft-columns" aria-label="Footer">
            {columns.map(({ heading, links }) => (
              <div key={heading} className="ft-column">
                <h2 className="ft-heading">{heading}</h2>
                <ul>
                  {links.map(({ to, href, label }) => (
                    <li key={label}>
                      {to ? <Link to={to}>{label}</Link> : <a href={href}>{label}</a>}
                    </li>
                  ))}
                </ul>
              </div>
            ))}

            <div className="ft-column">
              <h2 className="ft-heading">Support</h2>
              <ul>
                <li><a href={`mailto:${LEGAL.supportEmail}`}>Contact us</a></li>
                {isAuthenticated && <li><Link to="/pricing">Plans</Link></li>}
              </ul>
            </div>
          </nav>
        </div>

        <div className="ft-bottom">
          <span>&copy; {new Date().getFullYear()} CV Optimizer</span>
          <span className="ft-bottom-note">
            Scores estimate how applicant tracking systems commonly parse a resume.
            They are not affiliated with any specific ATS vendor.
          </span>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
