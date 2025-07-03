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
  "8:00 AM",
  "9:00 AM",
  "10:00 AM",
  "11:00 AM",
  "12:00 PM",
  "1:00 PM",
  "2:00 PM",
  "3:00 PM",
  "4:00 PM",
  "5:00 PM",
  "6:00 PM",
  "7:00 PM",
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
        console.log("Fetched events for trainer:", data);
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
    const filteredEvents = events.filter((event) => {
      const eventDate = new Date(event.start.dateTime);
      return (
        eventDate.getFullYear() === date.getFullYear() &&
        eventDate.getMonth() === date.getMonth() &&
        eventDate.getDate() === date.getDate()
      );
    });
    console.log(`Sessions for ${date.toDateString()}:`, filteredEvents);
    return filteredEvents;
  };

  const getSessionsForTimeSlot = (date: Date, time: string) => {
    const sessions = getSessionsForDate(date);
    return sessions.filter((session) => {
      const eventTime = new Date(session.start.dateTime);
      const eventHour = eventTime.getHours();
      const eventMinute = eventTime.getMinutes();

      // Parse the time slot (e.g., "9:00 AM" -> 9, 0)
      const timeMatch = time.match(/(\d+):(\d+)\s*(AM|PM)/);
      if (!timeMatch) return false;

      let slotHour = parseInt(timeMatch[1]);
      const slotMinute = parseInt(timeMatch[2]);
      const period = timeMatch[3];

      // Convert to 24-hour format
      if (period === "PM" && slotHour !== 12) {
        slotHour += 12;
      } else if (period === "AM" && slotHour === 12) {
        slotHour = 0;
      }

      // Check if event starts within this time slot (within 1 hour)
      return (
        eventHour === slotHour &&
        eventMinute >= slotMinute &&
        eventMinute < slotMinute + 60
      );
    });
  };

  const navigateWeek = (direction: "prev" | "next") => {
    setCurrentDate((prev) => {
      const newDate = new Date(prev);
      newDate.setDate(prev.getDate() + (direction === "prev" ? -7 : 7));
      return newDate;
    });
  };

  const navigateMonth = (direction: "prev" | "next") => {
    setCurrentDate((prev) => {
      const newDate = new Date(prev);
      if (direction === "prev") {
        newDate.setMonth(prev.getMonth() - 1);
      } else {
        newDate.setMonth(prev.getMonth() + 1);
      }
      return newDate;
    });
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }

    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(day);
    }

    return days;
  };

  const isToday = (day: number | null) => {
    if (!day) return false;
    const today = new Date();
    return (
      today.getDate() === day &&
      today.getMonth() === currentDate.getMonth() &&
      today.getFullYear() === currentDate.getFullYear()
    );
  };

  const getSessionsForDay = (day: number | null) => {
    if (!day) return [];

    return events.filter((event) => {
      const eventDate = new Date(event.start.dateTime);
      return (
        eventDate.getFullYear() === currentDate.getFullYear() &&
        eventDate.getMonth() === currentDate.getMonth() &&
        eventDate.getDate() === day
      );
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
        className={`rounded-md p-2 ${clientColor.bg} ${clientColor.border} border shadow-sm hover:shadow-md transition-all duration-200 transform hover:scale-[1.02] cursor-pointer`}
      >
        <div
          className={`text-xs font-bold ${clientColor.text} mb-1 leading-tight`}
        >
          {sessionType}
        </div>
        <div
          className={`text-xs ${clientColor.text} opacity-90 font-medium leading-tight`}
        >
          with {clientName}
        </div>
        <div
          className={`text-xs ${clientColor.text} opacity-75 mt-1 flex items-center gap-1`}
        >
          <div className="w-1.5 h-1.5 rounded-full bg-current opacity-60"></div>
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
          <div className="flex items-center gap-3">
            <div className="w-1 h-8 bg-gradient-to-b from-red-500 to-red-600 rounded-full"></div>
            <h2 className="text-xl font-bold text-gray-900">
              Week of{" "}
              {startDate.toLocaleDateString("en-US", {
                month: "long",
                day: "numeric",
              })}{" "}
              -{" "}
              {endDate.toLocaleDateString("en-US", {
                month: "long",
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
              className="hover:bg-gray-50 border-gray-300"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigateWeek("next")}
              className="hover:bg-gray-50 border-gray-300"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="flex-1 overflow-auto">
          <div className="grid grid-cols-[100px_repeat(7,1fr)] gap-0 bg-white rounded-xl shadow-lg overflow-hidden h-[calc(100vh-12rem)] border border-gray-200 divide-x divide-gray-300">
            {/* Time column */}
            <div className="bg-gradient-to-b from-gray-50 to-gray-100">
              <div className="h-12 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100" />
              {timeSlots.map((time) => (
                <div
                  key={time}
                  className="h-20 bg-gradient-to-r from-gray-50 to-gray-100 p-2 text-sm font-medium text-gray-600 flex items-center justify-end pr-4 border-b border-gray-100"
                >
                  {time}
                </div>
              ))}
            </div>

            {/* Days columns */}
            {weekDates.map((date, index) => (
              <div
                key={date.toISOString()}
                className={`bg-white ${isToday(date.getDate()) ? "bg-red-50" : ""}`}
              >
                <div
                  className={`h-12 border-b border-gray-200 p-2 bg-gradient-to-b from-gray-50 to-white ${isToday(date.getDate()) ? "bg-gradient-to-b from-red-50 to-red-100" : ""}`}
                >
                  <div className="flex items-center justify-between">
                    <div
                      className={`text-sm font-semibold uppercase tracking-wide ${isToday(date.getDate()) ? "text-red-800" : "text-gray-900"}`}
                    >
                      {daysOfWeek[index]}
                    </div>
                    <div
                      className={`text-lg font-bold ${isToday(date.getDate()) ? "text-red-600" : "text-gray-700"}`}
                    >
                      {date.getDate()}
                    </div>
                  </div>
                </div>
                {timeSlots.map((time) => {
                  const sessions = getSessionsForTimeSlot(date, time);
                  return (
                    <div
                      key={`${date.toISOString()}-${time}`}
                      className={`h-20 border-b border-gray-200 p-1 relative transition-colors duration-150 ${
                        isToday(date.getDate())
                          ? "bg-red-50 hover:bg-red-100 border-red-200"
                          : "bg-white hover:bg-gray-50 border-gray-100"
                      }`}
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

  const renderMonthView = () => {
    const days = getDaysInMonth(currentDate);
    const monthName = currentDate.toLocaleDateString("en-US", {
      month: "long",
      year: "numeric",
    });

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-1 h-10 bg-gradient-to-b from-red-500 to-red-600 rounded-full"></div>
            <h2 className="text-3xl font-bold text-gray-900">{monthName}</h2>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigateMonth("prev")}
              className="hover:bg-gray-50 border-gray-300"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigateMonth("next")}
              className="hover:bg-gray-50 border-gray-300"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-0 bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200 h-[calc(100vh-12rem)] divide-x divide-gray-300">
          {/* Day headers */}
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
            <div
              key={day}
              className="bg-gradient-to-b from-gray-50 to-gray-100 p-3 text-center text-sm font-semibold text-gray-900 uppercase tracking-wide border-b border-gray-200"
            >
              {day}
            </div>
          ))}

          {/* Calendar days */}
          {days.map((day, index) => (
            <div
              key={index}
              className={`bg-white p-2 border-b border-gray-200 hover:bg-gray-50 transition-colors duration-150 overflow-y-auto ${
                isToday(day)
                  ? "bg-red-50 hover:bg-red-100 ring-2 ring-red-500 ring-opacity-50"
                  : ""
              }`}
            >
              {day && (
                <>
                  <div
                    className={`text-lg font-bold mb-2 text-right ${isToday(day) ? "text-red-600" : "text-gray-900"}`}
                  >
                    {day}
                  </div>
                  <div className="space-y-1">
                    {getSessionsForDay(day).map(renderEvent)}
                  </div>
                </>
              )}
            </div>
          ))}
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
          <header className="border-b border-gray-200 bg-white px-6 py-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <SidebarTrigger />
                <div className="flex items-center gap-3">
                  <div className="w-1 h-8 bg-gradient-to-b from-red-500 to-red-600 rounded-full"></div>
                  <h1 className="text-3xl font-bold text-gray-900">Schedule</h1>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2 bg-gray-100 p-1 rounded-lg">
                  <Button
                    variant={viewMode === "week" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setViewMode("week")}
                    className={
                      viewMode === "week"
                        ? "bg-white shadow-sm text-gray-900 hover:bg-gray-50"
                        : "text-gray-600 hover:text-gray-900 hover:bg-transparent"
                    }
                  >
                    Week
                  </Button>
                  <Button
                    variant={viewMode === "month" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setViewMode("month")}
                    className={
                      viewMode === "month"
                        ? "bg-white shadow-sm text-gray-900 hover:bg-gray-50"
                        : "text-gray-600 hover:text-gray-900 hover:bg-transparent"
                    }
                  >
                    Month
                  </Button>
                </div>
                <Button
                  onClick={() => setIsAddSessionOpen(true)}
                  className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 shadow-md hover:shadow-lg transition-all duration-200"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Session
                </Button>
              </div>
            </div>
          </header>

          <main className="p-4">
            {loading ? (
              <div className="flex items-center justify-center h-[calc(100vh-10rem)]">
                <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
              </div>
            ) : error ? (
              <div className="flex items-center justify-center h-[calc(100vh-10rem)]">
                <div className="text-center text-red-600">
                  <AlertCircle className="h-8 w-8 mx-auto mb-2" />
                  {error}
                </div>
              </div>
            ) : viewMode === "week" ? (
              renderWeekView()
            ) : viewMode === "month" ? (
              renderMonthView()
            ) : null}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
