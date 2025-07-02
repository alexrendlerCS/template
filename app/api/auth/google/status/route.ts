import { createClient } from "@/lib/supabase-server";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const supabase = createClient();

    // Get user session
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError) {
      console.error("Session error:", sessionError);
      return NextResponse.json(
        { connected: false, error: "Session error" },
        { status: 401 }
      );
    }

    if (!session?.user) {
      console.error("No session found");
      return NextResponse.json(
        { connected: false, error: "No session found" },
        { status: 401 }
      );
    }

    // Check if user has Google connected
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("google_account_connected")
      .eq("id", session.user.id)
      .single();

    if (userError) {
      console.error("Failed to fetch user data:", userError);
      return NextResponse.json(
        { connected: false, error: "Database error" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      connected: userData?.google_account_connected || false,
    });
  } catch (error) {
    console.error("Error checking Google connection status:", error);
    return NextResponse.json(
      { connected: false, error: "Unexpected error" },
      { status: 500 }
    );
  }
}
