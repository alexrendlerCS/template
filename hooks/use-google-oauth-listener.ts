"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/use-toast";
import { createClient } from "@/lib/supabaseClient";

interface GoogleOAuthCallbacks {
  onSuccess?: () => Promise<void> | void;
  onError?: (error: Error) => void;
}

export function useGoogleOAuthListenerWithDialog(
  callbacks?: GoogleOAuthCallbacks
) {
  const router = useRouter();
  const { toast } = useToast();
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const popupRef = useRef<Window | null>(null);
  const popupCheckInterval = useRef<NodeJS.Timeout | null>(null);
  let supabase = createClient();

  const rehydrateSupabaseSession = useCallback(() => {
    console.log("🔄 Rehydrating Supabase client...");
    supabase = createClient();
  }, []);

  const ensureValidSession = useCallback(async () => {
    try {
      console.log("🔍 Checking for valid session...");
      rehydrateSupabaseSession();

      console.log("🌡️ Warming session cache...");
      await supabase.auth.getSession();

      console.log("📡 Fetching fresh session...");
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();

      if (error) {
        console.error("⚠️ Failed to get session:", error);
      } else if (session) {
        console.log("✅ Valid session found for user:", session.user.id);
      } else {
        console.log("⚠️ No active session found");
      }

      return session;
    } catch (err) {
      console.error("❌ Session validation failed:", err);
      return null;
    }
  }, []);

  const getAccessToken = useCallback(async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session?.access_token) {
      throw new Error("No access token found");
    }
    return session.access_token;
  }, [supabase.auth]);

  const exchangeGoogleToken = useCallback(
    async (code: string, state: string) => {
      console.log("🔄 Starting token exchange");

      try {
        const response = await fetch("/api/auth/google/exchange", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${await getAccessToken()}`,
          },
          body: JSON.stringify({ code, state }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          console.error("❌ Exchange failed:", errorData);
          throw new Error(errorData.message || "Token exchange failed");
        }

        const data = await response.json();
        console.log("✅ Token exchange successful");

        // Clear OAuth state
        localStorage.removeItem("oauth_state");
        localStorage.removeItem("oauth_popup_open");

        // Call onSuccess callback
        if (callbacks?.onSuccess) {
          await callbacks.onSuccess();
        }

        setShowSuccessDialog(true);
      } catch (error) {
        console.error("❌ Exchange error:", error);
        if (callbacks?.onError) {
          callbacks.onError(
            error instanceof Error ? error : new Error(String(error))
          );
        }
        throw error;
      }
    },
    [callbacks, getAccessToken]
  );

  const handleOAuthCallback = useCallback(
    async (url: string) => {
      const urlParams = new URLSearchParams(new URL(url).search);
      const code = urlParams.get("code");
      const state = urlParams.get("state");
      const error = urlParams.get("error");

      if (error) {
        console.error("❌ OAuth error:", error);
        toast({
          title: "Connection Failed",
          description:
            "Failed to connect to Google Calendar. Please try again.",
          variant: "destructive",
        });
        return;
      }

      if (!code || !state) {
        console.error("❌ Missing code or state");
        return;
      }

      const storedState = localStorage.getItem("oauth_state");
      if (state !== storedState) {
        console.error("❌ State mismatch");
        return;
      }

      await exchangeGoogleToken(code, state);
    },
    [exchangeGoogleToken, toast]
  );

  const checkPopupStatus = useCallback(() => {
    if (!popupRef.current || popupRef.current.closed) {
      console.log("📢 Popup closed");
      if (popupCheckInterval.current) {
        clearInterval(popupCheckInterval.current);
        popupCheckInterval.current = null;
      }
      localStorage.removeItem("oauth_popup_open");
      return;
    }

    try {
      const popupUrl = popupRef.current.location.href;
      if (popupUrl.includes("/oauth/callback")) {
        console.log("🎯 Detected callback URL in popup");
        handleOAuthCallback(popupUrl);
        popupRef.current.close();
      }
    } catch (e) {
      // Cross-origin errors are expected while the popup is on google.com
      if (e instanceof DOMException && e.name === "SecurityError") {
        return;
      }
      console.error("❌ Error checking popup status:", e);
    }
  }, [handleOAuthCallback]);

  const startOAuthFlow = useCallback(async () => {
    try {
      // Generate and store state
      const state = crypto.randomUUID();
      localStorage.setItem("oauth_state", state);

      // Get auth URL
      const response = await fetch(`/api/auth/google/url?state=${state}`);
      const { url } = await response.json();

      // Open popup
      const popup = window.open(url, "google-oauth", "width=600,height=800");
      if (!popup) {
        throw new Error("Failed to open popup");
      }

      popupRef.current = popup;
      localStorage.setItem("oauth_popup_open", "true");

      // Start checking popup status
      if (popupCheckInterval.current) {
        clearInterval(popupCheckInterval.current);
      }
      popupCheckInterval.current = setInterval(checkPopupStatus, 500);
    } catch (error) {
      console.error("❌ Failed to start OAuth flow:", error);
      toast({
        title: "Connection Failed",
        description: "Failed to connect to Google Calendar. Please try again.",
        variant: "destructive",
      });
    }
  }, [checkPopupStatus, toast]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (popupCheckInterval.current) {
        clearInterval(popupCheckInterval.current);
      }
      if (popupRef.current && !popupRef.current.closed) {
        popupRef.current.close();
      }
      localStorage.removeItem("oauth_popup_open");
    };
  }, []);

  return {
    startOAuthFlow,
    showSuccessDialog,
    setShowSuccessDialog,
  };
}
