import { oauth2Client } from "@/lib/google";
import { supabaseAdmin } from "@/lib/supabase-server";
import { cookies } from "next/headers";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");

  if (!code) {
    return new Response("Missing code", { status: 400 });
  }

  try {
    const { tokens } = await oauth2Client.getToken(code);

    // Get user session from Supabase auth
    const cookieStore = await cookies();
    const supabaseAccessToken = cookieStore.get("sb-access-token")?.value;

    if (!supabaseAccessToken) {
      return new Response("Not authenticated", { status: 401 });
    }

    const { data: userData, error } = await supabaseAdmin.auth.getUser(
      supabaseAccessToken
    );
    if (error || !userData?.user?.id) {
      return new Response("Could not fetch Supabase user", { status: 401 });
    }

    const user_id = userData.user.id;

    // Store tokens in Supabase `users` table
    const { error: updateError } = await supabaseAdmin
      .from("users")
      .update({
        google_access_token: tokens.access_token,
        google_refresh_token: tokens.refresh_token,
        google_token_expiry: tokens.expiry_date
          ? new Date(tokens.expiry_date).toISOString()
          : null,
        google_calendar_id: "primary",
      })
      .eq("id", user_id);

    if (updateError) {
      return new Response("Failed to store tokens", { status: 500 });
    }

    return new Response("Google Calendar connected!", { status: 200 });
  } catch (err) {
    console.error(err);
    return new Response("OAuth failed", { status: 500 });
  }
}
