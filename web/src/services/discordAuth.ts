import { api } from "../../convex/_generated/api";
import { ConvexHttpClient } from "convex/browser";

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

  // Use Convex action to securely exchange code for token
  // This keeps the client secret on the server
  const convexUrl = import.meta.env.VITE_CONVEX_URL;
  const client = new ConvexHttpClient(convexUrl);

  const result = await client.action(api.oauth.exchangeDiscordCode, {
    code,
    redirectUri: DISCORD_REDIRECT_URI!,
  });

  return result;
}
