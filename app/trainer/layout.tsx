"use client";

import { TrainerSidebar } from "@/components/trainer-sidebar";
import { SidebarProvider } from "@/components/ui/sidebar";

export default function TrainerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <TrainerSidebar />
        <div className="flex-1">{children}</div>
      </div>
    </SidebarProvider>
  );
}
