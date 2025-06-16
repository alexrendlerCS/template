"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { MessageSquare, Plus, ArrowLeft, Send, Bot } from "lucide-react"
import Link from "next/link"
import { ClientNavigation } from "@/components/client-navigation"

const mockMessages = [
  {
    id: 1,
    subject: "Question about tomorrow's session",
    preview: "Hi John, I wanted to ask about the workout plan for tomorrow...",
    date: "2024-01-14",
    time: "2:30 PM",
    unread: true,
    replies: 2,
    lastReply: "2024-01-14 3:45 PM",
  },
  {
    id: 2,
    subject: "Nutrition advice needed",
    preview: "Could you recommend some post-workout meals that would help with...",
    date: "2024-01-12",
    time: "10:15 AM",
    unread: false,
    replies: 4,
    lastReply: "2024-01-13 9:20 AM",
  },
  {
    id: 3,
    subject: "Schedule change request",
    preview: "I need to reschedule my Friday session due to a work conflict...",
    date: "2024-01-10",
    time: "4:20 PM",
    unread: false,
    replies: 1,
    lastReply: "2024-01-10 5:15 PM",
  },
]

const mockConversation = [
  {
    id: 1,
    sender: "client",
    message:
      "Hi John, I wanted to ask about the workout plan for tomorrow. Should I focus more on cardio or strength training?",
    timestamp: "2024-01-14 2:30 PM",
  },
  {
    id: 2,
    sender: "trainer",
    message:
      "Hi Sarah! Great question. Based on your current progress, I'd recommend focusing on strength training tomorrow. We'll work on your upper body routine.",
    timestamp: "2024-01-14 3:15 PM",
  },
  {
    id: 3,
    sender: "client",
    message: "Perfect! Should I do any warm-up exercises before our session?",
    timestamp: "2024-01-14 3:45 PM",
  },
]

export default function ClientMessagesPage() {
  const [selectedMessage, setSelectedMessage] = useState<number | null>(null)
  const [newMessage, setNewMessage] = useState("")
  const [isNewMessageOpen, setIsNewMessageOpen] = useState(false)

  const selectedConversation = selectedMessage ? mockMessages.find((m) => m.id === selectedMessage) : null

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
              <h1 className="text-xl font-bold text-gray-900">Messages</h1>
            </div>
            <Dialog open={isNewMessageOpen} onOpenChange={setIsNewMessageOpen}>
              <DialogTrigger asChild>
                <Button className="bg-red-600 hover:bg-red-700">
                  <Plus className="h-4 w-4 mr-2" />
                  New Message
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>New Message</DialogTitle>
                  <DialogDescription>Send a message to your trainer</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="subject">Subject</Label>
                    <Input id="subject" placeholder="Enter message subject" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="message">Message</Label>
                    <Textarea id="message" placeholder="Type your message here..." rows={4} />
                  </div>
                  <Button className="w-full bg-red-600 hover:bg-red-700">
                    <Send className="h-4 w-4 mr-2" />
                    Send Message
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Message List */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <MessageSquare className="h-5 w-5 text-red-600" />
                  <span>Conversations</span>
                </CardTitle>
                <CardDescription>Your messages with John Doe</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="space-y-1">
                  {mockMessages.map((message) => (
                    <div
                      key={message.id}
                      className={`p-4 cursor-pointer border-b hover:bg-gray-50 transition-colors ${
                        selectedMessage === message.id ? "bg-red-50 border-l-4 border-l-red-600" : ""
                      }`}
                      onClick={() => setSelectedMessage(message.id)}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h4 className={`font-medium text-sm ${message.unread ? "text-gray-900" : "text-gray-700"}`}>
                          {message.subject}
                        </h4>
                        {message.unread && <div className="w-2 h-2 bg-red-600 rounded-full"></div>}
                      </div>
                      <p className="text-sm text-gray-600 line-clamp-2 mb-2">{message.preview}</p>
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>{message.date}</span>
                        <Badge variant="outline" className="text-xs">
                          {message.replies} replies
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Conversation View */}
          <div className="lg:col-span-2">
            {selectedConversation ? (
              <Card className="h-[600px] flex flex-col">
                <CardHeader className="border-b">
                  <div className="flex items-center space-x-3">
                    <Avatar>
                      <AvatarImage src="/placeholder.svg?height=40&width=40" />
                      <AvatarFallback className="bg-red-600 text-white">JD</AvatarFallback>
                    </Avatar>
                    <div>
                      <CardTitle className="text-lg">{selectedConversation.subject}</CardTitle>
                      <CardDescription>Conversation with John Doe</CardDescription>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="flex-1 overflow-y-auto p-4">
                  <div className="space-y-4">
                    {mockConversation.map((msg) => (
                      <div key={msg.id} className={`flex ${msg.sender === "client" ? "justify-end" : "justify-start"}`}>
                        <div
                          className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                            msg.sender === "client" ? "bg-red-600 text-white" : "bg-gray-100 text-gray-900"
                          }`}
                        >
                          <p className="text-sm">{msg.message}</p>
                          <p className={`text-xs mt-1 ${msg.sender === "client" ? "text-red-100" : "text-gray-500"}`}>
                            {msg.timestamp}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>

                <div className="border-t p-4">
                  <div className="flex space-x-2">
                    <Input
                      placeholder="Type your message..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      className="flex-1"
                    />
                    <Button className="bg-red-600 hover:bg-red-700">
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>

                  {/* AI Assistant Placeholder */}
                  <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="flex items-center space-x-2 mb-2">
                      <Bot className="h-4 w-4 text-blue-600" />
                      <span className="text-sm font-medium text-blue-800">AI Quick Replies (Coming Soon)</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button size="sm" variant="outline" disabled className="text-xs">
                        "Thanks for the advice!"
                      </Button>
                      <Button size="sm" variant="outline" disabled className="text-xs">
                        "Can we reschedule?"
                      </Button>
                      <Button size="sm" variant="outline" disabled className="text-xs">
                        "I have a question about..."
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            ) : (
              <Card className="h-[600px] flex items-center justify-center">
                <div className="text-center">
                  <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Select a conversation</h3>
                  <p className="text-gray-600">Choose a message from the list to view the conversation</p>
                </div>
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
