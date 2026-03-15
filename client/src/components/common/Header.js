import { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { FileText, Menu, X, LogOut, User, ChevronDown } from 'lucide-react';
import './Header.css';

const Header = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const { user, signOut, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const closeDropdown = useCallback(() => setDropdownOpen(false), []);

  // Close dropdown on click outside
  useEffect(() => {
    if (!dropdownOpen) return;
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        closeDropdown();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [dropdownOpen, closeDropdown]);

  // Close dropdown and mobile nav on Escape
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        if (dropdownOpen) closeDropdown();
        if (mobileOpen) setMobileOpen(false);
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [dropdownOpen, mobileOpen, closeDropdown]);

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
    setMobileOpen(false);
    closeDropdown();
  };

  const isActive = (path) => location.pathname === path;

  const displayName =
    user?.user_metadata?.first_name ||
    user?.email?.split('@')[0] ||
    'User';

  const initial = displayName.charAt(0).toUpperCase();

  const isAuthPage = ['/login', '/register'].includes(location.pathname);

  return (
    <header className="header">
      <div className="header-inner">
        <Link to="/" className="header-logo" onClick={() => setMobileOpen(false)}>
          <FileText size={24} aria-hidden="true" />
          <span>CV Optimizer</span>
        </Link>

        {!isAuthPage && isAuthenticated && (
          <>
            <nav className={`header-nav ${mobileOpen ? 'is-open' : ''}`} aria-label="Main navigation">
              <Link
                to="/"
                className={`nav-link ${isActive('/') ? 'active' : ''}`}
                onClick={() => setMobileOpen(false)}
              >
                Dashboard
              </Link>
              <Link
                to="/templates"
                className={`nav-link ${isActive('/templates') ? 'active' : ''}`}
                onClick={() => setMobileOpen(false)}
              >
                Templates
              </Link>
              <Link
                to="/builder"
                className={`nav-link ${isActive('/builder') ? 'active' : ''}`}
                onClick={() => setMobileOpen(false)}
              >
                Builder
              </Link>
              <Link
                to="/ai-creator"
                className={`nav-link ${isActive('/ai-creator') ? 'active' : ''}`}
                onClick={() => setMobileOpen(false)}
              >
                AI Creator
              </Link>
              <Link
                to="/ats-checker"
                className={`nav-link ${isActive('/ats-checker') ? 'active' : ''}`}
                onClick={() => setMobileOpen(false)}
              >
                ATS Checker
              </Link>

              {/* Mobile-only auth section */}
              <div className="nav-mobile-auth">
                <button className="nav-link" onClick={handleSignOut}>
                  <LogOut size={16} aria-hidden="true" />
                  Sign out
                </button>
              </div>
            </nav>

            <div className="header-user" ref={dropdownRef}>
              <button
                className="user-trigger"
                onClick={() => setDropdownOpen(!dropdownOpen)}
                aria-expanded={dropdownOpen}
                aria-haspopup="true"
                aria-label={`User menu for ${displayName}`}
              >
                <span className="user-avatar">{initial}</span>
                <span className="user-name">{displayName}</span>
                <ChevronDown size={14} aria-hidden="true" />
              </button>

              {dropdownOpen && (
                <div className="user-dropdown" role="menu" aria-label="User menu">
                  <div className="dropdown-header">
                    <span className="dropdown-name">{displayName}</span>
                    <span className="dropdown-email">{user?.email}</span>
                  </div>
                  <div className="dropdown-divider" />
                  <button
                    className="dropdown-item"
                    role="menuitem"
                    onClick={() => { navigate('/'); closeDropdown(); }}
                  >
                    <User size={14} aria-hidden="true" />
                    Dashboard
                  </button>
                  <button
                    className="dropdown-item dropdown-item-danger"
                    role="menuitem"
                    onClick={handleSignOut}
                  >
                    <LogOut size={14} aria-hidden="true" />
                    Sign out
                  </button>
                </div>
              )}
            </div>

            <button
              className="header-mobile-toggle"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={mobileOpen}
            >
              {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </>
        )}

        {!isAuthPage && !isAuthenticated && (
          <div className="header-auth">
            <Link to="/login" className="btn btn-ghost">Log in</Link>
            <Link to="/register" className="btn btn-primary">Sign up</Link>
          </div>
        )}
      </div>

      {mobileOpen && (
        <div
          className="header-overlay"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}
    </header>
  );
};

export default Header;
