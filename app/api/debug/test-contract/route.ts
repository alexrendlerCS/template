import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";

// A minimal 1x1 black PNG in base64 for testing
const TEST_SIGNATURE =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";

export async function GET() {
  try {
    console.log("=== CONTRACT TEST START ===");

    // Check environment variables
    console.log("Environment check:");
    console.log(
      "- SUPABASE_URL:",
      process.env.NEXT_PUBLIC_SUPABASE_URL ? "✓" : "✗"
    );
    console.log(
      "- SUPABASE_SERVICE_ROLE_KEY:",
      process.env.SUPABASE_SERVICE_ROLE_KEY ? "✓" : "✗"
    );
    console.log("- RESEND_API_KEY:", process.env.RESEND_API_KEY ? "✓" : "✗");

    // Get the authenticated user's email
    const supabase = createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user?.email) {
      console.error("User authentication failed:", userError);
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    console.log("User authenticated:", user.email);

    const testData = {
      clientName: "Test User",
      email: user.email, // Use the authenticated user's email
      phone: "123-456-7890",
      startDate: new Date().toISOString().split("T")[0],
      location: "Test Gym",
      signature: `data:image/png;base64,${TEST_SIGNATURE}`,
      signatureDate: new Date().toISOString().split("T")[0],
      userId: user.id,
    };

    console.log("Test data prepared:", {
      clientName: testData.clientName,
      email: testData.email,
      phone: testData.phone,
      startDate: testData.startDate,
      location: testData.location,
      signatureLength: testData.signature.length,
      userId: testData.userId,
    });

    console.log("Sending test contract to:", user.email);

    // Make a direct call to the API route
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/contract/generate`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(testData),
      }
    );

    const data = await response.json();
    console.log("API Response status:", response.status);
    console.log("API Response data:", data);

    return NextResponse.json({
      status: response.status,
      data,
      testPayload: testData,
      environment: {
        supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ? "✓" : "✗",
        serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY ? "✓" : "✗",
        resendApiKey: process.env.RESEND_API_KEY ? "✓" : "✗",
      },
    });
  } catch (error) {
    console.error("Test contract generation error:", error);
    return NextResponse.json(
      {
        error: String(error),
        stack: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}
