import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Create a new friend group
export const createGroup = mutation({
  args: {
    userId: v.id("users"),
    name: v.string(),
    color: v.string(),
    icon: v.optional(v.string()),
  },
  handler: async (ctx, { userId, name, color, icon }) => {
    const groupId = await ctx.db.insert("friendGroups", {
      userId,
      name,
      color,
      icon,
      memberIds: [],
      createdAt: Date.now(),
    });
    return groupId;
  },
});

// Update an existing group
export const updateGroup = mutation({
  args: {
    groupId: v.id("friendGroups"),
    userId: v.id("users"),
    name: v.optional(v.string()),
    color: v.optional(v.string()),
    icon: v.optional(v.string()),
  },
  handler: async (ctx, { groupId, userId, name, color, icon }) => {
    const group = await ctx.db.get(groupId);

    if (!group || group.userId !== userId) {
      throw new Error("Unauthorized");
    }

    await ctx.db.patch(groupId, {
      ...(name !== undefined && { name }),
      ...(color !== undefined && { color }),
      ...(icon !== undefined && { icon }),
    });
  },
});

// Delete a group
export const deleteGroup = mutation({
  args: {
    groupId: v.id("friendGroups"),
    userId: v.id("users"),
  },
  handler: async (ctx, { groupId, userId }) => {
    const group = await ctx.db.get(groupId);

    if (!group || group.userId !== userId) {
      throw new Error("Unauthorized");
    }

    await ctx.db.delete(groupId);
  },
});

// Add a friend to a group
export const addToGroup = mutation({
  args: {
    groupId: v.id("friendGroups"),
    userId: v.id("users"),
    friendId: v.id("users"),
  },
  handler: async (ctx, { groupId, userId, friendId }) => {
    const group = await ctx.db.get(groupId);

    if (!group || group.userId !== userId) {
      throw new Error("Unauthorized");
    }

    // Verify they're friends
    const sentFriendship = await ctx.db
      .query("friendships")
      .withIndex("by_user_status", (q) =>
        q.eq("userId", userId).eq("status", "accepted")
      )
      .filter((q) => q.eq(q.field("friendId"), friendId))
      .first();

    const receivedFriendship = await ctx.db
      .query("friendships")
      .withIndex("by_user_status", (q) =>
        q.eq("userId", friendId).eq("status", "accepted")
      )
      .filter((q) => q.eq(q.field("friendId"), userId))
      .first();

    if (!sentFriendship && !receivedFriendship) {
      throw new Error("Not friends");
    }

    // Add to group if not already a member
    if (!group.memberIds.includes(friendId)) {
      await ctx.db.patch(groupId, {
        memberIds: [...group.memberIds, friendId],
      });
    }
  },
});

// Remove a friend from a group
export const removeFromGroup = mutation({
  args: {
    groupId: v.id("friendGroups"),
    userId: v.id("users"),
    friendId: v.id("users"),
  },
  handler: async (ctx, { groupId, userId, friendId }) => {
    const group = await ctx.db.get(groupId);

    if (!group || group.userId !== userId) {
      throw new Error("Unauthorized");
    }

    await ctx.db.patch(groupId, {
      memberIds: group.memberIds.filter((id) => id !== friendId),
    });
  },
});

// List all groups for a user with member details
export const listGroups = query({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    const groups = await ctx.db
      .query("friendGroups")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    // Get member details for each group
    const groupsWithMembers = await Promise.all(
      groups.map(async (group) => {
        const members = await Promise.all(
          group.memberIds.map(async (id) => {
            const user = await ctx.db.get(id);
            if (!user) return null;
            return {
              _id: user._id,
              username: user.username,
              displayName: user.displayName,
              avatarUrl: user.avatarUrl,
              status: user.status,
              lastActiveAt: user.lastActiveAt,
              tailscaleDevices: user.tailscaleDevices,
            };
          })
        );
        return { ...group, members: members.filter(Boolean) };
      })
    );

    return groupsWithMembers;
  },
});

// Get friends not in any group
export const getUngroupedFriends = query({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    // Get all groups
    const groups = await ctx.db
      .query("friendGroups")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    // Get all grouped friend IDs
    const groupedIds = new Set(groups.flatMap((g) => g.memberIds));

    // Get all friends
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
    ].filter((id) => !groupedIds.has(id));

    const friends = await Promise.all(
      friendIds.map(async (id) => {
        const user = await ctx.db.get(id);
        if (!user) return null;
        return {
          _id: user._id,
          username: user.username,
          displayName: user.displayName,
          avatarUrl: user.avatarUrl,
          status: user.status,
          lastActiveAt: user.lastActiveAt,
          tailscaleDevices: user.tailscaleDevices,
        };
      })
    );

    return friends.filter(Boolean);
  },
});
