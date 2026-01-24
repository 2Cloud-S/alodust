import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery, useMutation } from "convex/react";
import { motion } from "framer-motion";
import { api } from "../../convex/_generated/api";
import { useAuth } from "../hooks";
import {
  Container,
  TronBackground,
  Navbar,
  Button,
  Card,
  Avatar,
} from "../components";
import "./AcceptInvite.css";

export function AcceptInvite() {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const { userId, isLoaded, isSignedIn } = useAuth();

  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [errorMessage, setErrorMessage] = useState("");

  const invite = useQuery(
    api.invites.getInviteByCode,
    code ? { code } : "skip"
  );
  const acceptInvite = useMutation(api.invites.acceptInviteLink);

  useEffect(() => {
    if (!isLoaded || !code) return;

    // If not signed in, don't try to accept yet
    if (!isSignedIn) {
      setStatus("loading"); // Keep loading, will show sign-in prompt
      return;
    }

    // If signed in and have userId and invite data
    if (userId && invite) {
      handleAccept();
    }
  }, [isLoaded, isSignedIn, userId, invite, code]);

  const handleAccept = async () => {
    if (!userId || !code) return;

    try {
      await acceptInvite({
        code,
        acceptorId: userId as any,
      });
      setStatus("success");
      setTimeout(() => navigate("/lobby"), 2000);
    } catch (error: any) {
      setStatus("error");
      setErrorMessage(error.message || "Failed to accept invite");
    }
  };

  if (!code) {
    return (
      <div className="accept-invite">
        <TronBackground showGrid showPerspective />
        <Navbar />
        <Container>
          <div className="accept-invite-content">
            <Card className="status-card error">
              <h2>Invalid Invite Link</h2>
              <p>This invite link appears to be malformed.</p>
              <Link to="/lobby">
                <Button>Go to Lobby</Button>
              </Link>
            </Card>
          </div>
        </Container>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="accept-invite">
        <TronBackground showGrid showPerspective />
        <Navbar />
        <Container>
          <div className="accept-invite-content">
            <Card className="status-card loading">
              <div className="spinner"></div>
              <p>Loading...</p>
            </Card>
          </div>
        </Container>
      </div>
    );
  }

  // Not signed in - show sign-in prompt
  if (!isSignedIn) {
    return (
      <div className="accept-invite">
        <TronBackground showGrid showPerspective />
        <Navbar />
        <Container>
          <div className="accept-invite-content">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card className="invite-preview-card">
                {invite && !invite.isExpired && !invite.isMaxedOut ? (
                  <>
                    <div className="invite-from">
                      <Avatar
                        src={invite.creatorAvatarUrl}
                        alt={invite.creatorUsername}
                        size="lg"
                      />
                      <div className="invite-from-text">
                        <p className="label">Friend Invite From</p>
                        <h3>{invite.creatorDisplayName || invite.creatorUsername}</h3>
                        <p className="username">@{invite.creatorUsername}</p>
                      </div>
                    </div>

                    <div className="invite-message">
                      <p>
                        Sign in or create an account to accept this friend invite and
                        start watching together!
                      </p>
                    </div>

                    <div className="auth-actions">
                      <Link to={`/login?redirect=/invite/${code}`}>
                        <Button variant="primary">Sign In</Button>
                      </Link>
                      <Link to={`/signup?redirect=/invite/${code}`}>
                        <Button variant="ghost">Create Account</Button>
                      </Link>
                    </div>
                  </>
                ) : (
                  <div className="invite-error">
                    <h3>Invite Not Available</h3>
                    <p>
                      {invite?.isExpired
                        ? "This invite link has expired."
                        : invite?.isMaxedOut
                        ? "This invite link has reached its maximum uses."
                        : "This invite link is invalid."}
                    </p>
                    <Link to="/signup">
                      <Button>Create Account Anyway</Button>
                    </Link>
                  </div>
                )}
              </Card>
            </motion.div>
          </div>
        </Container>
      </div>
    );
  }

  // Signed in - show status
  return (
    <div className="accept-invite">
      <TronBackground showGrid showPerspective />
      <Navbar />
      <Container>
        <div className="accept-invite-content">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            {status === "loading" && (
              <Card className="status-card loading">
                <div className="spinner"></div>
                <p>Processing invite...</p>
              </Card>
            )}

            {status === "success" && (
              <Card className="status-card success">
                <div className="success-icon">✓</div>
                <h2>Friend Request Accepted!</h2>
                <p>You are now friends with {invite?.creatorUsername}</p>
                <p className="redirect-notice">Redirecting to lobby...</p>
              </Card>
            )}

            {status === "error" && (
              <Card className="status-card error">
                <div className="error-icon">✕</div>
                <h2>Could Not Accept Invite</h2>
                <p>{errorMessage}</p>
                <Link to="/lobby">
                  <Button>Go to Lobby</Button>
                </Link>
              </Card>
            )}
          </motion.div>
        </div>
      </Container>
    </div>
  );
}
