import { createClient } from "@/lib/supabase-server";
import { cookies } from "next/headers";
import { Database } from "@/lib/database.types";

export async function POST(req: Request) {
  console.log("[LOGIN] Login route called");
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      console.log("[LOGIN] Missing email or password");
      return new Response(
        JSON.stringify({ error: "Missing email or password" }),
        { status: 400 }
      );
    }

    // Create a Supabase client with cookie handling
    const cookieStore = cookies();
    const supabase = createClient();

    console.log("[LOGIN] Attempting signInWithPassword", { email });
    const { data: authData, error: authError } =
      await supabase.auth.signInWithPassword({
        email,
        password,
      });
    console.log("[LOGIN] signInWithPassword result", { authData, authError });

    if (authError || !authData.session) {
      console.log("[LOGIN] Auth error or missing session", {
        authError,
        session: authData.session,
      });
      return new Response(
        JSON.stringify({ error: authError?.message || "Invalid credentials" }),
        { status: 401 }
      );
    }

    const session = authData.session;
    const user = authData.user;
    console.log("[LOGIN] Session and user", { session, user });

    // Check if user exists in users table
    let { data: userData, error: userDataError } = await supabase
      .from("users")
      .select("*")
      .eq("id", user.id)
      .single();
    console.log("[LOGIN] users table query", { userData, userDataError });

    // If user does not exist, insert a new row
    if (userDataError && userDataError.code === "PGRST116") {
      // PGRST116: No rows found
      const full_name = user.user_metadata?.full_name || "";
      const role = user.user_metadata?.role || "client";
      const insertPayload = {
        id: user.id,
        email: user.email,
        full_name,
        role,
        contract_accepted: false,
        google_account_connected: false,
        created_at: new Date().toISOString(),
      };
      console.log(
        "[LOGIN] No user row found, inserting new user",
        insertPayload
      );
      const { data: insertData, error: insertError } = await supabase
        .from("users")
        .insert([insertPayload])
        .select()
        .single();
      if (insertError) {
        console.log("[LOGIN] Error inserting new user", insertError);
        return new Response(
          JSON.stringify({ error: "Failed to create user profile" }),
          { status: 500 }
        );
      }
      userData = insertData;
      console.log("[LOGIN] New user row inserted", { userData });
    } else if (userDataError) {
      // Some other error
      console.log("[LOGIN] User data error", userDataError);
      return new Response(JSON.stringify({ error: "User lookup failed" }), {
        status: 500,
      });
    }

    // Merge auth user and users table data
    const mergedUser = { ...user, ...userData };

    return new Response(
      JSON.stringify({
        user: mergedUser,
        session,
      }),
      { status: 200 }
    );
  } catch (err) {
    console.log("[LOGIN] Unexpected error", err);
    return new Response(
      JSON.stringify({ error: "Unexpected error occurred" }),
      { status: 500 }
    );
  }
}
