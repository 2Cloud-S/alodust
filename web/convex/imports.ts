import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Import Discord friends
export const importDiscordFriends = mutation({
  args: {
    userId: v.id("users"),
    discordId: v.string(),
    discordUsername: v.string(),
    connections: v.array(
      v.object({
        id: v.string(),
        name: v.string(),
        type: v.string(),
      })
    ),
  },
  handler: async (ctx, { userId, discordId, discordUsername, connections }) => {
    // Update user's connected accounts
    const user = await ctx.db.get(userId);
    if (!user) throw new Error("User not found");

    await ctx.db.patch(userId, {
      connectedAccounts: {
        ...user.connectedAccounts,
        discord: {
          id: discordId,
          username: discordUsername,
          connectedAt: Date.now(),
        },
      },
    });

    // Import connections as potential friends
    let matchedCount = 0;
    for (const conn of connections) {
      // Check if any Alodust user has this Discord account
      const allUsers = await ctx.db.query("users").collect();
      const matchedUser = allUsers.find(
        (u) => u.connectedAccounts?.discord?.id === conn.id
      );

      await ctx.db.insert("importedFriends", {
        userId,
        source: "discord",
        externalId: conn.id,
        externalUsername: conn.name,
        matchedUserId: matchedUser?._id,
        imported: false,
        importedAt: Date.now(),
      });

      if (matchedUser) matchedCount++;
    }

    return { total: connections.length, matched: matchedCount };
  },
});

// Import Steam friends
export const importSteamFriends = mutation({
  args: {
    userId: v.id("users"),
    steamId: v.string(),
    steamName: v.string(),
    friends: v.array(
      v.object({
        steamid: v.string(),
        personaname: v.string(),
      })
    ),
  },
  handler: async (ctx, { userId, steamId, steamName, friends }) => {
    // Update user's connected accounts
    const user = await ctx.db.get(userId);
    if (!user) throw new Error("User not found");

    await ctx.db.patch(userId, {
      connectedAccounts: {
        ...user.connectedAccounts,
        steam: {
          id: steamId,
          personaName: steamName,
          connectedAt: Date.now(),
        },
      },
    });

    // Import friends
    let matchedCount = 0;
    for (const friend of friends) {
      // Check if any Alodust user has this Steam account
      const allUsers = await ctx.db.query("users").collect();
      const matchedUser = allUsers.find(
        (u) => u.connectedAccounts?.steam?.id === friend.steamid
      );

      await ctx.db.insert("importedFriends", {
        userId,
        source: "steam",
        externalId: friend.steamid,
        externalUsername: friend.personaname,
        matchedUserId: matchedUser?._id,
        imported: false,
        importedAt: Date.now(),
      });

      if (matchedUser) matchedCount++;
    }

    return { total: friends.length, matched: matchedCount };
  },
});

// Get imported friends
export const getImportedFriends = query({
  args: {
    userId: v.id("users"),
    source: v.union(v.literal("discord"), v.literal("steam")),
  },
  handler: async (ctx, { userId, source }) => {
    const imported = await ctx.db
      .query("importedFriends")
      .withIndex("by_user_source", (q) =>
        q.eq("userId", userId).eq("source", source)
      )
      .collect();

    // Separate matched vs unmatched
    const matched = imported.filter((f) => f.matchedUserId);
    const unmatched = imported.filter((f) => !f.matchedUserId);

    // Fetch matched user details
    const matchedWithDetails = await Promise.all(
      matched.map(async (imp) => {
        const user = imp.matchedUserId
          ? await ctx.db.get(imp.matchedUserId)
          : null;
        return {
          ...imp,
          user: user
            ? {
                _id: user._id,
                username: user.username,
                displayName: user.displayName,
                avatarUrl: user.avatarUrl,
                status: user.status,
              }
            : null,
        };
      })
    );

    return {
      matched: matchedWithDetails,
      unmatched,
    };
  },
});

// Send friend requests to imported friends
export const sendRequestsToImported = mutation({
  args: {
    userId: v.id("users"),
    importedIds: v.array(v.id("importedFriends")),
  },
  handler: async (ctx, { userId, importedIds }) => {
    let sentCount = 0;

    for (const impId of importedIds) {
      const imported = await ctx.db.get(impId);
      if (!imported || !imported.matchedUserId || imported.userId !== userId)
        continue;

      // Check if already friends or pending
      const existingFriendship = await ctx.db
        .query("friendships")
        .withIndex("by_user", (q) => q.eq("userId", userId))
        .collect();

      const alreadyExists = existingFriendship.some(
        (f) => f.friendId === imported.matchedUserId
      );

      if (alreadyExists) continue;

      // Send friend request
      await ctx.db.insert("friendships", {
        userId,
        friendId: imported.matchedUserId,
        status: "pending",
        requestedBy: userId,
        createdAt: Date.now(),
      });

      // Mark as imported
      await ctx.db.patch(impId, { imported: true });

      // Notify recipient
      const sender = await ctx.db.get(userId);
      await ctx.db.insert("notifications", {
        userId: imported.matchedUserId,
        type: "friend_request",
        title: "New Friend Request",
        message: `${sender?.displayName || sender?.username} sent you a friend request`,
        data: { userId },
        read: false,
        createdAt: Date.now(),
      });

      sentCount++;
    }

    return { sent: sentCount };
  },
});

// Check if user has connected account
export const hasConnectedAccount = query({
  args: {
    userId: v.id("users"),
    source: v.union(v.literal("discord"), v.literal("steam")),
  },
  handler: async (ctx, { userId, source }) => {
    const user = await ctx.db.get(userId);
    if (!user) return false;

    if (source === "discord") {
      return !!user.connectedAccounts?.discord;
    } else {
      return !!user.connectedAccounts?.steam;
    }
  },
});

// Get connected account info
export const getConnectedAccount = query({
  args: {
    userId: v.id("users"),
    source: v.union(v.literal("discord"), v.literal("steam")),
  },
  handler: async (ctx, { userId, source }) => {
    const user = await ctx.db.get(userId);
    if (!user) return null;

    if (source === "discord") {
      return user.connectedAccounts?.discord || null;
    } else {
      return user.connectedAccounts?.steam || null;
    }
  },
});
