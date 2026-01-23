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
  const [isConnected, setIsConnected] = useState(false);

  // Handle dismissing the connection guide
  const dismissGuide = useCallback((remember: boolean = false) => {
    if (remember || dontShowAgain) {
      localStorage.setItem(HIDE_CONNECTION_GUIDE_KEY, "true");
    }
    setShowConnectionGuide(false);
    setIsConnected(true);
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
                      <h3>Streaming via Moonlight</h3>
                      <p>Connect using the IP below or click to open Moonlight</p>
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

                    <button className="quick-connect-btn" onClick={openMoonlight}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                      </svg>
                      Open Moonlight
                    </button>

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
                        {stream.host?.displayName || stream.host?.username} is streaming via Moonlight.
                        Follow these steps to connect:
                      </p>
                    </div>

                    <div className="guide-steps">
                      <div className="guide-step">
                        <span className="step-number">1</span>
                        <div className="step-content">
                          <h4>Install Moonlight</h4>
                          <p>Download from <a href="https://moonlight-stream.org/" target="_blank" rel="noopener noreferrer">moonlight-stream.org</a></p>
                        </div>
                      </div>

                      <div className="guide-step">
                        <span className="step-number">2</span>
                        <div className="step-content">
                          <h4>Connect to Tailscale</h4>
                          <p>Make sure you're on the same Tailscale network as the host</p>
                        </div>
                      </div>

                      <div className="guide-step">
                        <span className="step-number">3</span>
                        <div className="step-content">
                          <h4>Add Host in Moonlight</h4>
                          <p>Use this IP address:</p>
                          <div className="guide-ip-box" onClick={copyIP}>
                            <code>{stream.tailscaleIP}</code>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                            </svg>
                          </div>
                        </div>
                      </div>

                      <div className="guide-step">
                        <span className="step-number">4</span>
                        <div className="step-content">
                          <h4>Start Streaming</h4>
                          <p>Select "Desktop" from the host's app list</p>
                        </div>
                      </div>
                    </div>

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
                Watching via Moonlight streaming protocol over Tailscale secure network.
                Enjoy ultra-low latency and high-quality video directly from the host's PC.
              </p>
              <div className="tech-specs">
                <span className="tech-spec">Tailscale: {stream.tailscaleIP}</span>
                <span className="tech-spec">Quality: {stream.quality}</span>
                <span className="tech-spec">Protocol: Moonlight</span>
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
