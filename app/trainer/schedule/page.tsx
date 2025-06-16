"use client"

import { useState } from "react"
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { TrainerSidebar } from "@/components/trainer-sidebar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar, Plus, ChevronLeft, ChevronRight, CheckCircle, AlertCircle } from "lucide-react"

const mockSessions = [
  {
    id: 1,
    clientName: "Sarah Johnson",
    date: "2024-01-15",
    time: "10:00",
    duration: 60,
    type: "Personal Training",
    status: "confirmed",
  },
  {
    id: 2,
    clientName: "Mike Chen",
    date: "2024-01-15",
    time: "14:00",
    duration: 45,
    type: "Strength Training",
    status: "confirmed",
  },
  {
    id: 3,
    clientName: "Emma Davis",
    date: "2024-01-16",
    time: "11:00",
    duration: 60,
    type: "Personal Training",
    status: "pending_payment",
  },
  {
    id: 4,
    clientName: "James Wilson",
    date: "2024-01-17",
    time: "09:00",
    duration: 45,
    type: "Cardio Session",
    status: "confirmed",
  },
  {
    id: 5,
    clientName: "Lisa Rodriguez",
    date: "2024-01-17",
    time: "16:00",
    duration: 60,
    type: "Personal Training",
    status: "confirmed",
  },
]

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
]

const daysOfWeek = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]

export default function TrainerSchedulePage() {
  const [viewMode, setViewMode] = useState<"week" | "month">("week")
  const [currentDate, setCurrentDate] = useState(new Date(2024, 0, 15)) // January 15, 2024
  const [selectedClient, setSelectedClient] = useState("")
  const [isAddSessionOpen, setIsAddSessionOpen] = useState(false)

  const getWeekDates = (date: Date) => {
    const week = []
    const startOfWeek = new Date(date)
    const day = startOfWeek.getDay()
    const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1) // Adjust for Monday start
    startOfWeek.setDate(diff)

    for (let i = 0; i < 7; i++) {
      const day = new Date(startOfWeek)
      day.setDate(startOfWeek.getDate() + i)
      week.push(day)
    }
    return week
  }

  const getSessionsForDate = (date: Date) => {
    const dateStr = date.toISOString().split("T")[0]
    return mockSessions.filter((session) => session.date === dateStr)
  }

  const getSessionsForTimeSlot = (date: Date, time: string) => {
    const sessions = getSessionsForDate(date)
    return sessions.filter((session) => session.time === time)
  }

  const navigateWeek = (direction: "prev" | "next") => {
    setCurrentDate((prev) => {
      const newDate = new Date(prev)
      newDate.setDate(prev.getDate() + (direction === "prev" ? -7 : 7))
      return newDate
    })
  }

  const weekDates = getWeekDates(currentDate)

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
                    className={viewMode === "week" ? "bg-red-600 hover:bg-red-700" : ""}
                  >
                    Week
                  </Button>
                  <Button
                    variant={viewMode === "month" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setViewMode("month")}
                    className={viewMode === "month" ? "bg-red-600 hover:bg-red-700" : ""}
                  >
                    Month
                  </Button>
                </div>
                <Dialog open={isAddSessionOpen} onOpenChange={setIsAddSessionOpen}>
                  <DialogTrigger asChild>
                    <Button className="bg-red-600 hover:bg-red-700">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Session
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Schedule New Session</DialogTitle>
                      <DialogDescription>Add a new training session to your calendar</DialogDescription>
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
                            <SelectItem value="personal">Personal Training</SelectItem>
                            <SelectItem value="strength">Strength Training</SelectItem>
                            <SelectItem value="cardio">Cardio Session</SelectItem>
                            <SelectItem value="flexibility">Flexibility Training</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <Button className="w-full bg-red-600 hover:bg-red-700">Schedule Session</Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </header>

          <main className="p-6">
            {/* Calendar Controls */}
            <Card className="mb-6">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <Button variant="outline" size="sm" onClick={() => navigateWeek("prev")}>
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <CardTitle className="text-xl">
                      {viewMode === "week"
                        ? `Week of ${weekDates[0].toLocaleDateString()} - ${weekDates[6].toLocaleDateString()}`
                        : currentDate.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
                    </CardTitle>
                    <Button variant="outline" size="sm" onClick={() => navigateWeek("next")}>
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex items-center space-x-4">
                    <Select value={selectedClient} onValueChange={setSelectedClient}>
                      <SelectTrigger className="w-48">
                        <SelectValue placeholder="Filter by client" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Clients</SelectItem>
                        <SelectItem value="sarah">Sarah Johnson</SelectItem>
                        <SelectItem value="mike">Mike Chen</SelectItem>
                        <SelectItem value="emma">Emma Davis</SelectItem>
                        <SelectItem value="james">James Wilson</SelectItem>
                      </SelectContent>
                    </Select>

                    {/* Google Calendar Sync Status */}
                    <div className="flex items-center space-x-2 px-3 py-2 bg-orange-50 rounded-lg border border-orange-200">
                      <AlertCircle className="h-4 w-4 text-orange-600" />
                      <span className="text-sm text-orange-800">Google Calendar: Not Connected</span>
                      <Button size="sm" variant="outline" className="text-orange-600 border-orange-600">
                        Connect
                      </Button>
                    </div>
                  </div>
                </div>
              </CardHeader>
            </Card>

            {/* Week View Calendar */}
            {viewMode === "week" && (
              <Card>
                <CardContent className="p-0">
                  <div className="grid grid-cols-8 border-b">
                    <div className="p-4 border-r bg-gray-50">
                      <span className="text-sm font-medium text-gray-600">Time</span>
                    </div>
                    {weekDates.map((date, index) => (
                      <div key={index} className="p-4 border-r text-center">
                        <div className="text-sm font-medium text-gray-900">{daysOfWeek[index]}</div>
                        <div className="text-lg font-bold text-gray-700">{date.getDate()}</div>
                      </div>
                    ))}
                  </div>

                  {timeSlots.map((time) => (
                    <div key={time} className="grid grid-cols-8 border-b min-h-[80px]">
                      <div className="p-2 border-r bg-gray-50 flex items-center justify-center">
                        <span className="text-sm font-medium text-gray-600">{time}</span>
                      </div>
                      {weekDates.map((date, dayIndex) => {
                        const sessions = getSessionsForTimeSlot(date, time)
                        return (
                          <div key={dayIndex} className="p-2 border-r relative">
                            {sessions.map((session) => (
                              <div
                                key={session.id}
                                className={`p-2 rounded text-xs cursor-pointer mb-1 ${
                                  session.status === "confirmed"
                                    ? "bg-red-100 text-red-800 hover:bg-red-200"
                                    : "bg-yellow-100 text-yellow-800 hover:bg-yellow-200"
                                }`}
                              >
                                <div className="font-medium">{session.clientName}</div>
                                <div className="text-xs">{session.type}</div>
                                <div className="text-xs">{session.duration}min</div>
                              </div>
                            ))}
                          </div>
                        )
                      })}
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Month View - Simplified */}
            {viewMode === "month" && (
              <Card>
                <CardContent className="p-6">
                  <div className="text-center text-gray-500">
                    <Calendar className="h-12 w-12 mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">Month View</h3>
                    <p>Month view calendar coming soon. Use week view for detailed scheduling.</p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Session Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">This Week</p>
                      <p className="text-2xl font-bold">{mockSessions.length}</p>
                      <p className="text-xs text-gray-500">Total Sessions</p>
                    </div>
                    <Calendar className="h-8 w-8 text-red-600" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Confirmed</p>
                      <p className="text-2xl font-bold text-green-600">
                        {mockSessions.filter((s) => s.status === "confirmed").length}
                      </p>
                      <p className="text-xs text-gray-500">Ready to go</p>
                    </div>
                    <CheckCircle className="h-8 w-8 text-green-600" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Pending Payment</p>
                      <p className="text-2xl font-bold text-yellow-600">
                        {mockSessions.filter((s) => s.status === "pending_payment").length}
                      </p>
                      <p className="text-xs text-gray-500">Need attention</p>
                    </div>
                    <AlertCircle className="h-8 w-8 text-yellow-600" />
                  </div>
                </CardContent>
              </Card>
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  )
}
