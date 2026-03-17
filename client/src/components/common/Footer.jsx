import { Link } from 'react-router-dom';
import { FileText } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import './Footer.css';

const Footer = () => {
  const { isAuthenticated } = useAuth();

  return (
    <footer className="footer">
      <div className="footer-inner">
        <div className="footer-brand">
          <Link to={isAuthenticated ? '/dashboard' : '/'} className="footer-logo">
            <FileText size={18} />
            <span>CV Optimizer</span>
          </Link>
          <p className="footer-tagline">
            Build professional, ATS-optimized resumes with AI assistance.
          </p>
        </div>

        <div className="footer-links">
          {isAuthenticated ? (
            <>
              <Link to="/dashboard">Dashboard</Link>
              <Link to="/templates">Templates</Link>
              <Link to="/builder">Builder</Link>
              <Link to="/ai-creator">AI Creator</Link>
              <Link to="/ats-checker">ATS Checker</Link>
            </>
          ) : (
            <>
              <Link to="/register">Get Started</Link>
              <Link to="/login">Sign In</Link>
              <a href="/#ats-checker">ATS Checker</a>
            </>
          )}
        </div>

        <div className="footer-bottom">
          <span>&copy; {new Date().getFullYear()} CV Optimizer</span>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
