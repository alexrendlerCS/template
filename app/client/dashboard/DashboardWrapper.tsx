"use client";

import { useEffect, useState, useCallback } from "react";
import GoogleCalendarPopup from "@/components/GoogleCalendarPopup";
import { createClient } from "@/lib/supabaseClient";
import { useGoogleOAuthListenerWithDialog } from "@/hooks/use-google-oauth-listener";
import GoogleCalendarSuccessDialog from "@/components/GoogleCalendarSuccessDialog";

export function DashboardWrapper({ children }: { children: React.ReactNode }) {
  const [showPopup, setShowPopup] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const supabase = createClient();

  const handleSuccess = useCallback(async () => {
    // Update user's Google Calendar connection status
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      await supabase
        .from("users")
        .update({ google_account_connected: true })
        .eq("id", user.id);
    }
    setShowPopup(false);
    // Add a small delay before showing success dialog
    setTimeout(() => {
      setShowSuccessDialog(true);
    }, 100);
  }, [supabase]);

  useEffect(() => {
    const checkCalendarStatus = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data: userData } = await supabase
        .from("users")
        .select("contract_accepted, google_account_connected")
        .eq("id", user.id)
        .single();

      if (userData?.contract_accepted && !userData?.google_account_connected) {
        setShowPopup(true);
      }
    };

    checkCalendarStatus();
  }, [supabase]);

  return (
    <>
      {children}
      <GoogleCalendarPopup
        open={showPopup}
        onOpenChange={setShowPopup}
        onSuccess={handleSuccess}
      />
      {showSuccessDialog && (
        <GoogleCalendarSuccessDialog
          open={showSuccessDialog}
          onOpenChange={setShowSuccessDialog}
          calendarName="Training Sessions"
        />
      )}
    </>
  );
}
