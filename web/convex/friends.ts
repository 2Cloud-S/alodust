import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// Get all accepted friends for a user (with real-time updates)
export const list = query({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    // Get friendships where user is either the sender or receiver
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

    // Get friend IDs and deduplicate
    const friendIds = [
      ...sentFriendships.map((f) => f.friendId),
      ...receivedFriendships.map((f) => f.userId),
    ];

    // Remove duplicates using Set
    const uniqueFriendIds = Array.from(new Set(friendIds));

    // Fetch friend details
    const friends = await Promise.all(
      uniqueFriendIds.map(async (friendId) => {
        const friend = await ctx.db.get(friendId);
        if (!friend) return null;

        // Type guard to ensure we're working with a user document
        if (!("username" in friend)) return null;

        return {
          _id: friend._id,
          username: friend.username,
          displayName: friend.displayName,
          avatarUrl: friend.avatarUrl,
          status: friend.status,
          lastActiveAt: friend.lastActiveAt,
          tailscaleDevices: friend.tailscaleDevices,
        };
      })
    );

    return friends.filter(Boolean);
  },
});

// Get pending friend requests (received)
export const getPendingRequests = query({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    const pendingFriendships = await ctx.db
      .query("friendships")
      .withIndex("by_friend_status", (q) =>
        q.eq("friendId", userId).eq("status", "pending")
      )
      .collect();

    const requests = await Promise.all(
      pendingFriendships.map(async (friendship) => {
        const requester = await ctx.db.get(friendship.userId);
        if (!requester) return null;
        return {
          friendshipId: friendship._id,
          user: {
            _id: requester._id,
            username: requester.username,
            displayName: requester.displayName,
            avatarUrl: requester.avatarUrl,
          },
          createdAt: friendship.createdAt,
        };
      })
    );

    return requests.filter(Boolean);
  },
});

// Get sent friend requests (pending)
export const getSentRequests = query({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    const sentFriendships = await ctx.db
      .query("friendships")
      .withIndex("by_user_status", (q) =>
        q.eq("userId", userId).eq("status", "pending")
      )
      .collect();

    const requests = await Promise.all(
      sentFriendships.map(async (friendship) => {
        const recipient = await ctx.db.get(friendship.friendId);
        if (!recipient) return null;
        return {
          friendshipId: friendship._id,
          user: {
            _id: recipient._id,
            username: recipient.username,
            displayName: recipient.displayName,
            avatarUrl: recipient.avatarUrl,
          },
          createdAt: friendship.createdAt,
        };
      })
    );

    return requests.filter(Boolean);
  },
});

// Send friend request
export const sendRequest = mutation({
  args: {
    userId: v.id("users"),
    friendUsername: v.string(),
  },
  handler: async (ctx, { userId, friendUsername }) => {
    // Find friend by username
    const friend = await ctx.db
      .query("users")
      .withIndex("by_username", (q) =>
        q.eq("username", friendUsername.toLowerCase())
      )
      .first();

    if (!friend) {
      throw new Error("User not found");
    }

    if (friend._id === userId) {
      throw new Error("Cannot add yourself as a friend");
    }

    // Check if friendship already exists (in either direction)
    const existingSent = await ctx.db
      .query("friendships")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .filter((q) => q.eq(q.field("friendId"), friend._id))
      .first();

    const existingReceived = await ctx.db
      .query("friendships")
      .withIndex("by_user", (q) => q.eq("userId", friend._id))
      .filter((q) => q.eq(q.field("friendId"), userId))
      .first();

    if (existingSent || existingReceived) {
      throw new Error("Friend request already exists or you're already friends");
    }

    // Create friendship request
    const friendshipId = await ctx.db.insert("friendships", {
      userId,
      friendId: friend._id,
      status: "pending",
      requestedBy: userId,
      createdAt: Date.now(),
    });

    // Create notification for the recipient
    await ctx.db.insert("notifications", {
      userId: friend._id,
      type: "friend_request",
      title: "Friend Request",
      message: `sent you a friend request`,
      data: { friendshipId, fromUserId: userId },
      read: false,
      createdAt: Date.now(),
    });

    return friendshipId;
  },
});

// Accept friend request
export const acceptRequest = mutation({
  args: {
    friendshipId: v.id("friendships"),
    userId: v.id("users"),
  },
  handler: async (ctx, { friendshipId, userId }) => {
    const friendship = await ctx.db.get(friendshipId);

    if (!friendship) {
      throw new Error("Friend request not found");
    }

    if (friendship.friendId !== userId) {
      throw new Error("Not authorized to accept this request");
    }

    if (friendship.status !== "pending") {
      throw new Error("Request is not pending");
    }

    // Update the existing friendship to accepted
    await ctx.db.patch(friendshipId, {
      status: "accepted",
      acceptedAt: Date.now(),
    });

    // Check if reverse friendship already exists (shouldn't happen, but safety check)
    const reverseFriendship = await ctx.db
      .query("friendships")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .filter((q) => q.eq(q.field("friendId"), friendship.userId))
      .first();

    // Create reverse friendship for bidirectional relationship (if not exists)
    if (!reverseFriendship) {
      await ctx.db.insert("friendships", {
        userId,
        friendId: friendship.userId,
        status: "accepted",
        requestedBy: friendship.userId,
        createdAt: friendship.createdAt,
        acceptedAt: Date.now(),
      });
    }

    // Create notification for the requester
    await ctx.db.insert("notifications", {
      userId: friendship.userId,
      type: "friend_accepted",
      title: "Friend Request Accepted",
      message: `accepted your friend request`,
      data: { friendshipId, fromUserId: userId },
      read: false,
      createdAt: Date.now(),
    });
  },
});

// Decline friend request
export const declineRequest = mutation({
  args: {
    friendshipId: v.id("friendships"),
    userId: v.id("users"),
  },
  handler: async (ctx, { friendshipId, userId }) => {
    const friendship = await ctx.db.get(friendshipId);

    if (!friendship) {
      throw new Error("Friend request not found");
    }

    if (friendship.friendId !== userId) {
      throw new Error("Not authorized to decline this request");
    }

    await ctx.db.delete(friendshipId);
  },
});

// Cancel sent friend request
export const cancelRequest = mutation({
  args: {
    friendshipId: v.id("friendships"),
    userId: v.id("users"),
  },
  handler: async (ctx, { friendshipId, userId }) => {
    const friendship = await ctx.db.get(friendshipId);

    if (!friendship) {
      throw new Error("Friend request not found");
    }

    if (friendship.userId !== userId) {
      throw new Error("Not authorized to cancel this request");
    }

    await ctx.db.delete(friendshipId);
  },
});

// Remove friend
export const removeFriend = mutation({
  args: {
    userId: v.id("users"),
    friendId: v.id("users"),
  },
  handler: async (ctx, { userId, friendId }) => {
    // Find both friendships (bidirectional)
    const friendship1 = await ctx.db
      .query("friendships")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .filter((q) => q.eq(q.field("friendId"), friendId))
      .first();

    const friendship2 = await ctx.db
      .query("friendships")
      .withIndex("by_user", (q) => q.eq("userId", friendId))
      .filter((q) => q.eq(q.field("friendId"), userId))
      .first();

    if (!friendship1 && !friendship2) {
      throw new Error("Friendship not found");
    }

    // Delete both friendships to completely remove the connection
    if (friendship1) {
      await ctx.db.delete(friendship1._id);
    }
    if (friendship2) {
      await ctx.db.delete(friendship2._id);
    }
  },
});

// Block user
export const blockUser = mutation({
  args: {
    userId: v.id("users"),
    blockedUserId: v.id("users"),
  },
  handler: async (ctx, { userId, blockedUserId }) => {
    // Find and update or create blocked friendship
    const existingFriendship = await ctx.db
      .query("friendships")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .filter((q) => q.eq(q.field("friendId"), blockedUserId))
      .first();

    if (existingFriendship) {
      await ctx.db.patch(existingFriendship._id, { status: "blocked" });
    } else {
      await ctx.db.insert("friendships", {
        userId,
        friendId: blockedUserId,
        status: "blocked",
        requestedBy: userId,
        createdAt: Date.now(),
      });
    }
  },
});

// Get friendship status between two users
export const getFriendshipStatus = query({
  args: {
    userId: v.id("users"),
    otherUserId: v.id("users"),
  },
  handler: async (ctx, { userId, otherUserId }) => {
    const friendship1 = await ctx.db
      .query("friendships")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .filter((q) => q.eq(q.field("friendId"), otherUserId))
      .first();

    const friendship2 = await ctx.db
      .query("friendships")
      .withIndex("by_user", (q) => q.eq("userId", otherUserId))
      .filter((q) => q.eq(q.field("friendId"), userId))
      .first();

    const friendship = friendship1 || friendship2;

    if (!friendship) {
      return { status: "none" };
    }

    return {
      status: friendship.status,
      isRequester: friendship.requestedBy === userId,
      friendshipId: friendship._id,
    };
  },
});

// Get online friends count
export const getOnlineFriendsCount = query({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    // Get friendships where user is either the sender or receiver
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

    // Get friend IDs
    const friendIds = [
      ...sentFriendships.map((f) => f.friendId),
      ...receivedFriendships.map((f) => f.userId),
    ];

    // Fetch friend details and count online
    let onlineCount = 0;
    await Promise.all(
      friendIds.map(async (friendId) => {
        const friend = await ctx.db.get(friendId);
        if (friend && (friend.status === "online" || friend.status === "streaming")) {
          onlineCount++;
        }
      })
    );

    return onlineCount;
  },
});
