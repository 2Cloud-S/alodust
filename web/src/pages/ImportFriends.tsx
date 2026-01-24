import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useAuth } from "../hooks/useAuth";
import { TronBackground, Navbar, Container, Card, Button, Avatar } from "../components";
import "./ImportFriends.css";

type ImportSource = "discord" | "steam";

export function ImportFriends() {
  const { source } = useParams<{ source: ImportSource }>();
  const navigate = useNavigate();
  const { userId } = useAuth();
  const [selectedFriends, setSelectedFriends] = useState<Set<string>>(new Set());
  const [sending, setSending] = useState(false);

  const importedData = useQuery(
    api.imports.getImportedFriends,
    userId && source ? { userId, source: source as "discord" | "steam" } : "skip"
  );

  const sendRequests = useMutation(api.imports.sendRequestsToImported);

  const handleToggleSelection = (friendId: string) => {
    const newSelection = new Set(selectedFriends);
    if (newSelection.has(friendId)) {
      newSelection.delete(friendId);
    } else {
      newSelection.add(friendId);
    }
    setSelectedFriends(newSelection);
  };

  const handleSelectAll = () => {
    if (!importedData?.matched) return;
    const allIds = importedData.matched.map((f) => f._id);
    setSelectedFriends(new Set(allIds));
  };

  const handleDeselectAll = () => {
    setSelectedFriends(new Set());
  };

  const handleSendRequests = async () => {
    if (!userId || selectedFriends.size === 0) return;

    setSending(true);
    try {
      const result = await sendRequests({
        userId,
        importedIds: Array.from(selectedFriends) as any[],
      });

      alert(`Sent ${result.sent} friend requests!`);
      navigate("/lobby");
    } catch (error) {
      console.error("Failed to send requests:", error);
      alert("Failed to send friend requests. Please try again.");
    } finally {
      setSending(false);
    }
  };

  if (!source || (source !== "discord" && source !== "steam")) {
    return (
      <div className="import-friends-page">
        <TronBackground />
        <Navbar />
        <Container>
          <Card>
            <h2>Invalid source</h2>
            <Link to="/settings">Back to Settings</Link>
          </Card>
        </Container>
      </div>
    );
  }

  const sourceName = source === "discord" ? "Discord" : "Steam";
  const sourceIcon = source === "discord" ? "🎮" : "🎮";

  return (
    <div className="import-friends-page">
      <TronBackground />
      <Navbar />

      <Container>
        <div className="import-header">
          <h1 className="import-title">
            {sourceIcon} {sourceName} Friends
          </h1>
          <p className="import-subtitle">
            Send friend requests to {sourceName} friends already on Alodust
          </p>
        </div>

        {!importedData ? (
          <Card>
            <div className="loading-state">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
              <p>Loading imported friends...</p>
            </div>
          </Card>
        ) : (
          <>
            {/* Matched Friends */}
            {importedData.matched.length > 0 && (
              <Card className="matched-friends-card">
                <div className="section-header">
                  <h2>
                    Found on Alodust ({importedData.matched.length})
                  </h2>
                  <div className="selection-actions">
                    <button onClick={handleSelectAll} className="action-btn">
                      Select All
                    </button>
                    <button onClick={handleDeselectAll} className="action-btn">
                      Deselect All
                    </button>
                  </div>
                </div>

                <div className="friends-grid">
                  {importedData.matched.map((imported) => (
                    <div
                      key={imported._id}
                      className={`friend-item ${
                        selectedFriends.has(imported._id) ? "selected" : ""
                      } ${imported.imported ? "already-sent" : ""}`}
                      onClick={() =>
                        !imported.imported && handleToggleSelection(imported._id)
                      }
                    >
                      <div className="friend-checkbox">
                        {imported.imported ? (
                          <span className="checkmark-sent">✓</span>
                        ) : (
                          <input
                            type="checkbox"
                            checked={selectedFriends.has(imported._id)}
                            onChange={() => handleToggleSelection(imported._id)}
                            onClick={(e) => e.stopPropagation()}
                          />
                        )}
                      </div>

                      <Avatar
                        src={imported.user?.avatarUrl}
                        alt={imported.user?.displayName || imported.user?.username || "User"}
                        size="md"
                        status={imported.user?.status}
                      />

                      <div className="friend-info">
                        <span className="friend-name">
                          {imported.user?.displayName || imported.user?.username}
                        </span>
                        <span className="external-name">{imported.externalUsername}</span>
                        {imported.imported && (
                          <span className="already-sent-label">Request Sent</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {selectedFriends.size > 0 && (
                  <div className="send-requests-section">
                    <Button
                      onClick={handleSendRequests}
                      disabled={sending}
                      variant="primary"
                      fullWidth
                    >
                      {sending
                        ? "Sending..."
                        : `Send ${selectedFriends.size} Friend Request${
                            selectedFriends.size !== 1 ? "s" : ""
                          }`}
                    </Button>
                  </div>
                )}
              </Card>
            )}

            {/* Unmatched Friends */}
            {importedData.unmatched.length > 0 && (
              <Card className="unmatched-friends-card">
                <div className="section-header">
                  <h2>Not on Alodust Yet ({importedData.unmatched.length})</h2>
                </div>

                <div className="unmatched-grid">
                  {importedData.unmatched.map((imported) => (
                    <div key={imported._id} className="unmatched-item">
                      <span className="unmatched-name">{imported.externalUsername}</span>
                    </div>
                  ))}
                </div>

                <p className="unmatched-note">
                  Invite them to Alodust to connect! Share your{" "}
                  <Link to="/lobby">friend invite link</Link>.
                </p>
              </Card>
            )}

            {importedData.matched.length === 0 && importedData.unmatched.length === 0 && (
              <Card>
                <div className="empty-state">
                  <p>No {sourceName} friends found.</p>
                  <Link to="/settings">Back to Settings</Link>
                </div>
              </Card>
            )}
          </>
        )}
      </Container>
    </div>
  );
}
