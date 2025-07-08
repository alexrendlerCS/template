"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, RefreshCw, CheckCircle, AlertCircle } from "lucide-react";
import { createClient } from "@/lib/supabaseClient";
import { toast } from "@/components/ui/use-toast";

interface RescheduleSyncNotificationProps {
  sessionId: string;
  onSyncComplete?: () => void;
}

export function RescheduleSyncNotification({
  sessionId,
  onSyncComplete,
}: RescheduleSyncNotificationProps) {
  const [isSyncing, setIsSyncing] = useState(false);
  const [isSynced, setIsSynced] = useState(false);
  const supabase = createClient();

  const handleSyncCalendar = async () => {
    setIsSyncing(true);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.user) {
        toast({
          title: "Error",
          description: "You must be logged in to sync your calendar",
          variant: "destructive",
        });
        return;
      }

      // Get user role to determine which sync endpoint to use
      const { data: userData } = await supabase
        .from("users")
        .select("role")
        .eq("id", session.user.id)
        .single();

      const syncEndpoint =
        userData?.role === "trainer"
          ? "/api/google/calendar/sync"
          : "/api/google/calendar/sync/client";

      const response = await fetch(syncEndpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to sync calendar");
      }

      const result = await response.json();

      toast({
        title: "Success",
        description:
          "Calendar synced successfully! Your updated session time has been added to your Google Calendar.",
      });

      setIsSynced(true);
      if (onSyncComplete) {
        onSyncComplete();
      }
    } catch (error) {
      console.error("Error syncing calendar:", error);
      toast({
        title: "Error",
        description:
          "Failed to sync calendar. Please try again or sync manually in settings.",
        variant: "destructive",
      });
    } finally {
      setIsSyncing(false);
    }
  };

  if (isSynced) {
    return (
      <Card className="border-green-200 bg-green-50">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-green-800">
            <CheckCircle className="h-5 w-5" />
            Calendar Synced
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-green-700 text-sm">
            Your Google Calendar has been updated with the new session time.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-orange-200 bg-orange-50">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-orange-800">
          <AlertCircle className="h-5 w-5" />
          Calendar Sync Required
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <p className="text-orange-700 text-sm">
            Your session has been rescheduled. Please sync your Google Calendar
            to see the updated time.
          </p>
          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={handleSyncCalendar}
              disabled={isSyncing}
              className="bg-orange-600 hover:bg-orange-700"
            >
              {isSyncing ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Syncing...
                </>
              ) : (
                <>
                  <Calendar className="h-4 w-4 mr-2" />
                  Sync Calendar
                </>
              )}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                // Navigate to settings page
                window.location.href = "/trainer/settings";
              }}
            >
              Settings
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
