"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Calendar as CalendarIcon,
  List,
  ArrowLeft,
  User,
  ChevronLeft,
  ChevronRight,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import { ClientNavigation } from "@/components/client-navigation";

interface GoogleEvent {
  id: string;
  summary: string;
  start: {
    dateTime: string;
  };
  status: string;
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

// Helper function to get event status color
function getEventStatusColor(status: string) {
  switch (status.toLowerCase()) {
    case "confirmed":
      return "bg-green-100 text-green-800";
    case "tentative":
      return "bg-yellow-100 text-yellow-800";
    case "cancelled":
      return "bg-red-100 text-red-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
}

const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const months = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export default function ClientCalendarPage() {
  const [viewMode, setViewMode] = useState<"calendar" | "list">("calendar");
  const [currentDate, setCurrentDate] = useState(new Date());
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

  const getSessionsForDate = (day: number | null) => {
    if (!day) return [];
    const dateStr = `${currentDate.getFullYear()}-${String(
      currentDate.getMonth() + 1
    ).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

    return events.filter((event) => {
      const eventDate = new Date(event.start.dateTime);
      return eventDate.toISOString().split("T")[0] === dateStr;
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

  const days = getDaysInMonth(currentDate);

  const renderEvent = (event: GoogleEvent) => (
    <div
      key={event.id}
      className="p-2 mb-1 rounded-md border border-gray-200 bg-white shadow-sm"
    >
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-900">{event.summary}</p>
          <p className="text-xs text-gray-500">
            {formatEventTime(event.start.dateTime)}
          </p>
        </div>
        <Badge className={getEventStatusColor(event.status)}>
          {event.status}
        </Badge>
      </div>
    </div>
  );

  if (!isGoogleConnected) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle>Connect Google Calendar</CardTitle>
            <CardDescription>
              To view your training sessions, please connect your Google
              Calendar account.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/client/dashboard">
              <Button className="bg-red-600 hover:bg-red-700">
                Go to Dashboard to Connect
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <ClientNavigation />
              <Link href="/client/dashboard">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Dashboard
                </Button>
              </Link>
              <h1 className="text-xl font-bold text-gray-900">My Calendar</h1>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant={viewMode === "calendar" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("calendar")}
                className={
                  viewMode === "calendar" ? "bg-red-600 hover:bg-red-700" : ""
                }
              >
                <CalendarIcon className="h-4 w-4 mr-2" />
                Calendar
              </Button>
              <Button
                variant={viewMode === "list" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("list")}
                className={
                  viewMode === "list" ? "bg-red-600 hover:bg-red-700" : ""
                }
              >
                <List className="h-4 w-4 mr-2" />
                List
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Calendar View */}
        {viewMode === "calendar" && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xl font-bold">
                  {months[currentDate.getMonth()]} {currentDate.getFullYear()}
                </CardTitle>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => navigateMonth("prev")}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => navigateMonth("next")}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                  </div>
                ) : error ? (
                  <div className="text-center py-8 text-red-600">{error}</div>
                ) : (
                  <div className="grid grid-cols-7 gap-2">
                    {/* Day headers */}
                    {daysOfWeek.map((day) => (
                      <div
                        key={day}
                        className="text-center font-medium text-gray-500 py-2"
                      >
                        {day}
                      </div>
                    ))}
                    {/* Calendar days */}
                    {days.map((day, index) => {
                      const sessions = getSessionsForDate(day);
                      return (
                        <div
                          key={index}
                          className={`min-h-[100px] p-2 border rounded-lg ${
                            day ? "bg-white" : "bg-gray-50"
                          }`}
                        >
                          {day && (
                            <>
                              <div className="font-medium text-gray-900">
                                {day}
                              </div>
                              <div className="space-y-1 mt-1">
                                {sessions.map(renderEvent)}
                              </div>
                            </>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* List View */}
        {viewMode === "list" && (
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <Card>
              <CardHeader>
                <CardTitle>
                  {months[currentDate.getMonth()]} {currentDate.getFullYear()}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                  </div>
                ) : error ? (
                  <div className="text-center py-8 text-red-600">{error}</div>
                ) : events.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    No training sessions scheduled for this month
                  </div>
                ) : (
                  <div className="space-y-4">{events.map(renderEvent)}</div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
}
