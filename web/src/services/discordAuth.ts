// Discord OAuth Configuration
const DISCORD_CLIENT_ID = import.meta.env.VITE_DISCORD_CLIENT_ID;
const DISCORD_REDIRECT_URI = import.meta.env.VITE_DISCORD_REDIRECT_URI;

export function initiateDiscordOAuth() {
  if (!DISCORD_CLIENT_ID || !DISCORD_REDIRECT_URI) {
    console.error("Discord OAuth not configured. Please set environment variables.");
    alert("Discord integration is not configured. Please contact support.");
    return;
  }

  const scope = "identify connections";
  const state = Math.random().toString(36).substring(7); // CSRF protection

  // Store state in sessionStorage for verification
  sessionStorage.setItem("discord_oauth_state", state);

  const authUrl = `https://discord.com/api/oauth2/authorize?client_id=${DISCORD_CLIENT_ID}&redirect_uri=${encodeURIComponent(
    DISCORD_REDIRECT_URI
  )}&response_type=code&scope=${encodeURIComponent(scope)}&state=${state}`;

  window.location.href = authUrl;
}

export async function handleDiscordCallback(code: string, state: string) {
  // Verify state to prevent CSRF
  const savedState = sessionStorage.getItem("discord_oauth_state");
  if (state !== savedState) {
    throw new Error("Invalid state parameter - possible CSRF attack");
  }
  sessionStorage.removeItem("discord_oauth_state");

  // Exchange code for access token
  const tokenResponse = await fetch("https://discord.com/api/oauth2/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: DISCORD_CLIENT_ID!,
      client_secret: import.meta.env.VITE_DISCORD_CLIENT_SECRET || "",
      grant_type: "authorization_code",
      code,
      redirect_uri: DISCORD_REDIRECT_URI!,
    }),
  });

  if (!tokenResponse.ok) {
    throw new Error("Failed to exchange code for token");
  }

  const tokens = await tokenResponse.json();

  // Fetch user info
  const userResponse = await fetch("https://discord.com/api/users/@me", {
    headers: { Authorization: `Bearer ${tokens.access_token}` },
  });

  if (!userResponse.ok) {
    throw new Error("Failed to fetch user info");
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
    throw new Error("Failed to fetch connections");
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
}
