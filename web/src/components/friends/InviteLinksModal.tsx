import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { motion, AnimatePresence } from "framer-motion";
import { api } from "../../../convex/_generated/api";
import { Button } from "../Button";
import { Card } from "../Card";
import "./InviteLinksModal.css";

interface InviteLinksModalProps {
  userId: string;
  onClose: () => void;
}

export function InviteLinksModal({ userId, onClose }: InviteLinksModalProps) {
  const [copySuccess, setCopySuccess] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const invites = useQuery(api.invites.listMyInvites, { userId: userId as any });
  const createInvite = useMutation(api.invites.createInviteLink);
  const revokeInvite = useMutation(api.invites.revokeInvite);

  const handleGenerateLink = async () => {
    setIsGenerating(true);
    try {
      await createInvite({ userId: userId as any });
    } catch (error) {
      console.error("Failed to generate invite:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopyLink = (code: string) => {
    const link = `${window.location.origin}/invite/${code}`;
    navigator.clipboard.writeText(link);
    setCopySuccess(code);
    setTimeout(() => setCopySuccess(null), 2000);
  };

  const handleRevoke = async (inviteId: string) => {
    if (!confirm("Are you sure you want to revoke this invite link?")) return;
    try {
      await revokeInvite({ inviteId: inviteId as any, userId: userId as any });
    } catch (error) {
      console.error("Failed to revoke invite:", error);
    }
  };

  const formatTimeRemaining = (expiresAt: number) => {
    const remaining = expiresAt - Date.now();
    const days = Math.floor(remaining / (1000 * 60 * 60 * 24));
    const hours = Math.floor((remaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h`;
    return "< 1h";
  };

  const activeInvites = invites?.filter((inv) => !inv.isExpired) || [];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <motion.div
        className="modal-content invite-links-modal"
        onClick={(e) => e.stopPropagation()}
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
      >
        <div className="modal-header">
          <h2>Friend Invite Links</h2>
          <button className="close-btn" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="modal-body">
          <div className="invite-description">
            <p>Share invite links with friends to instantly become friends on Alodust.</p>
            <p className="subtle">Links expire after 7 days and can be revoked anytime.</p>
          </div>

          <Button
            onClick={handleGenerateLink}
            disabled={isGenerating}
            className="generate-btn"
          >
            {isGenerating ? "Generating..." : "+ Generate New Link"}
          </Button>

          <div className="invites-list">
            {activeInvites.length === 0 ? (
              <div className="empty-state">
                <p>No active invite links</p>
                <p className="subtle">Create one to get started!</p>
              </div>
            ) : (
              <AnimatePresence>
                {activeInvites.map((invite) => (
                  <motion.div
                    key={invite._id}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                  >
                    <Card className="invite-card" glowColor="cyan">
                      <div className="invite-info">
                        <div className="invite-code">
                          <span className="code-label">Code:</span>
                          <span className="code-value">{invite.code}</span>
                        </div>

                        <div className="invite-stats">
                          <div className="stat">
                            <span className="stat-label">Expires:</span>
                            <span className="stat-value">
                              {formatTimeRemaining(invite.expiresAt)}
                            </span>
                          </div>
                          <div className="stat">
                            <span className="stat-label">Uses:</span>
                            <span className="stat-value">
                              {invite.usedBy.length}
                              {invite.maxUses && ` / ${invite.maxUses}`}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="invite-actions">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleCopyLink(invite.code)}
                        >
                          {copySuccess === invite.code ? "✓ Copied!" : "Copy Link"}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="revoke-btn"
                          onClick={() => handleRevoke(invite._id)}
                        >
                          Revoke
                        </Button>
                      </div>
                    </Card>
                  </motion.div>
                ))}
              </AnimatePresence>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
