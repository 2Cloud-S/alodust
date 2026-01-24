import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Avatar } from "../Avatar";
import { Badge } from "../Badge";
import { Button } from "../Button";
import "./FriendGroup.css";
import { Link } from "react-router-dom";

interface Friend {
  _id: string;
  username: string;
  displayName?: string;
  avatarUrl?: string;
  status: "online" | "offline" | "away" | "streaming";
}

interface FriendGroupProps {
  title: string;
  icon?: string;
  color?: string;
  friends: Friend[];
  showStatus?: boolean;
  collapsed?: boolean;
  onEdit?: () => void;
}

export function FriendGroup({
  title,
  icon,
  color,
  friends,
  showStatus = true,
  collapsed = false,
  onEdit,
}: FriendGroupProps) {
  const [isCollapsed, setIsCollapsed] = useState(collapsed);

  return (
    <div className="friend-group" style={{ borderLeftColor: color }}>
      <div
        className="group-header"
        onClick={() => setIsCollapsed(!isCollapsed)}
      >
        <div className="group-title">
          {icon && <span className="group-icon">{icon}</span>}
          <h3>{title}</h3>
          <span className="group-count">({friends.length})</span>
        </div>
        <div className="group-actions" onClick={(e) => e.stopPropagation()}>
          {onEdit && (
            <Button size="sm" variant="ghost" onClick={onEdit}>
              Edit
            </Button>
          )}
          <motion.div
            animate={{ rotate: isCollapsed ? 0 : 180 }}
            className="collapse-icon"
          >
            ▼
          </motion.div>
        </div>
      </div>

      <AnimatePresence>
        {!isCollapsed && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="group-content"
          >
            <div className="friends-grid">
              {friends.map((friend) => (
                <Link
                  key={friend._id}
                  to={`/profile/${friend.username}`}
                  className="friend-card"
                >
                  <div className="friend-card-avatar">
                    <Avatar
                      src={friend.avatarUrl}
                      alt={friend.displayName || friend.username}
                      status={showStatus ? friend.status : undefined}
                      size="md"
                    />
                  </div>
                  <div className="friend-card-info">
                    <span className="friend-card-name">
                      {friend.displayName || friend.username}
                    </span>
                    {showStatus && friend.status === "streaming" && (
                      <Badge variant="live" />
                    )}
                  </div>
                </Link>
              ))}
            </div>

            {friends.length === 0 && (
              <div className="group-empty">
                <p>No friends in this group</p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
