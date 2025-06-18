"use client";

import { useEffect, useState } from "react";
import { GoogleCalendarPopup } from "@/components/GoogleCalendarPopup";
import { createClient } from "@/lib/supabaseClient";

export function DashboardWrapper({ children }: { children: React.ReactNode }) {
  const [showPopup, setShowPopup] = useState(false);
  const supabase = createClient();

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
      <GoogleCalendarPopup open={showPopup} onOpenChange={setShowPopup} />
    </>
  );
}
