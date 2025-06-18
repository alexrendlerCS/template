"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabaseClient";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { TrainerSidebar } from "@/components/trainer-sidebar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { Toaster } from "@/components/ui/toaster";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Calendar as CalendarIcon,
  Clock,
  Plus,
  X,
  Check,
  AlertCircle,
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { cn } from "@/lib/utils";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";

interface TimeRange {
  id?: number;
  start_time: string;
  end_time: string;
  isModified?: boolean;
}

interface DaySchedule {
  enabled: boolean;
  timeRanges: TimeRange[];
}

interface UnavailableSlot {
  id?: number;
  trainer_id: string;
  date: string;
  start_time: string;
  end_time: string;
  reason: string;
}

const DAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

function TimeSlotDialog({
  day,
  onAdd,
}: {
  day: string;
  onAdd: (start: string, end: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("17:00");

  const handleAdd = () => {
    onAdd(startTime, endTime);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="w-full transition-all hover:bg-green-50"
          aria-label={`Add time slot for ${day}`}
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Time Slot
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Time Slot for {day}</DialogTitle>
          <DialogDescription>
            Set the start and end time for this slot
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor={`${day}-start-time`}>Start Time</Label>
            <Input
              id={`${day}-start-time`}
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              aria-label={`Start time for ${day}`}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor={`${day}-end-time`}>End Time</Label>
            <Input
              id={`${day}-end-time`}
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              aria-label={`End time for ${day}`}
            />
          </div>
        </div>
        <Button onClick={handleAdd} className="w-full">
          Add Time Slot
        </Button>
      </DialogContent>
    </Dialog>
  );
}

function UnavailableSlotDialog({
  onAdd,
  isOpen,
  onOpenChange,
}: {
  onAdd: (slot: Omit<UnavailableSlot, "id" | "trainer_id">) => void;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [date, setDate] = useState<Date>();
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("17:00");
  const [reason, setReason] = useState("");

  const handleAdd = () => {
    if (!date) {
      return;
    }

    onAdd({
      date: date.toISOString().split("T")[0],
      start_time: startTime,
      end_time: endTime,
      reason,
    });

    // Reset form
    setDate(undefined);
    setStartTime("09:00");
    setEndTime("17:00");
    setReason("");
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Block Off Time</DialogTitle>
          <DialogDescription>
            Mark a specific date and time as unavailable in your schedule.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Select Date</Label>
            <Calendar
              mode="single"
              selected={date}
              onSelect={setDate}
              className="rounded-md border"
              disabled={(date) => date < new Date()}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start-time">Start Time</Label>
              <Input
                id="start-time"
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="end-time">End Time</Label>
              <Input
                id="end-time"
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="reason">Reason (Optional)</Label>
            <Textarea
              id="reason"
              placeholder="e.g., Doctor's appointment, Personal commitment"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleAdd} disabled={!date} className="w-full">
            Block Off Time
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function UnavailableSlots({
  slots,
  onDelete,
}: {
  slots: UnavailableSlot[];
  onDelete: (id: number) => void;
}) {
  if (slots.length === 0) {
    return (
      <Card className="bg-gray-50 border-gray-100">
        <CardHeader className="pb-2">
          <CardDescription className="text-center text-gray-500">
            No blocked time slots
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {slots.map((slot) => (
        <Card key={slot.id} className="bg-red-50/50 border-red-100">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-medium">
                {format(parseISO(slot.date), "MMMM d, yyyy")}
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => slot.id && onDelete(slot.id)}
                className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <CardDescription>
              {formatTime(slot.start_time)} – {formatTime(slot.end_time)}
            </CardDescription>
          </CardHeader>
          {slot.reason && (
            <CardContent>
              <p className="text-sm text-gray-600">{slot.reason}</p>
            </CardContent>
          )}
        </Card>
      ))}
    </div>
  );
}

function WeeklyAvailabilityEditor({
  schedule,
  onScheduleChange,
  onTimeRangeAdd,
  onTimeRangeRemove,
  isSaving,
}: {
  schedule: Record<string, DaySchedule>;
  onScheduleChange: (day: string, enabled: boolean) => void;
  onTimeRangeAdd: (day: string, start: string, end: string) => void;
  onTimeRangeRemove: (day: string, index: number) => void;
  isSaving: boolean;
}) {
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {DAYS.map((day) => (
        <Card
          key={day}
          className={cn(
            "transition-all duration-200",
            schedule[day].enabled
              ? "border-green-200 bg-green-50"
              : "border-gray-200 bg-gray-50"
          )}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div className="flex items-center space-x-2">
              <CalendarIcon
                className={cn(
                  "h-4 w-4",
                  schedule[day].enabled ? "text-green-600" : "text-gray-400"
                )}
              />
              <h3
                className={cn(
                  "font-medium",
                  schedule[day].enabled ? "text-gray-900" : "text-gray-500"
                )}
              >
                {day}
              </h3>
            </div>
            <Switch
              checked={schedule[day].enabled}
              onCheckedChange={(checked) => onScheduleChange(day, checked)}
              aria-label={`Enable ${day} availability`}
              disabled={isSaving}
            />
          </CardHeader>
          <CardContent>
            <div className="space-y-2 min-h-[100px]">
              {schedule[day].timeRanges.map((range, index) => (
                <div
                  key={index}
                  className={cn(
                    "flex items-center justify-between transition-all duration-300 transform",
                    range.isModified && "animate-pulse bg-yellow-50 rounded-lg"
                  )}
                >
                  <Badge
                    variant="secondary"
                    className="bg-green-100 text-green-800 hover:bg-green-200"
                  >
                    {formatTime(range.start_time)} –{" "}
                    {formatTime(range.end_time)}
                    <button
                      onClick={() => onTimeRangeRemove(day, index)}
                      className="ml-2 hover:text-red-600"
                      aria-label={`Remove time slot ${formatTime(
                        range.start_time
                      )} to ${formatTime(range.end_time)}`}
                      disabled={isSaving}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                </div>
              ))}
              {schedule[day].enabled && (
                <TimeSlotDialog
                  day={day}
                  onAdd={(start, end) => onTimeRangeAdd(day, start, end)}
                />
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function AvailabilitySummary({
  schedule,
}: {
  schedule: Record<string, DaySchedule>;
}) {
  const summary = DAYS.filter((day) => schedule[day].enabled).map((day) => ({
    day,
    slots: schedule[day].timeRanges.map(
      (range) =>
        `${formatTime(range.start_time)} – ${formatTime(range.end_time)}`
    ),
  }));

  if (summary.length === 0) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Current Availability</CardTitle>
          <CardDescription>Summary of your weekly schedule</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-gray-500 text-sm italic">
            No availability set yet
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">
            Current Availability
          </h2>
          <p className="text-sm text-muted-foreground">
            Your weekly schedule at a glance
          </p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {DAYS.map((day) => {
          const isEnabled = schedule[day].enabled;
          const timeSlots = schedule[day].timeRanges;

          return (
            <Card
              key={day}
              className={cn(
                "transition-colors duration-200",
                isEnabled
                  ? "border-green-100 bg-green-50/50"
                  : "border-gray-100 bg-gray-50/50 opacity-60"
              )}
            >
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2">
                  <CalendarIcon
                    className={cn(
                      "h-4 w-4",
                      isEnabled ? "text-green-600" : "text-gray-400"
                    )}
                  />
                  {day}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isEnabled ? (
                  <div className="space-y-2">
                    {timeSlots.map((slot, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-2 text-sm"
                      >
                        <Clock className="h-3 w-3 text-gray-500" />
                        <span>
                          {formatTime(slot.start_time)} –{" "}
                          {formatTime(slot.end_time)}
                        </span>
                      </div>
                    ))}
                    {timeSlots.length === 0 && (
                      <p className="text-sm text-gray-500 italic">
                        No time slots added
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 italic">Not available</p>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

function SaveFooter({
  onSave,
  isSaving,
}: {
  onSave: () => void;
  isSaving: boolean;
}) {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg p-4 z-50">
      <div className="container max-w-7xl mx-auto">
        <Button
          onClick={onSave}
          className="w-full max-w-md mx-auto flex items-center justify-center"
          disabled={isSaving}
        >
          {isSaving ? (
            <Clock className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Check className="h-4 w-4 mr-2" />
          )}
          {isSaving ? "Saving Changes..." : "Save Availability"}
        </Button>
      </div>
    </div>
  );
}

function formatTime(time: string) {
  return format(new Date(`2000-01-01T${time}`), "h:mm a");
}

export default function TrainerAvailabilityPage() {
  const [schedule, setSchedule] = useState<Record<string, DaySchedule>>(
    DAYS.reduce(
      (acc, day) => ({
        ...acc,
        [day]: { enabled: false, timeRanges: [] },
      }),
      {}
    )
  );
  const [unavailableSlots, setUnavailableSlots] = useState<UnavailableSlot[]>(
    []
  );
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(
    new Date()
  );
  const [newOverride, setNewOverride] = useState<{
    start_time: string;
    end_time: string;
    reason: string;
  }>({
    start_time: "09:00",
    end_time: "17:00",
    reason: "",
  });
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUnavailableDialogOpen, setIsUnavailableDialogOpen] = useState(false);
  const supabase = createClient();
  const { toast } = useToast();

  useEffect(() => {
    loadAvailability();
    loadUnavailableSlots();
  }, []);

  const loadAvailability = async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) return;

      const { data, error } = await supabase
        .from("trainer_availability")
        .select("*")
        .eq("trainer_id", session.user.id);

      if (error) throw error;

      const newSchedule = DAYS.reduce(
        (acc, day) => ({
          ...acc,
          [day]: { enabled: false, timeRanges: [] },
        }),
        {}
      );

      data.forEach((slot) => {
        const day = DAYS[slot.weekday];
        newSchedule[day].enabled = true;
        newSchedule[day].timeRanges.push({
          id: slot.id,
          start_time: slot.start_time,
          end_time: slot.end_time,
        });
      });

      setSchedule(newSchedule);
    } catch (error) {
      console.error("Error loading availability:", error);
      toast({
        title: "Error Loading Availability",
        description:
          "Failed to load your availability schedule. Please try refreshing the page.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadUnavailableSlots = async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) return;

      const { data, error } = await supabase
        .from("trainer_unavailable_slots")
        .select("*")
        .eq("trainer_id", session.user.id)
        .gte("date", new Date().toISOString().split("T")[0]);

      if (error) throw error;

      setUnavailableSlots(data || []);
    } catch (error) {
      console.error("Error loading unavailable slots:", error);
      toast({
        title: "Error Loading Time Off",
        description: "Failed to load your unavailable time slots.",
        variant: "destructive",
      });
    }
  };

  const saveAvailability = async () => {
    try {
      setIsSaving(true);
      console.log("Starting save availability process...");

      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        console.log("No session found, showing auth error toast");
        toast({
          title: "Authentication Error",
          description: "Please log in to save your availability.",
          variant: "destructive",
        });
        return;
      }

      console.log("Deleting existing availability...");
      const { error: deleteError } = await supabase
        .from("trainer_availability")
        .delete()
        .eq("trainer_id", session.user.id);

      if (deleteError) throw deleteError;

      const slots = DAYS.flatMap((day, index) => {
        if (!schedule[day].enabled) return [];
        return schedule[day].timeRanges.map((range) => ({
          trainer_id: session.user.id,
          weekday: index,
          start_time: range.start_time,
          end_time: range.end_time,
        }));
      });

      console.log("Inserting new availability slots:", slots.length);
      const { error: insertError } = await supabase
        .from("trainer_availability")
        .insert(slots);

      if (insertError) throw insertError;

      console.log("Reloading availability...");
      await loadAvailability();

      console.log("Showing success toast...");
      toast({
        variant: "default",
        title: (
          <div className="flex items-center gap-2 text-green-600">
            <Check className="h-5 w-5" />
            <span>Success!</span>
          </div>
        ),
        description: "Your availability schedule has been successfully updated",
        className: "border-2 border-green-500/50 bg-green-50",
        duration: 3000,
      });
    } catch (error) {
      console.error("Error in saveAvailability:", error);
      toast({
        variant: "destructive",
        title: "Error Saving Availability",
        description:
          "Failed to save your availability schedule. Please try again.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const addOverride = async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session || !selectedDate) return;

      const { error } = await supabase
        .from("trainer_unavailable_slots")
        .insert({
          trainer_id: session.user.id,
          date: format(selectedDate, "yyyy-MM-dd"),
          start_time: newOverride.start_time,
          end_time: newOverride.end_time,
          reason: newOverride.reason || null,
        });

      if (error) throw error;

      loadUnavailableSlots();
      setNewOverride({
        start_time: "09:00",
        end_time: "17:00",
        reason: "",
      });
    } catch (error) {
      console.error("Error adding override:", error);
    }
  };

  const deleteOverride = async (id: number) => {
    try {
      const { error } = await supabase
        .from("trainer_unavailable_slots")
        .delete()
        .eq("id", id);

      if (error) throw error;

      loadUnavailableSlots();
    } catch (error) {
      console.error("Error deleting override:", error);
    }
  };

  const addUnavailableSlot = async (
    slot: Omit<UnavailableSlot, "id" | "trainer_id">
  ) => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        toast({
          title: "Authentication Error",
          description: "Please log in to add unavailable slots.",
          variant: "destructive",
        });
        return;
      }

      const { data, error } = await supabase
        .from("trainer_unavailable_slots")
        .insert([
          {
            ...slot,
            trainer_id: session.user.id,
          },
        ])
        .select();

      if (error) throw error;

      setUnavailableSlots([...unavailableSlots, data[0]]);
      toast({
        title: "Time Off Added",
        description: "Your unavailable time slot has been added successfully.",
        duration: 3000,
      });
    } catch (error) {
      console.error("Error adding unavailable slot:", error);
      toast({
        title: "Error Adding Time Off",
        description: "Failed to add your unavailable time slot.",
        variant: "destructive",
      });
    }
  };

  const deleteUnavailableSlot = async (id: number) => {
    try {
      const { error } = await supabase
        .from("trainer_unavailable_slots")
        .delete()
        .eq("id", id);

      if (error) throw error;

      setUnavailableSlots(unavailableSlots.filter((slot) => slot.id !== id));
      toast({
        title: "Time Off Removed",
        description: "Your unavailable time slot has been removed.",
        duration: 3000,
      });
    } catch (error) {
      console.error("Error deleting unavailable slot:", error);
      toast({
        title: "Error Removing Time Off",
        description: "Failed to remove your unavailable time slot.",
        variant: "destructive",
      });
    }
  };

  const handleScheduleChange = (day: string, enabled: boolean) => {
    setSchedule({
      ...schedule,
      [day]: { ...schedule[day], enabled },
    });
  };

  const addTimeRange = (day: string, start: string, end: string) => {
    setSchedule({
      ...schedule,
      [day]: {
        ...schedule[day],
        timeRanges: [
          ...schedule[day].timeRanges,
          { start_time: start, end_time: end, isModified: true },
        ],
      },
    });
  };

  const removeTimeRange = (day: string, index: number) => {
    const newRanges = [...schedule[day].timeRanges];
    newRanges.splice(index, 1);
    setSchedule({
      ...schedule,
      [day]: {
        ...schedule[day],
        timeRanges: newRanges,
      },
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Clock className="h-8 w-8 animate-spin text-red-600" />
      </div>
    );
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <TrainerSidebar />
        <div className="flex-1 pb-20">
          <header className="border-b bg-white px-6 py-4">
            <div className="flex items-center space-x-4">
              <SidebarTrigger />
              <h1 className="text-2xl font-bold text-gray-900">
                My Availability
              </h1>
            </div>
          </header>

          <main className="container max-w-7xl mx-auto p-6 space-y-8">
            <section aria-label="Blocked time slots" className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-semibold tracking-tight">
                    Blocked Time
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Mark specific dates as unavailable
                  </p>
                </div>
                <Button
                  onClick={() => setIsUnavailableDialogOpen(true)}
                  className="bg-red-600 hover:bg-red-700"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Block Off Time
                </Button>
              </div>

              <UnavailableSlots
                slots={unavailableSlots}
                onDelete={deleteUnavailableSlot}
              />

              <UnavailableSlotDialog
                isOpen={isUnavailableDialogOpen}
                onOpenChange={setIsUnavailableDialogOpen}
                onAdd={addUnavailableSlot}
              />
            </section>

            <Separator className="my-8" />

            <section aria-label="Weekly availability editor">
              <WeeklyAvailabilityEditor
                schedule={schedule}
                onScheduleChange={handleScheduleChange}
                onTimeRangeAdd={addTimeRange}
                onTimeRangeRemove={removeTimeRange}
                isSaving={isSaving}
              />
            </section>

            <Separator className="my-8" />

            <section
              aria-label="Current availability summary"
              className="bg-gray-50 rounded-lg p-6"
            >
              <AvailabilitySummary schedule={schedule} />
            </section>
          </main>

          <SaveFooter onSave={saveAvailability} isSaving={isSaving} />
        </div>
        <Toaster />
      </div>
    </SidebarProvider>
  );
}
