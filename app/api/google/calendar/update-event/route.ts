import { createClient } from "@/lib/supabase-server";
import { getGoogleCalendarClient } from "@/lib/google";
import { NextResponse } from "next/server";

export async function PATCH(request: Request) {
  try {
    console.log("Calendar event update request received");
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

    const searchParams = new URL(request.url).searchParams;
    const trainerId = searchParams.get("trainerId");
    const clientId = searchParams.get("clientId");
    const sessionId = searchParams.get("sessionId");
    const eventDetails = await request.json();

    console.log("Processing update request:", {
      trainerId,
      clientId,
      sessionId,
      eventDetails,
      userId: user.id,
    });

    if (!sessionId) {
      return new NextResponse("Session ID is required", { status: 400 });
    }

    // Get the session to check if it has existing Google event IDs
    const { data: session, error: sessionError } = await supabase
      .from("sessions")
      .select("google_event_id, client_id, trainer_id")
      .eq("id", sessionId)
      .single();

    if (sessionError || !session) {
      console.error("Session fetch error:", sessionError);
      return new NextResponse("Session not found", { status: 404 });
    }

    const results = {
      trainerUpdated: false,
      clientUpdated: false,
      trainerEventId: null as string | null,
      clientEventId: null as string | null,
    };

    // Update trainer calendar event
    if (trainerId) {
      try {
        console.log("Fetching trainer data for ID:", trainerId);
        const { data: trainerData, error: trainerError } = await supabase
          .from("users")
          .select("google_refresh_token, google_calendar_id, email")
          .eq("id", trainerId)
          .single();

        if (trainerError) {
          console.error("Trainer data fetch error:", trainerError);
          return new NextResponse("Failed to fetch trainer data", {
            status: 500,
          });
        }

        if (
          !trainerData?.google_refresh_token ||
          !trainerData?.google_calendar_id
        ) {
          console.log("Missing trainer Google calendar data");
          return new NextResponse("Trainer Google Calendar not connected", {
            status: 400,
          });
        }

        console.log("Creating trainer calendar client with refresh token");
        const calendar = await getGoogleCalendarClient(
          trainerData.google_refresh_token
        );

        const trainerEventDetails = {
          ...eventDetails,
          summary: `${eventDetails.type || "Training"} with ${eventDetails.clientName || "Client"}`,
        };

        if (session.google_event_id) {
          // Update existing event
          console.log(
            "Updating existing trainer calendar event:",
            session.google_event_id
          );
          const event = await calendar.events.update({
            calendarId: trainerData.google_calendar_id,
            eventId: session.google_event_id,
            requestBody: trainerEventDetails,
          });
          results.trainerEventId = event.data.id || null;
          results.trainerUpdated = true;
          console.log("Trainer calendar event updated:", event.data.id);
        } else {
          // Create new event
          console.log("Creating new trainer calendar event");
          const event = await calendar.events.insert({
            calendarId: trainerData.google_calendar_id,
            requestBody: trainerEventDetails,
          });
          results.trainerEventId = event.data.id || null;
          results.trainerUpdated = true;
          console.log("Trainer calendar event created:", event.data.id);

          // Update session with new event ID
          await supabase
            .from("sessions")
            .update({ google_event_id: event.data.id })
            .eq("id", sessionId);
        }
      } catch (error: unknown) {
        console.error("Trainer calendar update error:", error);
        return new NextResponse("Failed to update trainer calendar", {
          status: 500,
        });
      }
    }

    // Update client calendar event (if client has Google Calendar connected)
    if (clientId) {
      try {
        console.log("Fetching client data for ID:", clientId);
        const { data: clientData, error: clientError } = await supabase
          .from("users")
          .select("google_refresh_token, google_calendar_id, email")
          .eq("id", clientId)
          .single();

        // Fetch the client_google_event_id from the session
        const { data: sessionRow } = await supabase
          .from("sessions")
          .select("client_google_event_id")
          .eq("id", sessionId)
          .single();
        const clientGoogleEventId = sessionRow?.client_google_event_id;

        if (clientError) {
          console.error("Client data fetch error:", clientError);
          // Don't fail the entire request if client calendar is not connected
          console.log(
            "Client Google Calendar not connected, skipping client update"
          );
        } else if (
          clientData?.google_refresh_token &&
          clientData?.google_calendar_id
        ) {
          console.log("Creating client calendar client with refresh token");
          const calendar = await getGoogleCalendarClient(
            clientData.google_refresh_token
          );

          const clientEventDetails = {
            ...eventDetails,
            summary: `${eventDetails.type || "Training"} with Trainer`,
          };

          let updated = false;
          // Try to update existing event if we have an event ID
          if (clientGoogleEventId) {
            try {
              console.log(
                "Updating existing client calendar event:",
                clientGoogleEventId
              );
              const event = await calendar.events.update({
                calendarId: clientData.google_calendar_id,
                eventId: clientGoogleEventId,
                requestBody: clientEventDetails,
              });
              results.clientEventId = event.data.id || null;
              results.clientUpdated = true;
              updated = true;
              console.log("Client calendar event updated:", event.data.id);
            } catch (error) {
              console.error(
                "Failed to update client event, will try to create new one:",
                error
              );
            }
          }
          // If not updated, create a new event and update the session row
          if (!updated) {
            console.log("Creating new client calendar event");
            const event = await calendar.events.insert({
              calendarId: clientData.google_calendar_id,
              requestBody: clientEventDetails,
            });
            results.clientEventId = event.data.id || null;
            results.clientUpdated = true;
            console.log("Client calendar event created:", event.data.id);
            // Update session with new client event ID
            await supabase
              .from("sessions")
              .update({ client_google_event_id: event.data.id })
              .eq("id", sessionId);
          }
        }
      } catch (error: unknown) {
        console.error("Client calendar update error:", error);
        // Don't fail the entire request if client calendar update fails
        console.log("Client calendar update failed, but continuing...");
      }
    }

    console.log("Calendar update completed:", results);
    return NextResponse.json(results);
  } catch (error) {
    console.error("Calendar event update error:", error);
    return new NextResponse(
      `Failed to update calendar event: ${error instanceof Error ? error.message : "Unknown error"}`,
      { status: 500 }
    );
  }
}
