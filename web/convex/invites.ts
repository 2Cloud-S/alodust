import { mutation, query, internalMutation } from "./_generated/server";
import { v } from "convex/values";

// Helper function to generate random invite code
function generateRandomCode(length: number): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let code = "";
  for (let i = 0; i < length; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// Create a new invite link
export const createInviteLink = mutation({
  args: {
    userId: v.id("users"),
    maxUses: v.optional(v.number()),
  },
  handler: async (ctx, { userId, maxUses }) => {
    // Generate unique code
    let code = generateRandomCode(8);

    // Ensure code is unique
    let existing = await ctx.db
      .query("inviteLinks")
      .withIndex("by_code", (q) => q.eq("code", code))
      .first();

    while (existing) {
      code = generateRandomCode(8);
      existing = await ctx.db
        .query("inviteLinks")
        .withIndex("by_code", (q) => q.eq("code", code))
        .first();
    }

    const expiresAt = Date.now() + 7 * 24 * 60 * 60 * 1000; // 7 days

    const inviteId = await ctx.db.insert("inviteLinks", {
      userId,
      code,
      expiresAt,
      usedBy: [],
      maxUses,
      createdAt: Date.now(),
    });

    return { code, expiresAt, inviteId };
  },
});

// Accept an invite link
export const acceptInviteLink = mutation({
  args: {
    code: v.string(),
    acceptorId: v.id("users"),
  },
  handler: async (ctx, { code, acceptorId }) => {
    // Find invite
    const invite = await ctx.db
      .query("inviteLinks")
      .withIndex("by_code", (q) => q.eq("code", code))
      .first();

    if (!invite) {
      throw new Error("Invalid invite code");
    }

    if (invite.expiresAt < Date.now()) {
      throw new Error("Invite expired");
    }

    if (invite.maxUses && invite.usedBy.length >= invite.maxUses) {
      throw new Error("Invite link limit reached");
    }

    // Check if trying to accept own invite first (before other checks)
    if (invite.userId === acceptorId) {
      throw new Error("Cannot accept your own invite");
    }

    if (invite.usedBy.includes(acceptorId)) {
      throw new Error("Already used this invite");
    }

    // Check if already friends (check both directions)
    const existingFriendship1 = await ctx.db
      .query("friendships")
      .withIndex("by_user", (q) => q.eq("userId", invite.userId))
      .filter((q) => q.eq(q.field("friendId"), acceptorId))
      .first();

    const existingFriendship2 = await ctx.db
      .query("friendships")
      .withIndex("by_user", (q) => q.eq("userId", acceptorId))
      .filter((q) => q.eq(q.field("friendId"), invite.userId))
      .first();

    // If already friends (either direction), just mark invite as used and return success
    if (existingFriendship1 || existingFriendship2) {
      // Mark invite as used if not already
      if (!invite.usedBy.includes(acceptorId)) {
        await ctx.db.patch(invite._id, {
          usedBy: [...invite.usedBy, acceptorId],
        });
      }
      return { success: true, alreadyFriends: true };
    }

    // Create friendship (auto-accepted via invite)
    await ctx.db.insert("friendships", {
      userId: invite.userId,
      friendId: acceptorId,
      status: "accepted",
      requestedBy: invite.userId,
      createdAt: Date.now(),
      acceptedAt: Date.now(),
    });

    // Create reverse friendship for bidirectional relationship
    await ctx.db.insert("friendships", {
      userId: acceptorId,
      friendId: invite.userId,
      status: "accepted",
      requestedBy: invite.userId,
      createdAt: Date.now(),
      acceptedAt: Date.now(),
    });

    // Mark invite as used
    await ctx.db.patch(invite._id, {
      usedBy: [...invite.usedBy, acceptorId],
    });

    // Get acceptor username for notification
    const acceptor = await ctx.db.get(acceptorId);
    const acceptorUsername = acceptor?.username || "Someone";

    // Create notification for invite creator
    await ctx.db.insert("notifications", {
      userId: invite.userId,
      type: "friend_accepted",
      title: "New Friend via Invite",
      message: `${acceptorUsername} accepted your friend invite!`,
      read: false,
      createdAt: Date.now(),
    });

    return { success: true };
  },
});

// List user's invite links
export const listMyInvites = query({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    const invites = await ctx.db
      .query("inviteLinks")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    return invites.map((inv) => ({
      ...inv,
      isExpired: inv.expiresAt < Date.now(),
      usesRemaining: inv.maxUses ? inv.maxUses - inv.usedBy.length : null,
    }));
  },
});

// Get invite by code (for validation before accepting)
export const getInviteByCode = query({
  args: { code: v.string() },
  handler: async (ctx, { code }) => {
    const invite = await ctx.db
      .query("inviteLinks")
      .withIndex("by_code", (q) => q.eq("code", code))
      .first();

    if (!invite) return null;

    // Get creator info
    const creator = await ctx.db.get(invite.userId);

    return {
      ...invite,
      isExpired: invite.expiresAt < Date.now(),
      isMaxedOut: invite.maxUses ? invite.usedBy.length >= invite.maxUses : false,
      creatorUsername: creator?.username || "Unknown",
      creatorDisplayName: creator?.displayName,
      creatorAvatarUrl: creator?.avatarUrl,
    };
  },
});

// Revoke an invite link
export const revokeInvite = mutation({
  args: {
    inviteId: v.id("inviteLinks"),
    userId: v.id("users"),
  },
  handler: async (ctx, { inviteId, userId }) => {
    const invite = await ctx.db.get(inviteId);

    if (!invite || invite.userId !== userId) {
      throw new Error("Unauthorized");
    }

    await ctx.db.delete(inviteId);
  },
});

// Background cleanup job (called by cron)
export const cleanupExpiredInvites = internalMutation({
  handler: async (ctx) => {
    const now = Date.now();
    const expired = await ctx.db
      .query("inviteLinks")
      .withIndex("by_expiry", (q) => q.lt("expiresAt", now))
      .collect();

    for (const invite of expired) {
      await ctx.db.delete(invite._id);
    }

    return { deletedCount: expired.length };
  },
});
