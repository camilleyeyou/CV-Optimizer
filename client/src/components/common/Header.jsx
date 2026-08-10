import { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getCredits } from '../../services/api';
import { Menu, X, LogOut, User, ChevronDown, LayoutDashboard, FileSearch, Sparkles, PenTool, Layout, Mail, Zap, Briefcase, MessageSquare, BarChart3, Settings, Send } from 'lucide-react';
import Avatar from './Avatar';
import Logo from './Logo';
import './Header.css';

/**
 * Nav is split into the three places you live and one menu of single-purpose
 * tools. Nine equal-weight links across the bar gave no hierarchy and had to
 * scroll horizontally to fit.
 */
const PRIMARY_LINKS = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/templates', label: 'Templates', icon: Layout },
  { to: '/tracker', label: 'Tracker', icon: Briefcase },
];

const TOOL_LINKS = [
  // Named for what it does: visiting /builder with no id creates a resume, so
  // "Builder" was a nav link with an invisible side effect.
  { to: '/builder', label: 'New blank resume', icon: PenTool },
  { to: '/ai-creator', label: 'AI Creator', icon: Sparkles },
  { to: '/ats-checker', label: 'ATS Checker', icon: FileSearch },
  { to: '/cover-letter', label: 'Cover Letter', icon: Mail },
  { to: '/emails', label: 'Emails', icon: Send },
  { to: '/interview-prep', label: 'Interview Prep', icon: MessageSquare },
];

const Header = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [toolsOpen, setToolsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const toolsRef = useRef(null);
  const { user, firstName, avatarUrl, signOut, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [credits, setCredits] = useState(null);

  const closeDropdown = useCallback(() => setDropdownOpen(false), []);
  const closeMobile = useCallback(() => setMobileOpen(false), []);
  const closeTools = useCallback(() => setToolsOpen(false), []);

  // Fetch credits
  useEffect(() => {
    if (!isAuthenticated) return;
    getCredits().then(setCredits).catch(() => {});
  }, [isAuthenticated, location.pathname]);

  // Close mobile nav on route change
  useEffect(() => {
    closeMobile();
    closeDropdown();
    closeTools();
  }, [location.pathname, closeMobile, closeDropdown, closeTools]);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

  // Close open menus on a click outside them
  useEffect(() => {
    if (!dropdownOpen && !toolsOpen) return undefined;
    const handleClickOutside = (e) => {
      if (dropdownOpen && dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        closeDropdown();
      }
      if (toolsOpen && toolsRef.current && !toolsRef.current.contains(e.target)) {
        closeTools();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [dropdownOpen, toolsOpen, closeDropdown, closeTools]);

  // Escape key handler
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key !== 'Escape') return;
      if (dropdownOpen) closeDropdown();
      if (toolsOpen) {
        closeTools();
        // Escape should leave focus on the control that opened the menu, not
        // wherever it happened to be inside it.
        toolsRef.current?.querySelector('button')?.focus();
      }
      if (mobileOpen) closeMobile();
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [dropdownOpen, toolsOpen, mobileOpen, closeDropdown, closeTools, closeMobile]);

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
    closeMobile();
    closeDropdown();
  };

  const isActive = (path) => location.pathname === path;

  const displayName = firstName || 'User';

  const initial = displayName.charAt(0).toUpperCase();
  const isAuthPage = ['/login', '/register'].includes(location.pathname);
  const showNav = !isAuthPage && isAuthenticated;

  const toolsActive = TOOL_LINKS.some(({ to }) => location.pathname.startsWith(to));

  return (
    <>
      <header className="header">
        <div className="header-inner">
          <Link to={isAuthenticated ? '/dashboard' : '/'} className="header-logo">
            <Logo size={24} />
            <span>CV Optimizer</span>
          </Link>

          {showNav && (
            <>
              {/* Desktop nav */}
              <nav className="header-nav-desktop" aria-label="Main navigation" data-tour="dashboard-nav">
                {PRIMARY_LINKS.map(({ to, label }) => (
                  <Link key={to} to={to} className={`nav-link ${isActive(to) ? 'active' : ''}`}>
                    {label}
                  </Link>
                ))}

                <div className="nav-menu" ref={toolsRef}>
                  <button
                    type="button"
                    className={`nav-link nav-menu-trigger ${toolsActive ? 'active' : ''}`}
                    onClick={() => setToolsOpen((o) => !o)}
                    aria-expanded={toolsOpen}
                    aria-haspopup="menu"
                  >
                    Tools
                    <ChevronDown size={13} aria-hidden="true" />
                  </button>

                  {toolsOpen && (
                    <div className="nav-dropdown" role="menu" aria-label="Tools">
                      {TOOL_LINKS.map(({ to, label, icon: Icon }) => (
                        <Link
                          key={to}
                          to={to}
                          role="menuitem"
                          className={`dropdown-item ${isActive(to) ? 'active' : ''}`}
                          onClick={closeTools}
                        >
                          <Icon size={15} aria-hidden="true" /> {label}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
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
                  <Avatar url={avatarUrl} initial={initial} />
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
                    <button className="dropdown-item" role="menuitem" onClick={() => { navigate('/account'); closeDropdown(); }}>
                      <Settings size={14} aria-hidden="true" /> Account &amp; Data
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

      {/* Mobile drawer — rendered OUTSIDE header to avoid backdrop-filter containing block.
          Wrapped in a clipping container so the off-canvas (closed) drawer can never
          create horizontal scroll — even position:fixed children are clipped because the
          wrapper is a transformed containing block. */}
      {showNav && (
        <>
          <div className="mobile-drawer-clip">
            {/* A <nav>, not a labelled <div>: aria-label on a plain div names
                nothing, which left the drawer's footer (user details, sign out)
                outside every landmark. */}
            <nav
              className={`mobile-drawer ${mobileOpen ? 'is-open' : ''}`}
              aria-label="Mobile navigation"
            >
              {/* Flat on mobile, but grouped — vertical space scrolls, so the
                  headings cost nothing and the same split still reads. */}
              <div className="mobile-drawer-nav">
                {PRIMARY_LINKS.map(({ to, label, icon: Icon }) => (
                  <Link key={to} to={to} className={`mobile-nav-link ${isActive(to) ? 'active' : ''}`}>
                    <Icon size={18} aria-hidden="true" />
                    {label}
                  </Link>
                ))}

                <p className="mobile-nav-heading" id="mobile-tools-heading">Tools</p>
                <div role="group" aria-labelledby="mobile-tools-heading">
                  {TOOL_LINKS.map(({ to, label, icon: Icon }) => (
                    <Link key={to} to={to} className={`mobile-nav-link ${isActive(to) ? 'active' : ''}`}>
                      <Icon size={18} aria-hidden="true" />
                      {label}
                    </Link>
                  ))}
                </div>
              </div>

              <div className="mobile-drawer-footer">
                <div className="mobile-user-info">
                  <Avatar url={avatarUrl} initial={initial} />
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
            </nav>
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
