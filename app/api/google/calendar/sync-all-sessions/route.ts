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
        client_google_event_id,
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

    // Get client's Google Calendar data
    const { data: clientData, error: clientError } = await supabase
      .from("users")
      .select("google_refresh_token, google_calendar_id, email")
      .eq("id", clientId)
      .single();

    // Check if trainer calendar is connected
    const trainerCalendarConnected =
      !trainerError &&
      trainerData?.google_refresh_token &&
      trainerData?.google_calendar_id;

    // Check if client calendar is connected
    const clientCalendarConnected =
      !clientError &&
      clientData?.google_refresh_token &&
      clientData?.google_calendar_id;

    if (!trainerCalendarConnected && !clientCalendarConnected) {
      console.log("Neither trainer nor client Google Calendar connected");
      return NextResponse.json({
        message: "Neither trainer nor client Google Calendar connected",
        synced: 0,
        created: 0,
        updated: 0,
        errors: ["Neither trainer nor client Google Calendar connected"],
      });
    }

    console.log("Calendar connection status:", {
      trainerConnected: trainerCalendarConnected,
      clientConnected: clientCalendarConnected,
      trainerEmail: trainerData?.email,
      clientEmail: clientData?.email,
    });

    // Set up Google Calendar clients
    let trainerCalendar = null;
    let clientCalendar = null;

    if (trainerCalendarConnected) {
      try {
        trainerCalendar = await getGoogleCalendarClient(
          trainerData.google_refresh_token
        );

        // Test trainer calendar access
        console.log("Testing trainer calendar access...");
        const calendarInfo = await trainerCalendar.calendars.get({
          calendarId: trainerData.google_calendar_id,
        });
        console.log("Trainer calendar access successful:", {
          calendarId: calendarInfo.data.id,
          summary: calendarInfo.data.summary,
          accessRole: (calendarInfo.data as any).accessRole,
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
    }

    if (clientCalendarConnected) {
      try {
        clientCalendar = await getGoogleCalendarClient(
          clientData.google_refresh_token
        );

        // Test client calendar access
        console.log("Testing client calendar access...");
        const calendarInfo = await clientCalendar.calendars.get({
          calendarId: clientData.google_calendar_id,
        });
        console.log("Client calendar access successful:", {
          calendarId: calendarInfo.data.id,
          summary: calendarInfo.data.summary,
          accessRole: (calendarInfo.data as any).accessRole,
        });
      } catch (error) {
        console.error("Client calendar access test failed:", error);
        console.error("Calendar access error details:", {
          calendarId: clientData.google_calendar_id,
          errorCode: (error as any)?.code,
          errorStatus: (error as any)?.status,
          errorMessage: (error as any)?.message,
        });
        // Don't fail the entire sync if client calendar access fails
        console.log(
          "Client calendar access failed, continuing with trainer sync only"
        );
        clientCalendar = null;
      }
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

        // Format dates in local timezone to avoid UTC conversion issues
        const formatDateTime = (date: Date) => {
          const year = date.getFullYear();
          const month = String(date.getMonth() + 1).padStart(2, "0");
          const day = String(date.getDate()).padStart(2, "0");
          const hours = String(date.getHours()).padStart(2, "0");
          const minutes = String(date.getMinutes()).padStart(2, "0");
          const seconds = String(date.getSeconds()).padStart(2, "0");
          return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
        };

        // Build event details
        const startDateTime = new Date(`${session.date}T${session.start_time}`);
        const endDateTime = session.end_time
          ? new Date(`${session.date}T${session.end_time}`)
          : new Date(
              startDateTime.getTime() + (session.duration_minutes || 60) * 60000
            );

        const baseEventDetails = {
          description: session.notes || `${session.type} training session`,
          start: {
            dateTime: formatDateTime(startDateTime),
            timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          },
          end: {
            dateTime: formatDateTime(endDateTime),
            timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          },
          reminders: {
            useDefault: true,
          },
        };

        // Handle trainer calendar
        if (trainerCalendar && trainerData) {
          const trainerEventDetails = {
            ...baseEventDetails,
            summary: `${session.type} with ${(session.users as any)?.full_name || "Client"}`,
            attendees: (session.users as any)?.email
              ? [{ email: (session.users as any).email }]
              : [],
          };

          if (session.google_event_id) {
            // Try to update existing event
            try {
              console.log(
                `Updating existing trainer event ${session.google_event_id} for session ${session.id}`
              );
              await trainerCalendar.events.update({
                calendarId: trainerData!.google_calendar_id,
                eventId: session.google_event_id,
                requestBody: trainerEventDetails,
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
                calendarId: trainerData!.google_calendar_id,
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
                  calendarId: trainerData!.google_calendar_id,
                  requestBody: trainerEventDetails,
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
                  calendarId: trainerData!.google_calendar_id,
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
              console.log(
                `Creating new trainer event for session ${session.id}`
              );
              const newEvent = await trainerCalendar.events.insert({
                calendarId: trainerData!.google_calendar_id,
                requestBody: trainerEventDetails,
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
                calendarId: trainerData!.google_calendar_id,
                errorCode: (error as any)?.code,
                errorStatus: (error as any)?.status,
                errorMessage: (error as any)?.message,
              });
              results.errors.push(
                `Session ${session.id}: Failed to create trainer event`
              );
            }
          }
        }

        // Handle client calendar
        if (clientCalendar && clientData) {
          const clientEventDetails = {
            ...baseEventDetails,
            summary: `${session.type} with Trainer`,
            attendees: trainerData?.email ? [{ email: trainerData.email }] : [],
          };

          if (session.client_google_event_id) {
            // Try to update existing event
            try {
              console.log(
                `Updating existing client event ${session.client_google_event_id} for session ${session.id}`
              );
              await clientCalendar.events.update({
                calendarId: clientData!.google_calendar_id,
                eventId: session.client_google_event_id,
                requestBody: clientEventDetails,
              });
              results.updated++;
              console.log(
                `Successfully updated client event for session ${session.id}`
              );
            } catch (error) {
              console.error(
                `Failed to update client event for session ${session.id}:`,
                error
              );
              console.error("Update error details:", {
                calendarId: clientData!.google_calendar_id,
                eventId: session.client_google_event_id,
                errorCode: (error as any)?.code,
                errorStatus: (error as any)?.status,
                errorMessage: (error as any)?.message,
              });

              // Event might not exist, try to create new one
              try {
                console.log(
                  `Creating new client event for session ${session.id}`
                );
                const newEvent = await clientCalendar.events.insert({
                  calendarId: clientData!.google_calendar_id,
                  requestBody: clientEventDetails,
                });

                // Update session with new event ID
                await supabase
                  .from("sessions")
                  .update({ client_google_event_id: newEvent.data.id })
                  .eq("id", session.id);

                results.created++;
                console.log(
                  `Successfully created new client event for session ${session.id}`
                );
              } catch (createError) {
                console.error(
                  `Failed to create client event for session ${session.id}:`,
                  createError
                );
                console.error("Create error details:", {
                  calendarId: clientData!.google_calendar_id,
                  errorCode: (createError as any)?.code,
                  errorStatus: (createError as any)?.status,
                  errorMessage: (createError as any)?.message,
                });
                results.errors.push(
                  `Session ${session.id}: Failed to create client event`
                );
              }
            }
          } else {
            // Create new event (this handles old sessions without client_google_event_id)
            try {
              console.log(
                `Creating new client event for session ${session.id} (no existing client event ID)`
              );
              const newEvent = await clientCalendar.events.insert({
                calendarId: clientData!.google_calendar_id,
                requestBody: clientEventDetails,
              });

              // Update session with new event ID
              await supabase
                .from("sessions")
                .update({ client_google_event_id: newEvent.data.id })
                .eq("id", session.id);

              results.created++;
              console.log(
                `Successfully created client event for session ${session.id}`
              );
            } catch (error) {
              console.error(
                `Failed to create client event for session ${session.id}:`,
                error
              );
              console.error("Create new event error details:", {
                calendarId: clientData!.google_calendar_id,
                errorCode: (error as any)?.code,
                errorStatus: (error as any)?.status,
                errorMessage: (error as any)?.message,
              });
              results.errors.push(
                `Session ${session.id}: Failed to create client event`
              );
            }
          }
        }

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
