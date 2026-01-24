import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { useAuth } from "../hooks/useAuth";
import { TronBackground, Navbar, Card, Button, Avatar, Badge } from "../components";
import "./WatchStream.css";

// LocalStorage key for hiding connection guide
const HIDE_CONNECTION_GUIDE_KEY = "alodust_hide_connection_guide";

interface ChatMessage {
  _id: string;
  userId: string;
  message: string;
  timestamp: number;
  type?: "text" | "emoji" | "system";
  user?: {
    avatarUrl?: string;
    displayName?: string;
    username?: string;
  } | null;
}

interface ViewerData {
  _id: string;
  user?: {
    avatarUrl?: string;
    displayName?: string;
    username?: string;
  } | null;
}

export function WatchStream() {
  const { streamId } = useParams<{ streamId: string }>();
  const navigate = useNavigate();
  const { userId, isLoaded, isSignedIn } = useAuth();

  // Chat state
  const [chatMessage, setChatMessage] = useState("");
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Connection guide state - check localStorage for returning users
  const [showConnectionGuide, setShowConnectionGuide] = useState(() => {
    const hidden = localStorage.getItem(HIDE_CONNECTION_GUIDE_KEY);
    return hidden !== "true";
  });
  const [dontShowAgain, setDontShowAgain] = useState(false);

  // Handle dismissing the connection guide
  const dismissGuide = useCallback((remember: boolean = false) => {
    if (remember || dontShowAgain) {
      localStorage.setItem(HIDE_CONNECTION_GUIDE_KEY, "true");
    }
    setShowConnectionGuide(false);
  }, [dontShowAgain]);

  // Show guide again (for help button)
  const showGuide = useCallback(() => {
    setShowConnectionGuide(true);
  }, []);

  // Convex queries
  const stream = useQuery(
    api.streams.getById,
    streamId ? { streamId: streamId as Id<"streams"> } : "skip"
  );

  const viewers = useQuery(
    api.streams.getStreamViewers,
    streamId ? { streamId: streamId as Id<"streams"> } : "skip"
  );

  const messages = useQuery(
    api.chat.getMessages,
    streamId ? { streamId: streamId as Id<"streams">, limit: 100 } : "skip"
  );

  // Mutations
  const joinAsViewer = useMutation(api.streams.joinAsViewer);
  const leaveAsViewer = useMutation(api.streams.leaveAsViewer);
  const sendMessage = useMutation(api.chat.sendMessage);

  // Join as viewer when component mounts
  useEffect(() => {
    if (streamId && userId && stream?.isLive) {
      joinAsViewer({
        streamId: streamId as Id<"streams">,
        userId,
      }).catch(console.error);
    }

    // Leave when component unmounts
    return () => {
      if (streamId && userId) {
        leaveAsViewer({
          streamId: streamId as Id<"streams">,
          userId,
        }).catch(console.error);
      }
    };
  }, [streamId, userId, stream?.isLive, joinAsViewer, leaveAsViewer]);

  // Auto-scroll chat
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  // Redirect if not signed in
  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      navigate("/login");
    }
  }, [isLoaded, isSignedIn, navigate]);

  const handleSendMessage = async () => {
    if (!streamId || !userId || !chatMessage.trim()) return;

    try {
      await sendMessage({
        streamId: streamId as Id<"streams">,
        userId,
        content: chatMessage.trim(),
      });
      setChatMessage("");
    } catch (error) {
      console.error("Failed to send message:", error);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const openMoonlight = () => {
    if (!stream) return;

    // Generate Moonlight deep link
    // Format: moonlight://[ip]:[port]
    const moonlightUrl = `moonlight://${stream.tailscaleIP}:${stream.sunshinePort || 47989}`;
    window.open(moonlightUrl, "_blank");

    // Mark as connected and dismiss guide
    dismissGuide();
  };

  // Copy IP to clipboard
  const copyIP = async () => {
    if (!stream) return;
    try {
      await navigator.clipboard.writeText(stream.tailscaleIP);
    } catch (error) {
      console.error("Failed to copy IP:", error);
    }
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Loading state
  if (!isLoaded || stream === undefined) {
    return (
      <div className="watch-stream-page">
        <TronBackground />
        <Navbar />
        <div className="stream-loading">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 2v4m0 12v4M4.93 4.93l2.83 2.83m8.48 8.48l2.83 2.83M2 12h4m12 0h4M4.93 19.07l2.83-2.83m8.48-8.48l2.83-2.83" />
          </svg>
          <span>Loading stream...</span>
        </div>
      </div>
    );
  }

  // Stream not found or ended
  if (!stream || !stream.isLive) {
    return (
      <div className="watch-stream-page">
        <TronBackground />
        <Navbar />
        <div className="stream-not-found">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <h2>Stream Not Found</h2>
          <p>This stream may have ended or doesn't exist.</p>
          <Button variant="primary" onClick={() => navigate("/lobby")}>
            Back to Lobby
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="watch-stream-page">
      <TronBackground />
      <Navbar />

      <div className="watch-stream-container">
        <div className="watch-stream-grid">
          {/* Main Content */}
          <div className="watch-stream-main">
            {/* Stream Player Area */}
            <Card className="stream-player-card" glow="cyan">
              <div className="stream-player-area">
                {/* Connected State - Minimal UI */}
                <div className="stream-connected-view">
                  <div className="connected-status">
                    <svg
                      className="connected-icon"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                    </svg>
                    <div className="connected-info">
                      <h3>Streaming via {stream.streamType === "obs" ? "OBS Studio" : "Moonlight"}</h3>
                      <p>{stream.streamType === "obs"
                        ? "Connect using VLC or compatible RTMP player"
                        : "Connect using the IP below or click to open Moonlight"}</p>
                    </div>
                  </div>

                  <div className="quick-connect-bar">
                    <div className="ip-display" onClick={copyIP} title="Click to copy">
                      <span className="ip-label">Host IP:</span>
                      <code className="ip-value">{stream.tailscaleIP}</code>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                      </svg>
                    </div>

                    {stream.streamType === "obs" ? (
                      <button
                        className="quick-connect-btn"
                        onClick={() => {
                          const rtmpUrl = `${stream.obsServerUrl}/${stream.obsStreamKey}`;
                          navigator.clipboard.writeText(rtmpUrl);
                        }}
                      >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                        </svg>
                        Copy Stream URL
                      </button>
                    ) : (
                      <button className="quick-connect-btn" onClick={openMoonlight}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                        </svg>
                        Open Moonlight
                      </button>
                    )}

                    <button className="help-btn" onClick={showGuide} title="Connection Help">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10" />
                        <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                        <line x1="12" y1="17" x2="12.01" y2="17" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>

              {/* Connection Guide Modal - for first-time or help */}
              {showConnectionGuide && (
                <div className="connection-guide-overlay" onClick={() => dismissGuide()}>
                  <div className="connection-guide-modal" onClick={(e) => e.stopPropagation()}>
                    <button className="guide-close-btn" onClick={() => dismissGuide()}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                      </svg>
                    </button>

                    <div className="guide-header">
                      <svg
                        className="guide-icon"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.5"
                      >
                        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                      </svg>
                      <h2>Connect to Stream</h2>
                      <p>
                        {stream.host?.displayName || stream.host?.username} is streaming via {stream.streamType === "obs" ? "OBS Studio" : "Moonlight"}.
                        Follow these steps to connect:
                      </p>
                    </div>

                    {/* Guide Sections with Tabs */}
                    <div className="guide-tabs">
                      <button className="guide-tab active" data-tab="quick">Quick Connect</button>
                      {stream.streamType !== "obs" && (
                        <>
                          <button className="guide-tab" data-tab="tailscale">Tailscale Setup</button>
                          <button className="guide-tab" data-tab="moonlight">Moonlight Setup</button>
                        </>
                      )}
                    </div>

                    {/* Quick Connect - For returning users */}
                    <div className="guide-section" id="quick-connect">
                      {stream.streamType === "obs" ? (
                        // OBS Quick Connect
                        <div className="guide-steps">
                          <div className="guide-step">
                            <span className="step-number">1</span>
                            <div className="step-content">
                              <h4>Download VLC Player (if needed)</h4>
                              <p>VLC is a free media player that supports RTMP streams</p>
                              <a href="https://www.videolan.org/vlc/" target="_blank" rel="noopener noreferrer" className="download-link">
                                Download VLC
                              </a>
                            </div>
                          </div>

                          <div className="guide-step">
                            <span className="step-number">2</span>
                            <div className="step-content">
                              <h4>Open VLC & Connect</h4>
                              <p>1. Open VLC Player</p>
                              <p>2. Go to Media → Open Network Stream</p>
                              <p>3. Paste this URL:</p>
                              <div className="guide-ip-box" onClick={() => {
                                const rtmpUrl = `${stream.obsServerUrl}/${stream.obsStreamKey}`;
                                navigator.clipboard.writeText(rtmpUrl);
                              }}>
                                <code>{stream.obsServerUrl}/{stream.obsStreamKey}</code>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                                </svg>
                              </div>
                            </div>
                          </div>

                          <div className="guide-step">
                            <span className="step-number">3</span>
                            <div className="step-content">
                              <h4>Click Play</h4>
                              <p>The stream should start playing automatically</p>
                            </div>
                          </div>
                        </div>
                      ) : (
                        // Moonlight Quick Connect
                        <div className="guide-steps">
                          <div className="guide-step">
                            <span className="step-number">1</span>
                            <div className="step-content">
                              <h4>Open Tailscale</h4>
                              <p>Make sure Tailscale is connected (check system tray icon)</p>
                            </div>
                          </div>

                          <div className="guide-step">
                            <span className="step-number">2</span>
                            <div className="step-content">
                              <h4>Open Moonlight & Connect</h4>
                              <p>Host's Tailscale IP:</p>
                              <div className="guide-ip-box" onClick={copyIP}>
                                <code>{stream.tailscaleIP}</code>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                                </svg>
                              </div>
                              {stream.tailscaleIP === "100.0.0.1" && (
                                <p className="ip-warning">
                                  ⚠️ Host hasn't configured their Tailscale IP yet. Ask them to update it in Settings.
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="guide-step">
                            <span className="step-number">3</span>
                            <div className="step-content">
                              <h4>Select Desktop</h4>
                              <p>Choose "Desktop" from the host's app list to start watching</p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Full Tailscale Setup Guide */}
                    <details className="guide-details">
                      <summary className="guide-details-summary">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                        </svg>
                        First Time? Complete Tailscale Setup
                      </summary>
                      <div className="guide-details-content">
                        <h4>What is Tailscale?</h4>
                        <p>Tailscale creates a secure private network between your devices. It's like being on the same WiFi, but works over the internet too!</p>

                        <div className="setup-section">
                          <h5>Step 1: Download Tailscale</h5>
                          <p>Get the app for your device:</p>
                          <div className="download-links">
                            <a href="https://tailscale.com/download/windows" target="_blank" rel="noopener noreferrer" className="download-link">
                              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M0 3.449L9.75 2.1v9.45H0m10.949-9.602L24 0v11.4H10.949M0 12.6h9.75v9.451L0 20.699M10.949 12.6H24V24l-12.9-1.801"/>
                              </svg>
                              Windows
                            </a>
                            <a href="https://tailscale.com/download/mac" target="_blank" rel="noopener noreferrer" className="download-link">
                              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                              </svg>
                              macOS
                            </a>
                            <a href="https://tailscale.com/download/ios" target="_blank" rel="noopener noreferrer" className="download-link">
                              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                              </svg>
                              iOS
                            </a>
                            <a href="https://tailscale.com/download/android" target="_blank" rel="noopener noreferrer" className="download-link">
                              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M17.523 2.047l1.41 1.41-2.59 2.59c1.68 1.1 2.8 2.91 3.04 4.95h2v2h-2v1h2v2h-2c-.24 2.04-1.36 3.85-3.04 4.95l2.59 2.59-1.41 1.41-2.59-2.59c-1.1.68-2.4 1.07-3.77 1.07s-2.67-.39-3.77-1.07l-2.59 2.59-1.41-1.41 2.59-2.59C3.47 17.85 2.35 16.04 2.11 14h-2v-2h2v-1h-2V9h2c.24-2.04 1.36-3.85 3.04-4.95L2.56 1.46l1.41-1.41 2.59 2.59c1.1-.68 2.4-1.07 3.77-1.07s2.67.39 3.77 1.07l2.59-2.59zM12 5c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6-2.69-6-6-6z"/>
                              </svg>
                              Android
                            </a>
                          </div>
                        </div>

                        <div className="setup-section">
                          <h5>Step 2: Sign In to Tailscale</h5>
                          <p>Open Tailscale and sign in with Google, Microsoft, or GitHub.</p>
                          <p className="important-note">
                            <strong>Important:</strong> You must sign in with the <strong>same account</strong> the host is using,
                            OR have the host share their Tailnet with you.
                          </p>
                        </div>

                        <div className="setup-section">
                          <h5>Step 3: Connect</h5>
                          <p>Click "Connect" in the Tailscale app. You'll see a connected status and your Tailscale IP.</p>
                          <p>Once connected, you can reach the host's PC directly using their Tailscale IP: <code>{stream.tailscaleIP}</code></p>
                        </div>

                        <div className="setup-section sharing-section">
                          <h5>Alternative: Get Invited to Host's Tailnet</h5>
                          <p>If the host wants to share without you using the same account:</p>
                          <ol>
                            <li>Host goes to <a href="https://login.tailscale.com/admin/users" target="_blank" rel="noopener noreferrer">Tailscale Admin Console</a></li>
                            <li>Host clicks "Invite users" and enters your email</li>
                            <li>You'll receive an invite email - accept it!</li>
                          </ol>
                        </div>
                      </div>
                    </details>

                    {/* Full Moonlight Setup Guide */}
                    <details className="guide-details">
                      <summary className="guide-details-summary">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                        </svg>
                        First Time? Complete Moonlight Setup
                      </summary>
                      <div className="guide-details-content">
                        <h4>What is Moonlight?</h4>
                        <p>Moonlight is a game streaming client that connects to Sunshine (running on the host's PC) to receive the video stream.</p>

                        <div className="setup-section">
                          <h5>Step 1: Download Moonlight</h5>
                          <p>Get Moonlight for your device:</p>
                          <div className="download-links">
                            <a href="https://github.com/moonlight-stream/moonlight-qt/releases" target="_blank" rel="noopener noreferrer" className="download-link">
                              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M0 3.449L9.75 2.1v9.45H0m10.949-9.602L24 0v11.4H10.949M0 12.6h9.75v9.451L0 20.699M10.949 12.6H24V24l-12.9-1.801"/>
                              </svg>
                              Windows
                            </a>
                            <a href="https://apps.apple.com/app/moonlight-game-streaming/id1000551566" target="_blank" rel="noopener noreferrer" className="download-link">
                              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                              </svg>
                              iOS / macOS
                            </a>
                            <a href="https://play.google.com/store/apps/details?id=com.limelight" target="_blank" rel="noopener noreferrer" className="download-link">
                              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M3 20.5v-17c0-.83.67-1.5 1.5-1.5.4 0 .77.15 1.06.44L19.5 12l-13.94 9.56c-.29.19-.62.44-1.06.44-.83 0-1.5-.67-1.5-1.5z"/>
                              </svg>
                              Android
                            </a>
                          </div>
                        </div>

                        <div className="setup-section">
                          <h5>Step 2: Add Host Computer</h5>
                          <ol>
                            <li>Open Moonlight</li>
                            <li>Click the <strong>+</strong> button or "Add Host"</li>
                            <li>Enter the host's Tailscale IP: <code onClick={copyIP} className="clickable-code">{stream.tailscaleIP}</code></li>
                            <li>Click "OK" or "Add"</li>
                          </ol>
                        </div>

                        <div className="setup-section">
                          <h5>Step 3: Pair with Host (First Time Only)</h5>
                          <p>When connecting for the first time:</p>
                          <ol>
                            <li>Moonlight will show a <strong>4-digit PIN</strong></li>
                            <li>The host needs to enter this PIN in Sunshine</li>
                            <li>Host opens Sunshine web UI (localhost:47990) and enters the PIN</li>
                            <li>Once paired, you won't need to do this again!</li>
                          </ol>
                        </div>

                        <div className="setup-section">
                          <h5>Step 4: Start Watching</h5>
                          <ol>
                            <li>Click on the host computer in Moonlight</li>
                            <li>Select "Desktop" from the app list</li>
                            <li>Enjoy the stream!</li>
                          </ol>
                        </div>

                        <div className="setup-section troubleshoot-section">
                          <h5>Troubleshooting</h5>
                          <ul>
                            <li><strong>Can't find host?</strong> Make sure both devices have Tailscale connected</li>
                            <li><strong>Connection failed?</strong> Host should check if Sunshine is running (tray icon)</li>
                            <li><strong>Black screen?</strong> Try lowering the stream quality in Moonlight settings</li>
                            <li><strong>High latency?</strong> Both devices should have good internet connections</li>
                          </ul>
                        </div>
                      </div>
                    </details>

                    <div className="guide-actions">
                      <button className="guide-connect-btn" onClick={openMoonlight}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                        </svg>
                        Open Moonlight App
                      </button>

                      <button className="guide-dismiss-btn" onClick={() => dismissGuide()}>
                        I'm Connected
                      </button>
                    </div>

                    <label className="guide-remember">
                      <input
                        type="checkbox"
                        checked={dontShowAgain}
                        onChange={(e) => setDontShowAgain(e.target.checked)}
                      />
                      <span>Don't show this again</span>
                    </label>
                  </div>
                </div>
              )}

              <div className="stream-info-bar">
                <div className="stream-host-info">
                  <Avatar
                    src={stream.host?.avatarUrl}
                    alt={stream.host?.displayName || stream.host?.username || "Host"}
                    size="md"
                    status="streaming"
                  />
                  <div className="host-details">
                    <h3>{stream.host?.displayName || stream.host?.username}</h3>
                    <span className="host-username">@{stream.host?.username}</span>
                  </div>
                </div>

                <div className="stream-meta">
                  <div className="meta-item">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                      <circle cx="9" cy="7" r="4" />
                      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                    </svg>
                    <span>{viewers?.length || 0} watching</span>
                  </div>
                  <div className="meta-item">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
                      <line x1="8" y1="21" x2="16" y2="21" />
                      <line x1="12" y1="17" x2="12" y2="21" />
                    </svg>
                    <span>{stream.quality}</span>
                  </div>
                </div>

                <div className="stream-actions">
                  <Button variant="ghost" size="sm" onClick={() => navigate("/lobby")}>
                    Leave
                  </Button>
                </div>
              </div>
            </Card>

            {/* Stream Details */}
            <Card className="stream-details-card">
              <h2 className="stream-title">
                <Badge variant="live" />
                {stream.title}
              </h2>
              <span className="stream-category">
                {stream.category?.replace("_", " ") || "General"}
              </span>
              <p className="stream-description">
                {stream.streamType === "obs"
                  ? "Watching via OBS Studio RTMP stream. Connect using VLC or any compatible RTMP player."
                  : "Watching via Moonlight streaming protocol over Tailscale secure network. Enjoy ultra-low latency and high-quality video directly from the host's PC."}
              </p>
              <div className="tech-specs">
                {stream.streamType === "obs" ? (
                  <>
                    <span className="tech-spec">Server: {stream.obsServerUrl}</span>
                    <span className="tech-spec">Quality: {stream.quality}</span>
                    <span className="tech-spec">Protocol: RTMP/OBS</span>
                  </>
                ) : (
                  <>
                    <span className="tech-spec">Tailscale: {stream.tailscaleIP}</span>
                    <span className="tech-spec">Quality: {stream.quality}</span>
                    <span className="tech-spec">Protocol: Moonlight</span>
                  </>
                )}
              </div>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="watch-stream-sidebar">
            {/* Chat Panel */}
            <Card className="chat-panel">
              <div className="chat-header">
                <h3 className="chat-title">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                  </svg>
                  Stream Chat
                </h3>
              </div>

              <div className="chat-messages" ref={chatContainerRef}>
                {messages && messages.length > 0 ? (
                  messages.map((msg: ChatMessage) => (
                    <div key={msg._id} className={`chat-message ${msg.type === "system" ? "system" : ""}`}>
                      <Avatar
                        src={msg.user?.avatarUrl}
                        alt={msg.user?.username || "User"}
                        size="sm"
                      />
                      <div className="chat-message-content">
                        <div className="chat-message-header">
                          <span
                            className={`chat-sender ${
                              msg.userId === stream.hostId ? "host" : ""
                            }`}
                          >
                            {msg.type === "system" ? "System" : (msg.user?.displayName || msg.user?.username)}
                            {msg.type !== "system" && msg.userId === stream.hostId && " (Host)"}
                          </span>
                          <span className="chat-time">{formatTime(msg.timestamp)}</span>
                        </div>
                        <p className="chat-text">{msg.message}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="no-messages">
                    <p>No messages yet</p>
                    <p>Be the first to chat!</p>
                  </div>
                )}
              </div>

              <div className="chat-input-area">
                <input
                  type="text"
                  className="chat-input"
                  placeholder="Send a message..."
                  value={chatMessage}
                  onChange={(e) => setChatMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  maxLength={500}
                />
                <button
                  className="chat-send-btn"
                  onClick={handleSendMessage}
                  disabled={!chatMessage.trim()}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="22" y1="2" x2="11" y2="13" />
                    <polygon points="22 2 15 22 11 13 2 9 22 2" />
                  </svg>
                </button>
              </div>
            </Card>

            {/* Viewers Panel */}
            <Card className="viewers-panel">
              <div className="viewers-header">
                <h3 className="viewers-title">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                  </svg>
                  Viewers
                </h3>
                <span className="viewer-count">{(viewers?.length || 0) + 1}</span>
              </div>

              <div className="viewers-list">
                {/* Host */}
                <div className="viewer-item host">
                  <Avatar
                    src={stream.host?.avatarUrl}
                    alt={stream.host?.username || "Host"}
                    size="sm"
                    status="streaming"
                  />
                  <div className="viewer-info">
                    <div className="viewer-name">
                      {stream.host?.displayName || stream.host?.username}
                    </div>
                    <div className="viewer-role">Host</div>
                  </div>
                </div>

                {/* Viewers */}
                {viewers?.map((viewer: ViewerData) => (
                  <div key={viewer._id} className="viewer-item">
                    <Avatar
                      src={viewer.user?.avatarUrl}
                      alt={viewer.user?.username || "Viewer"}
                      size="sm"
                      status="online"
                    />
                    <div className="viewer-info">
                      <div className="viewer-name">
                        {viewer.user?.displayName || viewer.user?.username}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
