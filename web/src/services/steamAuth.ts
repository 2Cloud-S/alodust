// Steam OpenID Configuration
const STEAM_REDIRECT_URI = import.meta.env.VITE_STEAM_REDIRECT_URI;

export function initiateSteamAuth() {
  if (!STEAM_REDIRECT_URI) {
    console.error("Steam auth not configured. Please set environment variables.");
    alert("Steam integration is not configured. Please contact support.");
    return;
  }

  const realm = window.location.origin;
  const returnTo = STEAM_REDIRECT_URI;

  const authUrl = `https://steamcommunity.com/openid/login?openid.mode=checkid_setup&openid.ns=http://specs.openid.net/auth/2.0&openid.identity=http://specs.openid.net/auth/2.0/identifier_select&openid.claimed_id=http://specs.openid.net/auth/2.0/identifier_select&openid.return_to=${encodeURIComponent(
    returnTo
  )}&openid.realm=${encodeURIComponent(realm)}`;

  window.location.href = authUrl;
}

export function extractSteamId(returnUrl: string): string | null {
  // Steam returns the ID in the claimed_id parameter
  // Format: https://steamcommunity.com/openid/id/[STEAM_ID]
  const match = returnUrl.match(/openid\/id\/(\d+)/);
  return match ? match[1] : null;
}

export async function getSteamUserInfo(steamId: string) {
  const apiKey = import.meta.env.VITE_STEAM_API_KEY;

  if (!apiKey) {
    throw new Error("Steam API key not configured");
  }

  // Fetch user summary
  const response = await fetch(
    `https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v2/?key=${apiKey}&steamids=${steamId}`
  );

  if (!response.ok) {
    throw new Error("Failed to fetch Steam user info");
  }

  const data = await response.json();
  const player = data.response.players[0];

  if (!player) {
    throw new Error("Steam user not found");
  }

  return {
    steamid: player.steamid,
    personaname: player.personaname,
    profileurl: player.profileurl,
    avatar: player.avatar,
    avatarmedium: player.avatarmedium,
    avatarfull: player.avatarfull,
  };
}

export async function getSteamFriends(steamId: string) {
  const apiKey = import.meta.env.VITE_STEAM_API_KEY;

  if (!apiKey) {
    throw new Error("Steam API key not configured");
  }

  // Fetch friends list
  const friendsResponse = await fetch(
    `https://api.steampowered.com/ISteamUser/GetFriendList/v1/?key=${apiKey}&steamid=${steamId}&relationship=friend`
  );

  if (!friendsResponse.ok) {
    // User's friend list might be private
    if (friendsResponse.status === 401 || friendsResponse.status === 403) {
      throw new Error("Friend list is private. Please make it public in Steam privacy settings.");
    }
    throw new Error("Failed to fetch Steam friends");
  }

  const friendsData = await friendsResponse.json();
  const friendsList = friendsData.friendslist?.friends || [];

  if (friendsList.length === 0) {
    return [];
  }

  // Get friend details (batch request, max 100 at a time)
  const friendIds = friendsList.map((f: { steamid: string }) => f.steamid).slice(0, 100);
  const summariesResponse = await fetch(
    `https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v2/?key=${apiKey}&steamids=${friendIds.join(
      ","
    )}`
  );

  if (!summariesResponse.ok) {
    throw new Error("Failed to fetch friend details");
  }

  const summaries = await summariesResponse.json();

  return summaries.response.players.map((player: { steamid: string; personaname: string }) => ({
    steamid: player.steamid,
    personaname: player.personaname,
  }));
}
