import { createClient } from "@/lib/supabase-server";
import { Database } from "@/lib/database.types";
import { NextResponse } from "next/server";

// Helper function to get the start and end of current month
function getCurrentMonthRange() {
  const now = new Date();
  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  return {
    start: firstDay.toISOString(),
    end: lastDay.toISOString(),
  };
}

// Helper function to refresh Google access token
async function refreshGoogleToken(refreshToken: string) {
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });

  if (!response.ok) {
    throw new Error("Failed to refresh token");
  }

  const data = await response.json();
  return {
    access_token: data.access_token,
    expires_in: data.expires_in,
  };
}

// Helper function to fetch Google Calendar events
async function fetchGoogleEvents(accessToken: string, calendarId: string) {
  const { start, end } = getCurrentMonthRange();

  const response = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(
      calendarId
    )}/events?timeMin=${start}&timeMax=${end}&orderBy=startTime&singleEvents=true`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error("Token expired");
    }
    throw new Error(`Google Calendar API error: ${response.statusText}`);
  }

  const data = await response.json();
  return data.items.map((event: any) => ({
    id: event.id,
    summary: event.summary,
    start: event.start,
    status: event.status,
  }));
}

export async function GET() {
  try {
    // Initialize Supabase client
    const supabase = createClient();

    // Get current session
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();
    if (sessionError || !session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user's Google tokens and calendar ID
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select(
        "google_access_token, google_refresh_token, google_calendar_id, role"
      )
      .eq("id", session.user.id)
      .single();

    if (
      userError ||
      !userData?.google_access_token ||
      !userData?.google_refresh_token ||
      !userData?.google_calendar_id
    ) {
      return NextResponse.json(
        { error: "Google Calendar not properly configured" },
        { status: 400 }
      );
    }

    try {
      // First attempt with current access token
      const events = await fetchGoogleEvents(
        userData.google_access_token,
        userData.google_calendar_id
      );

      // Filter events based on user role
      const filteredEvents =
        userData.role === "client"
          ? events.filter((event: any) =>
              event.summary?.includes("Training Session")
            )
          : events;

      return NextResponse.json(filteredEvents);
    } catch (error: any) {
      // If token expired, refresh and retry once
      if (error.message === "Token expired") {
        // Refresh token
        const { access_token, expires_in } = await refreshGoogleToken(
          userData.google_refresh_token
        );

        // Update tokens in database
        await supabase
          .from("users")
          .update({
            google_access_token: access_token,
            google_token_expires_at: new Date(
              Date.now() + expires_in * 1000
            ).toISOString(),
          })
          .eq("id", session.user.id);

        // Retry with new token
        const events = await fetchGoogleEvents(
          access_token,
          userData.google_calendar_id
        );

        // Filter events based on user role
        const filteredEvents =
          userData.role === "client"
            ? events.filter((event: any) =>
                event.summary?.includes("Training Session")
              )
            : events;

        return NextResponse.json(filteredEvents);
      }
      throw error;
    }
  } catch (error: any) {
    console.error("Error fetching calendar events:", error);
    return NextResponse.json(
      { error: "Failed to fetch calendar events" },
      { status: 500 }
    );
  }
}
