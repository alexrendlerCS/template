import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";
import crypto from "crypto";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return new Response(JSON.stringify({ error: "Email is required" }), {
        status: 400,
      });
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return new Response(
        JSON.stringify({ error: "Please enter a valid email address" }),
        { status: 400 }
      );
    }

    // Create Supabase client with service role key
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Use Supabase Admin API to list all users and filter by email
    const { data: users, error: userError } =
      await supabase.auth.admin.listUsers();

    const userData = users?.users?.find((u) => u.email === email);

    if (userError || !userData) {
      return new Response(
        JSON.stringify({
          error:
            "We don't have an account registered under that email. Please check for typos or try a different email.",
        }),
        { status: 404 }
      );
    }

    // Generate a secure reset token
    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now

    // Store the reset token in the database
    const { error: tokenError } = await supabase
      .from("password_reset_tokens")
      .upsert({
        user_id: userData.id,
        token: resetToken,
        expires_at: resetTokenExpiry.toISOString(),
        used: false,
      });

    if (tokenError) {
      console.error("Error storing reset token:", tokenError);
      return new Response(
        JSON.stringify({
          error: "Failed to create reset token. Please try again.",
        }),
        { status: 500 }
      );
    }

    // Create reset URL with robust fallback
    const appUrl =
      process.env.NEXT_PUBLIC_APP_URL ||
      process.env.NEXT_PUBLIC_SITE_URL ||
      process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : process.env.NODE_ENV === "production"
          ? request.headers.get("host")
            ? `https://${request.headers.get("host")}`
            : "https://yourdomain.com"
          : "http://localhost:3000";
    const resetUrl = `${appUrl}/reset-password?token=${resetToken}`;

    // Format the email HTML
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8f9fa;">
        <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #dc2626; margin: 0; font-size: 28px;">Fitness Training</h1>
            <p style="color: #6b7280; margin: 10px 0 0 0; font-size: 16px;">Password Reset Request</p>
          </div>
          <p style="font-size: 16px; color: #374151; margin-bottom: 20px;">
            Hello,
          </p>
          <p style="font-size: 16px; color: #374151; margin-bottom: 20px;">
            We received a request to reset your password for your Fitness Training account. 
            If you didn't make this request, you can safely ignore this email.
          </p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" 
               style="background-color: #dc2626; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; display: inline-block;">
              Reset Your Password
            </a>
          </div>
          <p style="font-size: 14px; color: #6b7280; margin-bottom: 20px;">
            This link will expire in 1 hour for security reasons. If you need a new link, 
            please request another password reset.
          </p>
          <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p style="font-size: 14px; color: #6b7280; margin: 0;">
              <strong>Security Notice:</strong> If you didn't request this password reset, 
              please contact our support team immediately. Your account security is important to us.
            </p>
          </div>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;" />
          <p style="color: #6b7280; font-size: 14px; text-align: center; margin: 0;">
            — Fitness Training Team<br>
            <a href="${appUrl}" style="color: #dc2626;">${appUrl}</a>
          </p>
        </div>
      </div>
    `;

    // Send email with Resend
    try {
      await resend.emails.send({
        from: "Fitness Training <no-reply@coachkilday.com>",
        to: [email],
        subject: "Reset Your Fitness Training Password",
        html: emailHtml,
      });
    } catch (emailError) {
      console.error("Failed to send password reset email:", emailError);
      return new Response(
        JSON.stringify({
          error: "Failed to send reset email. Please try again.",
        }),
        { status: 500 }
      );
    }

    return new Response(
      JSON.stringify({
        message:
          "Password reset link has been sent to your email. Please check your inbox and spam folder.",
      }),
      { status: 200 }
    );
  } catch (error) {
    console.error("Handler error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to process request" }),
      { status: 400 }
    );
  }
}
