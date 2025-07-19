import { createClient } from "@/lib/supabase-server";
import { getGoogleCalendarClient } from "@/lib/google";
import { NextResponse } from "next/server";
import { isGoogleCalendarEnabled } from "@/lib/config/features";

export async function GET(request: Request) {
  try {
    console.log("Calendar event fetch request received");
    const supabase = createClient();

    // Check if Google Calendar is enabled for current tier
    if (!isGoogleCalendarEnabled()) {
      console.log("Google Calendar feature is disabled for current tier");
      return new NextResponse("Google Calendar feature not available in current tier", { status: 403 });
    }

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
    const eventDetails = await request.json();

    console.log("Processing request:", {
      trainerId,
      eventDetails,
      userId: user.id,
    });

    // If trainerId is provided, we're creating an event in the trainer's calendar
    if (trainerId) {
      console.log("Fetching trainer data for ID:", trainerId);
      const { data: trainerData, error: trainerError } = await supabase
        .from("users")
        .select("google_refresh_token, google_calendar_id, email")
        .eq("id", trainerId)
        .single();

      if (trainerError) {
        console.error("Trainer data fetch error:", {
          error: trainerError,
          trainerId,
        });
        return new NextResponse("Failed to fetch trainer data", {
          status: 500,
        });
      }

      console.log("Trainer data retrieved:", {
        hasRefreshToken: !!trainerData?.google_refresh_token,
        hasCalendarId: !!trainerData?.google_calendar_id,
        trainerEmail: trainerData?.email,
      });

      if (
        !trainerData?.google_refresh_token ||
        !trainerData?.google_calendar_id
      ) {
        console.log("Missing trainer Google calendar data:", {
          trainerId,
          hasRefreshToken: !!trainerData?.google_refresh_token,
          hasCalendarId: !!trainerData?.google_calendar_id,
        });
        return new NextResponse("Trainer Google Calendar not connected", {
          status: 400,
        });
      }

      console.log("Creating trainer calendar client with refresh token");
      const calendar = await getGoogleCalendarClient(
        trainerData.google_refresh_token
      );

      console.log("Creating event in trainer calendar");
      try {
        const event = await calendar.events.insert({
          calendarId: trainerData.google_calendar_id,
          requestBody: eventDetails,
        });
        console.log("Trainer calendar event created:", event.data.id);
        return NextResponse.json({ eventId: event.data.id });
      } catch (error: unknown) {
        console.error("Google Calendar API Error:", {
          error,
          details: (error as any)?.response?.data,
          calendarId: trainerData.google_calendar_id,
          eventDetails,
        });
        throw error;
      }
    }

    // Otherwise, create event in client's calendar
    console.log("Fetching client data");
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("google_refresh_token, google_calendar_id")
      .eq("id", user.id)
      .single();

    if (userError) {
      console.error("User data fetch error:", userError);
      return new NextResponse("Failed to fetch user data", { status: 500 });
    }

    if (!userData?.google_refresh_token || !userData?.google_calendar_id) {
      console.log("No client Google calendar found");
      return new NextResponse("Client Google Calendar not connected", {
        status: 400,
      });
    }

    console.log("Creating client calendar client");
    const calendar = await getGoogleCalendarClient(
      userData.google_refresh_token
    );

    console.log("Creating event in client calendar");
    try {
      const event = await calendar.events.insert({
        calendarId: userData.google_calendar_id,
        requestBody: eventDetails,
      });
      console.log("Client calendar event created:", event.data.id);
      return NextResponse.json({ eventId: event.data.id });
    } catch (error: unknown) {
      console.error("Google Calendar API Error:", {
        error,
        details: (error as any)?.response?.data,
        calendarId: userData.google_calendar_id,
        eventDetails,
      });
      throw error;
    }
  } catch (error) {
    console.error("Calendar event creation error:", error);
    return new NextResponse(
      `Failed to create calendar event: ${
        error instanceof Error ? error.message : "Unknown error"
      }`,
      { status: 500 }
    );
  }
}
