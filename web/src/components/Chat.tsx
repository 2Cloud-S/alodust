import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { Card, Avatar } from "./index";
import "./Chat.css";

interface ChatMessage {
  _id: string;
  userId: string;
  message: string;
  timestamp: number;
  type?: "text" | "emoji" | "system";
  user?: {
    avatarUrl?: string;
    displayName?: string;
    username?: string;
  } | null;
}

interface ChatProps {
  streamId: Id<"streams">;
  userId: Id<"users">;
  hostId: Id<"users">;
  isHost?: boolean;
}

export function Chat({ streamId, userId, hostId, isHost = false }: ChatProps) {
  const [message, setMessage] = useState("");
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Get messages with real-time subscription
  const messages = useQuery(api.chat.getMessages, { streamId, limit: 100 });

  // Mutations
  const sendMessage = useMutation(api.chat.sendMessage);
  const clearMessages = useMutation(api.chat.clearMessages);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!message.trim()) return;

    try {
      await sendMessage({
        streamId,
        userId,
        content: message.trim(),
      });
      setMessage("");
    } catch (error) {
      console.error("Failed to send message:", error);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleClearChat = async () => {
    if (!isHost) return;

    try {
      await clearMessages({
        streamId,
        hostId: userId,
      });
    } catch (error) {
      console.error("Failed to clear chat:", error);
    }
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <Card className="chat-component">
      <div className="chat-header">
        <h3 className="chat-title">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
          Stream Chat
        </h3>
        {isHost && (
          <button className="chat-clear-btn" onClick={handleClearChat} title="Clear chat">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
            </svg>
          </button>
        )}
      </div>

      <div className="chat-messages" ref={chatContainerRef}>
        {messages && messages.length > 0 ? (
          messages.map((msg: ChatMessage) => (
            <div
              key={msg._id}
              className={`chat-message ${msg.type === "system" ? "system-message" : ""}`}
            >
              {msg.type !== "system" && (
                <Avatar
                  src={msg.user?.avatarUrl}
                  alt={msg.user?.username || "User"}
                  size="sm"
                />
              )}
              <div className="chat-message-content">
                <div className="chat-message-header">
                  <span
                    className={`chat-sender ${
                      msg.userId === hostId ? "host" : ""
                    } ${msg.type === "system" ? "system" : ""}`}
                  >
                    {msg.type === "system"
                      ? "System"
                      : msg.user?.displayName || msg.user?.username}
                    {msg.type !== "system" && msg.userId === hostId && (
                      <span className="host-badge">HOST</span>
                    )}
                  </span>
                  <span className="chat-time">{formatTime(msg.timestamp)}</span>
                </div>
                <p className="chat-text">{msg.message}</p>
              </div>
            </div>
          ))
        ) : (
          <div className="no-messages">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
            <p>No messages yet</p>
            <p>Be the first to chat!</p>
          </div>
        )}
      </div>

      <div className="chat-input-area">
        <input
          type="text"
          className="chat-input"
          placeholder="Send a message..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          maxLength={500}
        />
        <button
          className="chat-send-btn"
          onClick={handleSend}
          disabled={!message.trim()}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="22" y1="2" x2="11" y2="13" />
            <polygon points="22 2 15 22 11 13 2 9 22 2" />
          </svg>
        </button>
      </div>
    </Card>
  );
}
