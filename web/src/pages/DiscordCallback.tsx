import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useAuth } from "../hooks/useAuth";
import { handleDiscordCallback } from "../services/discordAuth";
import { TronBackground, Navbar, Container, Card } from "../components";
import "./AuthCallback.css";

export function DiscordCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { userId } = useAuth();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("Connecting to Discord...");
  const [importStats, setImportStats] = useState<{ total: number; matched: number } | null>(null);

  const importDiscordFriends = useMutation(api.imports.importDiscordFriends);

  useEffect(() => {
    const processCallback = async () => {
      const code = searchParams.get("code");
      const state = searchParams.get("state");
      const error = searchParams.get("error");

      if (error) {
        setStatus("error");
        setMessage(`Discord authorization failed: ${error}`);
        return;
      }

      if (!code || !state) {
        setStatus("error");
        setMessage("Missing authorization code or state");
        return;
      }

      if (!userId) {
        setStatus("error");
        setMessage("You must be logged in to connect Discord");
        return;
      }

      try {
        setMessage("Fetching Discord data...");
        const { user, connections } = await handleDiscordCallback(code, state);

        setMessage("Importing friends...");
        const stats = await importDiscordFriends({
          userId,
          discordId: user.id,
          discordUsername: user.username,
          connections: connections.map((conn: { id: string; name: string; type: string }) => ({
            id: conn.id,
            name: conn.name,
            type: conn.type,
          })),
        });

        setImportStats(stats);
        setStatus("success");
        setMessage("Discord connected successfully!");

        // Redirect to import page after 2 seconds
        setTimeout(() => {
          navigate("/import/discord");
        }, 2000);
      } catch (error) {
        console.error("Discord callback error:", error);
        setStatus("error");
        setMessage(error instanceof Error ? error.message : "Failed to connect Discord");
      }
    };

    processCallback();
  }, [searchParams, userId, importDiscordFriends, navigate]);

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
              <p>Found {importStats.total} connections</p>
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
