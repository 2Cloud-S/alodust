import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // ========== USERS ==========
  users: defineTable({
    // Identity (from Clerk)
    clerkId: v.string(),
    email: v.string(),
    username: v.string(),
    displayName: v.optional(v.string()),
    avatarUrl: v.optional(v.string()),

    // Tailscale integration
    tailscaleDevices: v.array(
      v.object({
        id: v.string(),
        ip: v.string(),
        hostname: v.string(),
        os: v.optional(v.string()),
        lastSeen: v.number(),
      })
    ),

    // Status
    status: v.union(
      v.literal("online"),
      v.literal("offline"),
      v.literal("away"),
      v.literal("streaming")
    ),

    // Metadata
    createdAt: v.number(),
    lastActiveAt: v.number(),
  })
    .index("by_clerk_id", ["clerkId"])
    .index("by_email", ["email"])
    .index("by_username", ["username"])
    .index("by_status", ["status"]),

  // ========== FRIENDSHIPS ==========
  friendships: defineTable({
    userId: v.id("users"),
    friendId: v.id("users"),
    status: v.union(
      v.literal("pending"),
      v.literal("accepted"),
      v.literal("blocked")
    ),
    requestedBy: v.id("users"),
    createdAt: v.number(),
    acceptedAt: v.optional(v.number()),
  })
    .index("by_user", ["userId"])
    .index("by_friend", ["friendId"])
    .index("by_user_status", ["userId", "status"])
    .index("by_friend_status", ["friendId", "status"]),

  // ========== FRIEND GROUPS ==========
  friendGroups: defineTable({
    userId: v.id("users"),
    name: v.string(),
    color: v.string(),
    icon: v.optional(v.string()),
    memberIds: v.array(v.id("users")),
    createdAt: v.number(),
  }).index("by_user", ["userId"]),

  // ========== INVITE LINKS ==========
  inviteLinks: defineTable({
    userId: v.id("users"), // Link creator
    code: v.string(), // Random code (8 chars)
    expiresAt: v.number(), // Timestamp (now + 7 days)
    usedBy: v.array(v.id("users")), // Track who used it
    maxUses: v.optional(v.number()), // Optional use limit
    createdAt: v.number(),
  })
    .index("by_code", ["code"])
    .index("by_user", ["userId"])
    .index("by_expiry", ["expiresAt"]),

  // ========== STREAMS ==========
  streams: defineTable({
    hostId: v.id("users"),
    title: v.string(),
    category: v.optional(v.string()),

    // Stream type
    streamType: v.union(
      v.literal("sunshine"),
      v.literal("obs"),
      v.literal("browser") // Future: WebRTC
    ),

    // Stream settings
    quality: v.string(), // "1080p60", "720p30", etc.
    bitrate: v.number(),

    // Connection info (Sunshine)
    tailscaleIP: v.string(),
    sunshinePort: v.optional(v.number()),

    // Connection info (OBS)
    obsStreamKey: v.optional(v.string()),
    obsServerUrl: v.optional(v.string()),

    // State
    isLive: v.boolean(),
    privacy: v.union(
      v.literal("friends-only"),
      v.literal("invite-only"),
      v.literal("public")
    ),
    inviteCode: v.optional(v.string()),

    // Stats
    viewerCount: v.number(),
    peakViewers: v.number(),

    // Timestamps
    startedAt: v.number(),
    endedAt: v.optional(v.number()),

    // Thumbnail
    thumbnailUrl: v.optional(v.string()),
  })
    .index("by_host", ["hostId"])
    .index("by_live", ["isLive"])
    .index("by_privacy", ["privacy"])
    .index("by_invite_code", ["inviteCode"]),

  // ========== STREAM VIEWERS ==========
  streamViewers: defineTable({
    streamId: v.id("streams"),
    userId: v.id("users"),
    joinedAt: v.number(),
    leftAt: v.optional(v.number()),
  })
    .index("by_stream", ["streamId"])
    .index("by_user", ["userId"])
    .index("by_stream_active", ["streamId", "leftAt"]),

  // ========== CHAT MESSAGES ==========
  chatMessages: defineTable({
    streamId: v.id("streams"),
    userId: v.id("users"),
    message: v.string(),
    type: v.union(
      v.literal("text"),
      v.literal("emoji"),
      v.literal("system")
    ),
    timestamp: v.number(),
  })
    .index("by_stream", ["streamId"])
    .index("by_stream_time", ["streamId", "timestamp"]),

  // ========== SCHEDULED EVENTS ==========
  events: defineTable({
    hostId: v.id("users"),
    title: v.string(),
    description: v.optional(v.string()),
    scheduledAt: v.number(),
    duration: v.optional(v.number()), // in minutes
    invitedUserIds: v.array(v.id("users")),
    rsvps: v.array(
      v.object({
        userId: v.id("users"),
        status: v.union(
          v.literal("going"),
          v.literal("maybe"),
          v.literal("declined")
        ),
        respondedAt: v.number(),
      })
    ),
    createdAt: v.number(),
  })
    .index("by_host", ["hostId"])
    .index("by_scheduled", ["scheduledAt"]),

  // ========== NOTIFICATIONS ==========
  notifications: defineTable({
    userId: v.id("users"),
    type: v.union(
      v.literal("friend_request"),
      v.literal("friend_accepted"),
      v.literal("stream_live"),
      v.literal("event_reminder"),
      v.literal("event_invite")
    ),
    title: v.string(),
    message: v.string(),
    data: v.optional(v.any()), // Additional context (streamId, friendId, etc.)
    read: v.boolean(),
    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_unread", ["userId", "read"]),
});
