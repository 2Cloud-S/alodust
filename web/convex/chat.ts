import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// Get messages for a stream (real-time subscription)
export const getMessages = query({
  args: {
    streamId: v.id("streams"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, { streamId, limit = 100 }) => {
    const messages = await ctx.db
      .query("chatMessages")
      .withIndex("by_stream_time", (q) => q.eq("streamId", streamId))
      .order("desc")
      .take(limit);

    // Reverse to get chronological order
    const chronologicalMessages = messages.reverse();

    // Fetch user details for each message
    const messagesWithUsers = await Promise.all(
      chronologicalMessages.map(async (message) => {
        const user = await ctx.db.get(message.userId);
        return {
          ...message,
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

    return messagesWithUsers;
  },
});

// Send a message
export const send = mutation({
  args: {
    streamId: v.id("streams"),
    userId: v.id("users"),
    message: v.string(),
    type: v.optional(
      v.union(v.literal("text"), v.literal("emoji"), v.literal("system"))
    ),
  },
  handler: async (ctx, { streamId, userId, message, type = "text" }) => {
    // Verify stream exists and is live
    const stream = await ctx.db.get(streamId);
    if (!stream || !stream.isLive) {
      throw new Error("Stream not found or not live");
    }

    // Validate message
    if (message.trim().length === 0) {
      throw new Error("Message cannot be empty");
    }

    if (message.length > 500) {
      throw new Error("Message too long (max 500 characters)");
    }

    // Create message
    return await ctx.db.insert("chatMessages", {
      streamId,
      userId,
      message: message.trim(),
      type,
      timestamp: Date.now(),
    });
  },
});

// Send system message (e.g., "User joined")
export const sendSystemMessage = mutation({
  args: {
    streamId: v.id("streams"),
    message: v.string(),
  },
  handler: async (ctx, { streamId, message }) => {
    const stream = await ctx.db.get(streamId);
    if (!stream) {
      throw new Error("Stream not found");
    }

    // Use the host as the "system" user
    return await ctx.db.insert("chatMessages", {
      streamId,
      userId: stream.hostId,
      message,
      type: "system",
      timestamp: Date.now(),
    });
  },
});

// Get recent messages count (for unread indicator)
export const getRecentCount = query({
  args: {
    streamId: v.id("streams"),
    sinceTimestamp: v.number(),
  },
  handler: async (ctx, { streamId, sinceTimestamp }) => {
    const messages = await ctx.db
      .query("chatMessages")
      .withIndex("by_stream_time", (q) => q.eq("streamId", streamId))
      .filter((q) => q.gt(q.field("timestamp"), sinceTimestamp))
      .collect();

    return messages.length;
  },
});

// Delete a message (host only)
export const deleteMessage = mutation({
  args: {
    messageId: v.id("chatMessages"),
    userId: v.id("users"),
  },
  handler: async (ctx, { messageId, userId }) => {
    const message = await ctx.db.get(messageId);
    if (!message) {
      throw new Error("Message not found");
    }

    const stream = await ctx.db.get(message.streamId);
    if (!stream) {
      throw new Error("Stream not found");
    }

    // Only message author or stream host can delete
    if (message.userId !== userId && stream.hostId !== userId) {
      throw new Error("Not authorized to delete this message");
    }

    await ctx.db.delete(messageId);
  },
});

// Clear all messages (host only)
export const clearMessages = mutation({
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
      throw new Error("Not authorized to clear messages");
    }

    const messages = await ctx.db
      .query("chatMessages")
      .withIndex("by_stream", (q) => q.eq("streamId", streamId))
      .collect();

    await Promise.all(messages.map((m) => ctx.db.delete(m._id)));

    // Add system message
    await ctx.db.insert("chatMessages", {
      streamId,
      userId: hostId,
      message: "Chat has been cleared by the host.",
      type: "system",
      timestamp: Date.now(),
    });
  },
});

// Alias for send - used by WatchStream page
export const sendMessage = mutation({
  args: {
    streamId: v.id("streams"),
    userId: v.id("users"),
    content: v.string(),
  },
  handler: async (ctx, { streamId, userId, content }) => {
    // Verify stream exists and is live
    const stream = await ctx.db.get(streamId);
    if (!stream || !stream.isLive) {
      throw new Error("Stream not found or not live");
    }

    // Validate message
    if (content.trim().length === 0) {
      throw new Error("Message cannot be empty");
    }

    if (content.length > 500) {
      throw new Error("Message too long (max 500 characters)");
    }

    // Create message
    return await ctx.db.insert("chatMessages", {
      streamId,
      userId,
      message: content.trim(),
      type: "text",
      timestamp: Date.now(),
    });
  },
});
