import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useAuth } from "../hooks/useAuth";
import { extractSteamId, getSteamDataSecurely } from "../services/steamAuth";
import { TronBackground, Navbar, Container, Card } from "../components";
import "./AuthCallback.css";

export function SteamCallback() {
  const navigate = useNavigate();
  const { userId } = useAuth();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("Connecting to Steam...");
  const [importStats, setImportStats] = useState<{ total: number; matched: number } | null>(null);

  const importSteamFriends = useMutation(api.imports.importSteamFriends);

  useEffect(() => {
    const processCallback = async () => {
      // Extract Steam ID from URL
      const steamId = extractSteamId(window.location.href);

      if (!steamId) {
        setStatus("error");
        setMessage("Failed to extract Steam ID from callback");
        return;
      }

      if (!userId) {
        setStatus("error");
        setMessage("You must be logged in to connect Steam");
        return;
      }

      try {
        setMessage("Fetching Steam data...");
        const { userInfo, friends } = await getSteamDataSecurely(steamId);

        setMessage("Importing friends...");
        const stats = await importSteamFriends({
          userId,
          steamId: userInfo.steamid,
          steamName: userInfo.personaname,
          friends: friends.map((f: { steamid: string; personaname: string }) => ({
            steamid: f.steamid,
            personaname: f.personaname,
          })),
        });

        setImportStats(stats);
        setStatus("success");
        setMessage("Steam connected successfully!");

        // Redirect to import page after 2 seconds
        setTimeout(() => {
          navigate("/import/steam");
        }, 2000);
      } catch (error) {
        console.error("Steam callback error:", error);
        setStatus("error");
        setMessage(error instanceof Error ? error.message : "Failed to connect Steam");
      }
    };

    processCallback();
  }, [userId, importSteamFriends, navigate]);

  return (
    <div className="auth-callback-page">
      <TronBackground />
      <Navbar />

      <Container>
        <Card className="auth-callback-card">
          <div className={`callback-status ${status}`}>
            {status === "loading" && (
              <div className="loading-spinner">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
              </div>
            )}

            {status === "success" && (
              <div className="success-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
            )}

            {status === "error" && (
              <div className="error-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="15" y1="9" x2="9" y2="15" />
                  <line x1="9" y1="9" x2="15" y2="15" />
                </svg>
              </div>
            )}
          </div>

          <h2 className="callback-title">{message}</h2>

          {importStats && (
            <div className="import-stats">
              <p>Found {importStats.total} friends</p>
              <p className="matched-count">{importStats.matched} already on Alodust!</p>
            </div>
          )}

          {status === "error" && (
            <div className="callback-actions">
              <button onClick={() => navigate("/settings")} className="btn-secondary">
                Back to Settings
              </button>
            </div>
          )}
        </Card>
      </Container>
    </div>
  );
}
