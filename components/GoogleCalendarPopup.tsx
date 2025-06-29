"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CalendarIcon, Loader2 } from "lucide-react";
import GoogleCalendarSuccessDialog from "./GoogleCalendarSuccessDialog";

interface GoogleCalendarPopupProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function GoogleCalendarPopup({
  open,
  onOpenChange,
}: GoogleCalendarPopupProps) {
  const router = useRouter();
  const [isConnecting, setIsConnecting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [calendarName, setCalendarName] = useState<string>("");
  const { toast } = useToast();

  // Check if we're in the middle of an OAuth flow
  useEffect(() => {
    const checkOAuthStatus = () => {
      const urlParams = new URLSearchParams(window.location.search);
      const oauthState = urlParams.get("state");
      const oauthCode = urlParams.get("code");

      // If we have state and code params, we're in a redirect
      if (oauthState && oauthCode) {
        setIsConnecting(true);
      }
    };

    if (open) {
      checkOAuthStatus();
    }
  }, [open]);

  // Handle messages from the popup window
  useEffect(() => {
    const handleMessage = async (event: MessageEvent) => {
      if (event.data.type === "GOOGLE_AUTH_SUCCESS") {
        try {
          // Verify calendar connection
          const response = await fetch("/api/google/calendar/verify", {
            method: "POST",
          });

          if (!response.ok) {
            const errorText = await response.text();
            throw new Error(
              errorText || "Failed to verify calendar connection"
            );
          }

          const data = await response.json();
          setIsConnecting(false);
          onOpenChange(false);
          setShowSuccess(true);
          setCalendarName(data.calendarName);
          router.refresh();
        } catch (error) {
          console.error("Error verifying calendar:", error);
          toast({
            title: "Warning",
            description:
              "Connected to Google Calendar but failed to verify connection. Please try reconnecting.",
            variant: "destructive",
            duration: 5000,
          });
          setIsConnecting(false);
        }
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
  }, [router, toast, onOpenChange]);

  const handleConnectCalendar = async () => {
    try {
      setIsConnecting(true);

      // Get the OAuth URL from our backend
      const response = await fetch("/api/auth/google/url");
      const data = await response.json();

      if (!data.url) {
        throw new Error("Failed to get OAuth URL");
      }

      // Open the OAuth flow in a popup window
      const width = 600;
      const height = 700;
      const left = window.screenX + (window.outerWidth - width) / 2;
      const top = window.screenY + (window.outerHeight - height) / 2;

      const popup = window.open(
        data.url,
        "Connect Google Calendar",
        `width=${width},height=${height},left=${left},top=${top}`
      );

      // Poll for popup closure without success message
      const pollTimer = setInterval(() => {
        if (popup?.closed) {
          clearInterval(pollTimer);
          // Only reset connecting state if we haven't received a success message
          if (!showSuccess) {
            setIsConnecting(false);
          }
        }
      }, 500);
    } catch (error) {
      console.error("Error connecting to Google Calendar:", error);
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
      <Dialog
        open={open}
        onOpenChange={(newOpen) => {
          // Only allow closing if not in connecting state
          if (!isConnecting || !newOpen) {
            onOpenChange(newOpen);
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5" />
              Connect Google Calendar
            </DialogTitle>
            <DialogDescription>
              Connect your Google Calendar to automatically sync your training
              sessions and receive reminders.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center justify-center">
            {isConnecting ? (
              <div className="flex flex-col items-center gap-4 py-4">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground text-center">
                  Connecting to Google Calendar...
                  <br />
                  Please complete the authentication in the popup window.
                </p>
              </div>
            ) : (
              <Button
                onClick={handleConnectCalendar}
                className="w-full max-w-sm"
              >
                Connect Calendar
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>
      <GoogleCalendarSuccessDialog
        open={showSuccess}
        onOpenChange={(open) => {
          setShowSuccess(open);
          if (!open) {
            router.refresh();
          }
        }}
        calendarName={calendarName}
      />
    </>
  );
}
