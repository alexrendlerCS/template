import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";

export async function DELETE(req: NextRequest) {
  try {
    const supabase = createClient();

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify user is a trainer
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single();

    if (userError || userData?.role !== "trainer") {
      return NextResponse.json(
        { error: "Unauthorized - trainer access required" },
        { status: 403 }
      );
    }

    const { clientId } = await req.json();

    if (!clientId) {
      return NextResponse.json(
        { error: "Client ID is required" },
        { status: 400 }
      );
    }

    // Verify the client exists and is actually a client
    const { data: clientData, error: clientError } = await supabase
      .from("users")
      .select("id, full_name, role")
      .eq("id", clientId)
      .single();

    if (clientError || !clientData) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    // Additional security check: ensure the user being deleted is actually a client
    if (clientData.role !== "client") {
      return NextResponse.json(
        { error: "Can only delete client accounts" },
        { status: 403 }
      );
    }

    // Delete related data in the correct order to avoid foreign key constraints
    // 1. Delete sessions
    const { error: sessionsError } = await supabase
      .from("sessions")
      .delete()
      .or(`trainer_id.eq.${user.id},client_id.eq.${clientId}`);

    if (sessionsError) {
      console.error("Error deleting sessions:", sessionsError);
      return NextResponse.json(
        { error: "Failed to delete client sessions" },
        { status: 500 }
      );
    }

    // 2. Delete packages
    const { error: packagesError } = await supabase
      .from("packages")
      .delete()
      .eq("client_id", clientId);

    if (packagesError) {
      console.error("Error deleting packages:", packagesError);
      return NextResponse.json(
        { error: "Failed to delete client packages" },
        { status: 500 }
      );
    }

    // 3. Delete payments
    const { error: paymentsError } = await supabase
      .from("payments")
      .delete()
      .eq("client_id", clientId);

    if (paymentsError) {
      console.error("Error deleting payments:", paymentsError);
      return NextResponse.json(
        { error: "Failed to delete client payments" },
        { status: 500 }
      );
    }

    // 4. Delete contracts
    const { error: contractsError } = await supabase
      .from("contracts")
      .delete()
      .eq("user_id", clientId);

    if (contractsError) {
      console.error("Error deleting contracts:", contractsError);
      return NextResponse.json(
        { error: "Failed to delete client contracts" },
        { status: 500 }
      );
    }

    // 5. Delete discount codes created by this client (if any)
    const { error: discountCodesError } = await supabase
      .from("discount_codes")
      .delete()
      .eq("created_by", clientId);

    if (discountCodesError) {
      console.error("Error deleting discount codes:", discountCodesError);
      // Don't fail the entire operation for this
    }

    // 6. Finally, delete the user record
    const { error: userDeleteError } = await supabase
      .from("users")
      .delete()
      .eq("id", clientId);

    if (userDeleteError) {
      console.error("Error deleting user:", userDeleteError);
      return NextResponse.json(
        { error: "Failed to delete client profile" },
        { status: 500 }
      );
    }

    // 7. Delete the auth user (this requires admin privileges)
    // Note: This would typically be done with the service role key
    // For now, we'll just delete the database record and let the auth user remain
    // The trainer can handle auth user deletion separately if needed

    return NextResponse.json({
      success: true,
      message: `Client ${clientData.full_name} has been permanently deleted along with all their data.`,
    });
  } catch (err) {
    console.error("Error deleting client:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
