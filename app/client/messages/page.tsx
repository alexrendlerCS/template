"use client";

import { Button } from "@/components/ui/button";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { ArrowLeft, Menu, MessageSquare } from "lucide-react";
import Link from "next/link";

export default function ClientMessagesPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-background px-4 md:px-6">
        <SidebarTrigger>
          <Button variant="ghost" size="icon" className="md:hidden">
            <Menu className="h-6 w-6" />
            <span className="sr-only">Toggle sidebar</span>
          </Button>
        </SidebarTrigger>
        <div className="flex items-center space-x-4">
          <Link href="/client/dashboard">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
          <h1 className="text-xl font-bold text-gray-900">Messages</h1>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col items-center justify-center h-full py-24">
          <h1 className="text-2xl font-bold mb-4">Messaging Add-On</h1>
          <p className="text-lg text-gray-700 mb-2 text-center">In-app messaging is available as an optional add-on feature.</p>
          <p className="text-md text-gray-500 text-center">Ask your trainer if you’d like to enable secure messaging. Additional costs may apply.</p>
        </div>
      </main>
    </div>
  );
}
