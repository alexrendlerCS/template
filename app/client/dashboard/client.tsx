"use client";

import { useState, useEffect } from "react";

interface DashboardClientProps {
  children: React.ReactNode;
  showGoogleCalendarPopup: boolean;
}

export function DashboardClient({
  children,
  showGoogleCalendarPopup,
}: DashboardClientProps) {
  return <>{children}</>;
}
