import { query, mutation, internalMutation } from "./_generated/server";
import { v } from "convex/values";

// Get current user by Clerk ID
export const getByClerkId = query({
  args: { clerkId: v.string() },
  handler: async (ctx, { clerkId }) => {
    return await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", clerkId))
      .first();
  },
});

// Get user by username
export const getByUsername = query({
  args: { username: v.string() },
  handler: async (ctx, { username }) => {
    return await ctx.db
      .query("users")
      .withIndex("by_username", (q) => q.eq("username", username))
      .first();
  },
});

// Get user by ID
export const getById = query({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    return await ctx.db.get(userId);
  },
});

// Create or update user from Clerk webhook/sync
export const upsertFromClerk = mutation({
  args: {
    clerkId: v.string(),
    email: v.string(),
    username: v.string(),
    displayName: v.optional(v.string()),
    avatarUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .first();

    if (existingUser) {
      // Update existing user
      await ctx.db.patch(existingUser._id, {
        email: args.email,
        username: args.username,
        displayName: args.displayName,
        avatarUrl: args.avatarUrl,
        lastActiveAt: Date.now(),
      });
      return existingUser._id;
    } else {
      // Create new user
      return await ctx.db.insert("users", {
        clerkId: args.clerkId,
        email: args.email,
        username: args.username,
        displayName: args.displayName,
        avatarUrl: args.avatarUrl,
        tailscaleDevices: [],
        status: "online",
        createdAt: Date.now(),
        lastActiveAt: Date.now(),
      });
    }
  },
});

// Update user status
export const updateStatus = mutation({
  args: {
    userId: v.id("users"),
    status: v.union(
      v.literal("online"),
      v.literal("offline"),
      v.literal("away"),
      v.literal("streaming")
    ),
  },
  handler: async (ctx, { userId, status }) => {
    await ctx.db.patch(userId, {
      status,
      lastActiveAt: Date.now(),
    });
  },
});

// Update user profile
export const updateProfile = mutation({
  args: {
    userId: v.id("users"),
    displayName: v.optional(v.string()),
    avatarUrl: v.optional(v.string()),
  },
  handler: async (ctx, { userId, displayName, avatarUrl }) => {
    const updates: Record<string, unknown> = { lastActiveAt: Date.now() };
    if (displayName !== undefined) updates.displayName = displayName;
    if (avatarUrl !== undefined) updates.avatarUrl = avatarUrl;

    await ctx.db.patch(userId, updates);
  },
});

// Add Tailscale device
export const addTailscaleDevice = mutation({
  args: {
    userId: v.id("users"),
    device: v.object({
      id: v.string(),
      ip: v.string(),
      hostname: v.string(),
      os: v.optional(v.string()),
    }),
  },
  handler: async (ctx, { userId, device }) => {
    const user = await ctx.db.get(userId);
    if (!user) throw new Error("User not found");

    const existingDevices = user.tailscaleDevices.filter(
      (d) => d.id !== device.id
    );

    await ctx.db.patch(userId, {
      tailscaleDevices: [
        ...existingDevices,
        { ...device, lastSeen: Date.now() },
      ],
    });
  },
});

// Remove Tailscale device
export const removeTailscaleDevice = mutation({
  args: {
    userId: v.id("users"),
    deviceId: v.string(),
  },
  handler: async (ctx, { userId, deviceId }) => {
    const user = await ctx.db.get(userId);
    if (!user) throw new Error("User not found");

    await ctx.db.patch(userId, {
      tailscaleDevices: user.tailscaleDevices.filter((d) => d.id !== deviceId),
    });
  },
});

// Search users by username (for adding friends)
export const searchByUsername = query({
  args: { query: v.string(), limit: v.optional(v.number()) },
  handler: async (ctx, { query, limit = 10 }) => {
    if (query.length < 2) return [];

    // Get all users and filter client-side (Convex doesn't support LIKE queries)
    const allUsers = await ctx.db.query("users").collect();

    const searchLower = query.toLowerCase();
    return allUsers
      .filter(
        (user) =>
          user.username.toLowerCase().includes(searchLower) ||
          user.displayName?.toLowerCase().includes(searchLower)
      )
      .slice(0, limit)
      .map((user) => ({
        _id: user._id,
        username: user.username,
        displayName: user.displayName,
        avatarUrl: user.avatarUrl,
        status: user.status,
      }));
  },
});

// Check if username is available
export const isUsernameAvailable = query({
  args: { username: v.string() },
  handler: async (ctx, { username }) => {
    const existing = await ctx.db
      .query("users")
      .withIndex("by_username", (q) => q.eq("username", username.toLowerCase()))
      .first();
    return !existing;
  },
});
