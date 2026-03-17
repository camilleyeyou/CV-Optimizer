import { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getCredits } from '../../services/api';
import { FileText, Menu, X, LogOut, User, ChevronDown, LayoutDashboard, FileSearch, Sparkles, PenTool, Layout, Mail, Zap, Briefcase, MessageSquare, BarChart3 } from 'lucide-react';
import './Header.css';

const Header = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const { user, signOut, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [credits, setCredits] = useState(null);

  const closeDropdown = useCallback(() => setDropdownOpen(false), []);
  const closeMobile = useCallback(() => setMobileOpen(false), []);

  // Fetch credits
  useEffect(() => {
    if (!isAuthenticated) return;
    getCredits().then(setCredits).catch(() => {});
  }, [isAuthenticated, location.pathname]);

  // Close mobile nav on route change
  useEffect(() => {
    closeMobile();
    closeDropdown();
  }, [location.pathname, closeMobile, closeDropdown]);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

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

  // Escape key handler
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        if (dropdownOpen) closeDropdown();
        if (mobileOpen) closeMobile();
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [dropdownOpen, mobileOpen, closeDropdown, closeMobile]);

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
    closeMobile();
    closeDropdown();
  };

  const isActive = (path) => location.pathname === path;

  const displayName =
    user?.user_metadata?.first_name ||
    user?.email?.split('@')[0] ||
    'User';

  const initial = displayName.charAt(0).toUpperCase();
  const isAuthPage = ['/login', '/register'].includes(location.pathname);
  const showNav = !isAuthPage && isAuthenticated;

  const navLinks = [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/templates', label: 'Templates', icon: Layout },
    { to: '/builder', label: 'Builder', icon: PenTool },
    { to: '/ai-creator', label: 'AI Creator', icon: Sparkles },
    { to: '/ats-checker', label: 'ATS Checker', icon: FileSearch },
    { to: '/cover-letter', label: 'Cover Letter', icon: Mail },
    { to: '/emails', label: 'Emails', icon: Mail },
    { to: '/tracker', label: 'Tracker', icon: Briefcase },
    { to: '/interview-prep', label: 'Interview', icon: MessageSquare },
  ];

  return (
    <>
      <header className="header">
        <div className="header-inner">
          <Link to={isAuthenticated ? '/dashboard' : '/'} className="header-logo">
            <FileText size={24} aria-hidden="true" />
            <span>CV Optimizer</span>
          </Link>

          {showNav && (
            <>
              {/* Desktop nav */}
              <nav className="header-nav-desktop" aria-label="Main navigation" data-tour="dashboard-nav">
                {navLinks.map(({ to, label }) => (
                  <Link key={to} to={to} className={`nav-link ${isActive(to) ? 'active' : ''}`}>
                    {label}
                  </Link>
                ))}
              </nav>

              {/* Desktop user dropdown */}
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
                    {credits && (
                      <div className="dropdown-credits">
                        <Zap size={12} />
                        <span>
                          {credits.credits === -1
                            ? `${credits.plan.charAt(0).toUpperCase() + credits.plan.slice(1)} — Unlimited`
                            : `${credits.credits}/${credits.max_credits} AI credits`}
                        </span>
                      </div>
                    )}
                    <div className="dropdown-divider" />
                    <button className="dropdown-item" role="menuitem" onClick={() => { navigate('/dashboard'); closeDropdown(); }}>
                      <User size={14} aria-hidden="true" /> Dashboard
                    </button>
                    <button className="dropdown-item" role="menuitem" onClick={() => { navigate('/analytics'); closeDropdown(); }}>
                      <BarChart3 size={14} aria-hidden="true" /> Analytics
                    </button>
                    <button className="dropdown-item dropdown-item-danger" role="menuitem" onClick={handleSignOut}>
                      <LogOut size={14} aria-hidden="true" /> Sign out
                    </button>
                  </div>
                )}
              </div>

              {/* Mobile burger */}
              <button
                className="header-mobile-toggle"
                onClick={() => setMobileOpen(!mobileOpen)}
                aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
                aria-expanded={mobileOpen}
              >
                {mobileOpen ? <X size={22} /> : <Menu size={22} />}
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
      </header>

      {/* Mobile drawer — rendered OUTSIDE header to avoid backdrop-filter containing block */}
      {showNav && (
        <>
          <div className={`mobile-drawer ${mobileOpen ? 'is-open' : ''}`} aria-label="Mobile navigation">
            <nav className="mobile-drawer-nav">
              {navLinks.map(({ to, label, icon: Icon }) => (
                <Link key={to} to={to} className={`mobile-nav-link ${isActive(to) ? 'active' : ''}`}>
                  <Icon size={18} aria-hidden="true" />
                  {label}
                </Link>
              ))}
            </nav>

            <div className="mobile-drawer-footer">
              <div className="mobile-user-info">
                <span className="user-avatar">{initial}</span>
                <div>
                  <span className="mobile-user-name">{displayName}</span>
                  <span className="mobile-user-email">{user?.email}</span>
                </div>
              </div>
              <button className="mobile-nav-link mobile-signout" onClick={handleSignOut}>
                <LogOut size={18} aria-hidden="true" />
                Sign out
              </button>
            </div>
          </div>

          {mobileOpen && (
            <div className="mobile-overlay" onClick={closeMobile} aria-hidden="true" />
          )}
        </>
      )}
    </>
  );
};

export default Header;
