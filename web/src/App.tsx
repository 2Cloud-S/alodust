import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ConvexClientProvider, ClerkProvider } from "./providers";
import { Landing, Login, Signup, Lobby, HostStream, WatchStream } from "./pages";
import "./styles/index.css";

function AppRoutes() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<Landing />} />
      <Route path="/login/*" element={<Login />} />
      <Route path="/signup/*" element={<Signup />} />

      {/* Protected routes */}
      <Route path="/lobby" element={<Lobby />} />
      <Route path="/stream/new" element={<HostStream />} />
      <Route path="/watch/:streamId" element={<WatchStream />} />

      {/* Placeholder routes */}
      <Route path="/features" element={<ComingSoon title="Features" />} />
      <Route path="/docs" element={<ComingSoon title="Documentation" />} />
      <Route path="/privacy" element={<ComingSoon title="Privacy Policy" />} />

      {/* 404 */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <ClerkProvider>
        <ConvexClientProvider>
          <AppRoutes />
        </ConvexClientProvider>
      </ClerkProvider>
    </BrowserRouter>
  );
}

// Temporary placeholder for pages not yet built
function ComingSoon({ title }: { title: string }) {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--deep-space)",
        color: "var(--text-primary)",
        fontFamily: "var(--font-display)",
      }}
    >
      <h1
        style={{
          fontSize: "var(--text-4xl)",
          marginBottom: "var(--space-md)",
        }}
      >
        {title}
      </h1>
      <p style={{ color: "var(--text-muted)" }}>Coming soon...</p>
      <a
        href="/"
        style={{
          marginTop: "var(--space-xl)",
          color: "var(--neon-cyan)",
          textDecoration: "none",
        }}
      >
        ← Back to Home
      </a>
    </div>
  );
}

function NotFound() {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--deep-space)",
        color: "var(--text-primary)",
        fontFamily: "var(--font-display)",
      }}
    >
      <h1
        style={{
          fontSize: "var(--text-6xl)",
          color: "var(--neon-cyan)",
          textShadow:
            "0 0 10px var(--neon-cyan), 0 0 20px var(--neon-cyan), 0 0 40px var(--neon-cyan)",
          marginBottom: "var(--space-md)",
        }}
      >
        404
      </h1>
      <p style={{ fontSize: "var(--text-xl)", marginBottom: "var(--space-lg)" }}>
        Page not found
      </p>
      <a
        href="/"
        style={{
          color: "var(--neon-cyan)",
          textDecoration: "none",
        }}
      >
        ← Back to Home
      </a>
    </div>
  );
}

export default App;
