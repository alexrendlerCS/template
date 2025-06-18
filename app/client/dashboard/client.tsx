"use client";

import { useState, useEffect } from "react";
import { GoogleCalendarPopup } from "@/components/GoogleCalendarPopup";

interface DashboardClientProps {
  children: React.ReactNode;
  showGoogleCalendarPopup: boolean;
}

export function DashboardClient({
  children,
  showGoogleCalendarPopup,
}: DashboardClientProps) {
  const [isPopupOpen, setIsPopupOpen] = useState(showGoogleCalendarPopup);

  // Show popup when prop changes
  useEffect(() => {
    setIsPopupOpen(showGoogleCalendarPopup);
  }, [showGoogleCalendarPopup]);

  return (
    <>
      {children}
      <GoogleCalendarPopup open={isPopupOpen} onOpenChange={setIsPopupOpen} />
    </>
  );
}
