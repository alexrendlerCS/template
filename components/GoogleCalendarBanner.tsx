"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Calendar, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/use-toast";
import GoogleCalendarSuccessDialog from "./GoogleCalendarSuccessDialog";
import { isGoogleCalendarEnabled, getCurrentTier } from "@/lib/config/features";
import { UpgradeOverlay } from "@/components/ui/upgrade-overlay";

interface GoogleCalendarBannerProps {
  onDismiss?: () => void;
}

export function GoogleCalendarBanner({ onDismiss }: GoogleCalendarBannerProps) {
  const [isConnecting, setIsConnecting] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  // Check if Google Calendar is enabled for current tier
  const googleCalendarEnabled = isGoogleCalendarEnabled();
  const currentTier = getCurrentTier();

  const handleUpgrade = () => {
    // This would typically redirect to a pricing/upgrade page
    console.log("Upgrade requested for Google Calendar");
    toast({
      title: "Upgrade Required",
      description: "Please upgrade your plan to access Google Calendar integration.",
    });
  };

  // If Google Calendar is not enabled, show upgrade overlay
  if (!googleCalendarEnabled) {
    return (
      <UpgradeOverlay
        feature="Google Calendar Integration"
        currentTier={currentTier}
        onUpgrade={handleUpgrade}
        variant="banner"
        showPricing={false}
      />
    );
  }

  // Check localStorage for connection success flag
  useEffect(() => {
    const checkLocalStorage = () => {
      if (typeof window !== "undefined") {
        const connected = localStorage.getItem("google_calendar_connected");
        if (connected === "true") {
          localStorage.removeItem("google_calendar_connected");
          setShowSuccessDialog(true);
          router.refresh();
        }
      }
    };

    // Check immediately
    checkLocalStorage();

    // Also check when the window gains focus
    window.addEventListener("focus", checkLocalStorage);

    return () => {
      window.removeEventListener("focus", checkLocalStorage);
    };
  }, [router]);

  // Handle messages from the popup window
  useEffect(() => {
    const handleMessage = async (event: MessageEvent) => {
      if (event.data.type === "GOOGLE_AUTH_CODE") {
        const { code, state } = event.data;
        const storedState = localStorage.getItem("oauth_state");

        // Validate state before proceeding
        if (state !== storedState) {
          toast({
            title: "Authentication Error",
            description: "Invalid state parameter. Please try again.",
            variant: "destructive",
          });
          setIsConnecting(false);
          return;
        }

        try {
          const res = await fetch("/api/auth/google/exchange", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ code, state }),
          });

          if (!res.ok) {
            const error = await res.text();
            throw new Error(error || "Failed to exchange code");
          }

          localStorage.removeItem("oauth_state");
          setIsConnecting(false);
          setShowSuccessDialog(true);
          router.refresh();
        } catch (err) {
          console.error("Failed to exchange code:", err);
          setIsConnecting(false);
          toast({
            title: "OAuth Error",
            description: err instanceof Error ? err.message : "Unknown error",
            variant: "destructive",
          });
        }
      }

      if (event.data.type === "GOOGLE_AUTH_ERROR") {
        setIsConnecting(false);
        toast({
          title: "OAuth Error",
          description: event.data.error || "Unknown error during Google auth",
          variant: "destructive",
        });
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [router, toast]);

  const handleConnect = async () => {
    try {
      setIsConnecting(true);
      // Get the OAuth URL and state from our backend
      const response = await fetch("/api/auth/google/url");
      const { url, state } = await response.json();

      if (!url || !state) {
        throw new Error("Failed to get OAuth URL or state");
      }

      // Store state in localStorage for validation in callback
      localStorage.setItem("oauth_state", state);

      // Open the OAuth flow in a centered popup window
      const width = 500;
      const height = 600;
      const left = window.screenX + (window.outerWidth - width) / 2;
      const top = window.screenY + (window.outerHeight - height) / 2;

      const popup = window.open(
        url,
        "Connect Google Calendar",
        `width=${width},height=${height},left=${left},top=${top}`
      );

      // Poll for popup closure without success message
      const pollTimer = setInterval(() => {
        if (popup?.closed) {
          clearInterval(pollTimer);
          setIsConnecting(false);
          localStorage.removeItem("oauth_state"); // Clean up state if popup was closed
        }
      }, 500);
    } catch (error) {
      console.error("Error starting Google Calendar connection:", error);
      setIsConnecting(false);
      localStorage.removeItem("oauth_state"); // Clean up state on error
      toast({
        title: "Error",
        description: "Failed to start Google Calendar connection",
        variant: "destructive",
        duration: 5000,
      });
    }
  };

  return (
    <>
      <Alert className="relative mb-6">
        {onDismiss && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-2 top-2"
            onClick={onDismiss}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
        <Calendar className="h-5 w-5" />
        <AlertTitle>Connect Google Calendar</AlertTitle>
        <AlertDescription className="flex items-center justify-between mt-2">
          <span>
            Connect your Google Calendar to automatically sync your training
            sessions and receive reminders.
          </span>
          <Button
            variant="default"
            size="sm"
            className="ml-4"
            onClick={handleConnect}
            disabled={isConnecting}
          >
            {isConnecting ? "Connecting..." : "Connect Calendar"}
          </Button>
        </AlertDescription>
      </Alert>

      <GoogleCalendarSuccessDialog
        open={showSuccessDialog}
        onOpenChange={setShowSuccessDialog}
        calendarName="Training Sessions"
      />
    </>
  );
}
