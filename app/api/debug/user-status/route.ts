import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";

export async function GET() {
  try {
    console.log("=== USER STATUS DEBUG START ===");

    const supabase = createClient();

    // Check session
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError) {
      console.error("Session error:", sessionError);
      return NextResponse.json(
        {
          status: "error",
          error: "Session error",
          details: sessionError,
          timestamp: new Date().toISOString(),
        },
        { status: 401 }
      );
    }

    if (!session?.user) {
      console.error("No session found");
      return NextResponse.json(
        {
          status: "error",
          error: "No session found",
          timestamp: new Date().toISOString(),
        },
        { status: 401 }
      );
    }

    console.log("User authenticated:", session.user.email);
    console.log("User ID:", session.user.id);

    // Check user record in database
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("*")
      .eq("id", session.user.id)
      .single();

    if (userError) {
      console.error("Database error:", userError);
      return NextResponse.json(
        {
          status: "error",
          error: "Database error",
          details: userError,
          user: {
            id: session.user.id,
            email: session.user.email,
            emailConfirmed: session.user.email_confirmed_at,
            createdAt: session.user.created_at,
            lastSignIn: session.user.last_sign_in_at,
          },
          timestamp: new Date().toISOString(),
        },
        { status: 500 }
      );
    }

    if (!userData) {
      console.error("No user record found in database");
      return NextResponse.json(
        {
          status: "error",
          error: "No user record found in database",
          user: {
            id: session.user.id,
            email: session.user.email,
            emailConfirmed: session.user.email_confirmed_at,
            createdAt: session.user.created_at,
            lastSignIn: session.user.last_sign_in_at,
          },
          timestamp: new Date().toISOString(),
        },
        { status: 404 }
      );
    }

    console.log("User data found:", userData);

    // Test database permissions by trying to update a test field
    const testUpdate = await supabase
      .from("users")
      .update({
        // Don't actually change anything, just test permissions
        updated_at: new Date().toISOString(),
      })
      .eq("id", session.user.id)
      .select("updated_at")
      .single();

    console.log("Database update test result:", testUpdate);

    // Check if contracts bucket exists and is accessible
    const { data: bucketData, error: bucketError } =
      await supabase.storage.listBuckets();

    const contractsBucketExists = bucketData?.some(
      (bucket) => bucket.name === "contracts"
    );
    console.log("Contracts bucket exists:", contractsBucketExists);

    // Test storage permissions
    let storageTestResult = null;
    if (contractsBucketExists) {
      const testFileName = `test_${session.user.id}_${Date.now()}.txt`;
      const testContent = "Test file for permissions check";

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("contracts")
        .upload(testFileName, testContent, {
          contentType: "text/plain",
          upsert: true,
        });

      if (!uploadError) {
        // Clean up test file
        await supabase.storage.from("contracts").remove([testFileName]);

        storageTestResult = "success";
      } else {
        storageTestResult = uploadError;
      }
    }

    console.log("Storage test result:", storageTestResult);

    return NextResponse.json({
      status: "success",
      user: {
        id: session.user.id,
        email: session.user.email,
        emailConfirmed: session.user.email_confirmed_at,
        createdAt: session.user.created_at,
        lastSignIn: session.user.last_sign_in_at,
      },
      userData: {
        ...userData,
        contractAccepted: userData.contract_accepted,
        googleConnected: userData.google_account_connected,
        role: userData.role,
        fullName: userData.full_name,
      },
      databaseTest: {
        canRead: !userError,
        canUpdate: !testUpdate.error,
        updateError: testUpdate.error,
      },
      storageTest: {
        contractsBucketExists,
        canUpload: storageTestResult === "success",
        uploadError: storageTestResult !== "success" ? storageTestResult : null,
      },
      session: {
        expiresAt: session.expires_at,
        refreshToken: !!session.refresh_token,
        accessToken: !!session.access_token,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("User status debug error:", error);
    return NextResponse.json(
      {
        status: "error",
        error: "Unexpected error",
        details: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
