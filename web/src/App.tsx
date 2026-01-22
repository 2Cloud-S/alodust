import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Landing } from './pages';
import './styles/index.css';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        {/* More routes will be added here */}
        <Route path="/login" element={<ComingSoon title="Login" />} />
        <Route path="/signup" element={<ComingSoon title="Sign Up" />} />
        <Route path="/features" element={<ComingSoon title="Features" />} />
        <Route path="/docs" element={<ComingSoon title="Documentation" />} />
      </Routes>
    </BrowserRouter>
  );
}

// Temporary placeholder for pages not yet built
function ComingSoon({ title }: { title: string }) {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--deep-space)',
        color: 'var(--text-primary)',
        fontFamily: 'var(--font-display)',
      }}
    >
      <h1
        style={{
          fontSize: 'var(--text-4xl)',
          marginBottom: 'var(--space-md)',
        }}
      >
        {title}
      </h1>
      <p style={{ color: 'var(--text-muted)' }}>Coming soon...</p>
      <a
        href="/"
        style={{
          marginTop: 'var(--space-xl)',
          color: 'var(--neon-cyan)',
          textDecoration: 'none',
        }}
      >
        ← Back to Home
      </a>
    </div>
  );
}

export default App;
