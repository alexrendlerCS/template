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
  start: {
    dateTime: string;
  };
  status: string;
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

  const weekDates = getWeekDates(currentDate);

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
        <div className="flex-1">
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
                <Dialog
                  open={isAddSessionOpen}
                  onOpenChange={setIsAddSessionOpen}
                >
                  <DialogTrigger asChild>
                    <Button className="bg-red-600 hover:bg-red-700">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Session
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Schedule New Session</DialogTitle>
                      <DialogDescription>
                        Add a new training session to your calendar
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label>Client</Label>
                        <Select>
                          <SelectTrigger>
                            <SelectValue placeholder="Select client" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="sarah">Sarah Johnson</SelectItem>
                            <SelectItem value="mike">Mike Chen</SelectItem>
                            <SelectItem value="emma">Emma Davis</SelectItem>
                            <SelectItem value="james">James Wilson</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Date</Label>
                          <Input type="date" />
                        </div>
                        <div className="space-y-2">
                          <Label>Time</Label>
                          <Select>
                            <SelectTrigger>
                              <SelectValue placeholder="Select time" />
                            </SelectTrigger>
                            <SelectContent>
                              {timeSlots.map((time) => (
                                <SelectItem key={time} value={time}>
                                  {time}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Session Type</Label>
                        <Select>
                          <SelectTrigger>
                            <SelectValue placeholder="Select session type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="personal">
                              Personal Training
                            </SelectItem>
                            <SelectItem value="strength">
                              Strength Training
                            </SelectItem>
                            <SelectItem value="cardio">
                              Cardio Session
                            </SelectItem>
                            <SelectItem value="flexibility">
                              Flexibility Training
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <Button className="w-full bg-red-600 hover:bg-red-700">
                        Schedule Session
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </header>

          <main className="p-6">
            <Card>
              <CardHeader className="pb-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigateWeek("prev")}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <CardTitle className="text-xl">
                      Week of {weekDates[0].toLocaleDateString()} -{" "}
                      {weekDates[6].toLocaleDateString()}
                    </CardTitle>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigateWeek("next")}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex items-center space-x-4">
                    <Select
                      value={selectedClient}
                      onValueChange={setSelectedClient}
                    >
                      <SelectTrigger className="w-48">
                        <SelectValue placeholder="Filter by client" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Clients</SelectItem>
                        <SelectItem value="sarah">Sarah Johnson</SelectItem>
                        <SelectItem value="mike">Mike Chen</SelectItem>
                        <SelectItem value="emma">Emma Davis</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {loading ? (
                  <div className="flex justify-center items-center h-96">
                    <Loader2 className="h-8 w-8 animate-spin text-red-600" />
                  </div>
                ) : error ? (
                  <div className="text-center text-red-600 py-8">{error}</div>
                ) : (
                  <div className="border-t mt-4">
                    {/* Calendar Header */}
                    <div className="grid grid-cols-8 border-b">
                      <div className="p-4 border-r font-medium text-gray-500 text-sm">
                        Time
                      </div>
                      {weekDates.map((date, index) => (
                        <div key={index} className="p-4 border-r text-center">
                          <div className="font-medium text-gray-900">
                            {daysOfWeek[index]}
                          </div>
                          <div className="text-sm text-gray-500">
                            {date.getDate()}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Time Slots */}
                    {timeSlots.map((time) => (
                      <div key={time} className="grid grid-cols-8 border-b">
                        <div className="p-4 border-r bg-gray-50 text-sm text-gray-500">
                          {time}
                        </div>
                        {weekDates.map((date, dayIndex) => {
                          const sessions = getSessionsForTimeSlot(date, time);
                          return (
                            <div
                              key={`${date}-${time}`}
                              className="p-2 border-r min-h-[80px] relative"
                            >
                              {sessions.map((session) => (
                                <div
                                  key={session.id}
                                  className={`absolute inset-x-1 p-2 rounded text-xs ${
                                    session.status === "confirmed"
                                      ? "bg-red-100 text-red-800"
                                      : "bg-yellow-100 text-yellow-800"
                                  }`}
                                >
                                  <div className="font-medium">
                                    {session.summary}
                                  </div>
                                </div>
                              ))}
                            </div>
                          );
                        })}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
