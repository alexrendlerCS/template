import { createClient } from "@/lib/supabase-server";
import { cookies } from "next/headers";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get("code");
    const state = searchParams.get("state");
    const error = searchParams.get("error");

    if (error) {
      return new Response(
        `
        <html>
          <head>
            <title>Error</title>
            <style>
              body { font-family: system-ui; padding: 2rem; line-height: 1.5; }
              .error { color: #dc2626; }
            </style>
          </head>
          <body>
            <h2 class="error">Google Calendar Connection Failed</h2>
            <p>${error}</p>
            <script>
              if (window.opener) {
                window.opener.postMessage({ type: 'GOOGLE_AUTH_ERROR', error: '${error}' }, '*');
              window.close();
              }
            </script>
          </body>
        </html>
        `,
        {
          status: 400,
          headers: {
            "Content-Type": "text/html",
          },
        }
      );
    }

    if (!code) {
      return new Response(
        `
        <html>
          <head>
            <title>Error</title>
            <style>
              body { font-family: system-ui; padding: 2rem; line-height: 1.5; }
              .error { color: #dc2626; }
            </style>
          </head>
          <body>
            <h2 class="error">Google Calendar Connection Failed</h2>
            <p>No authorization code received from Google. Please try again.</p>
            <script>
              if (window.opener) {
                window.opener.postMessage({ type: 'GOOGLE_AUTH_ERROR', error: 'No code received' }, '*');
              window.close();
              }
            </script>
          </body>
        </html>
        `,
        {
          status: 400,
          headers: {
            "Content-Type": "text/html",
          },
        }
      );
    }

    // Verify state parameter
    const cookieStore = await cookies();
    const savedState = cookieStore.get("google_oauth_state")?.value;

    if (!savedState || savedState !== state) {
      return new Response(
        `
        <html>
          <head>
            <title>Error</title>
            <style>
              body { font-family: system-ui; padding: 2rem; line-height: 1.5; }
              .error { color: #dc2626; }
            </style>
          </head>
          <body>
            <h2 class="error">Google Calendar Connection Failed</h2>
            <p>Invalid state parameter. This could be due to an expired session or security check failure.</p>
            <script>
              if (window.opener) {
                window.opener.postMessage({ type: 'GOOGLE_AUTH_ERROR', error: 'Invalid state' }, '*');
              window.close();
              }
            </script>
          </body>
        </html>
        `,
        {
          status: 400,
          headers: {
            "Content-Type": "text/html",
          },
        }
      );
    }

    // Exchange code for tokens
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        redirect_uri: process.env.GOOGLE_REDIRECT_URI!,
        grant_type: "authorization_code",
      }),
    });

    if (!tokenResponse.ok) {
      return new Response(
        `
        <html>
          <head>
            <title>Error</title>
            <style>
              body { font-family: system-ui; padding: 2rem; line-height: 1.5; }
              .error { color: #dc2626; }
            </style>
          </head>
          <body>
            <h2 class="error">Google Calendar Connection Failed</h2>
            <p>Failed to exchange authorization code for tokens. Please try again.</p>
            <script>
              if (window.opener) {
                window.opener.postMessage({ type: 'GOOGLE_AUTH_ERROR', error: 'Failed to exchange code for tokens' }, '*');
              window.close();
              }
            </script>
          </body>
        </html>
        `,
        {
          status: 400,
          headers: {
            "Content-Type": "text/html",
          },
        }
      );
    }

    const tokens = await tokenResponse.json();

    // Get current user
    const supabase = createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return new Response(
        `
        <html>
          <head>
            <title>Error</title>
            <style>
              body { font-family: system-ui; padding: 2rem; line-height: 1.5; }
              .error { color: #dc2626; }
              .button { 
                display: inline-block;
                padding: 0.5rem 1rem;
                background: #4f46e5;
                color: white;
                text-decoration: none;
                border-radius: 0.375rem;
                margin-top: 1rem;
              }
            </style>
          </head>
          <body>
            <h2 class="error">Session Not Found</h2>
            <p>Please ensure you're logged in on the original tab before connecting Google Calendar.</p>
            <a href="/login" class="button" target="_blank">Go to Login</a>
            <script>
              if (window.opener) {
                window.opener.postMessage({ type: 'GOOGLE_AUTH_ERROR', error: 'Not authenticated' }, '*');
              window.close();
              }
            </script>
          </body>
        </html>
        `,
        {
          status: 401,
          headers: {
            "Content-Type": "text/html",
          },
        }
      );
    }

    // Create a new Google Calendar
    try {
      const calendarResponse = await fetch(
        "https://www.googleapis.com/calendar/v3/calendars",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${tokens.access_token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            summary: "Training Sessions",
            timeZone: "America/Los_Angeles",
          }),
        }
      );

      if (!calendarResponse.ok) {
        throw new Error("Failed to create Google Calendar");
      }

      const calendar = await calendarResponse.json();

      // Update user record with Google tokens and calendar ID
      const { error: updateError } = await supabase
        .from("users")
        .update({
          google_access_token: tokens.access_token,
          google_refresh_token: tokens.refresh_token,
          google_token_expiry: new Date(
            Date.now() + tokens.expires_in * 1000
          ).toISOString(),
          google_account_connected: true,
          google_calendar_id: calendar.id,
        })
        .eq("id", user.id);

      if (updateError) {
        return new Response(
          `
          <html>
            <head>
              <title>Error</title>
              <style>
                body { font-family: system-ui; padding: 2rem; line-height: 1.5; }
                .error { color: #dc2626; }
              </style>
            </head>
            <body>
              <h2 class="error">Google Calendar Connection Failed</h2>
              <p>Failed to store Google Calendar tokens. Please try again later.</p>
              <script>
                if (window.opener) {
                  window.opener.postMessage({ type: 'GOOGLE_AUTH_ERROR', error: 'Failed to store tokens' }, '*');
                window.close();
                }
              </script>
            </body>
          </html>
          `,
          {
            status: 500,
            headers: {
              "Content-Type": "text/html",
            },
          }
        );
      }
    } catch (error) {
      return new Response(
        `
        <html>
          <head>
            <title>Error</title>
            <style>
              body { font-family: system-ui; padding: 2rem; line-height: 1.5; }
              .error { color: #dc2626; }
            </style>
          </head>
          <body>
            <h2 class="error">Google Calendar Connection Failed</h2>
            <p>Failed to create Google Calendar. Please try again later.</p>
            <script>
              if (window.opener) {
                window.opener.postMessage({ type: 'GOOGLE_AUTH_ERROR', error: 'Failed to create calendar' }, '*');
              window.close();
              }
            </script>
          </body>
        </html>
        `,
        {
          status: 500,
          headers: {
            "Content-Type": "text/html",
          },
        }
      );
    }

    // Clear the state cookie
    try {
      const cookieStore = await cookies();
      cookieStore.set("google_oauth_state", "", {
        expires: new Date(0),
        path: "/",
      });
    } catch (error) {
      // Ignore cookie errors, as they might occur in server components
      console.warn("Failed to clear google_oauth_state cookie:", error);
    }

    // Return success page that closes itself or redirects
    return new Response(
      `
      <html>
        <head>
          <title>Success</title>
          <style>
            body { 
              font-family: system-ui;
              padding: 2rem;
              line-height: 1.5;
              text-align: center;
            }
            .success { 
              color: #059669;
              margin-bottom: 1rem;
            }
            .spinner {
              border: 3px solid #f3f3f3;
              border-radius: 50%;
              border-top: 3px solid #059669;
              width: 24px;
              height: 24px;
              animation: spin 1s linear infinite;
              margin: 1rem auto;
            }
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          </style>
        </head>
        <body>
          <h2 class="success">Google Calendar Connected fully!</h2>
          <div class="spinner"></div>
          <p>Redirecting back to your dashboard...</p>
          <script>
            if (window.opener) {
              window.opener.postMessage({ type: 'GOOGLE_AUTH_SUCCESS' }, '*');
              setTimeout(() => window.close(), 1500);
            } else {
              const role = "${user.user_metadata?.role || "client"}";
              const redirectUrl = role === "trainer"
                ? "/trainer/dashboard"
                : "/client/dashboard";

              // Set the flag first, then redirect after a brief delay
              localStorage.setItem("google_calendar_connected", "true");
              
              // Use a shorter delay for the redirect to ensure smooth UX
              setTimeout(() => {
                window.location.href = redirectUrl;
              }, 100);
            }
          </script>
        </body>
      </html>
      `,
      {
        headers: {
          "Content-Type": "text/html",
        },
      }
    );
  } catch (error) {
    console.error("Google OAuth callback error:", error);
    return new Response(
      `
      <html>
        <head>
          <title>Error</title>
          <style>
            body { font-family: system-ui; padding: 2rem; line-height: 1.5; }
            .error { color: #dc2626; }
          </style>
        </head>
        <body>
          <h2 class="error">Unexpected Error</h2>
          <p>An unexpected error occurred while connecting your Google Calendar. Please try again later.</p>
          <script>
            if (window.opener) {
              window.opener.postMessage({ type: 'GOOGLE_AUTH_ERROR', error: 'Unexpected error' }, '*');
            window.close();
            }
          </script>
        </body>
      </html>
      `,
      {
        status: 500,
        headers: {
          "Content-Type": "text/html",
        },
      }
    );
  }
}
