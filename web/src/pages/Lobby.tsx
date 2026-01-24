import { useState } from "react";
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
  Badge,
  Input,
} from "../components";
import { Link } from "react-router-dom";
import "./Lobby.css";

export function Lobby() {
  const { user, userId, isLoaded, isSignedIn } = useAuth();
  const [showAddFriend, setShowAddFriend] = useState(false);
  const [friendUsername, setFriendUsername] = useState("");
  const [addFriendError, setAddFriendError] = useState("");

  // Queries
  const friends = useQuery(api.friends.list, userId ? { userId } : "skip");
  const pendingRequests = useQuery(
    api.friends.getPendingRequests,
    userId ? { userId } : "skip"
  );
  const liveStreams = useQuery(
    api.streams.getActiveFriendStreams,
    userId ? { userId } : "skip"
  );

  // Mutations
  const sendFriendRequest = useMutation(api.friends.sendRequest);
  const acceptRequest = useMutation(api.friends.acceptRequest);
  const declineRequest = useMutation(api.friends.declineRequest);

  // Loading state
  if (!isLoaded) {
    return (
      <div className="lobby">
        <TronBackground />
        <div className="lobby-loading">
          <div className="cyber-spinner" />
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  // Not signed in
  if (!isSignedIn) {
    return (
      <div className="lobby">
        <TronBackground />
        <div className="lobby-loading">
          <h2>Welcome to Alodust</h2>
          <p>Please sign in to access the lobby.</p>
          <Link to="/login">
            <Button variant="primary">Sign In</Button>
          </Link>
        </div>
      </div>
    );
  }

  const onlineFriends = friends?.filter(
    (f) => f !== null && (f.status === "online" || f.status === "streaming")
  );
  const offlineFriends = friends?.filter(
    (f) => f !== null && (f.status === "offline" || f.status === "away")
  );

  const handleAddFriend = async () => {
    if (!userId || !friendUsername.trim()) return;

    try {
      setAddFriendError("");
      await sendFriendRequest({ userId, friendUsername: friendUsername.trim() });
      setFriendUsername("");
      setShowAddFriend(false);
    } catch (error) {
      setAddFriendError(
        error instanceof Error ? error.message : "Failed to send request"
      );
    }
  };

  const handleAcceptRequest = async (friendshipId: string) => {
    if (!userId) return;
    await acceptRequest({ friendshipId: friendshipId as any, userId });
  };

  const handleDeclineRequest = async (friendshipId: string) => {
    if (!userId) return;
    await declineRequest({ friendshipId: friendshipId as any, userId });
  };

  return (
    <div className="lobby">
      <TronBackground showGrid showAmbient />
      <Navbar />

      {/* Header */}
      <header className="lobby-header">
        <Container>
          <div className="lobby-header-content">
            <div className="lobby-welcome">
              <h1>
                Welcome back,{" "}
                <span className="text-cyan">
                  {user?.displayName || user?.username}
                </span>
              </h1>
              <p className="text-muted">
                {onlineFriends?.length || 0} friends online
              </p>
            </div>

            <div className="lobby-actions">
              <Button variant="ghost" onClick={() => setShowAddFriend(true)}>
                Add Friend
              </Button>
              <Link to="/stream/new">
                <Button variant="primary">Start Stream</Button>
              </Link>
            </div>
          </div>
        </Container>
      </header>

      <main className="lobby-main">
        <Container>
          {/* Pending Friend Requests */}
          {pendingRequests && pendingRequests.length > 0 && (
            <section className="lobby-section">
              <h2 className="lobby-section-title">
                <span className="text-orange">Friend Requests</span>
                <Badge variant="new">{pendingRequests.length}</Badge>
              </h2>
              <div className="friend-requests-list">
                {pendingRequests.map((request: any) => (
                  <Card key={request.friendshipId} className="friend-request-card">
                    <Avatar
                      src={request.user.avatarUrl}
                      alt={request.user.username}
                      size="md"
                    />
                    <div className="friend-request-info">
                      <span className="friend-request-name">
                        {request.user.displayName || request.user.username}
                      </span>
                      <span className="friend-request-username text-muted">
                        @{request.user.username}
                      </span>
                    </div>
                    <div className="friend-request-actions">
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => handleAcceptRequest(request.friendshipId)}
                      >
                        Accept
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeclineRequest(request.friendshipId)}
                      >
                        Decline
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            </section>
          )}

          {/* Live Streams */}
          {liveStreams && liveStreams.length > 0 && (
            <motion.section
              className="lobby-section"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <h2 className="lobby-section-title">
                <span className="text-green">Live Now</span>
                <Badge variant="live">{liveStreams.length}</Badge>
              </h2>
              <div className="streams-grid">
                {liveStreams.map((stream: any) => (
                  <Link
                    key={stream._id}
                    to={`/watch/${stream._id}`}
                    className="stream-card-link"
                  >
                    <Card glowColor="cyan" clickable>
                      <div className="stream-card-header">
                        <Avatar
                          src={stream.host?.avatarUrl}
                          alt={stream.host?.username || "Host"}
                          status="streaming"
                          size="md"
                        />
                        <div className="stream-card-host">
                          <span className="stream-card-host-name">
                            {stream.host?.displayName || stream.host?.username}
                          </span>
                          <Badge variant="live" />
                        </div>
                      </div>
                      <h3 className="stream-card-title">{stream.title}</h3>
                      <div className="stream-card-meta">
                        <span className="text-muted">
                          {stream.viewerCount} watching
                        </span>
                        <span className="text-cyan">{stream.quality}</span>
                      </div>
                    </Card>
                  </Link>
                ))}
              </div>
            </motion.section>
          )}

          {/* Online Friends */}
          <section className="lobby-section">
            <h2 className="lobby-section-title">
              <span>Friends Online</span>
              <span className="text-muted">({onlineFriends?.length || 0})</span>
            </h2>
            {onlineFriends && onlineFriends.length > 0 ? (
              <div className="friends-grid">
                {onlineFriends.map((friend: any) => (
                  <Card key={friend._id} className="friend-card">
                    <Avatar
                      src={friend.avatarUrl}
                      alt={friend.username}
                      status={friend.status}
                      size="lg"
                    />
                    <span className="friend-card-name">
                      {friend.displayName || friend.username}
                    </span>
                    <span className="friend-card-username text-muted">
                      @{friend.username}
                    </span>
                    {friend.status === "streaming" && (
                      <Badge variant="live" className="friend-card-badge" />
                    )}
                  </Card>
                ))}
              </div>
            ) : (
              <div className="lobby-empty">
                <p className="text-muted">No friends online right now.</p>
                <Button variant="ghost" onClick={() => setShowAddFriend(true)}>
                  Add Friends
                </Button>
              </div>
            )}
          </section>

          {/* Offline Friends */}
          {offlineFriends && offlineFriends.length > 0 && (
            <section className="lobby-section">
              <h2 className="lobby-section-title">
                <span className="text-muted">Offline</span>
                <span className="text-muted">({offlineFriends.length})</span>
              </h2>
              <div className="friends-grid friends-grid-offline">
                {offlineFriends.map((friend: any) => (
                  <div key={friend._id} className="friend-card friend-card-offline">
                    <Avatar
                      src={friend.avatarUrl}
                      alt={friend.username}
                      status="offline"
                      size="md"
                    />
                    <span className="friend-card-name text-muted">
                      {friend.displayName || friend.username}
                    </span>
                  </div>
                ))}
              </div>
            </section>
          )}
        </Container>
      </main>

      {/* Add Friend Modal */}
      {showAddFriend && (
        <div className="modal-overlay" onClick={() => setShowAddFriend(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2 className="modal-title">Add Friend</h2>
            <p className="modal-subtitle text-muted">
              Enter your friend's username to send a request.
            </p>

            <Input
              label="Username"
              placeholder="Enter username..."
              value={friendUsername}
              onChange={(e) => setFriendUsername(e.target.value)}
              error={addFriendError}
              autoFocus
            />

            <div className="modal-actions">
              <Button variant="ghost" onClick={() => setShowAddFriend(false)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleAddFriend}
                disabled={!friendUsername.trim()}
              >
                Send Request
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
