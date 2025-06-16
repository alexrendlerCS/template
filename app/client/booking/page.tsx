"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Calendar, Clock, ArrowLeft, CheckCircle } from "lucide-react"
import Link from "next/link"
import { ClientNavigation } from "@/components/client-navigation"

const mockAvailableSlots = [
  { date: "2024-01-15", slots: ["9:00 AM", "10:00 AM", "2:00 PM", "4:00 PM"] },
  { date: "2024-01-16", slots: ["10:00 AM", "11:00 AM", "3:00 PM"] },
  { date: "2024-01-17", slots: ["9:00 AM", "1:00 PM", "2:00 PM", "5:00 PM"] },
  { date: "2024-01-18", slots: ["8:00 AM", "10:00 AM", "3:00 PM"] },
  { date: "2024-01-19", slots: ["9:00 AM", "11:00 AM", "2:00 PM", "4:00 PM"] },
]

const sessionTypes = [
  { id: "personal", name: "Personal Training", duration: "60 min", description: "One-on-one focused training" },
  { id: "strength", name: "Strength Training", duration: "45 min", description: "Build muscle and power" },
  { id: "cardio", name: "Cardio Session", duration: "30 min", description: "Improve cardiovascular health" },
  { id: "flexibility", name: "Flexibility & Mobility", duration: "45 min", description: "Enhance range of motion" },
]

export default function BookingPage() {
  const [selectedType, setSelectedType] = useState("")
  const [selectedDate, setSelectedDate] = useState("")
  const [selectedTime, setSelectedTime] = useState("")

  const handleBooking = () => {
    // Mock booking logic
    alert(`Session booked: ${selectedType} on ${selectedDate} at ${selectedTime}`)
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
              <h1 className="text-xl font-bold text-gray-900">Book a Session</h1>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {/* Session Type Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <span className="bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">
                  1
                </span>
                <span>Choose Session Type</span>
              </CardTitle>
              <CardDescription>Select the type of training session you'd like to book</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {sessionTypes.map((type) => (
                  <div
                    key={type.id}
                    className={`p-4 border rounded-lg cursor-pointer transition-all ${
                      selectedType === type.id ? "border-red-600 bg-red-50" : "border-gray-200 hover:border-gray-300"
                    }`}
                    onClick={() => setSelectedType(type.id)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-medium">{type.name}</h3>
                      <Badge variant="outline">{type.duration}</Badge>
                    </div>
                    <p className="text-sm text-gray-600">{type.description}</p>
                    {selectedType === type.id && <CheckCircle className="h-5 w-5 text-red-600 mt-2" />}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Date Selection */}
          <Card className={selectedType ? "" : "opacity-50 pointer-events-none"}>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <span
                  className={`rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold ${
                    selectedType ? "bg-red-600 text-white" : "bg-gray-300 text-gray-600"
                  }`}
                >
                  2
                </span>
                <span>Select Date & Time</span>
              </CardTitle>
              <CardDescription>Choose your preferred date and time slot</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {mockAvailableSlots.map((day) => (
                  <div key={day.date}>
                    <h4 className="font-medium mb-3 flex items-center space-x-2">
                      <Calendar className="h-4 w-4 text-red-600" />
                      <span>
                        {new Date(day.date).toLocaleDateString("en-US", {
                          weekday: "long",
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </span>
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {day.slots.map((time) => (
                        <Button
                          key={`${day.date}-${time}`}
                          variant={selectedDate === day.date && selectedTime === time ? "default" : "outline"}
                          className={`${
                            selectedDate === day.date && selectedTime === time ? "bg-red-600 hover:bg-red-700" : ""
                          }`}
                          onClick={() => {
                            setSelectedDate(day.date)
                            setSelectedTime(time)
                          }}
                        >
                          <Clock className="h-4 w-4 mr-2" />
                          {time}
                        </Button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Booking Summary */}
          <Card className={selectedType && selectedDate && selectedTime ? "" : "opacity-50 pointer-events-none"}>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <span
                  className={`rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold ${
                    selectedType && selectedDate && selectedTime ? "bg-red-600 text-white" : "bg-gray-300 text-gray-600"
                  }`}
                >
                  3
                </span>
                <span>Confirm Booking</span>
              </CardTitle>
              <CardDescription>Review your session details</CardDescription>
            </CardHeader>
            <CardContent>
              {selectedType && selectedDate && selectedTime && (
                <div className="space-y-4">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-medium mb-3">Booking Summary</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Session Type:</span>
                        <span className="font-medium">{sessionTypes.find((t) => t.id === selectedType)?.name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Duration:</span>
                        <span className="font-medium">{sessionTypes.find((t) => t.id === selectedType)?.duration}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Date:</span>
                        <span className="font-medium">
                          {new Date(selectedDate).toLocaleDateString("en-US", {
                            weekday: "long",
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Time:</span>
                        <span className="font-medium">{selectedTime}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Trainer:</span>
                        <span className="font-medium">John Doe</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-blue-50 p-4 rounded-lg">
                    <p className="text-sm text-blue-800">
                      <strong>Note:</strong> This session will use 1 credit from your current package. You have 8
                      sessions remaining.
                    </p>
                  </div>

                  <Button onClick={handleBooking} className="w-full bg-red-600 hover:bg-red-700" size="lg">
                    Confirm Booking
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Integration Placeholder */}
          <Card className="border-dashed border-2 border-gray-300">
            <CardContent className="p-6 text-center">
              <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="font-medium text-gray-900 mb-2">Google Calendar Integration</h3>
              <p className="text-gray-600 mb-4">
                Connect your Google Calendar to automatically sync your training sessions
              </p>
              <Button variant="outline" disabled>
                Connect Google Calendar (Coming Soon)
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
