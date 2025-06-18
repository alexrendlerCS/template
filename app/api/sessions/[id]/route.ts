import { supabaseAdmin } from "@/lib/supabase-server";
import { getCalendarClient } from "@/lib/google";
import { cookies } from "next/headers";

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  const sessionId = params.id;

  try {
    const cookieStore = await cookies();
    const accessToken = cookieStore.get("sb-access-token")?.value;

    if (!accessToken) {
      return new Response("Unauthorized", { status: 401 });
    }

    // Get user info
    const { data: authUser, error: authError } =
      await supabaseAdmin.auth.getUser(accessToken);
    if (authError || !authUser?.user?.id) {
      return new Response("Unauthorized", { status: 401 });
    }

    const userId = authUser.user.id;

    // Get session from DB
    const { data: session, error: sessionError } = await supabaseAdmin
      .from("sessions")
      .select("id, trainer_id, google_event_id")
      .eq("id", sessionId)
      .single();

    if (sessionError || !session) {
      return new Response("Session not found", { status: 404 });
    }

    if (session.trainer_id !== userId) {
      return new Response("Forbidden", { status: 403 });
    }

    // Get trainer's Google tokens
    const { data: trainer, error: trainerError } = await supabaseAdmin
      .from("users")
      .select("google_access_token, google_refresh_token, google_calendar_id")
      .eq("id", userId)
      .single();

    if (trainerError || !trainer?.google_access_token) {
      return new Response("Trainer Google credentials missing", {
        status: 400,
      });
    }

    // Delete Google Calendar event if exists
    if (session.google_event_id) {
      const calendar = getCalendarClient({
        access_token: trainer.google_access_token,
        refresh_token: trainer.google_refresh_token,
      });

      await calendar.events.delete({
        calendarId: trainer.google_calendar_id || "primary",
        eventId: session.google_event_id,
      });
    }

    // Delete session from Supabase
    const { error: deleteError } = await supabaseAdmin
      .from("sessions")
      .delete()
      .eq("id", sessionId);

    if (deleteError) {
      return new Response("Failed to delete session", { status: 500 });
    }

    return new Response("Session and calendar event deleted", { status: 200 });
  } catch (err) {
    console.error(err);
    return new Response("Internal server error", { status: 500 });
  }
}
