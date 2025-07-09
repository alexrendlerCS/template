import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

export async function DELETE(_: Request, context: { params: { id: string } }) {
  try {
    const supabase = createClient();

    const { error } = await supabase
      .from("sessions")
      .delete()
      .eq("id", context.params.id);

    if (error) {
      return NextResponse.json(
        { error: "Failed to delete session" },
        { status: 500 }
      );
    }

    return NextResponse.json({ message: "Session deleted successfully" });
  } catch (error) {
    console.error("Error deleting session:", error);
    return NextResponse.json(
      { error: "Failed to delete session" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = createClient();
    const { id } = await context.params;
    const body = await request.json();
    console.log("[PATCH] Received id:", id);
    console.log("[PATCH] Received body:", body);
    const {
      date,
      start_time,
      end_time,
      type,
      notes,
      status,
      duration_minutes,
    } = body;

    const { data, error } = await supabase
      .from("sessions")
      .update({
        ...(date && { date }),
        ...(start_time && { start_time }),
        ...(end_time && { end_time }),
        ...(type && { type }),
        ...(notes && { notes }),
        ...(status && { status }),
        ...(duration_minutes && { duration_minutes }),
      })
      .eq("id", id)
      .select()
      .single();

    console.log("[PATCH] Update result:", { data, error });

    if (error) {
      return NextResponse.json(
        { error: "Failed to update session", details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ session: data });
  } catch (error) {
    console.error("Error updating session:", error);
    return NextResponse.json(
      { error: "Failed to update session" },
      { status: 500 }
    );
  }
}
