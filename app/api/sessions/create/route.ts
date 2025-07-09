import { supabaseAdmin } from "@/lib/supabase-server";
import { getGoogleCalendarClient } from "@/lib/google";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { trainer_id, client_id, date, start_time, duration_minutes, type } =
      body;

    if (
      !trainer_id ||
      !client_id ||
      !date ||
      !start_time ||
      !duration_minutes ||
      !type
    ) {
      return new Response("Missing required fields", { status: 400 });
    }

    // Fetch trainer's Google tokens and email
    const { data: trainer, error: trainerError } = await supabaseAdmin
      .from("users")
      .select(
        "google_access_token, google_refresh_token, google_calendar_id, email"
      )
      .eq("id", trainer_id)
      .single();
    if (trainerError || !trainer) {
      return new Response("Trainer not found or missing Google tokens", {
        status: 400,
      });
    }
    if (!trainer.google_access_token || !trainer.google_refresh_token) {
      return new Response("Trainer has not connected Google Calendar", {
        status: 400,
      });
    }

    // Fetch client email and Google calendar info
    let clientEmail = undefined;
    let clientGoogleRefreshToken = undefined;
    let clientGoogleCalendarId = undefined;
    const { data: client } = await supabaseAdmin
      .from("users")
      .select("email, google_refresh_token, google_calendar_id")
      .eq("id", client_id)
      .single();
    if (client && client.email) clientEmail = client.email;
    if (client && client.google_refresh_token)
      clientGoogleRefreshToken = client.google_refresh_token;
    if (client && client.google_calendar_id)
      clientGoogleCalendarId = client.google_calendar_id;

    // Build start and end times in RFC3339
    const startDateTime = new Date(`${date}T${start_time}:00`);
    const endDateTime = new Date(
      startDateTime.getTime() + duration_minutes * 60000
    );

    // Set up Google Calendar client for trainer
    const calendar = await getGoogleCalendarClient(
      trainer.google_refresh_token
    );

    // Create Google Calendar event for trainer
    const event = await calendar.events.insert({
      calendarId: trainer.google_calendar_id || "primary",
      requestBody: {
        summary: `${type} with Client`,
        description: "Auto-synced from Fitness Platform",
        start: { dateTime: startDateTime.toISOString() },
        end: { dateTime: endDateTime.toISOString() },
        attendees: clientEmail ? [{ email: clientEmail }] : [],
      },
    });

    if (!event.data.id) {
      return new Response("Failed to create Google Calendar event", {
        status: 500,
      });
    }

    // Try to create client Google Calendar event
    let clientGoogleEventId = null;
    if (clientGoogleRefreshToken && clientGoogleCalendarId) {
      try {
        const clientCalendar = await getGoogleCalendarClient(
          clientGoogleRefreshToken
        );
        const clientEvent = await clientCalendar.events.insert({
          calendarId: clientGoogleCalendarId,
          requestBody: {
            summary: `${type} with Trainer`,
            description: "Auto-synced from Fitness Platform",
            start: { dateTime: startDateTime.toISOString() },
            end: { dateTime: endDateTime.toISOString() },
            attendees: trainer.email ? [{ email: trainer.email }] : [],
          },
        });
        if (clientEvent.data.id) {
          clientGoogleEventId = clientEvent.data.id;
        }
      } catch (err) {
        console.error("Failed to create client Google Calendar event:", err);
      }
    }

    // Insert session into Supabase
    const { error: sessionError } = await supabaseAdmin
      .from("sessions")
      .insert({
        trainer_id,
        client_id,
        scheduled_at: startDateTime.toISOString(),
        duration_minutes,
        type,
        status: "scheduled",
        google_event_id: event.data.id,
        client_google_event_id: clientGoogleEventId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
    if (sessionError) {
      return new Response("Failed to create session in DB", { status: 500 });
    }

    return new Response("Session and calendar event created", { status: 200 });
  } catch (err) {
    console.error(err);
    return new Response("Internal server error", { status: 500 });
  }
}
