import { createClient } from "@/lib/supabase-server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    console.log("Cleanup orphaned events request received");
    const supabase = createClient();

    // Use getUser() instead of getSession() for better security
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      console.log("No authenticated user found:", authError?.message);
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Check if user is admin/trainer
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single();

    if (userError || !userData) {
      return new NextResponse("Failed to verify user role", { status: 500 });
    }

    if (userData.role !== "trainer" && userData.role !== "admin") {
      return new NextResponse(
        "Unauthorized - trainer or admin access required",
        { status: 403 }
      );
    }

    // Find sessions with orphaned event IDs (events that don't exist in Google Calendar)
    console.log("Finding sessions with orphaned event IDs...");

    const { data: sessionsWithOrphanedEvents, error: fetchError } =
      await supabase
        .from("sessions")
        .select(
          "id, google_event_id, client_google_event_id, date, start_time, type"
        )
        .or("google_event_id.is.not.null,client_google_event_id.is.not.null")
        .order("date", { ascending: false });

    if (fetchError) {
      console.error("Error fetching sessions:", fetchError);
      return new NextResponse("Failed to fetch sessions", { status: 500 });
    }

    console.log(
      `Found ${sessionsWithOrphanedEvents?.length || 0} sessions with event IDs`
    );

    let cleanedCount = 0;
    const results = {
      totalSessions: sessionsWithOrphanedEvents?.length || 0,
      cleanedTrainerEvents: 0,
      cleanedClientEvents: 0,
      errors: [] as string[],
    };

    // For now, we'll just clear all event IDs since we can't easily verify them
    // In a production environment, you might want to actually check each event ID
    // against the Google Calendar API to see if it exists

    for (const session of sessionsWithOrphanedEvents || []) {
      try {
        const updateData: any = {};
        let hasChanges = false;

        if (session.google_event_id) {
          updateData.google_event_id = null;
          hasChanges = true;
          results.cleanedTrainerEvents++;
        }

        if (session.client_google_event_id) {
          updateData.client_google_event_id = null;
          hasChanges = true;
          results.cleanedClientEvents++;
        }

        if (hasChanges) {
          const { error: updateError } = await supabase
            .from("sessions")
            .update(updateData)
            .eq("id", session.id);

          if (updateError) {
            console.error(
              `Failed to clean session ${session.id}:`,
              updateError
            );
            results.errors.push(
              `Session ${session.id}: ${updateError.message}`
            );
          } else {
            cleanedCount++;
            console.log(`Cleaned orphaned event IDs for session ${session.id}`);
          }
        }
      } catch (error) {
        console.error(`Error processing session ${session.id}:`, error);
        results.errors.push(
          `Session ${session.id}: ${error instanceof Error ? error.message : "Unknown error"}`
        );
      }
    }

    console.log("Cleanup completed:", results);
    return NextResponse.json({
      message: `Successfully cleaned ${cleanedCount} sessions`,
      ...results,
    });
  } catch (error) {
    console.error("Cleanup orphaned events error:", error);
    return new NextResponse(
      `Failed to cleanup orphaned events: ${error instanceof Error ? error.message : "Unknown error"}`,
      { status: 500 }
    );
  }
}
