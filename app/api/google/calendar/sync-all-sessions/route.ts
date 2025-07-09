import { createClient } from "@/lib/supabase-server";
import { getGoogleCalendarClient } from "@/lib/google";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    console.log("Sync all sessions request received");
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

    console.log("Processing sync all sessions request:", {
      trainerId,
      clientId,
      userId: user.id,
    });

    if (!trainerId || !clientId) {
      return new NextResponse("Trainer ID and Client ID are required", {
        status: 400,
      });
    }

    // Fetch all sessions between this client and trainer
    const { data: sessions, error: sessionsError } = await supabase
      .from("sessions")
      .select(
        `
        id,
        date,
        start_time,
        end_time,
        duration_minutes,
        type,
        notes,
        google_event_id,
        status,
        users!sessions_client_id_fkey(full_name, email)
      `
      )
      .eq("trainer_id", trainerId)
      .eq("client_id", clientId)
      .order("date", { ascending: true });

    if (sessionsError) {
      console.error("Sessions fetch error:", sessionsError);
      return new NextResponse("Failed to fetch sessions", { status: 500 });
    }

    console.log(`Found ${sessions?.length || 0} sessions to check for sync`);

    if (!sessions || sessions.length === 0) {
      return NextResponse.json({
        message: "No sessions found between this client and trainer",
        synced: 0,
        created: 0,
        updated: 0,
        errors: [],
      });
    }

    // Get trainer's Google Calendar data
    const { data: trainerData, error: trainerError } = await supabase
      .from("users")
      .select("google_refresh_token, google_calendar_id, email")
      .eq("id", trainerId)
      .single();

    if (
      trainerError ||
      !trainerData?.google_refresh_token ||
      !trainerData?.google_calendar_id
    ) {
      console.log("Trainer Google Calendar not connected");
      return NextResponse.json({
        message: "Trainer Google Calendar not connected",
        synced: 0,
        created: 0,
        updated: 0,
        errors: ["Trainer Google Calendar not connected"],
      });
    }

    console.log("Trainer calendar data:", {
      hasRefreshToken: !!trainerData.google_refresh_token,
      calendarId: trainerData.google_calendar_id,
      email: trainerData.email,
    });

    // Set up Google Calendar client for trainer only
    const trainerCalendar = await getGoogleCalendarClient(
      trainerData.google_refresh_token
    );

    // Test trainer calendar access
    try {
      console.log("Testing trainer calendar access...");
      const calendarInfo = await trainerCalendar.calendars.get({
        calendarId: trainerData.google_calendar_id,
      });
      console.log("Trainer calendar access successful:", {
        calendarId: calendarInfo.data.id,
        summary: calendarInfo.data.summary,
        accessRole: calendarInfo.data.accessRole,
      });
    } catch (error) {
      console.error("Trainer calendar access test failed:", error);
      console.error("Calendar access error details:", {
        calendarId: trainerData.google_calendar_id,
        errorCode: (error as any)?.code,
        errorStatus: (error as any)?.status,
        errorMessage: (error as any)?.message,
      });
      return NextResponse.json({
        message: "Trainer calendar access failed",
        synced: 0,
        created: 0,
        updated: 0,
        errors: [
          `Trainer calendar access failed: ${(error as any)?.message || "Unknown error"}`,
        ],
      });
    }

    const results = {
      synced: 0,
      created: 0,
      updated: 0,
      errors: [] as string[],
    };

    // Process each session
    for (const session of sessions) {
      try {
        console.log(`Processing session ${session.id} for sync`);

        // Skip cancelled sessions
        if (session.status === "cancelled") {
          console.log(`Skipping cancelled session ${session.id}`);
          continue;
        }

        // Build event details
        const startDateTime = new Date(`${session.date}T${session.start_time}`);
        const endDateTime = session.end_time
          ? new Date(`${session.date}T${session.end_time}`)
          : new Date(
              startDateTime.getTime() + (session.duration_minutes || 60) * 60000
            );

        const eventDetails = {
          summary: `${session.type} with ${session.users?.full_name || "Client"}`,
          description: session.notes || `${session.type} training session`,
          start: {
            dateTime: startDateTime.toISOString(),
            timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          },
          end: {
            dateTime: endDateTime.toISOString(),
            timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          },
          attendees: session.users?.email
            ? [{ email: session.users.email }]
            : [],
          reminders: {
            useDefault: true,
          },
        };

        // Handle trainer calendar
        if (session.google_event_id) {
          // Try to update existing event
          try {
            console.log(
              `Updating existing trainer event ${session.google_event_id} for session ${session.id}`
            );
            await trainerCalendar.events.update({
              calendarId: trainerData.google_calendar_id,
              eventId: session.google_event_id,
              requestBody: eventDetails,
            });
            results.updated++;
            console.log(
              `Successfully updated trainer event for session ${session.id}`
            );
          } catch (error) {
            console.error(
              `Failed to update trainer event for session ${session.id}:`,
              error
            );
            console.error("Update error details:", {
              calendarId: trainerData.google_calendar_id,
              eventId: session.google_event_id,
              errorCode: (error as any)?.code,
              errorStatus: (error as any)?.status,
              errorMessage: (error as any)?.message,
            });

            // Event might not exist, try to create new one
            try {
              console.log(
                `Creating new trainer event for session ${session.id}`
              );
              const newEvent = await trainerCalendar.events.insert({
                calendarId: trainerData.google_calendar_id,
                requestBody: eventDetails,
              });

              // Update session with new event ID
              await supabase
                .from("sessions")
                .update({ google_event_id: newEvent.data.id })
                .eq("id", session.id);

              results.created++;
              console.log(
                `Successfully created new trainer event for session ${session.id}`
              );
            } catch (createError) {
              console.error(
                `Failed to create trainer event for session ${session.id}:`,
                createError
              );
              console.error("Create error details:", {
                calendarId: trainerData.google_calendar_id,
                errorCode: (createError as any)?.code,
                errorStatus: (createError as any)?.status,
                errorMessage: (createError as any)?.message,
              });
              results.errors.push(
                `Session ${session.id}: Failed to create trainer event`
              );
            }
          }
        } else {
          // Create new event
          try {
            console.log(`Creating new trainer event for session ${session.id}`);
            const newEvent = await trainerCalendar.events.insert({
              calendarId: trainerData.google_calendar_id,
              requestBody: eventDetails,
            });

            // Update session with new event ID
            await supabase
              .from("sessions")
              .update({ google_event_id: newEvent.data.id })
              .eq("id", session.id);

            results.created++;
            console.log(
              `Successfully created trainer event for session ${session.id}`
            );
          } catch (error) {
            console.error(
              `Failed to create trainer event for session ${session.id}:`,
              error
            );
            console.error("Create new event error details:", {
              calendarId: trainerData.google_calendar_id,
              errorCode: (error as any)?.code,
              errorStatus: (error as any)?.status,
              errorMessage: (error as any)?.message,
            });
            results.errors.push(
              `Session ${session.id}: Failed to create trainer event`
            );
          }
        }

        // Note: Client calendar events are handled by the main update endpoint
        // to avoid duplicate events. This endpoint only handles trainer calendar sync.

        results.synced++;
      } catch (error) {
        console.error(`Error processing session ${session.id}:`, error);
        results.errors.push(
          `Session ${session.id}: ${error instanceof Error ? error.message : "Unknown error"}`
        );
      }
    }

    console.log("Sync all sessions completed:", results);
    return NextResponse.json({
      message: `Successfully synced ${results.synced} sessions`,
      ...results,
    });
  } catch (error) {
    console.error("Sync all sessions error:", error);
    return new NextResponse(
      `Failed to sync all sessions: ${error instanceof Error ? error.message : "Unknown error"}`,
      { status: 500 }
    );
  }
}
