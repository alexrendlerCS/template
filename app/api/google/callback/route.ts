/**
 * Google OAuth Callback Handler
 *
 * This handler redirects all OAuth callbacks to our UI callback page
 * to ensure consistent handling of cross-browser authentication.
 */

import { NextResponse } from "next/server";

export async function GET(request: Request) {
  // Get the current URL and its search params
  const url = new URL(request.url);
  const params = url.searchParams;

  // Construct the redirect URL to our exchange endpoint
  const exchangeUrl = new URL("/api/auth/google/exchange", url.origin);

  // Forward all query parameters
  params.forEach((value, key) => {
    exchangeUrl.searchParams.append(key, value);
  });

  // Redirect to our exchange endpoint
  return NextResponse.redirect(exchangeUrl.toString());
}
