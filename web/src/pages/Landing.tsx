import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Container, TronBackground, Navbar, Button, Card } from '../components';
import './Landing.css';

// Animation variants
const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0 },
};

const stagger = {
  visible: {
    transition: {
      staggerChildren: 0.1,
    },
  },
};

export function Landing() {
  return (
    <div className="landing">
      <TronBackground showGrid showPerspective showAmbient />
      <Navbar transparent />

      {/* Hero Section */}
      <section className="hero">
        <Container>
          <motion.div
            className="hero-content"
            initial="hidden"
            animate="visible"
            variants={stagger}
          >
            <motion.div className="hero-badge" variants={fadeInUp}>
              <span className="badge badge-new">Open Source</span>
              <span className="hero-badge-text">100% Free Forever</span>
            </motion.div>

            <motion.h1 className="hero-title" variants={fadeInUp}>
              Watch Parties with
              <span className="hero-highlight neon-glow"> ZERO LATENCY</span>
            </motion.h1>

            <motion.p className="hero-subtitle" variants={fadeInUp}>
              Stream games, movies, and more to friends with less than 50ms latency.
              Free, open-source, and powered by{' '}
              <span className="text-cyan">Sunshine</span> +{' '}
              <span className="text-magenta">Moonlight</span> +{' '}
              <span className="text-green">Tailscale</span>.
            </motion.p>

            <motion.div className="hero-actions" variants={fadeInUp}>
              <Link to="/signup">
                <Button variant="primary" size="lg">
                  Get Started Free
                </Button>
              </Link>
              <a
                href="https://github.com/2Cloud-S/alodust"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button variant="ghost" size="lg">
                  View on GitHub
                </Button>
              </a>
            </motion.div>

            <motion.div className="hero-stats" variants={fadeInUp}>
              <div className="hero-stat">
                <span className="hero-stat-value text-cyan">&lt;50ms</span>
                <span className="hero-stat-label">Latency</span>
              </div>
              <div className="hero-stat-divider" />
              <div className="hero-stat">
                <span className="hero-stat-value text-magenta">$0</span>
                <span className="hero-stat-label">Monthly Cost</span>
              </div>
              <div className="hero-stat-divider" />
              <div className="hero-stat">
                <span className="hero-stat-value text-green">E2E</span>
                <span className="hero-stat-label">Encrypted</span>
              </div>
            </motion.div>
          </motion.div>
        </Container>
      </section>

      {/* Features Section */}
      <section className="features py-4xl">
        <Container>
          <motion.div
            className="section-header"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="section-title">
              Why <span className="text-cyan">Alodust</span>?
            </h2>
            <p className="section-subtitle">
              Built for friends who want to watch together without compromise.
            </p>
          </motion.div>

          <motion.div
            className="features-grid grid grid-cols-4 gap-lg"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={stagger}
          >
            <motion.div variants={fadeInUp}>
              <Card glowColor="cyan">
                <div className="feature-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="var(--neon-cyan)" strokeWidth="2">
                    <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                  </svg>
                </div>
                <h3 className="feature-title">Ultra-Low Latency</h3>
                <p className="feature-description">
                  Less than 50ms latency using hardware-accelerated encoding. Watch in perfect sync.
                </p>
              </Card>
            </motion.div>

            <motion.div variants={fadeInUp}>
              <Card glowColor="magenta">
                <div className="feature-icon feature-icon-magenta">
                  <svg viewBox="0 0 24 24" fill="none" stroke="var(--neon-magenta)" strokeWidth="2">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                  </svg>
                </div>
                <h3 className="feature-title">Friends-First Design</h3>
                <p className="feature-description">
                  Built around friend groups. See who's online, get notified when friends go live.
                </p>
              </Card>
            </motion.div>

            <motion.div variants={fadeInUp}>
              <Card glowColor="orange">
                <div className="feature-icon feature-icon-green">
                  <svg viewBox="0 0 24 24" fill="none" stroke="var(--neon-green)" strokeWidth="2">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                </div>
                <h3 className="feature-title">Privacy-First</h3>
                <p className="feature-description">
                  End-to-end encrypted via Tailscale. Your streams never touch our servers.
                </p>
              </Card>
            </motion.div>

            <motion.div variants={fadeInUp}>
              <Card glowColor="cyan">
                <div className="feature-icon feature-icon-orange">
                  <svg viewBox="0 0 24 24" fill="none" stroke="var(--neon-orange)" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="2" y1="12" x2="22" y2="12" />
                    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                  </svg>
                </div>
                <h3 className="feature-title">100% Free</h3>
                <p className="feature-description">
                  Open source and self-hosted. No subscriptions, no hidden costs, no data collection.
                </p>
              </Card>
            </motion.div>
          </motion.div>
        </Container>
      </section>

      {/* How It Works Section */}
      <section className="how-it-works py-4xl">
        <Container>
          <motion.div
            className="section-header"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="section-title">
              How It <span className="text-magenta">Works</span>
            </h2>
            <p className="section-subtitle">
              Get started in under 3 minutes. No technical knowledge required.
            </p>
          </motion.div>

          <motion.div
            className="steps"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={stagger}
          >
            <motion.div className="step" variants={fadeInUp}>
              <div className="step-number">01</div>
              <div className="step-content">
                <h3 className="step-title">Install Alodust</h3>
                <p className="step-description">
                  Download the app or use the web version. The setup wizard handles everything
                  automatically.
                </p>
              </div>
            </motion.div>

            <div className="step-connector" />

            <motion.div className="step" variants={fadeInUp}>
              <div className="step-number">02</div>
              <div className="step-content">
                <h3 className="step-title">Add Friends</h3>
                <p className="step-description">
                  Invite friends by username or share an invite link. Accept requests to connect.
                </p>
              </div>
            </motion.div>

            <div className="step-connector" />

            <motion.div className="step" variants={fadeInUp}>
              <div className="step-number">03</div>
              <div className="step-content">
                <h3 className="step-title">Start Watching</h3>
                <p className="step-description">
                  Click "Go Live" to stream, or join a friend's stream with one click. It just works.
                </p>
              </div>
            </motion.div>
          </motion.div>
        </Container>
      </section>

      {/* Tech Stack Section */}
      <section className="tech-stack py-4xl">
        <Container>
          <motion.div
            className="section-header"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="section-title">
              Powered By <span className="text-green">Open Source</span>
            </h2>
            <p className="section-subtitle">
              We stand on the shoulders of giants. Alodust coordinates these amazing tools.
            </p>
          </motion.div>

          <motion.div
            className="tech-logos"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            <a
              href="https://github.com/LizardByte/Sunshine"
              target="_blank"
              rel="noopener noreferrer"
              className="tech-logo"
            >
              <div className="tech-logo-icon">
                <span role="img" aria-label="sun" style={{ fontSize: '2rem' }}>
                  ☀️
                </span>
              </div>
              <span className="tech-logo-name">Sunshine</span>
              <span className="tech-logo-desc">Streaming Server</span>
            </a>

            <div className="tech-plus">+</div>

            <a
              href="https://moonlight-stream.org/"
              target="_blank"
              rel="noopener noreferrer"
              className="tech-logo"
            >
              <div className="tech-logo-icon">
                <span role="img" aria-label="moon" style={{ fontSize: '2rem' }}>
                  🌙
                </span>
              </div>
              <span className="tech-logo-name">Moonlight</span>
              <span className="tech-logo-desc">Streaming Client</span>
            </a>

            <div className="tech-plus">+</div>

            <a
              href="https://tailscale.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="tech-logo"
            >
              <div className="tech-logo-icon">
                <span role="img" aria-label="network" style={{ fontSize: '2rem' }}>
                  🔗
                </span>
              </div>
              <span className="tech-logo-name">Tailscale</span>
              <span className="tech-logo-desc">Mesh VPN</span>
            </a>
          </motion.div>
        </Container>
      </section>

      {/* CTA Section */}
      <section className="cta py-4xl">
        <Container>
          <motion.div
            className="cta-content"
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
          >
            <h2 className="cta-title">
              Ready to Stream with <span className="neon-glow">Zero Latency</span>?
            </h2>
            <p className="cta-subtitle">
              Join the watch party revolution. It's free, forever.
            </p>
            <Link to="/signup">
              <Button variant="primary" size="lg">
                Get Started Free
              </Button>
            </Link>
          </motion.div>
        </Container>
      </section>

      {/* Footer */}
      <footer className="footer">
        <Container>
          <div className="footer-content">
            <div className="footer-brand">
              <span className="font-display text-cyan">ALODUST</span>
              <p className="footer-tagline">Watch parties with zero latency.</p>
            </div>
            <div className="footer-links">
              <a href="https://github.com/2Cloud-S/alodust" target="_blank" rel="noopener noreferrer">
                GitHub
              </a>
              <a href="/docs">Documentation</a>
              <a href="/privacy">Privacy</a>
            </div>
            <p className="footer-copyright">
              MIT License. Made with ⚡ by the Alodust community.
            </p>
          </div>
        </Container>
      </footer>
    </div>
  );
}
