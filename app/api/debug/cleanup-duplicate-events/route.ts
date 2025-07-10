import { createClient } from "@/lib/supabase-server";
import { getGoogleCalendarClient } from "@/lib/google";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    console.log("Cleanup duplicate events request received");
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

    const body = await request.json();
    const { sessionId } = body;

    if (!sessionId) {
      return new NextResponse("Session ID is required", { status: 400 });
    }

    // Get the session data
    const { data: session, error: sessionError } = await supabase
      .from("sessions")
      .select(
        "id, google_event_id, client_google_event_id, trainer_id, client_id, date, start_time, type"
      )
      .eq("id", sessionId)
      .single();

    if (sessionError || !session) {
      console.error("Session fetch error:", sessionError);
      return new NextResponse("Session not found", { status: 404 });
    }

    console.log("Cleaning up duplicate events for session:", sessionId);

    const results = {
      sessionId,
      trainerEventsCleaned: 0,
      clientEventsCleaned: 0,
      errors: [] as string[],
    };

    // Clean up trainer calendar events
    if (session.trainer_id) {
      try {
        const { data: trainerData, error: trainerError } = await supabase
          .from("users")
          .select("google_refresh_token, google_calendar_id")
          .eq("id", session.trainer_id)
          .single();

        if (
          !trainerError &&
          trainerData?.google_refresh_token &&
          trainerData?.google_calendar_id
        ) {
          const calendar = await getGoogleCalendarClient(
            trainerData.google_refresh_token
          );

          // List events for the session date and time to find duplicates
          const startTime = new Date(`${session.date}T${session.start_time}`);
          const endTime = new Date(startTime.getTime() + 60 * 60 * 1000); // 1 hour later

          const events = await calendar.events.list({
            calendarId: trainerData.google_calendar_id,
            timeMin: startTime.toISOString(),
            timeMax: endTime.toISOString(),
            q: session.type, // Search for events with the session type in the title
          });

          console.log(
            `Found ${events.data.items?.length || 0} potential duplicate events for trainer`
          );

          // Find events that match this session but are not the current google_event_id
          const duplicateEvents =
            events.data.items?.filter((event) => {
              const summary = event.summary || "";
              return (
                summary.includes(session.type) &&
                event.id !== session.google_event_id &&
                event.start?.dateTime?.includes(session.date)
              );
            }) || [];

          console.log(
            `Found ${duplicateEvents.length} duplicate trainer events`
          );

          // Delete duplicate events
          for (const event of duplicateEvents) {
            try {
              await calendar.events.delete({
                calendarId: trainerData.google_calendar_id,
                eventId: event.id!,
              });
              results.trainerEventsCleaned++;
              console.log(`Deleted duplicate trainer event: ${event.id}`);
            } catch (deleteError) {
              console.error(
                `Failed to delete trainer event ${event.id}:`,
                deleteError
              );
              results.errors.push(`Failed to delete trainer event ${event.id}`);
            }
          }
        }
      } catch (error) {
        console.error("Error cleaning trainer events:", error);
        results.errors.push(
          `Trainer cleanup error: ${error instanceof Error ? error.message : "Unknown error"}`
        );
      }
    }

    // Clean up client calendar events
    if (session.client_id) {
      try {
        const { data: clientData, error: clientError } = await supabase
          .from("users")
          .select("google_refresh_token, google_calendar_id")
          .eq("id", session.client_id)
          .single();

        if (
          !clientError &&
          clientData?.google_refresh_token &&
          clientData?.google_calendar_id
        ) {
          const calendar = await getGoogleCalendarClient(
            clientData.google_refresh_token
          );

          // List events for the session date and time to find duplicates
          const startTime = new Date(`${session.date}T${session.start_time}`);
          const endTime = new Date(startTime.getTime() + 60 * 60 * 1000); // 1 hour later

          const events = await calendar.events.list({
            calendarId: clientData.google_calendar_id,
            timeMin: startTime.toISOString(),
            timeMax: endTime.toISOString(),
            q: session.type, // Search for events with the session type in the title
          });

          console.log(
            `Found ${events.data.items?.length || 0} potential duplicate events for client`
          );

          // Find events that match this session but are not the current client_google_event_id
          const duplicateEvents =
            events.data.items?.filter((event) => {
              const summary = event.summary || "";
              return (
                summary.includes(session.type) &&
                event.id !== session.client_google_event_id &&
                event.start?.dateTime?.includes(session.date)
              );
            }) || [];

          console.log(
            `Found ${duplicateEvents.length} duplicate client events`
          );

          // Delete duplicate events
          for (const event of duplicateEvents) {
            try {
              await calendar.events.delete({
                calendarId: clientData.google_calendar_id,
                eventId: event.id!,
              });
              results.clientEventsCleaned++;
              console.log(`Deleted duplicate client event: ${event.id}`);
            } catch (deleteError) {
              console.error(
                `Failed to delete client event ${event.id}:`,
                deleteError
              );
              results.errors.push(`Failed to delete client event ${event.id}`);
            }
          }
        }
      } catch (error) {
        console.error("Error cleaning client events:", error);
        results.errors.push(
          `Client cleanup error: ${error instanceof Error ? error.message : "Unknown error"}`
        );
      }
    }

    console.log("Cleanup completed:", results);
    return NextResponse.json({
      message: `Successfully cleaned ${results.trainerEventsCleaned + results.clientEventsCleaned} duplicate events`,
      ...results,
    });
  } catch (error) {
    console.error("Cleanup duplicate events error:", error);
    return new NextResponse(
      `Failed to cleanup duplicate events: ${error instanceof Error ? error.message : "Unknown error"}`,
      { status: 500 }
    );
  }
}
