import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = createClient();
    const { id: sessionId } = await context.params;

    // Get current user session
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError || !session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { action, responseNote } = body; // action: 'approve' or 'deny'

    // Validate action
    if (!action || !["approve", "deny"].includes(action)) {
      return NextResponse.json(
        { error: "Invalid action. Must be 'approve' or 'deny'" },
        { status: 400 }
      );
    }

    // Verify the session exists and belongs to the current trainer
    const { data: sessionData, error: fetchError } = await supabase
      .from("sessions")
      .select("id, trainer_id, reschedule_status, status")
      .eq("id", sessionId)
      .single();

    if (fetchError || !sessionData) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    // Check if user is the trainer for this session
    if (sessionData.trainer_id !== session.user.id) {
      return NextResponse.json(
        { error: "Unauthorized to respond to this reschedule request" },
        { status: 403 }
      );
    }

    // Check if there's a pending reschedule request
    if (sessionData.reschedule_status !== "pending") {
      return NextResponse.json(
        { error: "No pending reschedule request for this session" },
        { status: 400 }
      );
    }

    // Call the appropriate database function
    let responseError;
    if (action === "approve") {
      const { error } = await supabase.rpc("approve_reschedule", {
        session_id: sessionId,
        trainer_id: session.user.id,
        response_note: responseNote || null,
      });
      responseError = error;
    } else {
      const { error } = await supabase.rpc("deny_reschedule", {
        session_id: sessionId,
        trainer_id: session.user.id,
        response_note: responseNote || null,
      });
      responseError = error;
    }

    if (responseError) {
      console.error("Reschedule response error:", responseError);
      return NextResponse.json(
        { error: `Failed to ${action} reschedule request` },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: `Reschedule request ${action}d successfully`,
    });
  } catch (error) {
    console.error("Error responding to reschedule:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
