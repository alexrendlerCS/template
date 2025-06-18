import { supabaseAdmin } from "@/lib/supabase-server";
import { getCalendarClient, oauth2Client } from "@/lib/google";

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

    // Fetch client email (optional for attendees)
    let clientEmail = undefined;
    const { data: client } = await supabaseAdmin
      .from("users")
      .select("email")
      .eq("id", client_id)
      .single();
    if (client && client.email) clientEmail = client.email;

    // Build start and end times in RFC3339
    const startDateTime = new Date(`${date}T${start_time}:00`);
    const endDateTime = new Date(
      startDateTime.getTime() + duration_minutes * 60000
    );

    // Set up Google Calendar client
    const calendar = getCalendarClient({
      access_token: trainer.google_access_token,
      refresh_token: trainer.google_refresh_token,
    });

    // Create Google Calendar event
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
