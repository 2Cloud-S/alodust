import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// Generate a random invite code
function generateInviteCode(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

// Get all active streams from friends
export const getActiveFriendStreams = query({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    // Get friend IDs first
    const sentFriendships = await ctx.db
      .query("friendships")
      .withIndex("by_user_status", (q) =>
        q.eq("userId", userId).eq("status", "accepted")
      )
      .collect();

    const receivedFriendships = await ctx.db
      .query("friendships")
      .withIndex("by_friend_status", (q) =>
        q.eq("friendId", userId).eq("status", "accepted")
      )
      .collect();

    const friendIds = [
      ...sentFriendships.map((f) => f.friendId),
      ...receivedFriendships.map((f) => f.userId),
    ];

    // Get active streams from friends
    const allStreams = await ctx.db
      .query("streams")
      .withIndex("by_live", (q) => q.eq("isLive", true))
      .collect();

    const friendStreams = allStreams.filter(
      (stream) =>
        friendIds.includes(stream.hostId) ||
        stream.privacy === "public"
    );

    // Fetch host details for each stream
    const streamsWithHosts = await Promise.all(
      friendStreams.map(async (stream) => {
        const host = await ctx.db.get(stream.hostId);
        return {
          ...stream,
          host: host
            ? {
                _id: host._id,
                username: host.username,
                displayName: host.displayName,
                avatarUrl: host.avatarUrl,
              }
            : null,
        };
      })
    );

    return streamsWithHosts;
  },
});

// Get stream by ID
export const getById = query({
  args: { streamId: v.id("streams") },
  handler: async (ctx, { streamId }) => {
    const stream = await ctx.db.get(streamId);
    if (!stream) return null;

    const host = await ctx.db.get(stream.hostId);

    return {
      ...stream,
      host: host
        ? {
            _id: host._id,
            username: host.username,
            displayName: host.displayName,
            avatarUrl: host.avatarUrl,
          }
        : null,
    };
  },
});

// Get stream by invite code
export const getByInviteCode = query({
  args: { inviteCode: v.string() },
  handler: async (ctx, { inviteCode }) => {
    const stream = await ctx.db
      .query("streams")
      .withIndex("by_invite_code", (q) => q.eq("inviteCode", inviteCode))
      .first();

    if (!stream || !stream.isLive) return null;

    const host = await ctx.db.get(stream.hostId);

    return {
      ...stream,
      host: host
        ? {
            _id: host._id,
            username: host.username,
            displayName: host.displayName,
            avatarUrl: host.avatarUrl,
          }
        : null,
    };
  },
});

// Get user's current stream
export const getCurrentStream = query({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    return await ctx.db
      .query("streams")
      .withIndex("by_host", (q) => q.eq("hostId", userId))
      .filter((q) => q.eq(q.field("isLive"), true))
      .first();
  },
});

// Create a new stream
export const create = mutation({
  args: {
    hostId: v.id("users"),
    title: v.string(),
    category: v.optional(v.string()),
    quality: v.string(),
    bitrate: v.number(),
    tailscaleIP: v.string(),
    sunshinePort: v.number(),
    privacy: v.union(
      v.literal("friends-only"),
      v.literal("invite-only"),
      v.literal("public")
    ),
  },
  handler: async (ctx, args) => {
    // End any existing stream from this host
    const existingStream = await ctx.db
      .query("streams")
      .withIndex("by_host", (q) => q.eq("hostId", args.hostId))
      .filter((q) => q.eq(q.field("isLive"), true))
      .first();

    if (existingStream) {
      await ctx.db.patch(existingStream._id, {
        isLive: false,
        endedAt: Date.now(),
      });
    }

    // Update user status to streaming
    await ctx.db.patch(args.hostId, { status: "streaming" });

    // Create invite code for invite-only streams
    const inviteCode =
      args.privacy === "invite-only" ? generateInviteCode() : undefined;

    // Create new stream
    const streamId = await ctx.db.insert("streams", {
      ...args,
      isLive: true,
      inviteCode,
      viewerCount: 0,
      peakViewers: 0,
      startedAt: Date.now(),
    });

    // Notify friends if not public
    if (args.privacy !== "public") {
      const sentFriendships = await ctx.db
        .query("friendships")
        .withIndex("by_user_status", (q) =>
          q.eq("userId", args.hostId).eq("status", "accepted")
        )
        .collect();

      const receivedFriendships = await ctx.db
        .query("friendships")
        .withIndex("by_friend_status", (q) =>
          q.eq("friendId", args.hostId).eq("status", "accepted")
        )
        .collect();

      const friendIds = [
        ...sentFriendships.map((f) => f.friendId),
        ...receivedFriendships.map((f) => f.userId),
      ];

      const host = await ctx.db.get(args.hostId);

      // Create notifications for all friends
      await Promise.all(
        friendIds.map((friendId) =>
          ctx.db.insert("notifications", {
            userId: friendId,
            type: "stream_live",
            title: "Friend is Live!",
            message: `${host?.displayName || host?.username} is streaming: ${args.title}`,
            data: { streamId, hostId: args.hostId },
            read: false,
            createdAt: Date.now(),
          })
        )
      );
    }

    return { streamId, inviteCode };
  },
});

// Update stream
export const update = mutation({
  args: {
    streamId: v.id("streams"),
    hostId: v.id("users"),
    title: v.optional(v.string()),
    category: v.optional(v.string()),
    quality: v.optional(v.string()),
    bitrate: v.optional(v.number()),
    privacy: v.optional(
      v.union(
        v.literal("friends-only"),
        v.literal("invite-only"),
        v.literal("public")
      )
    ),
  },
  handler: async (ctx, { streamId, hostId, ...updates }) => {
    const stream = await ctx.db.get(streamId);

    if (!stream) {
      throw new Error("Stream not found");
    }

    if (stream.hostId !== hostId) {
      throw new Error("Not authorized to update this stream");
    }

    const patchData: Record<string, unknown> = {};
    if (updates.title !== undefined) patchData.title = updates.title;
    if (updates.category !== undefined) patchData.category = updates.category;
    if (updates.quality !== undefined) patchData.quality = updates.quality;
    if (updates.bitrate !== undefined) patchData.bitrate = updates.bitrate;
    if (updates.privacy !== undefined) {
      patchData.privacy = updates.privacy;
      // Generate new invite code if switching to invite-only
      if (updates.privacy === "invite-only" && !stream.inviteCode) {
        patchData.inviteCode = generateInviteCode();
      }
    }

    await ctx.db.patch(streamId, patchData);
  },
});

// End stream
export const end = mutation({
  args: {
    streamId: v.id("streams"),
    hostId: v.id("users"),
  },
  handler: async (ctx, { streamId, hostId }) => {
    const stream = await ctx.db.get(streamId);

    if (!stream) {
      throw new Error("Stream not found");
    }

    if (stream.hostId !== hostId) {
      throw new Error("Not authorized to end this stream");
    }

    // Mark all viewers as left
    const activeViewers = await ctx.db
      .query("streamViewers")
      .withIndex("by_stream", (q) => q.eq("streamId", streamId))
      .filter((q) => q.eq(q.field("leftAt"), undefined))
      .collect();

    await Promise.all(
      activeViewers.map((viewer) =>
        ctx.db.patch(viewer._id, { leftAt: Date.now() })
      )
    );

    // End the stream
    await ctx.db.patch(streamId, {
      isLive: false,
      endedAt: Date.now(),
    });

    // Update host status
    await ctx.db.patch(hostId, { status: "online" });
  },
});

// Join stream as viewer
export const joinAsViewer = mutation({
  args: {
    streamId: v.id("streams"),
    userId: v.id("users"),
  },
  handler: async (ctx, { streamId, userId }) => {
    const stream = await ctx.db.get(streamId);

    if (!stream || !stream.isLive) {
      throw new Error("Stream not found or not live");
    }

    // Check if already viewing
    const existingViewer = await ctx.db
      .query("streamViewers")
      .withIndex("by_stream", (q) => q.eq("streamId", streamId))
      .filter((q) =>
        q.and(
          q.eq(q.field("userId"), userId),
          q.eq(q.field("leftAt"), undefined)
        )
      )
      .first();

    if (existingViewer) {
      return existingViewer._id;
    }

    // Add as viewer
    const viewerId = await ctx.db.insert("streamViewers", {
      streamId,
      userId,
      joinedAt: Date.now(),
    });

    // Update viewer count
    const newCount = stream.viewerCount + 1;
    await ctx.db.patch(streamId, {
      viewerCount: newCount,
      peakViewers: Math.max(stream.peakViewers, newCount),
    });

    return viewerId;
  },
});

// Leave stream as viewer
export const leaveAsViewer = mutation({
  args: {
    streamId: v.id("streams"),
    userId: v.id("users"),
  },
  handler: async (ctx, { streamId, userId }) => {
    const viewer = await ctx.db
      .query("streamViewers")
      .withIndex("by_stream", (q) => q.eq("streamId", streamId))
      .filter((q) =>
        q.and(
          q.eq(q.field("userId"), userId),
          q.eq(q.field("leftAt"), undefined)
        )
      )
      .first();

    if (viewer) {
      await ctx.db.patch(viewer._id, { leftAt: Date.now() });

      const stream = await ctx.db.get(streamId);
      if (stream && stream.viewerCount > 0) {
        await ctx.db.patch(streamId, {
          viewerCount: stream.viewerCount - 1,
        });
      }
    }
  },
});

// Get stream viewers
export const getViewers = query({
  args: { streamId: v.id("streams") },
  handler: async (ctx, { streamId }) => {
    const viewers = await ctx.db
      .query("streamViewers")
      .withIndex("by_stream", (q) => q.eq("streamId", streamId))
      .filter((q) => q.eq(q.field("leftAt"), undefined))
      .collect();

    const viewersWithDetails = await Promise.all(
      viewers.map(async (viewer) => {
        const user = await ctx.db.get(viewer.userId);
        return {
          ...viewer,
          user: user
            ? {
                _id: user._id,
                username: user.username,
                displayName: user.displayName,
                avatarUrl: user.avatarUrl,
              }
            : null,
        };
      })
    );

    return viewersWithDetails.filter((v) => v.user);
  },
});

// Alias for getViewers to match HostStream page
export const getStreamViewers = getViewers;

// Get active stream by host ID
export const getActiveStreamByHost = query({
  args: { hostId: v.id("users") },
  handler: async (ctx, { hostId }) => {
    return await ctx.db
      .query("streams")
      .withIndex("by_host", (q) => q.eq("hostId", hostId))
      .filter((q) => q.eq(q.field("isLive"), true))
      .first();
  },
});

// Create stream with simplified args (for HostStream page)
export const createStream = mutation({
  args: {
    hostId: v.id("users"),
    title: v.string(),
    category: v.string(),
    quality: v.string(),
    privacy: v.union(
      v.literal("friends"),
      v.literal("invite"),
      v.literal("public")
    ),
  },
  handler: async (ctx, args) => {
    // End any existing stream from this host
    const existingStream = await ctx.db
      .query("streams")
      .withIndex("by_host", (q) => q.eq("hostId", args.hostId))
      .filter((q) => q.eq(q.field("isLive"), true))
      .first();

    if (existingStream) {
      await ctx.db.patch(existingStream._id, {
        isLive: false,
        endedAt: Date.now(),
      });
    }

    // Update user status to streaming
    await ctx.db.patch(args.hostId, { status: "streaming" });

    // Map simplified privacy to schema privacy
    const privacyMap: Record<string, "friends-only" | "invite-only" | "public"> = {
      friends: "friends-only",
      invite: "invite-only",
      public: "public",
    };

    // Create invite code for invite-only streams
    const inviteCode = args.privacy === "invite" ? generateInviteCode() : undefined;

    // Get user's Tailscale device (use placeholder if not set)
    const user = await ctx.db.get(args.hostId);
    const tailscaleDevice = user?.tailscaleDevices?.[0];

    // Create new stream
    const streamId = await ctx.db.insert("streams", {
      hostId: args.hostId,
      title: args.title,
      category: args.category,
      quality: args.quality,
      bitrate: 20000, // Default bitrate
      tailscaleIP: tailscaleDevice?.ip || "100.0.0.1",
      sunshinePort: 47989, // Default Sunshine port
      privacy: privacyMap[args.privacy],
      isLive: true,
      inviteCode,
      viewerCount: 0,
      peakViewers: 0,
      startedAt: Date.now(),
    });

    // Notify friends if not public
    if (args.privacy !== "public") {
      const sentFriendships = await ctx.db
        .query("friendships")
        .withIndex("by_user_status", (q) =>
          q.eq("userId", args.hostId).eq("status", "accepted")
        )
        .collect();

      const receivedFriendships = await ctx.db
        .query("friendships")
        .withIndex("by_friend_status", (q) =>
          q.eq("friendId", args.hostId).eq("status", "accepted")
        )
        .collect();

      const friendIds = [
        ...sentFriendships.map((f) => f.friendId),
        ...receivedFriendships.map((f) => f.userId),
      ];

      // Create notifications for all friends
      await Promise.all(
        friendIds.map((friendId) =>
          ctx.db.insert("notifications", {
            userId: friendId,
            type: "stream_live",
            title: "Friend is Live!",
            message: `${user?.displayName || user?.username} is streaming: ${args.title}`,
            data: { streamId, hostId: args.hostId },
            read: false,
            createdAt: Date.now(),
          })
        )
      );
    }

    return { streamId, inviteCode };
  },
});

// End stream (simplified version for HostStream page)
export const endStream = mutation({
  args: {
    streamId: v.id("streams"),
  },
  handler: async (ctx, { streamId }) => {
    const stream = await ctx.db.get(streamId);

    if (!stream) {
      throw new Error("Stream not found");
    }

    // Mark all viewers as left
    const activeViewers = await ctx.db
      .query("streamViewers")
      .withIndex("by_stream", (q) => q.eq("streamId", streamId))
      .filter((q) => q.eq(q.field("leftAt"), undefined))
      .collect();

    await Promise.all(
      activeViewers.map((viewer) =>
        ctx.db.patch(viewer._id, { leftAt: Date.now() })
      )
    );

    // End the stream
    await ctx.db.patch(streamId, {
      isLive: false,
      endedAt: Date.now(),
    });

    // Update host status
    await ctx.db.patch(stream.hostId, { status: "online" });
  },
});
