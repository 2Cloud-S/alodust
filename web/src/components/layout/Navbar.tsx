import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { Logo } from '../Logo';
import { Button } from '../Button';
import { Avatar } from '../Avatar';
import './Navbar.css';

interface NavbarProps {
  transparent?: boolean;
}

export function Navbar({ transparent = false }: NavbarProps) {
  const { isSignedIn, user, signOut } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  // Close menu when route changes
  const handleLinkClick = () => {
    closeMobileMenu();
  };

  return (
    <>
      <nav className={`navbar ${transparent ? 'navbar-transparent' : ''}`}>
        <div className="navbar-container container">
          <Link to="/" className="navbar-logo" onClick={handleLinkClick}>
            <Logo size="md" />
          </Link>

          <div className="navbar-links">
            {isSignedIn ? (
              <>
                <Link to="/lobby" className="navbar-link">
                  Lobby
                </Link>
                <Link to="/stream/new" className="navbar-link">
                  Stream
                </Link>
                <Link to="/settings" className="navbar-link">
                  Settings
                </Link>
              </>
            ) : (
              <>
                <Link to="/features" className="navbar-link">
                  Features
                </Link>
                <Link to="/docs" className="navbar-link">
                  Docs
                </Link>
              </>
            )}
          </div>

          <div className="navbar-actions">
            {isSignedIn ? (
              <>
                <Link to="/lobby" className="navbar-user">
                  <Avatar
                    src={user?.avatarUrl}
                    alt={user?.displayName || user?.username || 'User'}
                    size="sm"
                    status="online"
                  />
                  <span className="navbar-username">
                    {user?.displayName || user?.username}
                  </span>
                </Link>
                <Button variant="ghost" size="sm" onClick={() => signOut()}>
                  Sign Out
                </Button>
              </>
            ) : (
              <>
                <Link to="/login">
                  <Button variant="ghost" size="sm">
                    Sign In
                  </Button>
                </Link>
                <Link to="/signup">
                  <Button variant="primary" size="sm">
                    Get Started
                  </Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            className={`navbar-mobile-toggle btn-icon ${mobileMenuOpen ? 'active' : ''}`}
            aria-label="Toggle menu"
            onClick={toggleMobileMenu}
          >
            {mobileMenuOpen ? (
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            ) : (
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            )}
          </button>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div className="mobile-menu-overlay" onClick={closeMobileMenu}>
          <div className="mobile-menu" onClick={(e) => e.stopPropagation()}>
            {/* User info at top if signed in */}
            {isSignedIn && user && (
              <div className="mobile-menu-user">
                <Avatar
                  src={user.avatarUrl}
                  alt={user.displayName || user.username || 'User'}
                  size="lg"
                  status="online"
                />
                <div className="mobile-menu-user-info">
                  <span className="mobile-menu-displayname">
                    {user.displayName || user.username}
                  </span>
                  {user.username && user.displayName && (
                    <span className="mobile-menu-username">@{user.username}</span>
                  )}
                </div>
              </div>
            )}

            {/* Navigation Links */}
            <div className="mobile-menu-links">
              {isSignedIn ? (
                <>
                  <Link
                    to="/lobby"
                    className={`mobile-menu-link ${location.pathname === '/lobby' ? 'active' : ''}`}
                    onClick={handleLinkClick}
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                      <circle cx="9" cy="7" r="4" />
                      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                    </svg>
                    Lobby
                  </Link>
                  <Link
                    to="/stream/new"
                    className={`mobile-menu-link ${location.pathname === '/stream/new' ? 'active' : ''}`}
                    onClick={handleLinkClick}
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polygon points="23 7 16 12 23 17 23 7" />
                      <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
                    </svg>
                    Start Stream
                  </Link>
                  <Link
                    to="/settings"
                    className={`mobile-menu-link ${location.pathname === '/settings' ? 'active' : ''}`}
                    onClick={handleLinkClick}
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="3" />
                      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
                    </svg>
                    Settings
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    to="/features"
                    className={`mobile-menu-link ${location.pathname === '/features' ? 'active' : ''}`}
                    onClick={handleLinkClick}
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polygon points="12 2 2 7 12 12 22 7 12 2" />
                      <polyline points="2 17 12 22 22 17" />
                      <polyline points="2 12 12 17 22 12" />
                    </svg>
                    Features
                  </Link>
                  <Link
                    to="/docs"
                    className={`mobile-menu-link ${location.pathname === '/docs' ? 'active' : ''}`}
                    onClick={handleLinkClick}
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                      <polyline points="14 2 14 8 20 8" />
                      <line x1="16" y1="13" x2="8" y2="13" />
                      <line x1="16" y1="17" x2="8" y2="17" />
                      <polyline points="10 9 9 9 8 9" />
                    </svg>
                    Docs
                  </Link>
                </>
              )}
            </div>

            {/* Auth Actions */}
            <div className="mobile-menu-actions">
              {isSignedIn ? (
                <Button
                  variant="ghost"
                  fullWidth
                  onClick={() => {
                    signOut();
                    closeMobileMenu();
                  }}
                >
                  Sign Out
                </Button>
              ) : (
                <>
                  <Link to="/login" onClick={handleLinkClick} style={{ width: '100%' }}>
                    <Button variant="ghost" fullWidth>
                      Sign In
                    </Button>
                  </Link>
                  <Link to="/signup" onClick={handleLinkClick} style={{ width: '100%' }}>
                    <Button variant="primary" fullWidth>
                      Get Started
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
