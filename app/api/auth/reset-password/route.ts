import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(request: Request) {
  try {
    const { token, password } = await request.json();

    if (!token || !password) {
      return NextResponse.json(
        { error: "Token and password are required" },
        { status: 400 }
      );
    }

    // Validate password strength
    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters long" },
        { status: 400 }
      );
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
        { error: "Invalid or expired reset token" },
        { status: 400 }
      );
    }

    // Check if token is expired
    if (new Date(tokenData.expires_at) < new Date()) {
      return NextResponse.json(
        { error: "Reset token has expired" },
        { status: 400 }
      );
    }

    // Check if token has already been used
    if (tokenData.used) {
      return NextResponse.json(
        { error: "Reset token has already been used" },
        { status: 400 }
      );
    }

    // Get user data
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("email")
      .eq("id", tokenData.user_id)
      .single();

    if (userError || !userData) {
      return NextResponse.json({ error: "User not found" }, { status: 400 });
    }

    // Update the user's password in Supabase Auth
    const { error: updateError } = await supabase.auth.admin.updateUserById(
      tokenData.user_id,
      { password: password }
    );

    if (updateError) {
      console.error("Error updating password:", updateError);
      return NextResponse.json(
        { error: "Failed to update password" },
        { status: 500 }
      );
    }

    // Mark the token as used
    const { error: markUsedError } = await supabase
      .from("password_reset_tokens")
      .update({ used: true })
      .eq("token", token);

    if (markUsedError) {
      console.error("Error marking token as used:", markUsedError);
      // Don't fail the request if we can't mark the token as used
      // The password was successfully updated
    }

    console.log(`Password successfully reset for user: ${userData.email}`);

    return NextResponse.json(
      { message: "Password has been successfully reset" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Failed to reset password:", error);
    return NextResponse.json(
      { error: "Failed to reset password" },
      { status: 500 }
    );
  }
}
