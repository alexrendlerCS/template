/**
 * Google OAuth Code Exchange Handler
 *
 * This endpoint:
 * 1. Validates the authenticated user
 * 2. Exchanges the OAuth code for tokens
 * 3. Stores the tokens in the user's profile
 * 4. Creates a dedicated calendar for training sessions
 */

import { createClient } from "@/lib/supabase-server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    // Get code and state from query params
    const url = new URL(request.url);
    const code = url.searchParams.get("code");
    const state = url.searchParams.get("state");
    const origin = url.origin;

    if (!code || !state) {
      console.error("❌ Missing code or state");
      // Since we don't have a session yet, redirect to login
      return NextResponse.redirect(
        `${origin}/login?error=${encodeURIComponent("Missing OAuth parameters")}`
      );
    }

    // Create Supabase client
    const supabase = createClient();

    // Get user session
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError) {
      console.error("❌ Session error:", sessionError);
      return NextResponse.redirect(
        `${origin}/login?error=${encodeURIComponent(sessionError.message)}`
      );
    }

    if (!session?.user) {
      console.error("❌ No session found");
      return NextResponse.redirect(
        `${origin}/login?error=${encodeURIComponent("Please log in to continue")}`
      );
    }

    // Get user role for redirects
    const { data: userData, error: userRoleError } = await supabase
      .from("users")
      .select("role")
      .eq("id", session.user.id)
      .single();

    if (userRoleError) {
      console.error("❌ Failed to fetch user role:", userRoleError);
      return NextResponse.redirect(
        `${origin}/login?error=${encodeURIComponent("Failed to fetch user role")}`
      );
    }

    const redirectPath =
      userData.role === "trainer" ? "/trainer/dashboard" : "/client/dashboard";

    try {
      // Exchange code for tokens
      const tokenRequestBody = {
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        code,
        grant_type: "authorization_code",
        redirect_uri: process.env.GOOGLE_REDIRECT_URI,
      };

      console.log("🔄 Token Exchange Request:", {
        redirect_uri: process.env.GOOGLE_REDIRECT_URI,
        code_length: code.length,
        client_id: process.env.GOOGLE_CLIENT_ID ? "present" : "missing",
        client_secret: process.env.GOOGLE_CLIENT_SECRET ? "present" : "missing",
      });

      const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(tokenRequestBody),
      });

      if (!tokenResponse.ok) {
        const error = await tokenResponse.text();
        console.error("❌ Token exchange failed:", error);
        throw new Error("Failed to exchange token");
      }

      const tokenData = await tokenResponse.json();

      // First store the tokens in the users table
      const { error: updateError } = await supabase
        .from("users")
        .update({
          google_access_token: tokenData.access_token,
          google_refresh_token: tokenData.refresh_token,
          google_token_expiry: new Date(
            Date.now() + tokenData.expires_in * 1000
          ).toISOString(),
        })
        .eq("id", session.user.id);

      if (updateError) {
        console.error("❌ Failed to update user:", updateError);
        throw new Error("Failed to store tokens");
      }

      // Get user's role and name for calendar creation
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("role, full_name")
        .eq("id", session.user.id)
        .single();

      if (userError) {
        console.error("❌ Failed to fetch user data:", userError);
        throw new Error("Failed to fetch user data");
      }

      // Create a dedicated calendar for training sessions
      const calendarResponse = await fetch(
        `${origin}/api/google/calendar/create`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            // Pass the auth cookie through
            cookie: request.headers.get("cookie") || "",
          },
          credentials: "include",
        }
      );

      if (!calendarResponse.ok) {
        const error = await calendarResponse.text();
        console.error("❌ Calendar creation failed:", error);
        throw new Error("Failed to create training calendar");
      }

      const calendarData = await calendarResponse.json();

      // Force a cache revalidation by adding a timestamp to the success URL
      const timestamp = Date.now();
      const response = NextResponse.redirect(
        `${origin}${redirectPath}?success=true&calendarName=${encodeURIComponent(calendarData.calendarName)}&t=${timestamp}`
      );

      // Set cookie to indicate successful connection
      response.cookies.set("google_connected", "true", {
        path: "/",
        maxAge: 60 * 5, // 5 minutes
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
      });

      return response;
    } catch (error) {
      console.error("❌ Error during OAuth flow:", error);
      // Get user role for error redirect
      const { data: userData } = await supabase
        .from("users")
        .select("role")
        .eq("id", session.user.id)
        .single();

      const redirectPath =
        userData?.role === "trainer"
          ? "/trainer/dashboard"
          : "/client/dashboard";
      return NextResponse.redirect(
        `${origin}${redirectPath}?error=${encodeURIComponent(error instanceof Error ? error.message : "Unexpected error occurred")}`
      );
    }
  } catch (error) {
    console.error("❌ Unexpected error:", error);
    const url = new URL(request.url);
    // Default to client dashboard for unexpected errors since we can't determine role
    return NextResponse.redirect(
      `${url.origin}/client/dashboard?error=${encodeURIComponent("Unexpected error occurred")}`
    );
  }
}

export async function POST(request: Request) {
  const url = new URL(request.url);
  const origin = url.origin;

  try {
    const { code, state } = await request.json();

    if (!code || !state) {
      return NextResponse.json(
        { error: "Missing code or state" },
        { status: 400 }
      );
    }

    // Create a new request to the GET handler
    const newUrl = new URL(url);
    newUrl.searchParams.set("code", code);
    newUrl.searchParams.set("state", state);

    const newRequest = new Request(newUrl, {
      headers: request.headers,
    });

    return GET(newRequest);
  } catch (error) {
    console.error("❌ Failed to parse request body:", error);
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 }
    );
  }
}
