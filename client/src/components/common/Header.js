import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './Header.css';

const Header = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  // Add a null check here to handle the case when AuthContext isn't available
  const auth = useAuth();
  const currentUser = auth ? auth.currentUser : null;
  const logout = auth ? auth.logout : () => {};
  
  const navigate = useNavigate();
  
  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };
  
  const handleLogout = () => {
    logout();
    navigate('/login');
    setMobileMenuOpen(false);
  };
  
  return (
    <header className="header">
      <div className="header-container">
        <div className="logo">
          <Link to="/">CV Optimizer</Link>
        </div>
        
        <button 
          className="mobile-menu-button" 
          onClick={toggleMobileMenu}
          aria-label="Toggle menu"
        >
          <span className={`hamburger ${mobileMenuOpen ? 'open' : ''}`}></span>
        </button>
        
        <nav className={`nav-menu ${mobileMenuOpen ? 'open' : ''}`}>
          <ul className="nav-links">
            <li>
              <Link to="/" onClick={() => setMobileMenuOpen(false)}>Dashboard</Link>
            </li>
            <li>
              <Link to="/templates" onClick={() => setMobileMenuOpen(false)}>Templates</Link>
            </li>
            {currentUser && (
              <>
                <li>
                  <Link to="/builder" onClick={() => setMobileMenuOpen(false)}>Resume Builder</Link>
                </li>
                <li>
                  <Link to="/cover-letter" onClick={() => setMobileMenuOpen(false)}>Cover Letter</Link>
                </li>
              </>
            )}
          </ul>
          
          <div className="auth-buttons">
            {currentUser ? (
              <>
                <div className="user-menu">
                  <button className="user-button">
                    <span className="user-initial">
                      {currentUser.firstName ? currentUser.firstName.charAt(0) : 'U'}
                    </span>
                    <span className="user-name">{currentUser.firstName}</span>
                  </button>
                  <div className="user-dropdown">
                    <Link to="/profile" onClick={() => setMobileMenuOpen(false)}>Profile</Link>
                    <button onClick={handleLogout}>Logout</button>
                  </div>
                </div>
              </>
            ) : (
              <>
                <Link to="/login" className="login-button" onClick={() => setMobileMenuOpen(false)}>
                  Log In
                </Link>
                <Link to="/register" className="signup-button" onClick={() => setMobileMenuOpen(false)}>
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </nav>
      </div>
    </header>
  );
};

export default Header;
