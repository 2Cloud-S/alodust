import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useAuth } from "../hooks/useAuth";
import { TronBackground, Navbar, Container, Card, Button, Input } from "../components";
import { initiateDiscordOAuth } from "../services/discordAuth";
import { initiateSteamAuth } from "../services/steamAuth";
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

  // Get connected accounts
  const discordAccount = useQuery(
    api.imports.getConnectedAccount,
    userId ? { userId, source: "discord" } : "skip"
  );
  const steamAccount = useQuery(
    api.imports.getConnectedAccount,
    userId ? { userId, source: "steam" } : "skip"
  );

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

          {/* Import Friends from Discord/Steam */}
          <Card className="settings-card import-friends-section" glow="magenta">
            <div className="card-header">
              <div className="card-icon import">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="8.5" cy="7" r="4" />
                  <line x1="20" y1="8" x2="20" y2="14" />
                  <line x1="23" y1="11" x2="17" y2="11" />
                </svg>
              </div>
              <div>
                <h2>Import Friends</h2>
                <p>Connect your Discord or Steam account to find friends already on Alodust</p>
              </div>
            </div>

            <div className="card-content">
              <div className="import-platforms">
                {/* Discord */}
                <div className="platform-connect">
                  <div className="platform-info">
                    <div className="platform-icon discord">
                      <svg viewBox="0 0 24 24" fill="currentColor">
                        <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515a.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0a12.64 12.64 0 0 0-.617-1.25a.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057a19.9 19.9 0 0 0 5.993 3.03a.078.078 0 0 0 .084-.028a14.09 14.09 0 0 0 1.226-1.994a.076.076 0 0 0-.041-.106a13.107 13.107 0 0 1-1.872-.892a.077.077 0 0 1-.008-.128a10.2 10.2 0 0 0 .372-.292a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127a12.299 12.299 0 0 1-1.873.892a.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028a19.839 19.839 0 0 0 6.002-3.03a.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.956-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.955-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.946 2.418-2.157 2.418z"/>
                      </svg>
                    </div>
                    <div className="platform-text">
                      <h3>Discord</h3>
                      {discordAccount ? (
                        <p className="connected">Connected as {"username" in discordAccount ? discordAccount.username : "Unknown"}</p>
                      ) : (
                        <p>Connect to find Discord friends</p>
                      )}
                    </div>
                  </div>

                  {discordAccount ? (
                    <Button variant="ghost" onClick={() => navigate("/import/discord")}>
                      View Imported
                    </Button>
                  ) : (
                    <Button variant="primary" onClick={initiateDiscordOAuth}>
                      Connect Discord
                    </Button>
                  )}
                </div>

                {/* Steam */}
                <div className="platform-connect">
                  <div className="platform-info">
                    <div className="platform-icon steam">
                      <svg viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2a10 10 0 0 1 10 10a10 10 0 0 1-10 10C6.47 22 2 17.5 2 12S6.5 2 12 2m0-.5C6.21 1.5 1.5 6.2 1.5 12c0 4.13 2.39 7.71 5.87 9.41l3.24-4.74c.17-1.62 1.5-2.91 3.14-2.91c1.73 0 3.15 1.4 3.15 3.15c0 1.73-1.42 3.14-3.15 3.14c-.11 0-.22 0-.32-.02l-4.61 3.28C9.49 23.75 10.72 24 12 24c5.79 0 10.5-4.71 10.5-10.5S17.79 1.5 12 1.5m-1.86 15.89c1.37 0 2.5-1.13 2.5-2.5s-1.13-2.5-2.5-2.5l-1.11.66c.74.39 1.25 1.17 1.25 2.09a2.5 2.5 0 0 1-2.5 2.5l1.08.63c.42.12.86.18 1.28.18m6.16-4.84c0-1.16-.93-2.09-2.09-2.09c-1.16 0-2.09.93-2.09 2.09s.93 2.09 2.09 2.09c1.16 0 2.09-.94 2.09-2.09m-3.56 0c0-.82.66-1.48 1.48-1.48c.81 0 1.48.66 1.48 1.48c0 .81-.67 1.48-1.48 1.48c-.82 0-1.48-.67-1.48-1.48z"/>
                      </svg>
                    </div>
                    <div className="platform-text">
                      <h3>Steam</h3>
                      {steamAccount ? (
                        <p className="connected">
                          Connected as {"personaName" in steamAccount ? steamAccount.personaName : "Unknown"}
                        </p>
                      ) : (
                        <p>Connect to find Steam friends</p>
                      )}
                    </div>
                  </div>

                  {steamAccount ? (
                    <Button variant="ghost" onClick={() => navigate("/import/steam")}>
                      View Imported
                    </Button>
                  ) : (
                    <Button variant="primary" onClick={initiateSteamAuth}>
                      Connect Steam
                    </Button>
                  )}
                </div>
              </div>

              <div className="import-note">
                <p>
                  ℹ️ This is a one-time import. Friends are matched by their connected accounts.
                  We do not store your login credentials or auto-sync friends.
                </p>
              </div>
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
