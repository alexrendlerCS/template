"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Calendar,
  Clock,
  User,
  CheckCircle,
  XCircle,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { createClient } from "@/lib/supabaseClient";
import { toast } from "@/components/ui/use-toast";
import { RescheduleSyncNotification } from "./RescheduleSyncNotification";

interface PendingReschedule {
  id: string;
  date: string;
  start_time: string;
  end_time: string;
  type: string;
  reschedule_requested_at: string;
  reschedule_reason: string;
  reschedule_proposed_date: string;
  reschedule_proposed_start_time: string;
  reschedule_proposed_end_time: string;
  users: {
    full_name: string;
    email: string;
  };
}

export function PendingReschedules() {
  const [pendingReschedules, setPendingReschedules] = useState<
    PendingReschedule[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [responseModal, setResponseModal] = useState<{
    open: boolean;
    reschedule: PendingReschedule | null;
    action: "approve" | "deny" | null;
  }>({
    open: false,
    reschedule: null,
    action: null,
  });
  const [responseNote, setResponseNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSyncNotification, setShowSyncNotification] = useState(false);
  const [approvedSessionId, setApprovedSessionId] = useState<string | null>(
    null
  );
  const supabase = createClient();

  useEffect(() => {
    fetchPendingReschedules();
  }, []);

  const fetchPendingReschedules = async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.user) {
        return;
      }

      const { data, error } = await supabase
        .from("sessions")
        .select(
          `
          id,
          date,
          start_time,
          end_time,
          type,
          reschedule_requested_at,
          reschedule_reason,
          reschedule_proposed_date,
          reschedule_proposed_start_time,
          reschedule_proposed_end_time,
          users!sessions_client_id_fkey (full_name, email)
        `
        )
        .eq("trainer_id", session.user.id)
        .eq("reschedule_status", "pending")
        .order("reschedule_requested_at", { ascending: true });

      if (error) {
        console.error("Error fetching pending reschedules:", error);
        return;
      }

      setPendingReschedules(
        (data || []).map((item: any) => ({
          ...item,
          users: Array.isArray(item.users) ? item.users[0] : item.users,
        }))
      );
    } catch (error) {
      console.error("Error fetching pending reschedules:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRespond = async () => {
    if (!responseModal.reschedule || !responseModal.action) return;

    setIsSubmitting(true);
    try {
      const response = await fetch(
        `/api/sessions/${responseModal.reschedule.id}/reschedule/respond`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            action: responseModal.action,
            responseNote: responseNote.trim() || null,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Failed to respond to reschedule request"
        );
      }

      toast({
        title: "Success",
        description: `Reschedule request ${responseModal.action}d successfully`,
      });

      // If approved, show sync notification
      if (responseModal.action === "approve") {
        setApprovedSessionId(responseModal.reschedule?.id || null);
        setShowSyncNotification(true);
      }

      // Close modal and refresh data
      setResponseModal({ open: false, reschedule: null, action: null });
      setResponseNote("");
      fetchPendingReschedules();
    } catch (error) {
      console.error("Error responding to reschedule:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Failed to respond to reschedule request",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatTime = (timeStr: string) => {
    const [hours, minutes] = timeStr.split(":");
    const hour = parseInt(hours, 10);
    const period = hour >= 12 ? "PM" : "AM";
    const formattedHour = hour % 12 || 12;
    return `${formattedHour}:${minutes} ${period}`;
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  };

  const formatDateTime = (dateTimeStr: string) => {
    return new Date(dateTimeStr).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            Pending Reschedules
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (pendingReschedules.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            Pending Reschedules
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            No pending reschedule requests
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      {showSyncNotification && approvedSessionId && (
        <div className="mb-6">
          <RescheduleSyncNotification
            sessionId={approvedSessionId}
            onSyncComplete={() => {
              setShowSyncNotification(false);
              setApprovedSessionId(null);
            }}
          />
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-orange-500" />
            Pending Reschedules ({pendingReschedules.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {pendingReschedules.map((reschedule) => (
              <div
                key={reschedule.id}
                className="border rounded-lg p-4 space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-gray-500" />
                    <span className="font-medium">
                      {reschedule.users.full_name}
                    </span>
                    <Badge
                      variant="outline"
                      className="text-orange-600 border-orange-600"
                    >
                      Pending
                    </Badge>
                  </div>
                  <span className="text-sm text-gray-500">
                    Requested{" "}
                    {formatDateTime(reschedule.reschedule_requested_at)}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Current Session */}
                  <div className="bg-gray-50 p-3 rounded">
                    <h4 className="font-semibold text-sm mb-2">
                      Current Session
                    </h4>
                    <div className="space-y-1 text-sm">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-3 w-3" />
                        <span>{formatDate(reschedule.date)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-3 w-3" />
                        <span>
                          {formatTime(reschedule.start_time)} -{" "}
                          {formatTime(reschedule.end_time)}
                        </span>
                      </div>
                      <div className="text-gray-600">{reschedule.type}</div>
                    </div>
                  </div>

                  {/* Proposed Session */}
                  <div className="bg-blue-50 p-3 rounded">
                    <h4 className="font-semibold text-sm mb-2">
                      Proposed Session
                    </h4>
                    <div className="space-y-1 text-sm">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-3 w-3" />
                        <span>
                          {formatDate(reschedule.reschedule_proposed_date)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-3 w-3" />
                        <span>
                          {formatTime(
                            reschedule.reschedule_proposed_start_time
                          )}{" "}
                          -{" "}
                          {formatTime(reschedule.reschedule_proposed_end_time)}
                        </span>
                      </div>
                      <div className="text-gray-600">{reschedule.type}</div>
                    </div>
                  </div>
                </div>

                {reschedule.reschedule_reason && (
                  <div className="bg-yellow-50 p-3 rounded">
                    <h4 className="font-semibold text-sm mb-1">Reason</h4>
                    <p className="text-sm text-gray-700">
                      {reschedule.reschedule_reason}
                    </p>
                  </div>
                )}

                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() =>
                      setResponseModal({
                        open: true,
                        reschedule,
                        action: "approve",
                      })
                    }
                    className="flex items-center gap-2"
                  >
                    <CheckCircle className="h-4 w-4" />
                    Approve
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() =>
                      setResponseModal({
                        open: true,
                        reschedule,
                        action: "deny",
                      })
                    }
                    className="flex items-center gap-2"
                  >
                    <XCircle className="h-4 w-4" />
                    Deny
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Response Modal */}
      <Dialog
        open={responseModal.open}
        onOpenChange={(open) => setResponseModal({ ...responseModal, open })}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {responseModal.action === "approve" ? "Approve" : "Deny"}{" "}
              Reschedule Request
            </DialogTitle>
            <DialogDescription>
              {responseModal.action === "approve"
                ? "This will update the session to the proposed time and change the status back to confirmed."
                : "This will keep the session at its original time and change the status back to confirmed."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {responseModal.reschedule && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-semibold mb-2">Reschedule Details</h4>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="font-medium">Client:</span>{" "}
                    {responseModal.reschedule.users.full_name}
                  </div>
                  <div>
                    <span className="font-medium">Current:</span>{" "}
                    {formatDate(responseModal.reschedule.date)} at{" "}
                    {formatTime(responseModal.reschedule.start_time)}
                  </div>
                  <div>
                    <span className="font-medium">Proposed:</span>{" "}
                    {formatDate(
                      responseModal.reschedule.reschedule_proposed_date
                    )}{" "}
                    at{" "}
                    {formatTime(
                      responseModal.reschedule.reschedule_proposed_start_time
                    )}
                  </div>
                  {responseModal.reschedule.reschedule_reason && (
                    <div>
                      <span className="font-medium">Reason:</span>{" "}
                      {responseModal.reschedule.reschedule_reason}
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-medium">
                Response Note (Optional)
              </label>
              <Textarea
                placeholder="Add a note to the client..."
                value={responseNote}
                onChange={(e) => setResponseNote(e.target.value)}
                rows={3}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() =>
                setResponseModal({
                  open: false,
                  reschedule: null,
                  action: null,
                })
              }
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleRespond}
              disabled={isSubmitting}
              variant={
                responseModal.action === "approve" ? "default" : "destructive"
              }
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                `${responseModal.action === "approve" ? "Approve" : "Deny"} Request`
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
