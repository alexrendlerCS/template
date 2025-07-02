/**
 * Google OAuth URL Generator
 *
 * We use localStorage for state management instead of server sessions or cookies because:
 * 1. OAuth popups/new tabs don't reliably share cookie state with the opener
 * 2. This allows for a more robust cross-window state validation
 * 3. Prevents "Invalid State" errors when users open auth in new tabs/popups
 */

import { NextResponse } from "next/server";

export async function GET(request: Request) {
  // Get state from query params
  const url = new URL(request.url);
  const state = url.searchParams.get("state");

  if (!state) {
    return NextResponse.json(
      { error: "Missing state parameter" },
      { status: 400 }
    );
  }

  const redirectUri = process.env.GOOGLE_REDIRECT_URI;
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const scope = [
    "https://www.googleapis.com/auth/calendar",
    "https://www.googleapis.com/auth/calendar.events",
    "https://www.googleapis.com/auth/calendar.calendars",
  ].join(" ");

  console.log("🔍 OAuth URL Generation:", {
    redirectUri,
    clientId: clientId ? "present" : "missing",
    origin: url.origin,
    state,
  });

  const googleUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  googleUrl.searchParams.set("client_id", clientId!);
  googleUrl.searchParams.set("redirect_uri", redirectUri!);
  googleUrl.searchParams.set("response_type", "code");
  googleUrl.searchParams.set("scope", scope);
  googleUrl.searchParams.set("state", state);
  googleUrl.searchParams.set("access_type", "offline");
  googleUrl.searchParams.set("prompt", "consent");

  const finalUrl = googleUrl.toString();
  console.log("📤 Generated OAuth URL:", finalUrl);

  return NextResponse.json({ url: finalUrl });
}
