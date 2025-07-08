"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar, Clock, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabaseClient";
import { toast } from "@/components/ui/use-toast";

interface RescheduleModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  session: {
    id: string;
    date: string;
    start_time: string;
    end_time: string;
    type: string;
    users?: {
      full_name?: string;
    };
  } | null;
  onSuccess?: () => void;
}

export function RescheduleModal({
  open,
  onOpenChange,
  session,
  onSuccess,
}: RescheduleModalProps) {
  // Don't render if no session is provided
  if (!session) {
    return null;
  }
  const [proposedDate, setProposedDate] = useState("");
  const [proposedStartTime, setProposedStartTime] = useState("");
  const [proposedEndTime, setProposedEndTime] = useState("");
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorDialogOpen, setErrorDialogOpen] = useState(false);
  const [errorDialogMessage, setErrorDialogMessage] = useState("");
  const supabase = createClient();

  // Generate 30-minute time slots
  const generateTimeSlots = () => {
    const slots = [];
    for (let hour = 0; hour < 24; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const timeString = `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`;
        const displayTime = new Date(
          `2000-01-01T${timeString}`
        ).toLocaleTimeString("en-US", {
          hour: "numeric",
          minute: "2-digit",
          hour12: true,
        });
        slots.push({ value: timeString, label: displayTime });
      }
    }
    return slots;
  };

  const timeSlots = generateTimeSlots();

  // Update end time whenever start time changes
  useEffect(() => {
    if (proposedStartTime) {
      const startTime = new Date(`2000-01-01T${proposedStartTime}`);
      const endTime = new Date(startTime.getTime() + 60 * 60 * 1000); // Add 1 hour
      setProposedEndTime(endTime.toTimeString().slice(0, 5)); // Format as HH:MM
    }
  }, [proposedStartTime]);

  // Set default proposed time to current session time
  useEffect(() => {
    if (session) {
      setProposedDate(session.date);
      setProposedStartTime(session.start_time);
      // Calculate end time as 1 hour after start time
      const startTime = new Date(`2000-01-01T${session.start_time}`);
      const endTime = new Date(startTime.getTime() + 60 * 60 * 1000); // Add 1 hour
      setProposedEndTime(endTime.toTimeString().slice(0, 5)); // Format as HH:MM
    }
  }, [session]);

  const handleSubmit = async () => {
    if (!proposedDate || !proposedStartTime || !proposedEndTime) {
      setErrorDialogMessage("Please fill in all required fields");
      setErrorDialogOpen(true);
      return;
    }

    // Check if session is within 24 hours
    const sessionDateTime = new Date(`${session.date}T${session.start_time}`);
    const now = new Date();
    const hoursUntilSession =
      (sessionDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);

    if (hoursUntilSession < 24) {
      setErrorDialogMessage(
        "Sessions cannot be rescheduled within 24 hours of the start time. Please contact your trainer directly."
      );
      setErrorDialogOpen(true);
      return;
    }

    // Validate that proposed date is in the future
    const proposedDateTime = new Date(`${proposedDate}T${proposedStartTime}`);
    if (proposedDateTime <= now) {
      setErrorDialogMessage("Proposed date and time must be in the future");
      setErrorDialogOpen(true);
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/sessions/${session.id}/reschedule`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          proposedDate,
          proposedStartTime,
          proposedEndTime,
          reason,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        const errorMessage = data.error || "Failed to request reschedule";

        // Handle specific error cases with additional information
        if (data.availability) {
          console.log("Trainer availability:", data.availability);
          if (data.availability.slots) {
            // Multiple time slots
            const slotList = data.availability.slots
              .map((slot: any) => `${slot.startTime} - ${slot.endTime}`)
              .join(", ");
            setErrorDialogMessage(
              `${errorMessage}. Trainer availability for ${data.availability.day}: ${slotList}`
            );
            setErrorDialogOpen(true);
            return;
          } else {
            // Single time slot (backward compatibility)
            setErrorDialogMessage(
              `${errorMessage}. Trainer availability for ${data.availability.day}: ${data.availability.startTime} - ${data.availability.endTime}`
            );
            setErrorDialogOpen(true);
            return;
          }
        }

        if (data.conflicts) {
          const conflictList = data.conflicts
            .map((c: any) => `${c.time} (${c.client})`)
            .join(", ");
          setErrorDialogMessage(
            `${errorMessage}. Conflicting sessions: ${conflictList}`
          );
          setErrorDialogOpen(true);
          return;
        }

        setErrorDialogMessage(errorMessage);
        setErrorDialogOpen(true);
        return;
      }

      toast({
        title: "Success",
        description: "Reschedule request submitted successfully",
      });

      onOpenChange(false);
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error("Error requesting reschedule:", error);
      setErrorDialogMessage(
        error instanceof Error ? error.message : "Failed to request reschedule"
      );
      setErrorDialogOpen(true);
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
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Request Session Reschedule</DialogTitle>
          <DialogDescription>
            Request to reschedule your session with{" "}
            {session.users?.full_name || "your trainer"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Current Session Info */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-semibold mb-2">Current Session</h4>
            <div className="space-y-1 text-sm">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span>{formatDate(session.date)}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <span>
                  {formatTime(session.start_time)} -{" "}
                  {formatTime(session.end_time)}
                </span>
              </div>
              <div className="text-gray-600">{session.type}</div>
            </div>
          </div>

          {/* Proposed New Time */}
          <div className="space-y-4">
            <h4 className="font-semibold">Proposed New Time</h4>

            <div className="space-y-2">
              <Label htmlFor="proposed-date">Date</Label>
              <Input
                id="proposed-date"
                type="date"
                value={proposedDate}
                onChange={(e) => setProposedDate(e.target.value)}
                min={new Date().toISOString().split("T")[0]}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="proposed-start-time">Start Time</Label>
                <Select
                  value={proposedStartTime}
                  onValueChange={setProposedStartTime}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select start time" />
                  </SelectTrigger>
                  <SelectContent>
                    {timeSlots.map((slot) => (
                      <SelectItem key={slot.value} value={slot.value}>
                        {slot.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="proposed-end-time">
                  End Time (Auto-calculated)
                </Label>
                <Input
                  id="proposed-end-time"
                  type="time"
                  value={proposedEndTime}
                  disabled
                  className="bg-gray-50 cursor-not-allowed"
                />
                <p className="text-xs text-gray-500">
                  Automatically set to 1 hour after start time
                </p>
              </div>
            </div>
          </div>

          {/* Reason */}
          <div className="space-y-2">
            <Label htmlFor="reason">Reason for Reschedule (Optional)</Label>
            <Textarea
              id="reason"
              placeholder="Please provide a reason for the reschedule request..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Submitting...
              </>
            ) : (
              "Request Reschedule"
            )}
          </Button>
        </div>
      </DialogContent>
      {/* Error Dialog */}
      <Dialog open={errorDialogOpen} onOpenChange={setErrorDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Error</DialogTitle>
          </DialogHeader>
          <div className="py-2">{errorDialogMessage}</div>
          <DialogClose asChild>
            <Button
              onClick={() => setErrorDialogOpen(false)}
              className="mt-2 w-full"
            >
              Close
            </Button>
          </DialogClose>
        </DialogContent>
      </Dialog>
    </Dialog>
  );
}
