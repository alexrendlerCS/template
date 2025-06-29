"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Calendar, X } from "lucide-react";

interface GoogleCalendarBannerProps {
  onDismiss?: () => void;
}

export function GoogleCalendarBanner({ onDismiss }: GoogleCalendarBannerProps) {
  const [isConnecting, setIsConnecting] = useState(false);

  useEffect(() => {
    // Listen for messages from the popup
    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === "GOOGLE_AUTH_SUCCESS") {
        window.location.reload();
      } else if (event.data.type === "GOOGLE_AUTH_ERROR") {
        console.error("Google Auth Error:", event.data.error);
        setIsConnecting(false);
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  const openPopup = (url: string) => {
    // Calculate center position for the popup
    const width = 500;
    const height = 600;
    const left = window.screenX + (window.outerWidth - width) / 2;
    const top = window.screenY + (window.outerHeight - height) / 2;

    // Open the popup
    return window.open(
      url,
      "Google Calendar Auth",
      `width=${width},height=${height},left=${left},top=${top},toolbar=no,menubar=no,location=no,status=no`
    );
  };

  const handleConnect = async () => {
    try {
      setIsConnecting(true);
      // Get the OAuth URL from our backend
      const response = await fetch("/api/auth/google/url");
      const { url } = await response.json();

      // Open the OAuth flow in a popup
      const popup = openPopup(url);

      // Check if popup was blocked
      if (!popup) {
        console.error("Popup was blocked by the browser");
        setIsConnecting(false);
        return;
      }

      // Start polling to check if popup was closed
      const pollTimer = setInterval(() => {
        if (popup.closed) {
          clearInterval(pollTimer);
          setIsConnecting(false);
        }
      }, 500);
    } catch (error) {
      console.error("Error starting Google Calendar connection:", error);
      setIsConnecting(false);
    }
  };

  return (
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
  );
}
