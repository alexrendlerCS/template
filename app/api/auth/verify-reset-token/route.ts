import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(request: Request) {
  try {
    const { token } = await request.json();

    if (!token) {
      return NextResponse.json({ error: "Token is required" }, { status: 400 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Verify the reset token
    const { data: tokenData, error: tokenError } = await supabase
      .from("password_reset_tokens")
      .select("user_id, expires_at, used")
      .eq("token", token)
      .single();

    if (tokenError || !tokenData) {
      return NextResponse.json(
        { valid: false, error: "Invalid reset token" },
        { status: 200 }
      );
    }

    // Check if token is expired
    if (new Date(tokenData.expires_at) < new Date()) {
      return NextResponse.json(
        { valid: false, error: "Reset token has expired" },
        { status: 200 }
      );
    }

    // Check if token has already been used
    if (tokenData.used) {
      return NextResponse.json(
        { valid: false, error: "Reset token has already been used" },
        { status: 200 }
      );
    }

    // Get user data for display
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("email, full_name")
      .eq("id", tokenData.user_id)
      .single();

    if (userError || !userData) {
      return NextResponse.json(
        { valid: false, error: "User not found" },
        { status: 200 }
      );
    }

    return NextResponse.json(
      {
        valid: true,
        user: {
          email: userData.email,
          full_name: userData.full_name,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Failed to verify reset token:", error);
    return NextResponse.json(
      { valid: false, error: "Failed to verify reset token" },
      { status: 500 }
    );
  }
}
