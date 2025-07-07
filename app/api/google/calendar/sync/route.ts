import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { google } from "googleapis";

// Add type for sessions
type Session = {
  id: string;
  client_id: string;
  trainer_id: string;
  date: string;
  start_time: string;
  end_time?: string;
  duration_minutes?: number;
  type: string;
  notes?: string;
  users?:
    | { full_name?: string; email?: string }
    | { full_name?: string; email?: string }[];
};

export async function POST(request: NextRequest) {
  try {
    console.log("[DEBUG] Calendar sync API called");
    const supabase = createClient();

    // Get the current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      console.error("[ERROR] Authentication failed:", authError);
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("[DEBUG] User authenticated:", user.id);

    // Get user's Google access token
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("google_access_token, google_refresh_token, google_calendar_id")
      .eq("id", user.id)
      .single();

    if (userError || !userData?.google_access_token) {
      console.error("[ERROR] Failed to get user Google tokens:", userError);
      return NextResponse.json(
        { error: "Google Calendar not connected" },
        { status: 400 }
      );
    }

    console.log("[DEBUG] User Google tokens retrieved successfully");
    console.log("[DEBUG] Current calendar ID:", userData.google_calendar_id);

    // Set up Google Calendar API
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );

    oauth2Client.setCredentials({
      access_token: userData.google_access_token,
      refresh_token: userData.google_refresh_token,
    });

    const calendar = google.calendar({ version: "v3", auth: oauth2Client });

    // Create a new calendar
    console.log("[DEBUG] Creating new calendar for user:", user.id);
    const calendarResponse = await calendar.calendars.insert({
      requestBody: {
        summary: "Training Sessions",
        description:
          "Automatically synced training sessions from Fitness Training app",
        timeZone: "UTC",
      },
    });

    if (!calendarResponse.data.id) {
      console.error("[ERROR] Failed to create new calendar - no ID returned");
      throw new Error("Failed to create new calendar");
    }

    const newCalendarId = calendarResponse.data.id;
    console.log("[DEBUG] New calendar created with ID:", newCalendarId);

    // Update user's calendar ID
    console.log("[DEBUG] Updating user's calendar ID in database");
    const { error: updateError } = await supabase
      .from("users")
      .update({ google_calendar_id: newCalendarId })
      .eq("id", user.id);

    if (updateError) {
      console.error(
        "[ERROR] Failed to update user's calendar ID:",
        updateError
      );
      return NextResponse.json(
        { error: "Failed to update calendar ID" },
        { status: 500 }
      );
    }

    console.log("[DEBUG] User's calendar ID updated successfully");

    // Fetch all sessions for this trainer
    console.log("[DEBUG] Fetching all sessions for trainer:", user.id);
    const { data: sessions, error: sessionsError } = await supabase
      .from("sessions")
      .select(
        `
        id,
        client_id,
        trainer_id,
        date,
        start_time,
        end_time,
        duration_minutes,
        type,
        notes,
        users!sessions_client_id_fkey(full_name, email)
      `
      )
      .eq("trainer_id", user.id)
      .order("date", { ascending: true });

    if (sessionsError) {
      console.error("[ERROR] Failed to fetch sessions:", sessionsError);
      return NextResponse.json(
        { error: "Failed to fetch sessions" },
        { status: 500 }
      );
    }

    console.log("[DEBUG] Found", sessions?.length || 0, "sessions to sync");
    console.log(
      "[DEBUG] Session details:",
      sessions?.map((s) => ({
        id: s.id,
        date: s.date,
        start_time: s.start_time,
        end_time: s.end_time,
        duration_minutes: s.duration_minutes,
        type: s.type,
        client: Array.isArray(s.users)
          ? (s.users[0] as { full_name?: string })?.full_name
          : (s.users as { full_name?: string })?.full_name,
      }))
    );

    // Sync each session to the new calendar
    const syncResults = {
      total: sessions?.length || 0,
      successful: 0,
      failed: 0,
      errors: [] as string[],
    };

    for (const session of (sessions as Session[]) || []) {
      try {
        console.log(
          "[DEBUG] Processing session:",
          session.id,
          "for client:",
          Array.isArray(session.users)
            ? (session.users[0] as { full_name?: string })?.full_name
            : (session.users as { full_name?: string })?.full_name
        );
        // Combine date and start_time to get start DateTime
        const sessionDate = new Date(session.date + "T" + session.start_time);
        let endDate;
        if (session.end_time) {
          endDate = new Date(session.date + "T" + session.end_time);
          console.log("[DEBUG] Using end_time from DB:", session.end_time);
        } else if (session.duration_minutes) {
          endDate = new Date(
            sessionDate.getTime() + session.duration_minutes * 60000
          );
          console.log(
            "[DEBUG] Calculated end_time using duration_minutes:",
            session.duration_minutes
          );
        } else {
          endDate = new Date(sessionDate.getTime() + 60 * 60000); // Default 1 hour
          console.log(
            "[DEBUG] No end_time or duration_minutes, defaulting to 1 hour"
          );
        }

        const event = {
          summary: `${session.type} - ${
            Array.isArray(session.users)
              ? (session.users[0] as { full_name?: string })?.full_name
              : (session.users as { full_name?: string })?.full_name ||
                "Unknown Client"
          }`,
          description:
            session.notes ||
            `Training session with ${
              Array.isArray(session.users)
                ? (session.users[0] as { full_name?: string })?.full_name
                : (session.users as { full_name?: string })?.full_name ||
                  "client"
            }`,
          start: {
            dateTime: sessionDate.toISOString(),
            timeZone: "UTC",
          },
          end: {
            dateTime: endDate.toISOString(),
            timeZone: "UTC",
          },
          attendees:
            Array.isArray(session.users) && session.users[0]?.email
              ? [
                  {
                    email: session.users[0].email,
                    displayName: session.users[0].full_name,
                  },
                ]
              : !Array.isArray(session.users) && session.users?.email
                ? [
                    {
                      email: session.users.email,
                      displayName: session.users.full_name,
                    },
                  ]
                : undefined,
        };

        console.log(
          "[DEBUG] Creating event for session:",
          session.id,
          event.summary
        );
        console.log("[DEBUG] Event details:", {
          start: event.start.dateTime,
          end: event.end.dateTime,
          attendees: event.attendees,
        });

        await calendar.events.insert({
          calendarId: newCalendarId,
          requestBody: event,
        });

        console.log(
          "[DEBUG] Successfully created event for session:",
          session.id
        );
        syncResults.successful++;
      } catch (error) {
        console.error("[ERROR] Failed to sync session:", session.id, error);
        syncResults.failed++;
        syncResults.errors.push(`Session ${session.id}: ${error}`);
      }
    }

    console.log("[DEBUG] Sync completed:", syncResults);
    console.log("[DEBUG] Final sync results:", {
      total: syncResults.total,
      successful: syncResults.successful,
      failed: syncResults.failed,
      errorCount: syncResults.errors.length,
    });

    return NextResponse.json({
      success: true,
      newCalendarId,
      syncResults,
      message: `Successfully created new calendar and synced ${syncResults.successful} sessions`,
    });
  } catch (error) {
    console.error("[ERROR] Calendar sync failed:", error);
    return NextResponse.json(
      { error: "Failed to sync calendar" },
      { status: 500 }
    );
  }
}
