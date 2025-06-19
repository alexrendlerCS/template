import { createClient } from "@/lib/supabase-server";
import { getGoogleCalendarClient } from "@/lib/google";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    console.log("Calendar event creation request received");
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
    const eventDetails = await request.json();

    console.log("Processing request:", {
      trainerId,
      eventDetails,
      userId: user.id,
    });

    // If trainerId is provided, we're creating an event in the trainer's calendar
    if (trainerId) {
      console.log("Fetching trainer data");
      const { data: trainerData, error: trainerError } = await supabase
        .from("users")
        .select("google_refresh_token, google_calendar_id")
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
        console.log("No trainer Google calendar found");
        return new NextResponse("Trainer Google Calendar not connected", {
          status: 400,
        });
      }

      console.log("Creating trainer calendar client");
      const calendar = await getGoogleCalendarClient(
        trainerData.google_refresh_token
      );

      console.log("Creating event in trainer calendar");
      const event = await calendar.events.insert({
        calendarId: trainerData.google_calendar_id,
        requestBody: eventDetails,
      });

      console.log("Trainer calendar event created:", event.data.id);
      return NextResponse.json({ eventId: event.data.id });
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
    const event = await calendar.events.insert({
      calendarId: userData.google_calendar_id,
      requestBody: eventDetails,
    });

    console.log("Client calendar event created:", event.data.id);
    return NextResponse.json({ eventId: event.data.id });
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
