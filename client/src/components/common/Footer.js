import React from 'react';
import { Link } from 'react-router-dom';
import { FaLinkedin, FaTwitter, FaFacebook, FaInstagram } from 'react-icons/fa';

const Footer = () => {
  return (
    <footer className="app-footer">
      <div className="footer-container">
        <div className="footer-top">
          <div className="footer-section">
            <h3>CV Optimizer</h3>
            <p>Create professional, ATS-friendly resumes to increase your job prospects</p>
            
            <div className="social-links">
              <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer">
                <FaLinkedin />
              </a>
              <a href="https://twitter.com" target="_blank" rel="noopener noreferrer">
                <FaTwitter />
              </a>
              <a href="https://facebook.com" target="_blank" rel="noopener noreferrer">
                <FaFacebook />
              </a>
              <a href="https://instagram.com" target="_blank" rel="noopener noreferrer">
                <FaInstagram />
              </a>
            </div>
          </div>
          
          <div className="footer-section">
            <h3>Features</h3>
            <ul>
              <li><Link to="/features/ats-optimization">ATS Optimization</Link></li>
              <li><Link to="/features/ai-suggestions">AI Suggestions</Link></li>
              <li><Link to="/features/templates">Resume Templates</Link></li>
              <li><Link to="/features/cover-letters">Cover Letters</Link></li>
            </ul>
          </div>
          
          <div className="footer-section">
            <h3>Resources</h3>
            <ul>
              <li><Link to="/resources/resume-guide">Resume Guide</Link></li>
              <li><Link to="/resources/interview-tips">Interview Tips</Link></li>
              <li><Link to="/resources/job-search">Job Search Tips</Link></li>
              <li><Link to="/blog">Career Blog</Link></li>
            </ul>
          </div>
          
          <div className="footer-section">
            <h3>Company</h3>
            <ul>
              <li><Link to="/about">About Us</Link></li>
              <li><Link to="/pricing">Pricing</Link></li>
              <li><Link to="/contact">Contact</Link></li>
              <li><Link to="/faq">FAQ</Link></li>
            </ul>
          </div>
        </div>
        
        <div className="footer-bottom">
          <div className="copyright">
            <p>&copy; {new Date().getFullYear()} CV Optimizer. All rights reserved.</p>
          </div>
          
          <div className="legal-links">
            <Link to="/terms">Terms of Service</Link>
            <Link to="/privacy">Privacy Policy</Link>
            <Link to="/cookies">Cookie Policy</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
