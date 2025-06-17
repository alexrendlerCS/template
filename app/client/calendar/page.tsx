"use client";

import { useState } from "react";
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
  Calendar,
  List,
  ArrowLeft,
  User,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import Link from "next/link";
import { ClientNavigation } from "@/components/client-navigation";

const mockSessions = [
  {
    id: 1,
    date: "2024-01-15",
    time: "10:00 AM",
    type: "Personal Training",
    status: "confirmed",
  },
  {
    id: 2,
    date: "2024-01-17",
    time: "2:00 PM",
    type: "Strength Training",
    status: "confirmed",
  },
  {
    id: 3,
    date: "2024-01-19",
    time: "11:00 AM",
    type: "Cardio Session",
    status: "confirmed",
  },
  {
    id: 4,
    date: "2024-01-22",
    time: "9:00 AM",
    type: "Personal Training",
    status: "pending",
  },
  {
    id: 5,
    date: "2024-01-24",
    time: "3:00 PM",
    type: "Flexibility Training",
    status: "confirmed",
  },
  {
    id: 6,
    date: "2024-01-26",
    time: "10:30 AM",
    type: "Strength Training",
    status: "confirmed",
  },
];

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
  const [currentDate, setCurrentDate] = useState(new Date(2024, 0, 1)); // January 2024

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
    return mockSessions.filter((session) => session.date === dateStr);
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
                <Calendar className="h-4 w-4 mr-2" />
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
        {viewMode === "calendar" ? (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-2xl">
                  {months[currentDate.getMonth()]} {currentDate.getFullYear()}
                </CardTitle>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigateMonth("prev")}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigateMonth("next")}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <CardDescription>
                Your training sessions and appointments
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-7 gap-1 mb-4">
                {daysOfWeek.map((day) => (
                  <div
                    key={day}
                    className="p-2 text-center font-medium text-gray-600 text-sm"
                  >
                    {day}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-1">
                {days.map((day, index) => {
                  const sessions = getSessionsForDate(day);
                  const isToday =
                    day &&
                    currentDate.getFullYear() === new Date().getFullYear() &&
                    currentDate.getMonth() === new Date().getMonth() &&
                    day === new Date().getDate();

                  return (
                    <div
                      key={index}
                      className={`min-h-[100px] p-2 border border-gray-200 ${
                        day ? "bg-white hover:bg-gray-50" : "bg-gray-50"
                      } ${isToday ? "ring-2 ring-red-600" : ""}`}
                    >
                      {day && (
                        <>
                          <div
                            className={`text-sm font-medium mb-1 ${
                              isToday ? "text-red-600" : "text-gray-900"
                            }`}
                          >
                            {day}
                          </div>
                          <div className="space-y-1">
                            {sessions.map((session) => (
                              <div
                                key={session.id}
                                className={`text-xs p-1 rounded cursor-pointer ${
                                  session.status === "confirmed"
                                    ? "bg-red-100 text-red-800 hover:bg-red-200"
                                    : "bg-yellow-100 text-yellow-800 hover:bg-yellow-200"
                                }`}
                              >
                                <div className="font-medium">
                                  {session.time}
                                </div>
                                <div className="truncate">{session.type}</div>
                              </div>
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Upcoming Sessions</CardTitle>
                <CardDescription>
                  All your scheduled training sessions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {mockSessions.map((session) => (
                    <div
                      key={session.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                    >
                      <div className="flex items-center space-x-4">
                        <div className="text-center">
                          <p className="font-medium text-red-600">
                            {session.time}
                          </p>
                          <p className="text-sm text-gray-500">
                            {new Date(session.date).toLocaleDateString(
                              "en-US",
                              {
                                month: "short",
                                day: "numeric",
                              }
                            )}
                          </p>
                        </div>
                        <div>
                          <p className="font-medium">{session.type}</p>
                          <div className="flex items-center space-x-2 text-sm text-gray-500">
                            <User className="h-4 w-4" />
                            <span>with John Doe</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <Badge
                          variant={
                            session.status === "confirmed"
                              ? "default"
                              : "secondary"
                          }
                          className={
                            session.status === "confirmed"
                              ? "bg-green-100 text-green-800"
                              : ""
                          }
                        >
                          {session.status === "confirmed"
                            ? "Confirmed"
                            : "Pending"}
                        </Badge>
                        <Button size="sm" variant="outline">
                          Reschedule
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardContent className="p-6 text-center">
                  <div className="text-2xl font-bold text-red-600 mb-2">6</div>
                  <p className="text-sm text-gray-600">Sessions This Month</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6 text-center">
                  <div className="text-2xl font-bold text-green-600 mb-2">
                    4
                  </div>
                  <p className="text-sm text-gray-600">Completed Sessions</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6 text-center">
                  <div className="text-2xl font-bold text-blue-600 mb-2">2</div>
                  <p className="text-sm text-gray-600">Upcoming Sessions</p>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
