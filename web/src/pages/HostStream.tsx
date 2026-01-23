import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useAuth } from "../hooks/useAuth";
import { TronBackground, Navbar, Container, Card, Button, Input, Avatar, Chat } from "../components";
import "./HostStream.css";

type Privacy = "friends" | "invite" | "public";
type Quality = "1080p60" | "1080p30" | "720p60" | "720p30" | "480p30";
type Category = "gaming" | "movies" | "creative" | "just_chatting" | "music" | "sports" | "other";

interface SetupStatus {
  sunshine: "checking" | "ready" | "not-ready";
  tailscale: "checking" | "ready" | "not-ready";
  network: "checking" | "ready" | "not-ready";
}

interface ViewerData {
  _id: string;
  user?: {
    avatarUrl?: string;
    displayName?: string;
    username?: string;
  } | null;
  joinedAt: number;
}

export function HostStream() {
  const navigate = useNavigate();
  const { userId, isLoaded, isSignedIn } = useAuth();

  // Form state
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<Category>("gaming");
  const [quality, setQuality] = useState<Quality>("1080p60");
  const [privacy, setPrivacy] = useState<Privacy>("friends");

  // Setup status (simulated for now)
  const [setupStatus, setSetupStatus] = useState<SetupStatus>({
    sunshine: "checking",
    tailscale: "checking",
    network: "checking",
  });

  // Convex mutations
  const createStream = useMutation(api.streams.createStream);
  const endStream = useMutation(api.streams.endStream);

  // Get current active stream
  const activeStream = useQuery(
    api.streams.getActiveStreamByHost,
    userId ? { hostId: userId } : "skip"
  );

  // Get viewers for active stream
  const viewers = useQuery(
    api.streams.getStreamViewers,
    activeStream?._id ? { streamId: activeStream._id } : "skip"
  );

  // Elapsed time for live stream
  const [elapsedTime, setElapsedTime] = useState("00:00:00");

  // Simulate setup check
  useEffect(() => {
    const checkSetup = async () => {
      // Simulate checking Sunshine
      setTimeout(() => {
        setSetupStatus((prev) => ({ ...prev, sunshine: "ready" }));
      }, 1000);

      // Simulate checking Tailscale
      setTimeout(() => {
        setSetupStatus((prev) => ({ ...prev, tailscale: "ready" }));
      }, 1500);

      // Simulate checking network
      setTimeout(() => {
        setSetupStatus((prev) => ({ ...prev, network: "ready" }));
      }, 2000);
    };

    checkSetup();
  }, []);

  // Update elapsed time
  useEffect(() => {
    if (!activeStream?.startedAt) return;

    const updateElapsed = () => {
      const start = new Date(activeStream.startedAt).getTime();
      const now = Date.now();
      const diff = Math.floor((now - start) / 1000);

      const hours = Math.floor(diff / 3600);
      const minutes = Math.floor((diff % 3600) / 60);
      const seconds = diff % 60;

      setElapsedTime(
        `${hours.toString().padStart(2, "0")}:${minutes
          .toString()
          .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`
      );
    };

    updateElapsed();
    const interval = setInterval(updateElapsed, 1000);
    return () => clearInterval(interval);
  }, [activeStream?.startedAt]);

  // Redirect if not signed in
  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      navigate("/login");
    }
  }, [isLoaded, isSignedIn, navigate]);

  const handleStartStream = async () => {
    if (!userId || !title.trim()) return;

    try {
      await createStream({
        hostId: userId,
        title: title.trim(),
        category,
        quality,
        privacy,
      });
    } catch (error) {
      console.error("Failed to start stream:", error);
    }
  };

  const handleEndStream = async () => {
    if (!activeStream?._id) return;

    try {
      await endStream({ streamId: activeStream._id });
    } catch (error) {
      console.error("Failed to end stream:", error);
    }
  };

  const copyInviteCode = () => {
    if (activeStream?.inviteCode) {
      navigator.clipboard.writeText(activeStream.inviteCode);
    }
  };

  const isSetupReady =
    setupStatus.sunshine === "ready" &&
    setupStatus.tailscale === "ready" &&
    setupStatus.network === "ready";

  const canStartStream = isSetupReady && title.trim().length > 0;

  if (!isLoaded) {
    return (
      <div className="host-stream-page">
        <TronBackground />
        <Navbar />
        <Container>
          <div className="stream-loading">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2v4m0 12v4M4.93 4.93l2.83 2.83m8.48 8.48l2.83 2.83M2 12h4m12 0h4M4.93 19.07l2.83-2.83m8.48-8.48l2.83-2.83" />
            </svg>
            <span>Loading...</span>
          </div>
        </Container>
      </div>
    );
  }

  return (
    <div className="host-stream-page">
      <TronBackground />
      <Navbar />

      <div className="host-stream-container">
        <header className="host-stream-header">
          <h1 className="host-stream-title">
            {activeStream ? "You're Live!" : "Host a Stream"}
          </h1>
          <p className="host-stream-subtitle">
            {activeStream
              ? "Your friends can now join your stream"
              : "Share your screen with friends using Sunshine streaming"}
          </p>
        </header>

        <div className="host-stream-grid">
          <div className="host-stream-main">
            {activeStream ? (
              /* Live Stream Panel */
              <Card className="live-stream-panel" glow="cyan">
                <div className="live-stream-header">
                  <h2 className="live-stream-title">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polygon points="23 7 16 12 23 17 23 7" />
                      <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
                    </svg>
                    {activeStream.title}
                  </h2>
                  <div className="live-indicator">
                    <span className="live-dot" />
                    LIVE
                  </div>
                </div>

                <div className="live-stream-stats">
                  <div className="live-stat">
                    <div className="live-stat-value">{viewers?.length || 0}</div>
                    <div className="live-stat-label">Viewers</div>
                  </div>
                  <div className="live-stat">
                    <div className="live-stat-value elapsed-time">{elapsedTime}</div>
                    <div className="live-stat-label">Duration</div>
                  </div>
                  <div className="live-stat">
                    <div className="live-stat-value">{activeStream.quality}</div>
                    <div className="live-stat-label">Quality</div>
                  </div>
                </div>

                <div className="stream-info-grid">
                  <div className="stream-info-item">
                    <span>Category</span>
                    <span>{activeStream.category.replace("_", " ")}</span>
                  </div>
                  <div className="stream-info-item">
                    <span>Privacy</span>
                    <span>{activeStream.privacy}</span>
                  </div>
                  <div className="stream-info-item">
                    <span>Peak Viewers</span>
                    <span>{activeStream.peakViewers}</span>
                  </div>
                </div>

                {activeStream.inviteCode && (
                  <div className="invite-code-display">
                    <div>
                      <div className="invite-code-label">Invite Code</div>
                      <div className="invite-code-value">{activeStream.inviteCode}</div>
                    </div>
                    <button className="copy-invite-btn" onClick={copyInviteCode}>
                      Copy
                    </button>
                  </div>
                )}

                <div className="live-stream-actions">
                  <Button variant="danger" onClick={handleEndStream} fullWidth>
                    End Stream
                  </Button>
                </div>
              </Card>
            ) : (
              <>
                {/* Setup Status */}
                <Card className="setup-status">
                  <h2 className="setup-status-title">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                      <polyline points="22 4 12 14.01 9 11.01" />
                    </svg>
                    Setup Status
                  </h2>

                  <div className="setup-status-items">
                    <div className="setup-status-item">
                      <div className={`status-indicator ${setupStatus.sunshine}`}>
                        {setupStatus.sunshine === "ready" ? (
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        ) : setupStatus.sunshine === "checking" ? (
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="12" cy="12" r="10" />
                            <polyline points="12 6 12 12 16 14" />
                          </svg>
                        ) : (
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="12" cy="12" r="10" />
                            <line x1="15" y1="9" x2="9" y2="15" />
                            <line x1="9" y1="9" x2="15" y2="15" />
                          </svg>
                        )}
                      </div>
                      <div className="status-info">
                        <div className="status-name">Sunshine</div>
                        <div className="status-description">
                          {setupStatus.sunshine === "ready"
                            ? "Sunshine is running and ready"
                            : setupStatus.sunshine === "checking"
                            ? "Checking Sunshine status..."
                            : "Sunshine not detected. Please start it."}
                        </div>
                      </div>
                      {setupStatus.sunshine === "not-ready" && (
                        <Button variant="ghost" size="sm" className="status-action">
                          Help
                        </Button>
                      )}
                    </div>

                    <div className="setup-status-item">
                      <div className={`status-indicator ${setupStatus.tailscale}`}>
                        {setupStatus.tailscale === "ready" ? (
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        ) : setupStatus.tailscale === "checking" ? (
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="12" cy="12" r="10" />
                            <polyline points="12 6 12 12 16 14" />
                          </svg>
                        ) : (
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="12" cy="12" r="10" />
                            <line x1="15" y1="9" x2="9" y2="15" />
                            <line x1="9" y1="9" x2="15" y2="15" />
                          </svg>
                        )}
                      </div>
                      <div className="status-info">
                        <div className="status-name">Tailscale</div>
                        <div className="status-description">
                          {setupStatus.tailscale === "ready"
                            ? "Connected to your Tailnet"
                            : setupStatus.tailscale === "checking"
                            ? "Checking Tailscale connection..."
                            : "Tailscale not connected"}
                        </div>
                      </div>
                      {setupStatus.tailscale === "not-ready" && (
                        <Button variant="ghost" size="sm" className="status-action">
                          Connect
                        </Button>
                      )}
                    </div>

                    <div className="setup-status-item">
                      <div className={`status-indicator ${setupStatus.network}`}>
                        {setupStatus.network === "ready" ? (
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        ) : setupStatus.network === "checking" ? (
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="12" cy="12" r="10" />
                            <polyline points="12 6 12 12 16 14" />
                          </svg>
                        ) : (
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="12" cy="12" r="10" />
                            <line x1="15" y1="9" x2="9" y2="15" />
                            <line x1="9" y1="9" x2="15" y2="15" />
                          </svg>
                        )}
                      </div>
                      <div className="status-info">
                        <div className="status-name">Network</div>
                        <div className="status-description">
                          {setupStatus.network === "ready"
                            ? "Network connection stable"
                            : setupStatus.network === "checking"
                            ? "Testing network quality..."
                            : "Network issues detected"}
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>

                {/* Stream Settings */}
                <Card className="stream-settings">
                  <h2 className="stream-settings-title">Stream Settings</h2>

                  <div className="stream-form">
                    <Input
                      label="Stream Title"
                      placeholder="What are you streaming today?"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                    />

                    <div className="form-row">
                      <div className="form-group">
                        <label className="form-label">Category</label>
                        <select
                          className="form-select"
                          value={category}
                          onChange={(e) => setCategory(e.target.value as Category)}
                        >
                          <option value="gaming">Gaming</option>
                          <option value="movies">Movies & TV</option>
                          <option value="creative">Creative</option>
                          <option value="just_chatting">Just Chatting</option>
                          <option value="music">Music</option>
                          <option value="sports">Sports</option>
                          <option value="other">Other</option>
                        </select>
                      </div>

                      <div className="form-group">
                        <label className="form-label">Quality</label>
                        <select
                          className="form-select"
                          value={quality}
                          onChange={(e) => setQuality(e.target.value as Quality)}
                        >
                          <option value="1080p60">1080p @ 60fps</option>
                          <option value="1080p30">1080p @ 30fps</option>
                          <option value="720p60">720p @ 60fps</option>
                          <option value="720p30">720p @ 30fps</option>
                          <option value="480p30">480p @ 30fps</option>
                        </select>
                      </div>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Privacy</label>
                      <div className="privacy-options">
                        <div
                          className={`privacy-option ${privacy === "friends" ? "selected" : ""}`}
                          onClick={() => setPrivacy("friends")}
                        >
                          <div className="privacy-radio" />
                          <div className="privacy-info">
                            <h4>Friends Only</h4>
                            <p>Only your friends can see and join your stream</p>
                          </div>
                        </div>

                        <div
                          className={`privacy-option ${privacy === "invite" ? "selected" : ""}`}
                          onClick={() => setPrivacy("invite")}
                        >
                          <div className="privacy-radio" />
                          <div className="privacy-info">
                            <h4>Invite Only</h4>
                            <p>Share an invite code for others to join</p>
                          </div>
                        </div>

                        <div
                          className={`privacy-option ${privacy === "public" ? "selected" : ""}`}
                          onClick={() => setPrivacy("public")}
                        >
                          <div className="privacy-radio" />
                          <div className="privacy-info">
                            <h4>Public</h4>
                            <p>Anyone can discover and join your stream</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="form-actions">
                      <Button
                        variant="primary"
                        onClick={handleStartStream}
                        disabled={!canStartStream}
                        fullWidth
                      >
                        {!isSetupReady ? "Checking Setup..." : "Start Stream"}
                      </Button>
                    </div>
                  </div>
                </Card>
              </>
            )}
          </div>

          <div className="host-stream-sidebar">
            {/* Viewers Panel */}
            {activeStream && (
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
                  <span className="viewer-count">{viewers?.length || 0}</span>
                </div>

                <div className="viewers-list">
                  {viewers && viewers.length > 0 ? (
                    viewers.map((viewer: ViewerData) => (
                      <div key={viewer._id} className="viewer-item">
                        <Avatar
                          src={viewer.user?.avatarUrl}
                          alt={viewer.user?.displayName || viewer.user?.username || "Viewer"}
                          size="sm"
                          status="online"
                        />
                        <div className="viewer-info">
                          <div className="viewer-name">
                            {viewer.user?.displayName || viewer.user?.username}
                          </div>
                          <div className="viewer-joined">
                            Joined {new Date(viewer.joinedAt).toLocaleTimeString()}
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="no-viewers">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                        <circle cx="9" cy="7" r="4" />
                      </svg>
                      <p>No viewers yet</p>
                      <p style={{ fontSize: "var(--text-xs)" }}>
                        Share your stream to invite friends
                      </p>
                    </div>
                  )}
                </div>
              </Card>
            )}

            {/* Chat Panel (when streaming) */}
            {activeStream && userId && (
              <Chat
                streamId={activeStream._id}
                userId={userId}
                hostId={userId}
                isHost={true}
              />
            )}

            {/* Quick Tips */}
            <Card className="quick-tips">
              <h3 className="quick-tips-title">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                  <line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
                Quick Tips
              </h3>

              <div className="tips-list">
                <div className="tip-item">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="9 11 12 14 22 4" />
                    <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
                  </svg>
                  <span>Make sure Sunshine is running before starting</span>
                </div>
                <div className="tip-item">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="9 11 12 14 22 4" />
                    <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
                  </svg>
                  <span>Use "Friends Only" for private watch parties</span>
                </div>
                <div className="tip-item">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="9 11 12 14 22 4" />
                    <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
                  </svg>
                  <span>Lower quality settings can improve stability</span>
                </div>
                <div className="tip-item">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="9 11 12 14 22 4" />
                    <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
                  </svg>
                  <span>Viewers connect directly via Tailscale</span>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
