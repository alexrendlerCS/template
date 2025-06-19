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
    oauth2Client.setCredentials(credentials);

    return google.calendar({ version: "v3", auth: oauth2Client });
  } catch (error) {
    console.error("Error refreshing access token:", error);
    throw new Error("Failed to authenticate with Google Calendar");
  }
};
