"use client";

import { useState, useEffect } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { TrainerSidebar } from "@/components/trainer-sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Calendar as CalendarIcon,
  Plus,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { GoogleCalendarBanner } from "@/components/GoogleCalendarBanner";

interface GoogleEvent {
  id: string;
  summary: string;
  description?: string;
  start: {
    dateTime: string;
  };
  end: {
    dateTime: string;
  };
  status: string;
  attendees?: Array<{
    email: string;
    displayName?: string;
    responseStatus?: string;
  }>;
}

// Add color palette for clients
const clientColors = [
  { bg: "bg-red-50", border: "border-red-100", text: "text-red-900" },
  { bg: "bg-blue-50", border: "border-blue-100", text: "text-blue-900" },
  { bg: "bg-green-50", border: "border-green-100", text: "text-green-900" },
  { bg: "bg-purple-50", border: "border-purple-100", text: "text-purple-900" },
  { bg: "bg-orange-50", border: "border-orange-100", text: "text-orange-900" },
  { bg: "bg-teal-50", border: "border-teal-100", text: "text-teal-900" },
  { bg: "bg-pink-50", border: "border-pink-100", text: "text-pink-900" },
  { bg: "bg-indigo-50", border: "border-indigo-100", text: "text-indigo-900" },
];

// Helper function to get consistent color for a client
function getClientColor(
  clientEmail: string | undefined,
  clientName: string
): (typeof clientColors)[0] {
  // Create a consistent hash from client identifier
  const identifier = clientEmail || clientName;
  let hash = 0;
  for (let i = 0; i < identifier.length; i++) {
    hash = (hash << 5) - hash + identifier.charCodeAt(i);
    hash = hash & hash; // Convert to 32-bit integer
  }
  // Use absolute value of hash to get positive index
  const colorIndex = Math.abs(hash) % clientColors.length;
  return clientColors[colorIndex];
}

// Helper function to format event time
function formatEventTime(dateTimeStr: string) {
  const date = new Date(dateTimeStr);
  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

// Helper function to extract client name from event
function getClientName(event: GoogleEvent): string {
  // Try to get client name from attendees first
  const clientAttendee = event.attendees?.find(
    (a) => a.responseStatus !== "declined"
  );
  if (clientAttendee?.displayName) {
    return clientAttendee.displayName;
  }

  // Fall back to parsing from summary
  const summaryParts = event.summary.split("with");
  if (summaryParts.length > 1) {
    return summaryParts[1].trim();
  }

  return "Client";
}

// Helper function to get session type
function getSessionType(event: GoogleEvent): string {
  const summaryParts = event.summary.split("with");
  if (summaryParts.length > 0) {
    return summaryParts[0].trim();
  }
  return event.summary;
}

const timeSlots = [
  "08:00",
  "09:00",
  "10:00",
  "11:00",
  "12:00",
  "13:00",
  "14:00",
  "15:00",
  "16:00",
  "17:00",
  "18:00",
  "19:00",
];

const daysOfWeek = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export default function TrainerSchedulePage() {
  const [viewMode, setViewMode] = useState<"week" | "month">("week");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedClient, setSelectedClient] = useState("all");
  const [isAddSessionOpen, setIsAddSessionOpen] = useState(false);
  const [events, setEvents] = useState<GoogleEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isGoogleConnected, setIsGoogleConnected] = useState(true);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch("/api/google/events");

        if (!response.ok) {
          if (response.status === 400) {
            setIsGoogleConnected(false);
            return;
          }
          throw new Error("Failed to fetch events");
        }

        const data = await response.json();
        setEvents(data);
        setIsGoogleConnected(true);
      } catch (err) {
        setError("Failed to load calendar events");
        console.error("Error fetching events:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, [currentDate]);

  const getWeekDates = (date: Date) => {
    const week = [];
    const startOfWeek = new Date(date);
    const day = startOfWeek.getDay();
    const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1); // Adjust for Monday start
    startOfWeek.setDate(diff);

    for (let i = 0; i < 7; i++) {
      const day = new Date(startOfWeek);
      day.setDate(startOfWeek.getDate() + i);
      week.push(day);
    }
    return week;
  };

  const getSessionsForDate = (date: Date) => {
    const dateStr = date.toISOString().split("T")[0];
    return events.filter((event) => {
      const eventDate = new Date(event.start.dateTime);
      return eventDate.toISOString().split("T")[0] === dateStr;
    });
  };

  const getSessionsForTimeSlot = (date: Date, time: string) => {
    const sessions = getSessionsForDate(date);
    return sessions.filter((session) => {
      const eventTime = new Date(session.start.dateTime).toLocaleTimeString(
        [],
        {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        }
      );
      return eventTime === time;
    });
  };

  const navigateWeek = (direction: "prev" | "next") => {
    setCurrentDate((prev) => {
      const newDate = new Date(prev);
      newDate.setDate(prev.getDate() + (direction === "prev" ? -7 : 7));
      return newDate;
    });
  };

  const renderEvent = (event: GoogleEvent) => {
    const clientName = getClientName(event);
    const sessionType = getSessionType(event);
    const startTime = new Date(event.start.dateTime);
    const endTime = new Date(event.end.dateTime);
    const duration = (endTime.getTime() - startTime.getTime()) / (1000 * 60); // in minutes

    // Get client's email from attendees or use name as fallback
    const clientEmail = event.attendees?.find(
      (a) => a.responseStatus !== "declined"
    )?.email;
    const clientColor = getClientColor(clientEmail, clientName);

    return (
      <div
        key={event.id}
        className={`rounded-md p-2 ${clientColor.bg} ${clientColor.border} border`}
      >
        <div className={`text-sm font-medium ${clientColor.text}`}>
          {sessionType}
        </div>
        <div className={`text-sm ${clientColor.text} opacity-90`}>
          with {clientName}
        </div>
        <div className={`text-xs ${clientColor.text} opacity-75 mt-1`}>
          {formatEventTime(event.start.dateTime)} • {duration}min
        </div>
      </div>
    );
  };

  const renderWeekView = () => {
    const weekDates = getWeekDates(currentDate);
    const startDate = weekDates[0];
    const endDate = weekDates[6];

    return (
      <div className="flex flex-col h-full">
        <div className="flex items-center justify-between mb-4 px-4">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold">
              Week of{" "}
              {startDate.toLocaleDateString("en-US", {
                month: "numeric",
                day: "numeric",
              })}{" "}
              -{" "}
              {endDate.toLocaleDateString("en-US", {
                month: "numeric",
                day: "numeric",
                year: "numeric",
              })}
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigateWeek("prev")}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigateWeek("next")}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="flex-1 overflow-auto">
          <div className="grid grid-cols-[80px_repeat(7,1fr)] gap-px bg-gray-200 rounded-lg overflow-hidden h-full">
            {/* Time column */}
            <div className="bg-gray-50">
              <div className="h-12 border-b border-gray-200" />{" "}
              {/* Empty header cell */}
              {timeSlots.map((time) => (
                <div
                  key={time}
                  className="h-24 bg-gray-50 p-2 text-xs text-gray-500 flex items-center justify-end pr-3"
                >
                  {time}
                </div>
              ))}
            </div>

            {/* Days columns */}
            {weekDates.map((date, index) => (
              <div key={date.toISOString()} className="bg-white">
                <div className="h-12 border-b border-gray-200 p-2 bg-gray-50">
                  <div className="text-sm font-medium text-gray-900">
                    {daysOfWeek[index]}
                  </div>
                  <div className="text-sm text-gray-500">{date.getDate()}</div>
                </div>
                {timeSlots.map((time) => {
                  const sessions = getSessionsForTimeSlot(date, time);
                  return (
                    <div
                      key={`${date.toISOString()}-${time}`}
                      className="h-24 border-b border-gray-200 p-1 relative bg-white"
                    >
                      {sessions.map(renderEvent)}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  if (!isGoogleConnected) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle>Connect Google Calendar</CardTitle>
            <CardContent>
              <GoogleCalendarBanner />
            </CardContent>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <TrainerSidebar />
        <div className="flex-1 bg-white">
          <header className="border-b bg-white px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <SidebarTrigger />
                <h1 className="text-2xl font-bold text-gray-900">Schedule</h1>
              </div>
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <Button
                    variant={viewMode === "week" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setViewMode("week")}
                    className={
                      viewMode === "week" ? "bg-red-600 hover:bg-red-700" : ""
                    }
                  >
                    Week
                  </Button>
                  <Button
                    variant={viewMode === "month" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setViewMode("month")}
                    className={
                      viewMode === "month" ? "bg-red-600 hover:bg-red-700" : ""
                    }
                  >
                    Month
                  </Button>
                </div>
                <Button
                  onClick={() => setIsAddSessionOpen(true)}
                  className="bg-red-600 hover:bg-red-700"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Session
                </Button>
              </div>
            </div>
          </header>

          <main className="p-6">
            {
              loading ? (
                <div className="flex items-center justify-center h-[calc(100vh-8rem)]">
                  <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                </div>
              ) : error ? (
                <div className="flex items-center justify-center h-[calc(100vh-8rem)]">
                  <div className="text-center text-red-600">
                    <AlertCircle className="h-8 w-8 mx-auto mb-2" />
                    {error}
                  </div>
                </div>
              ) : viewMode === "week" ? (
                renderWeekView()
              ) : null // Month view rendering would go here
            }
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
