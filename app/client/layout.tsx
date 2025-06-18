"use client";

import { ClientSidebar } from "@/components/client-sidebar";
import { SidebarProvider } from "@/components/ui/sidebar";

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <ClientSidebar />
        <div className="flex-1">{children}</div>
      </div>
    </SidebarProvider>
  );
}
