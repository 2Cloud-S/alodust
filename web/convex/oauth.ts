import { action } from "./_generated/server";
import { v } from "convex/values";

// Declare process.env for TypeScript in Convex environment
declare const process: { env: Record<string, string | undefined> };

// Note: Convex actions can access environment variables differently than Node.js
// They are available at runtime via the deployment's environment configuration

// Discord OAuth token exchange
export const exchangeDiscordCode = action({
  args: {
    code: v.string(),
    redirectUri: v.string(),
  },
  handler: async (_ctx, { code, redirectUri }) => {
    // Access Convex environment variables
    // These are set via: npx convex env set VARIABLE_NAME value
    const clientId = process.env.DISCORD_CLIENT_ID;
    const clientSecret = process.env.DISCORD_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      throw new Error("Discord OAuth not configured on server");
    }

    // Exchange code for access token
    const tokenResponse = await fetch("https://discord.com/api/oauth2/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: "authorization_code",
        code,
        redirect_uri: redirectUri,
      }),
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error("Discord token exchange failed:", errorText);
      throw new Error(`Failed to exchange code for token: ${tokenResponse.status}`);
    }

    const tokens = await tokenResponse.json();

    // Fetch user info
    const userResponse = await fetch("https://discord.com/api/users/@me", {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });

    if (!userResponse.ok) {
      throw new Error("Failed to fetch Discord user info");
    }

    const user = await userResponse.json();

    // Fetch connections
    const connectionsResponse = await fetch(
      "https://discord.com/api/users/@me/connections",
      {
        headers: { Authorization: `Bearer ${tokens.access_token}` },
      }
    );

    if (!connectionsResponse.ok) {
      throw new Error("Failed to fetch Discord connections");
    }

    const connections = await connectionsResponse.json();

    return {
      user: {
        id: user.id,
        username: user.username,
        discriminator: user.discriminator,
        avatar: user.avatar,
      },
      connections,
    };
  },
});

// Steam OAuth handling
export const exchangeSteamAuth = action({
  args: {
    steamId: v.string(),
  },
  handler: async (_ctx, { steamId }) => {
    const apiKey = process.env.STEAM_API_KEY;

    if (!apiKey) {
      throw new Error("Steam API not configured on server");
    }

    // Fetch user info
    const userResponse = await fetch(
      `https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v2/?key=${apiKey}&steamids=${steamId}`
    );

    if (!userResponse.ok) {
      throw new Error("Failed to fetch Steam user info");
    }

    const userData = await userResponse.json();
    const player = userData.response?.players?.[0];

    if (!player) {
      throw new Error("Steam user not found");
    }

    // Fetch friends list
    const friendsResponse = await fetch(
      `https://api.steampowered.com/ISteamUser/GetFriendList/v1/?key=${apiKey}&steamid=${steamId}&relationship=friend`
    );

    // Handle private friend lists
    if (friendsResponse.status === 401 || friendsResponse.status === 403) {
      throw new Error(
        "Friend list is private. Please make it public in Steam privacy settings."
      );
    }

    if (!friendsResponse.ok) {
      throw new Error("Failed to fetch Steam friends list");
    }

    const friendsData = await friendsResponse.json();
    const friends = friendsData.friendslist?.friends || [];

    // Limit to 100 friends to avoid rate limits
    const friendIds = friends.slice(0, 100).map((f: any) => f.steamid);

    if (friendIds.length === 0) {
      return {
        userInfo: {
          steamid: player.steamid,
          personaname: player.personaname,
          avatar: player.avatar,
        },
        friends: [],
      };
    }

    // Batch fetch friend details
    const friendDetailsResponse = await fetch(
      `https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v2/?key=${apiKey}&steamids=${friendIds.join(
        ","
      )}`
    );

    if (!friendDetailsResponse.ok) {
      throw new Error("Failed to fetch Steam friend details");
    }

    const friendDetailsData = await friendDetailsResponse.json();
    const friendDetails = friendDetailsData.response?.players || [];

    return {
      userInfo: {
        steamid: player.steamid,
        personaname: player.personaname,
        avatar: player.avatar,
      },
      friends: friendDetails.map((f: any) => ({
        steamid: f.steamid,
        personaname: f.personaname,
      })),
    };
  },
});
