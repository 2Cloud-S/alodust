import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { TronBackground, Navbar, Container } from "../components";
import "./Privacy.css";

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

export function Privacy() {
  const lastUpdated = "January 24, 2026";

  return (
    <div className="privacy-page">
      <TronBackground />
      <Navbar />

      <Container className="privacy-container">
        <motion.header
          className="privacy-header"
          initial="hidden"
          animate="visible"
          variants={fadeInUp}
        >
          <h1 className="privacy-title">Privacy Policy</h1>
          <p className="privacy-subtitle">
            Your privacy matters. Here's how we handle your data.
          </p>
          <div className="privacy-meta">
            <span>Last Updated: {lastUpdated}</span>
            <span className="privacy-badge">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
              Open Source
            </span>
          </div>
        </motion.header>

        <motion.div
          className="privacy-content"
          initial="hidden"
          animate="visible"
          variants={staggerContainer}
        >
          {/* Open Source Commitment */}
          <motion.section className="privacy-section highlight-section" variants={fadeInUp}>
            <div className="section-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <path d="M8 14s1.5 2 4 2 4-2 4-2" />
                <line x1="9" y1="9" x2="9.01" y2="9" />
                <line x1="15" y1="9" x2="15.01" y2="9" />
              </svg>
            </div>
            <h2>Our Open Source Commitment</h2>
            <p>
              Alodust is <strong>100% open source</strong> under the MIT License. This means:
            </p>
            <ul className="commitment-list">
              <li>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                You can inspect, audit, and verify exactly how we handle your data
              </li>
              <li>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                You can self-host Alodust with complete control over your data
              </li>
              <li>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                No hidden trackers, analytics, or data collection beyond what's disclosed
              </li>
              <li>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                Community-driven development with transparent decision-making
              </li>
            </ul>
            <a
              href="https://github.com/2Cloud-S/alodust"
              target="_blank"
              rel="noopener noreferrer"
              className="source-link"
            >
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
              </svg>
              View Source Code
            </a>
          </motion.section>

          {/* Data We Collect */}
          <motion.section className="privacy-section" variants={fadeInUp}>
            <h2>1. Information We Collect</h2>

            <div className="subsection">
              <h3>Account Information</h3>
              <p>When you create an account through Clerk (our authentication provider), we collect:</p>
              <ul>
                <li>Email address (for account identification and communication)</li>
                <li>Username and display name (chosen by you)</li>
                <li>Profile picture (optional, if you choose to upload one)</li>
              </ul>
            </div>

            <div className="subsection">
              <h3>Streaming Configuration</h3>
              <p>To enable streaming functionality, we store:</p>
              <ul>
                <li>Your Tailscale IP address (entered by you in Settings)</li>
                <li>Stream settings (quality, privacy preferences)</li>
                <li>Friend connections and groups</li>
              </ul>
            </div>

            <div className="subsection">
              <h3>Usage Data</h3>
              <p>We collect minimal usage data to maintain service quality:</p>
              <ul>
                <li>Stream session metadata (start time, duration, viewer count)</li>
                <li>Chat messages within streams (stored temporarily)</li>
                <li>Last active timestamp (for online status)</li>
              </ul>
            </div>

            <div className="data-notice">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="16" x2="12" y2="12" />
                <line x1="12" y1="8" x2="12.01" y2="8" />
              </svg>
              <p>
                <strong>Important:</strong> Your actual video/audio streams are transmitted directly
                between devices via Tailscale and Sunshine/Moonlight. We never have access to your
                stream content.
              </p>
            </div>
          </motion.section>

          {/* How We Use Data */}
          <motion.section className="privacy-section" variants={fadeInUp}>
            <h2>2. How We Use Your Information</h2>
            <p>We use collected information solely for:</p>
            <ul>
              <li>Providing and maintaining the Alodust service</li>
              <li>Enabling friend connections and stream discovery</li>
              <li>Displaying your online/streaming status to friends</li>
              <li>Sending important service notifications (optional)</li>
              <li>Improving the platform based on usage patterns</li>
            </ul>
            <p className="emphasis">
              We do <strong>NOT</strong> sell, rent, or share your personal information with third
              parties for marketing purposes. Ever.
            </p>
          </motion.section>

          {/* Data Storage */}
          <motion.section className="privacy-section" variants={fadeInUp}>
            <h2>3. Data Storage & Security</h2>

            <div className="subsection">
              <h3>Where Your Data Lives</h3>
              <ul>
                <li><strong>Convex:</strong> Our real-time database for user profiles, friendships, and stream metadata</li>
                <li><strong>Clerk:</strong> Authentication data and secure session management</li>
                <li><strong>Your Devices:</strong> Preferences stored in localStorage (like "don't show again" settings)</li>
              </ul>
            </div>

            <div className="subsection">
              <h3>Security Measures</h3>
              <ul>
                <li>All data transmitted over HTTPS/TLS encryption</li>
                <li>Authentication handled by Clerk with industry-standard security</li>
                <li>Streams encrypted end-to-end via Tailscale's WireGuard protocol</li>
                <li>No plain-text password storage (Clerk handles this securely)</li>
              </ul>
            </div>
          </motion.section>

          {/* Your Rights */}
          <motion.section className="privacy-section rights-section" variants={fadeInUp}>
            <h2>4. Your Rights</h2>
            <p>You have full control over your data. Here's what you can do:</p>

            <div className="rights-grid">
              <div className="right-card">
                <div className="right-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                </div>
                <h4>Access</h4>
                <p>View all data we have about you at any time</p>
              </div>

              <div className="right-card">
                <div className="right-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                  </svg>
                </div>
                <h4>Rectify</h4>
                <p>Update or correct your information</p>
              </div>

              <div className="right-card">
                <div className="right-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="3 6 5 6 21 6" />
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                  </svg>
                </div>
                <h4>Delete</h4>
                <p>Request complete deletion of your account and data</p>
              </div>

              <div className="right-card">
                <div className="right-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="7 10 12 15 17 10" />
                    <line x1="12" y1="15" x2="12" y2="3" />
                  </svg>
                </div>
                <h4>Export</h4>
                <p>Download your data in a portable format</p>
              </div>

              <div className="right-card">
                <div className="right-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                </div>
                <h4>Restrict</h4>
                <p>Limit how we process your data</p>
              </div>

              <div className="right-card">
                <div className="right-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
                  </svg>
                </div>
                <h4>Object</h4>
                <p>Opt out of certain data processing</p>
              </div>
            </div>

            <p className="rights-contact">
              To exercise any of these rights, contact us at{" "}
              <a href="mailto:privacy@alodust.com">privacy@alodust.com</a> or open an issue on{" "}
              <a href="https://github.com/2Cloud-S/alodust" target="_blank" rel="noopener noreferrer">GitHub</a>.
            </p>
          </motion.section>

          {/* Third-Party Services */}
          <motion.section className="privacy-section" variants={fadeInUp}>
            <h2>5. Third-Party Services</h2>
            <p>Alodust integrates with the following services:</p>

            <div className="third-party-list">
              <div className="third-party-item">
                <h4>Clerk</h4>
                <p>Authentication and user management</p>
                <a href="https://clerk.com/privacy" target="_blank" rel="noopener noreferrer">
                  Privacy Policy
                </a>
              </div>
              <div className="third-party-item">
                <h4>Convex</h4>
                <p>Real-time database and backend</p>
                <a href="https://www.convex.dev/privacy" target="_blank" rel="noopener noreferrer">
                  Privacy Policy
                </a>
              </div>
              <div className="third-party-item">
                <h4>Tailscale</h4>
                <p>Secure networking (installed by you)</p>
                <a href="https://tailscale.com/privacy-policy" target="_blank" rel="noopener noreferrer">
                  Privacy Policy
                </a>
              </div>
            </div>

            <p className="third-party-note">
              Note: Sunshine and Moonlight are open-source software that run locally on your devices.
              They do not transmit data to external servers.
            </p>
          </motion.section>

          {/* Cookies */}
          <motion.section className="privacy-section" variants={fadeInUp}>
            <h2>6. Cookies & Local Storage</h2>
            <p>We use minimal browser storage:</p>
            <ul>
              <li><strong>Authentication cookies:</strong> Managed by Clerk for secure login sessions</li>
              <li><strong>Preferences:</strong> LocalStorage for settings like "don't show connection guide again"</li>
            </ul>
            <p>
              We do <strong>NOT</strong> use tracking cookies, advertising cookies, or any third-party
              analytics that track your behavior across sites.
            </p>
          </motion.section>

          {/* Data Retention */}
          <motion.section className="privacy-section" variants={fadeInUp}>
            <h2>7. Data Retention</h2>
            <ul>
              <li><strong>Account data:</strong> Retained while your account is active</li>
              <li><strong>Chat messages:</strong> Deleted when a stream ends</li>
              <li><strong>Stream metadata:</strong> Retained for 30 days for history/stats</li>
              <li><strong>Deleted accounts:</strong> All data permanently removed within 30 days</li>
            </ul>
          </motion.section>

          {/* Children */}
          <motion.section className="privacy-section" variants={fadeInUp}>
            <h2>8. Children's Privacy</h2>
            <p>
              Alodust is not intended for users under 13 years of age. We do not knowingly collect
              personal information from children under 13. If you believe a child has provided us
              with personal information, please contact us immediately.
            </p>
          </motion.section>

          {/* Changes */}
          <motion.section className="privacy-section" variants={fadeInUp}>
            <h2>9. Changes to This Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. All changes will be:
            </p>
            <ul>
              <li>Committed to our public GitHub repository with full change history</li>
              <li>Announced in our release notes</li>
              <li>Reflected in the "Last Updated" date at the top of this page</li>
            </ul>
            <p>
              Continued use of Alodust after changes constitutes acceptance of the updated policy.
            </p>
          </motion.section>

          {/* Contact */}
          <motion.section className="privacy-section contact-section" variants={fadeInUp}>
            <h2>10. Contact Us</h2>
            <p>Questions, concerns, or requests regarding your privacy? Reach out:</p>
            <div className="contact-options">
              <a href="mailto:privacy@alodust.com" className="contact-option">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                  <polyline points="22,6 12,13 2,6" />
                </svg>
                privacy@alodust.com
              </a>
              <a
                href="https://github.com/2Cloud-S/alodust/issues"
                target="_blank"
                rel="noopener noreferrer"
                className="contact-option"
              >
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                </svg>
                GitHub Issues
              </a>
            </div>
          </motion.section>
        </motion.div>

        <motion.footer className="privacy-footer" variants={fadeInUp} initial="hidden" animate="visible">
          <Link to="/" className="back-link">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="19" y1="12" x2="5" y2="12" />
              <polyline points="12 19 5 12 12 5" />
            </svg>
            Back to Home
          </Link>
          <p className="license-note">
            This Privacy Policy is part of the Alodust project, licensed under{" "}
            <a href="https://opensource.org/licenses/MIT" target="_blank" rel="noopener noreferrer">
              MIT License
            </a>
            .
          </p>
        </motion.footer>
      </Container>
    </div>
  );
}
