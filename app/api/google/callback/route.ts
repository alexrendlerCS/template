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
          </head>
          <body>
            <script>
              window.close();
              window.opener.postMessage({ type: 'GOOGLE_AUTH_ERROR', error: '${error}' }, '*');
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
          </head>
          <body>
            <script>
              window.close();
              window.opener.postMessage({ type: 'GOOGLE_AUTH_ERROR', error: 'No code received' }, '*');
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
          </head>
          <body>
            <script>
              window.close();
              window.opener.postMessage({ type: 'GOOGLE_AUTH_ERROR', error: 'Invalid state' }, '*');
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
          </head>
          <body>
            <script>
              window.close();
              window.opener.postMessage({ type: 'GOOGLE_AUTH_ERROR', error: 'Failed to exchange code for tokens' }, '*');
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
          </head>
          <body>
            <script>
              window.close();
              window.opener.postMessage({ type: 'GOOGLE_AUTH_ERROR', error: 'Not authenticated' }, '*');
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

    // Update user record with Google tokens
    const { error: updateError } = await supabase
      .from("users")
      .update({
        google_access_token: tokens.access_token,
        google_refresh_token: tokens.refresh_token,
        google_token_expiry: new Date(
          Date.now() + tokens.expires_in * 1000
        ).toISOString(),
        google_account_connected: true,
      })
      .eq("id", user.id);

    if (updateError) {
      return new Response(
        `
        <html>
          <head>
            <title>Error</title>
          </head>
          <body>
            <script>
              window.close();
              window.opener.postMessage({ type: 'GOOGLE_AUTH_ERROR', error: 'Failed to store tokens' }, '*');
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
    cookieStore.delete("google_oauth_state");

    // Return success page that closes itself
    return new Response(
      `
      <html>
        <head>
          <title>Success</title>
        </head>
        <body>
          <script>
            window.opener.postMessage({ type: 'GOOGLE_AUTH_SUCCESS' }, '*');
            window.close();
          </script>
        </body>
      </html>
      `,
      {
        status: 200,
        headers: {
          "Content-Type": "text/html",
        },
      }
    );
  } catch (error) {
    console.error("Error in Google callback:", error);
    return new Response(
      `
      <html>
        <head>
          <title>Error</title>
        </head>
        <body>
          <script>
            window.opener.postMessage({ type: 'GOOGLE_AUTH_ERROR', error: 'Internal server error' }, '*');
            window.close();
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
 