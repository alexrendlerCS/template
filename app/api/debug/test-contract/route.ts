import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";

// A minimal 1x1 black PNG in base64 for testing
const TEST_SIGNATURE =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";

export async function GET() {
  try {
    // Get the authenticated user's email
    const supabase = createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user?.email) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const testData = {
      clientName: "Test User",
      email: user.email, // Use the authenticated user's email
      phone: "123-456-7890",
      startDate: new Date().toISOString().split("T")[0],
      location: "Test Gym",
      signature: `data:image/png;base64,${TEST_SIGNATURE}`,
      signatureDate: new Date().toISOString().split("T")[0],
    };

    console.log("Sending test contract to:", user.email);

    // Make a direct call to the API route
    const response = await fetch(
      "http://localhost:3001/api/contract/generate",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(testData),
      }
    );

    const data = await response.json();

    return NextResponse.json({
      status: response.status,
      data,
      testPayload: testData,
    });
  } catch (error) {
    console.error("Test contract generation error:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
