import { createClient } from "@/lib/supabase-server";
import { getCalendarClient } from "@/lib/google";
import { NextResponse } from "next/server";

export async function POST() {
  try {
    const supabase = createClient();

    // Get current session
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();
    if (sessionError || !session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user's Google tokens and role
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("google_access_token, google_refresh_token, role")
      .eq("id", session.user.id)
      .single();

    if (
      userError ||
      !userData?.google_access_token ||
      !userData?.google_refresh_token
    ) {
      return NextResponse.json(
        { error: "Google Calendar not connected" },
        { status: 400 }
      );
    }

    // Create Google Calendar client
    const calendar = getCalendarClient({
      access_token: userData.google_access_token,
      refresh_token: userData.google_refresh_token,
    });

    // Create a new calendar with appropriate name based on user role
    const calendarName =
      userData.role === "trainer"
        ? "Fitness Training Sessions (Trainer Calendar)"
        : "Fitness Training Sessions (Client Calendar)";

    const calendarDescription =
      userData.role === "trainer"
        ? "Calendar for managing your client training sessions"
        : "Calendar for your scheduled training sessions";

    const newCalendar = await calendar.calendars.insert({
      requestBody: {
        summary: calendarName,
        description: calendarDescription,
        timeZone: "Etc/UTC", // Default to UTC, can be updated by user later
      },
    });

    if (!newCalendar.data.id) {
      return NextResponse.json(
        { error: "Failed to create calendar" },
        { status: 500 }
      );
    }

    // Update user's record with the new calendar ID
    const { error: updateError } = await supabase
      .from("users")
      .update({
        google_calendar_id: newCalendar.data.id,
        google_account_connected: true,
      })
      .eq("id", session.user.id);

    if (updateError) {
      // Try to delete the calendar if we couldn't save it
      try {
        await calendar.calendars.delete({
          calendarId: newCalendar.data.id,
        });
      } catch (deleteError) {
        console.error("Failed to cleanup calendar:", deleteError);
      }
      return NextResponse.json(
        { error: "Failed to save calendar ID" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      calendarId: newCalendar.data.id,
      message: "Calendar created successfully",
    });
  } catch (error: any) {
    console.error("Error creating calendar:", error);
    return NextResponse.json(
      { error: "Failed to create calendar" },
      { status: 500 }
    );
  }
}
