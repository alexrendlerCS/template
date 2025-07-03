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
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
          <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
            <div className="flex justify-center mb-6">
              <MessageSquare className="h-16 w-16 text-red-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Messages Coming Soon!
            </h2>
            <p className="text-gray-600 mb-6">
              We're working hard to bring you a seamless messaging experience
              with your trainer. This feature will be available in the near
              future.
            </p>
            <Link href="/client/dashboard">
              <Button className="bg-red-600 hover:bg-red-700">
                Return to Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
