"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useToast } from "@/components/ui/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { isGoogleCalendarEnabled, getCurrentTier } from "@/lib/config/features";
import { UpgradeOverlay } from "@/components/ui/upgrade-overlay";

// Generate a random string for OAuth state
function generateRandomString(length: number = 32): string {
  const charset =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";
  let result = "";
  const randomValues = new Uint8Array(length);
  crypto.getRandomValues(randomValues);
  for (let i = 0; i < length; i++) {
    result += charset[randomValues[i] % charset.length];
  }
  return result;
}

interface GoogleCalendarPopupProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export default function GoogleCalendarPopup({
  open,
  onOpenChange,
  onSuccess,
}: GoogleCalendarPopupProps) {
  const router = useRouter();
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const [isConnecting, setIsConnecting] = useState(false);

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
    onOpenChange(false);
  };

  // If Google Calendar is not enabled, show upgrade overlay
  if (!googleCalendarEnabled) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Google Calendar Integration</DialogTitle>
            <DialogDescription>
              This feature is not available in your current plan.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4">
            <UpgradeOverlay
              feature="Google Calendar Integration"
              currentTier={currentTier}
              onUpgrade={handleUpgrade}
              variant="overlay"
              showPricing={true}
            />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // Handle URL parameters in effect
  useEffect(() => {
    if (!searchParams) return;

    const success = searchParams.get("success");
    const error = searchParams.get("error");

    if (success === "true") {
      // Close the dialog
      onOpenChange(false);
      // Notify parent of success
      onSuccess?.();
      // Show success toast
      toast({
        title: "Success",
        description: "Successfully connected to Google Calendar!",
      });

      // Clean up URL params
      const url = new URL(window.location.href);
      url.searchParams.delete("success");
      router.replace(url.pathname);
    } else if (error) {
      toast({
        title: "Error",
        description: decodeURIComponent(error),
        variant: "destructive",
      });
      setIsConnecting(false);
      // Clean up URL params
      const url = new URL(window.location.href);
      url.searchParams.delete("error");
      router.replace(url.pathname);
    }
  }, [searchParams, router, onOpenChange, onSuccess, toast]);

  const handleAuthClick = useCallback(async () => {
    try {
      setIsConnecting(true);
      const state = generateRandomString();
      localStorage.setItem("oauth_state", state);

      const response = await fetch(`/api/auth/google/url?state=${state}`);
      if (!response.ok) {
        throw new Error("Failed to get auth URL");
      }

      const { url } = await response.json();
      window.location.href = url;
    } catch (error) {
      console.error("Failed to start auth:", error);
      setIsConnecting(false);
      toast({
        title: "Error",
        description: "Failed to start authentication. Please try again.",
        variant: "destructive",
      });
    }
  }, [toast]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Connect Google Calendar</DialogTitle>
          <DialogDescription>
            Connect your Google Calendar to automatically sync your training
            sessions.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          {isConnecting ? (
            <div className="flex items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span className="ml-2">Connecting to Google...</span>
            </div>
          ) : (
            <Button onClick={handleAuthClick} className="w-full max-w-sm">
              Connect Google Calendar
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
