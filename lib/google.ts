import { google } from "googleapis";

export const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID!,
  process.env.GOOGLE_CLIENT_SECRET!,
  process.env.GOOGLE_REDIRECT_URI!
);

export const getGoogleCalendarClient = async (refresh_token: string) => {
  oauth2Client.setCredentials({
    refresh_token: refresh_token,
  });

  try {
    // Get a new access token using the refresh token
    const { credentials } = await oauth2Client.refreshAccessToken();

    // Set the new credentials including the refresh token
    oauth2Client.setCredentials({
      ...credentials,
      refresh_token, // Keep the original refresh token
    });

    // Create and return the calendar client
    return google.calendar({
      version: "v3",
      auth: oauth2Client,
    });
  } catch (error) {
    console.error("Error refreshing access token:", error);
    if (error instanceof Error) {
      throw new Error(
        `Failed to authenticate with Google Calendar: ${error.message}`
      );
    }
    throw new Error("Failed to authenticate with Google Calendar");
  }
};
