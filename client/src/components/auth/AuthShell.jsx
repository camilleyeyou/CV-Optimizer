import { Link } from 'react-router-dom';
import Logo from '../common/Logo';
import './AuthShell.css';

/**
 * The frame every auth screen sits in.
 *
 * Deliberately narrow and centred rather than a split hero. This is the moment
 * a stranger types a password, so the page shows only what is needed to finish
 * the task — brand, heading, form, one way out. Anything else here reads as a
 * distraction at best and a phishing tell at worst.
 *
 * Owns no logic. Each page keeps its own state and submit handler.
 */
const AuthShell = ({ title, subtitle, children, footer, note }) => (
  <div className="au">
    <div className="au-inner">
      <Link to="/" className="au-brand">
        <Logo size={26} />
        <span>CV Optimizer</span>
      </Link>

      <div className="au-card">
        <header className="au-head">
          <h1 className="au-title">{title}</h1>
          {subtitle && <p className="au-sub">{subtitle}</p>}
        </header>
        {children}
      </div>

      {footer && <p className="au-alt">{footer}</p>}
      {note && <p className="au-note">{note}</p>}
    </div>
  </div>
);

export default AuthShell;
