import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { FaUser, FaBars, FaTimes, FaFileAlt, FaClipboard } from 'react-icons/fa';

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  
  // Mock authentication state (replace with actual auth check)
  const isAuthenticated = localStorage.getItem('token') !== null;
  
  const handleLogout = () => {
    // Clear auth token and user data
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    
    // Navigate to home page
    navigate('/');
    
    // Close menus
    setIsMenuOpen(false);
    setIsUserMenuOpen(false);
  };
  
  // Check if a link is active
  const isActive = (path) => {
    return location.pathname === path;
  };
  
  return (
    <header className="app-header">
      <div className="header-container">
        <div className="logo">
          <Link to="/">
            <h1>CV Optimizer</h1>
          </Link>
        </div>
        
        <div className="mobile-menu-toggle" onClick={() => setIsMenuOpen(!isMenuOpen)}>
          {isMenuOpen ? <FaTimes /> : <FaBars />}
        </div>
        
        <nav className={`main-nav ${isMenuOpen ? 'menu-open' : ''}`}>
          <ul>
            <li>
              <Link 
                to="/" 
                className={isActive('/') ? 'active' : ''} 
                onClick={() => setIsMenuOpen(false)}
              >
                Home
              </Link>
            </li>
            <li>
              <Link 
                to="/templates" 
                className={isActive('/templates') ? 'active' : ''} 
                onClick={() => setIsMenuOpen(false)}
              >
                Templates
              </Link>
            </li>
            <li>
              <Link 
                to="/builder" 
                className={isActive('/builder') ? 'active' : ''} 
                onClick={() => setIsMenuOpen(false)}
              >
                <FaFileAlt /> Resume Builder
              </Link>
            </li>
            {isAuthenticated && (
              <li>
                <Link 
                  to="/cover-letter" 
                  className={isActive('/cover-letter') ? 'active' : ''} 
                  onClick={() => setIsMenuOpen(false)}
                >
                  <FaClipboard /> Cover Letter
                </Link>
              </li>
            )}
            <li>
              <Link 
                to="/pricing" 
                className={isActive('/pricing') ? 'active' : ''} 
                onClick={() => setIsMenuOpen(false)}
              >
                Pricing
              </Link>
            </li>
          </ul>
        </nav>
        
        <div className="user-menu">
          {isAuthenticated ? (
            <div className="user-dropdown">
              <button 
                className="user-button" 
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              >
                <FaUser />
              </button>
              
              {isUserMenuOpen && (
                <div className="dropdown-menu">
                  <Link to="/dashboard" onClick={() => setIsUserMenuOpen(false)}>
                    My Resumes
                  </Link>
                  <Link to="/profile" onClick={() => setIsUserMenuOpen(false)}>
                    Profile
                  </Link>
                  <Link to="/settings" onClick={() => setIsUserMenuOpen(false)}>
                    Settings
                  </Link>
                  <button 
                    className="logout-button" 
                    onClick={handleLogout}
                  >
                    Log Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="auth-buttons">
              <Link to="/login" className="btn btn-text">
                Log In
              </Link>
              <Link to="/register" className="btn btn-primary">
                Sign Up
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
