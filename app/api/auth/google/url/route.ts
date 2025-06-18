import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

export async function GET() {
  try {
    const supabase = createRouteHandlerClient({ cookies });

    // Get the current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Not authenticated" }), {
        status: 401,
      });
    }

    // Generate state parameter to prevent CSRF
    const state = Math.random().toString(36).substring(7);

    // Store state in cookie for verification in callback
    const cookieStore = await cookies();
    cookieStore.set("google_oauth_state", state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 5, // 5 minutes
    });

    // Construct OAuth URL
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const redirectUri = process.env.GOOGLE_REDIRECT_URI;
    const scope = encodeURIComponent(
      "https://www.googleapis.com/auth/calendar"
    );

    const url =
      `https://accounts.google.com/o/oauth2/v2/auth?` +
      `client_id=${clientId}` +
      `&redirect_uri=${encodeURIComponent(redirectUri!)}` +
      `&response_type=code` +
      `&scope=${scope}` +
      `&access_type=offline` +
      `&state=${state}` +
      `&prompt=consent`;

    return new Response(JSON.stringify({ url }), { status: 200 });
  } catch (error) {
    console.error("Error generating Google OAuth URL:", error);
    return new Response(
      JSON.stringify({ error: "Failed to generate OAuth URL" }),
      { status: 500 }
    );
  }
}
