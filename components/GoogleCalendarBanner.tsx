"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Calendar, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/use-toast";
import GoogleCalendarSuccessDialog from "./GoogleCalendarSuccessDialog";

interface GoogleCalendarBannerProps {
  onDismiss?: () => void;
}

export function GoogleCalendarBanner({ onDismiss }: GoogleCalendarBannerProps) {
  const [isConnecting, setIsConnecting] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

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
      if (event.data.type === "GOOGLE_AUTH_SUCCESS") {
        setIsConnecting(false);
        setShowSuccessDialog(true);
        router.refresh();
      } else if (event.data.type === "GOOGLE_AUTH_ERROR") {
        setIsConnecting(false);
        toast({
          title: "Error",
          description: event.data.error || "Failed to connect Google Calendar",
          variant: "destructive",
          duration: 5000,
        });
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [router, toast]);

  const handleConnect = async () => {
    try {
      setIsConnecting(true);
      // Get the OAuth URL from our backend
      const response = await fetch("/api/auth/google/url");
      const { url } = await response.json();

      if (!url) {
        throw new Error("Failed to get OAuth URL");
      }

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
          // Only reset connecting state if we haven't received a success message
          setIsConnecting(false);
        }
      }, 500);
    } catch (error) {
      console.error("Error starting Google Calendar connection:", error);
      setIsConnecting(false);
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
