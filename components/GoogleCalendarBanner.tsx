"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Calendar, X } from "lucide-react";

interface GoogleCalendarBannerProps {
  onDismiss?: () => void;
}

export function GoogleCalendarBanner({ onDismiss }: GoogleCalendarBannerProps) {
  const [isConnecting, setIsConnecting] = useState(false);

  const handleConnect = async () => {
    try {
      setIsConnecting(true);
      // Get the OAuth URL from our backend
      const response = await fetch("/api/auth/google/url");
      const { url } = await response.json();

      // Redirect to Google OAuth consent screen
      window.location.href = url;
    } catch (error) {
      console.error("Error starting Google Calendar connection:", error);
    } finally {
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
