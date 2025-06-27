import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabaseClient";

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
