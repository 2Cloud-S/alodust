import { Link } from 'react-router-dom';
import { Logo } from '../Logo';
import { Button } from '../Button';
import './Navbar.css';

interface NavbarProps {
  transparent?: boolean;
}

export function Navbar({ transparent = false }: NavbarProps) {
  return (
    <nav className={`navbar ${transparent ? 'navbar-transparent' : ''}`}>
      <div className="navbar-container container">
        <Link to="/" className="navbar-logo">
          <Logo size="md" />
        </Link>

        <div className="navbar-links">
          <Link to="/features" className="navbar-link">
            Features
          </Link>
          <Link to="/docs" className="navbar-link">
            Docs
          </Link>
          <a
            href="https://github.com/alodust/alodust"
            target="_blank"
            rel="noopener noreferrer"
            className="navbar-link"
          >
            GitHub
          </a>
        </div>

        <div className="navbar-actions">
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
        </div>

        {/* Mobile menu button */}
        <button className="navbar-mobile-toggle btn-icon" aria-label="Toggle menu">
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
        </button>
      </div>
    </nav>
  );
}
