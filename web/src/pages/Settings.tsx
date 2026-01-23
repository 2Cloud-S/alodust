import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useAuth } from "../hooks/useAuth";
import { TronBackground, Navbar, Container, Card, Button, Input } from "../components";
import "./Settings.css";

export function Settings() {
  const navigate = useNavigate();
  const { userId, isLoaded, isSignedIn } = useAuth();

  // Form state for Tailscale
  const [tailscaleIP, setTailscaleIP] = useState("");
  const [deviceName, setDeviceName] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Get current user data
  const user = useQuery(api.users.getById, userId ? { userId } : "skip");

  // Mutations
  const addTailscaleDevice = useMutation(api.users.addTailscaleDevice);
  const removeTailscaleDevice = useMutation(api.users.removeTailscaleDevice);

  // Load existing Tailscale device data
  useEffect(() => {
    if (user?.tailscaleDevices?.[0]) {
      setTailscaleIP(user.tailscaleDevices[0].ip);
      setDeviceName(user.tailscaleDevices[0].hostname);
    }
  }, [user]);

  // Redirect if not signed in
  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      navigate("/login");
    }
  }, [isLoaded, isSignedIn, navigate]);

  const validateIP = (ip: string): boolean => {
    // Tailscale IPs are in 100.x.x.x range
    const ipRegex = /^100\.\d{1,3}\.\d{1,3}\.\d{1,3}$/;
    if (!ipRegex.test(ip)) return false;

    const parts = ip.split(".").map(Number);
    return parts.every(part => part >= 0 && part <= 255);
  };

  const handleSaveTailscale = async () => {
    if (!userId) return;

    // Validate IP
    if (!tailscaleIP.trim()) {
      setSaveMessage({ type: "error", text: "Please enter your Tailscale IP address" });
      return;
    }

    if (!validateIP(tailscaleIP.trim())) {
      setSaveMessage({ type: "error", text: "Invalid Tailscale IP. It should start with 100. (e.g., 100.64.0.1)" });
      return;
    }

    setIsSaving(true);
    setSaveMessage(null);

    try {
      await addTailscaleDevice({
        userId,
        device: {
          id: "primary-device",
          ip: tailscaleIP.trim(),
          hostname: deviceName.trim() || "My Computer",
          os: navigator.platform,
        },
      });

      setSaveMessage({ type: "success", text: "Tailscale configuration saved! Your friends can now connect to your streams." });
    } catch (error) {
      console.error("Failed to save Tailscale config:", error);
      setSaveMessage({ type: "error", text: "Failed to save. Please try again." });
    } finally {
      setIsSaving(false);
    }
  };

  const handleRemoveDevice = async (deviceId: string) => {
    if (!userId) return;

    try {
      await removeTailscaleDevice({ userId, deviceId });
      setTailscaleIP("");
      setDeviceName("");
      setSaveMessage({ type: "success", text: "Device removed" });
    } catch (error) {
      console.error("Failed to remove device:", error);
    }
  };

  if (!isLoaded) {
    return (
      <div className="settings-page">
        <TronBackground />
        <Navbar />
        <Container>
          <div className="settings-loading">
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
    <div className="settings-page">
      <TronBackground />
      <Navbar />

      <Container className="settings-container">
        <header className="settings-header">
          <h1 className="settings-title">Settings</h1>
          <p className="settings-subtitle">Configure your streaming setup</p>
        </header>

        <div className="settings-grid">
          {/* Tailscale Configuration */}
          <Card className="settings-card tailscale-config" glow="cyan">
            <div className="card-header">
              <div className="card-icon tailscale">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
              </div>
              <div>
                <h2>Tailscale Configuration</h2>
                <p>Required for streaming to friends</p>
              </div>
            </div>

            <div className="card-content">
              <div className="info-box">
                <h4>How to find your Tailscale IP:</h4>
                <ol>
                  <li>Open the Tailscale app on your computer</li>
                  <li>Click on the Tailscale icon in your system tray</li>
                  <li>Your IP will be shown (starts with <code>100.</code>)</li>
                  <li>Or run <code>tailscale ip</code> in terminal</li>
                </ol>
              </div>

              <div className="form-section">
                <Input
                  label="Your Tailscale IP Address"
                  placeholder="100.64.0.1"
                  value={tailscaleIP}
                  onChange={(e) => setTailscaleIP(e.target.value)}
                  helper="This IP will be shared with viewers to connect to your stream"
                />

                <Input
                  label="Device Name (Optional)"
                  placeholder="My Gaming PC"
                  value={deviceName}
                  onChange={(e) => setDeviceName(e.target.value)}
                  helper="A friendly name for this computer"
                />

                {saveMessage && (
                  <div className={`save-message ${saveMessage.type}`}>
                    {saveMessage.type === "success" ? (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    ) : (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10" />
                        <line x1="12" y1="8" x2="12" y2="12" />
                        <line x1="12" y1="16" x2="12.01" y2="16" />
                      </svg>
                    )}
                    {saveMessage.text}
                  </div>
                )}

                <Button
                  variant="primary"
                  onClick={handleSaveTailscale}
                  disabled={isSaving}
                  fullWidth
                >
                  {isSaving ? "Saving..." : "Save Tailscale Configuration"}
                </Button>
              </div>

              {/* Existing devices */}
              {user?.tailscaleDevices && user.tailscaleDevices.length > 0 && (
                <div className="devices-section">
                  <h4>Configured Devices</h4>
                  {user.tailscaleDevices.map((device) => (
                    <div key={device.id} className="device-item">
                      <div className="device-info">
                        <span className="device-name">{device.hostname}</span>
                        <code className="device-ip">{device.ip}</code>
                        <span className="device-last-seen">
                          Last updated: {new Date(device.lastSeen).toLocaleDateString()}
                        </span>
                      </div>
                      <button
                        className="device-remove"
                        onClick={() => handleRemoveDevice(device.id)}
                        title="Remove device"
                      >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <line x1="18" y1="6" x2="6" y2="18" />
                          <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Card>

          {/* Sunshine Setup Guide */}
          <Card className="settings-card sunshine-guide">
            <div className="card-header">
              <div className="card-icon sunshine">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="5" />
                  <line x1="12" y1="1" x2="12" y2="3" />
                  <line x1="12" y1="21" x2="12" y2="23" />
                  <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                  <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                  <line x1="1" y1="12" x2="3" y2="12" />
                  <line x1="21" y1="12" x2="23" y2="12" />
                  <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                  <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
                </svg>
              </div>
              <div>
                <h2>Sunshine Setup</h2>
                <p>Required on your streaming PC</p>
              </div>
            </div>

            <div className="card-content">
              <div className="setup-steps">
                <div className="setup-step">
                  <span className="step-num">1</span>
                  <div className="step-info">
                    <h4>Download Sunshine</h4>
                    <p>Get it from <a href="https://github.com/LizardByte/Sunshine/releases" target="_blank" rel="noopener noreferrer">GitHub Releases</a></p>
                  </div>
                </div>

                <div className="setup-step">
                  <span className="step-num">2</span>
                  <div className="step-info">
                    <h4>Install & Run</h4>
                    <p>Install Sunshine and start the service. It will run in your system tray.</p>
                  </div>
                </div>

                <div className="setup-step">
                  <span className="step-num">3</span>
                  <div className="step-info">
                    <h4>Access Web UI</h4>
                    <p>Open <a href="https://localhost:47990" target="_blank" rel="noopener noreferrer">localhost:47990</a> in your browser to configure.</p>
                  </div>
                </div>

                <div className="setup-step">
                  <span className="step-num">4</span>
                  <div className="step-info">
                    <h4>Create Login</h4>
                    <p>Set up a username and password for the Sunshine web interface.</p>
                  </div>
                </div>

                <div className="setup-step">
                  <span className="step-num">5</span>
                  <div className="step-info">
                    <h4>Ready to Stream!</h4>
                    <p>Sunshine will automatically detect when Moonlight clients connect.</p>
                  </div>
                </div>
              </div>

              <div className="sunshine-note">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                  <line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
                <p>
                  <strong>Note:</strong> When a friend connects for the first time, you'll need to enter
                  the 4-digit PIN they see in Moonlight into the Sunshine web UI.
                </p>
              </div>
            </div>
          </Card>

          {/* Connection Flow Summary */}
          <Card className="settings-card connection-flow">
            <div className="card-header">
              <div className="card-icon flow">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                </svg>
              </div>
              <div>
                <h2>How It All Connects</h2>
                <p>Understanding the streaming flow</p>
              </div>
            </div>

            <div className="card-content">
              <div className="flow-diagram">
                <div className="flow-item">
                  <div className="flow-icon host">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
                      <line x1="8" y1="21" x2="16" y2="21" />
                      <line x1="12" y1="17" x2="12" y2="21" />
                    </svg>
                  </div>
                  <div className="flow-label">
                    <strong>Your PC</strong>
                    <span>Sunshine captures screen</span>
                  </div>
                </div>

                <div className="flow-arrow">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="5" y1="12" x2="19" y2="12" />
                    <polyline points="12 5 19 12 12 19" />
                  </svg>
                  <span>Tailscale VPN</span>
                </div>

                <div className="flow-item">
                  <div className="flow-icon viewer">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
                      <line x1="12" y1="18" x2="12.01" y2="18" />
                    </svg>
                  </div>
                  <div className="flow-label">
                    <strong>Friend's Device</strong>
                    <span>Moonlight displays stream</span>
                  </div>
                </div>
              </div>

              <div className="flow-explanation">
                <p>
                  <strong>Tailscale</strong> creates a secure private network between devices,
                  allowing direct connections even across different networks or locations.
                </p>
                <p>
                  <strong>Sunshine</strong> on your PC captures and encodes your screen,
                  while <strong>Moonlight</strong> on viewers' devices decodes and displays it.
                </p>
              </div>
            </div>
          </Card>
        </div>

        <div className="settings-actions">
          <Button variant="ghost" onClick={() => navigate("/lobby")}>
            Back to Lobby
          </Button>
          <Button variant="primary" onClick={() => navigate("/stream/new")}>
            Start Streaming
          </Button>
        </div>
      </Container>
    </div>
  );
}
