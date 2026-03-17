import { Link } from 'react-router-dom';
import { FileText } from 'lucide-react';
import './Footer.css';

const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer-inner">
        <div className="footer-brand">
          <Link to="/" className="footer-logo">
            <FileText size={18} />
            <span>CV Optimizer</span>
          </Link>
          <p className="footer-tagline">
            Build professional, ATS-optimized resumes with AI assistance.
          </p>
        </div>

        <div className="footer-links">
          <Link to="/">Dashboard</Link>
          <Link to="/templates">Templates</Link>
          <Link to="/builder">Builder</Link>
          <Link to="/ai-creator">AI Creator</Link>
          <Link to="/ats-checker">ATS Checker</Link>
        </div>

        <div className="footer-bottom">
          <span>&copy; {new Date().getFullYear()} CV Optimizer</span>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
