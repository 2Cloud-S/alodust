import { api } from "../../convex/_generated/api";
import { ConvexHttpClient } from "convex/browser";

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

export async function getSteamDataSecurely(steamId: string) {
  // Use Convex action to securely fetch Steam data
  // This keeps the API key on the server
  const convexUrl = import.meta.env.VITE_CONVEX_URL;
  const client = new ConvexHttpClient(convexUrl);

  const result = await client.action(api.oauth.exchangeSteamAuth, {
    steamId,
  });

  return result;
}
