"use client"

import { useState } from "react"
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { TrainerSidebar } from "@/components/trainer-sidebar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { MessageSquare, Search, Send, Reply } from "lucide-react"

const mockMessages = [
  {
    id: 1,
    clientName: "Sarah Johnson",
    clientAvatar: "/placeholder.svg?height=40&width=40",
    subject: "Question about tomorrow's session",
    preview: "Hi John, I wanted to ask about the workout plan for tomorrow...",
    date: "2024-01-14",
    time: "2:30 PM",
    unread: true,
    replies: 2,
    lastReply: "2024-01-14 3:45 PM",
    priority: "normal",
  },
  {
    id: 2,
    clientName: "Mike Chen",
    clientAvatar: "/placeholder.svg?height=40&width=40",
    subject: "Nutrition advice needed",
    preview: "Could you recommend some post-workout meals that would help with...",
    date: "2024-01-12",
    time: "10:15 AM",
    unread: false,
    replies: 4,
    lastReply: "2024-01-13 9:20 AM",
    priority: "normal",
  },
  {
    id: 3,
    clientName: "Emma Davis",
    clientAvatar: "/placeholder.svg?height=40&width=40",
    subject: "Schedule change request",
    preview: "I need to reschedule my Friday session due to a work conflict...",
    date: "2024-01-10",
    time: "4:20 PM",
    unread: false,
    replies: 1,
    lastReply: "2024-01-10 5:15 PM",
    priority: "high",
  },
  {
    id: 4,
    clientName: "James Wilson",
    clientAvatar: "/placeholder.svg?height=40&width=40",
    subject: "Payment confirmation",
    preview: "Just wanted to confirm that my payment went through for the new package...",
    date: "2024-01-09",
    time: "1:45 PM",
    unread: true,
    replies: 0,
    lastReply: null,
    priority: "normal",
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

export default function TrainerMessagesPage() {
  const [selectedMessage, setSelectedMessage] = useState<number | null>(null)
  const [replyText, setReplyText] = useState("")
  const [filterStatus, setFilterStatus] = useState<"all" | "unread" | "replied">("all")
  const [searchTerm, setSearchTerm] = useState("")

  const filteredMessages = mockMessages.filter((message) => {
    const matchesSearch =
      message.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      message.subject.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesFilter =
      filterStatus === "all" ||
      (filterStatus === "unread" && message.unread) ||
      (filterStatus === "replied" && message.replies > 0)

    return matchesSearch && matchesFilter
  })

  const selectedConversation = selectedMessage ? mockMessages.find((m) => m.id === selectedMessage) : null
  const unreadCount = mockMessages.filter((m) => m.unread).length

  const handleSendReply = () => {
    if (replyText.trim()) {
      // Mock sending reply
      console.log("Sending reply:", replyText)
      setReplyText("")
    }
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
                <h1 className="text-2xl font-bold text-gray-900">Messages</h1>
                {unreadCount > 0 && <Badge className="bg-red-600">{unreadCount} unread</Badge>}
              </div>
            </div>
          </header>

          <main className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Message List */}
              <div className="lg:col-span-1">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <MessageSquare className="h-5 w-5 text-red-600" />
                      <span>Client Messages</span>
                    </CardTitle>
                    <CardDescription>Manage conversations with your clients</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Search and Filter */}
                    <div className="space-y-3">
                      <div className="relative">
                        <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <Input
                          placeholder="Search messages..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="pl-10"
                        />
                      </div>
                      <Select value={filterStatus} onValueChange={(value: any) => setFilterStatus(value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Filter messages" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Messages</SelectItem>
                          <SelectItem value="unread">Unread Only</SelectItem>
                          <SelectItem value="replied">With Replies</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Message List */}
                    <div className="space-y-2 max-h-[600px] overflow-y-auto">
                      {filteredMessages.map((message) => (
                        <div
                          key={message.id}
                          className={`p-3 cursor-pointer border rounded-lg hover:bg-gray-50 transition-colors ${
                            selectedMessage === message.id ? "bg-red-50 border-red-200" : ""
                          }`}
                          onClick={() => setSelectedMessage(message.id)}
                        >
                          <div className="flex items-start space-x-3">
                            <Avatar className="h-10 w-10">
                              <AvatarImage src={message.clientAvatar || "/placeholder.svg"} />
                              <AvatarFallback className="bg-red-600 text-white text-sm">
                                {message.clientName
                                  .split(" ")
                                  .map((n) => n[0])
                                  .join("")}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between mb-1">
                                <h4
                                  className={`font-medium text-sm truncate ${
                                    message.unread ? "text-gray-900" : "text-gray-700"
                                  }`}
                                >
                                  {message.clientName}
                                </h4>
                                <div className="flex items-center space-x-1">
                                  {message.unread && <div className="w-2 h-2 bg-red-600 rounded-full"></div>}
                                  {message.priority === "high" && (
                                    <Badge variant="destructive" className="text-xs">
                                      High
                                    </Badge>
                                  )}
                                </div>
                              </div>
                              <p className="text-sm font-medium text-gray-900 mb-1 truncate">{message.subject}</p>
                              <p className="text-xs text-gray-600 line-clamp-2 mb-2">{message.preview}</p>
                              <div className="flex items-center justify-between text-xs text-gray-500">
                                <span>{message.date}</span>
                                {message.replies > 0 && (
                                  <Badge variant="outline" className="text-xs">
                                    {message.replies} replies
                                  </Badge>
                                )}
                              </div>
                            </div>
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
                  <Card className="h-[700px] flex flex-col">
                    <CardHeader className="border-b">
                      <div className="flex items-center space-x-3">
                        <Avatar>
                          <AvatarImage src={selectedConversation.clientAvatar || "/placeholder.svg"} />
                          <AvatarFallback className="bg-red-600 text-white">
                            {selectedConversation.clientName
                              .split(" ")
                              .map((n) => n[0])
                              .join("")}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <CardTitle className="text-lg">{selectedConversation.subject}</CardTitle>
                          <CardDescription>Conversation with {selectedConversation.clientName}</CardDescription>
                        </div>
                        {selectedConversation.priority === "high" && <Badge variant="destructive">High Priority</Badge>}
                      </div>
                    </CardHeader>

                    <CardContent className="flex-1 overflow-y-auto p-4">
                      <div className="space-y-4">
                        {mockConversation.map((msg) => (
                          <div
                            key={msg.id}
                            className={`flex ${msg.sender === "trainer" ? "justify-end" : "justify-start"}`}
                          >
                            <div
                              className={`max-w-xs lg:max-w-md px-4 py-3 rounded-lg ${
                                msg.sender === "trainer" ? "bg-red-600 text-white" : "bg-gray-100 text-gray-900"
                              }`}
                            >
                              <p className="text-sm">{msg.message}</p>
                              <p
                                className={`text-xs mt-2 ${
                                  msg.sender === "trainer" ? "text-red-100" : "text-gray-500"
                                }`}
                              >
                                {msg.timestamp}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>

                    <div className="border-t p-4">
                      <div className="space-y-3">
                        <Textarea
                          placeholder="Type your reply..."
                          value={replyText}
                          onChange={(e) => setReplyText(e.target.value)}
                          rows={3}
                        />
                        <div className="flex justify-between items-center">
                          <div className="flex space-x-2">
                            <Button variant="outline" size="sm">
                              <Reply className="h-4 w-4 mr-1" />
                              Quick Reply
                            </Button>
                          </div>
                          <Button
                            onClick={handleSendReply}
                            className="bg-red-600 hover:bg-red-700"
                            disabled={!replyText.trim()}
                          >
                            <Send className="h-4 w-4 mr-2" />
                            Send Reply
                          </Button>
                        </div>
                      </div>
                    </div>
                  </Card>
                ) : (
                  <Card className="h-[700px] flex items-center justify-center">
                    <div className="text-center">
                      <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">Select a conversation</h3>
                      <p className="text-gray-600">Choose a message from the list to view the conversation</p>
                    </div>
                  </Card>
                )}
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-8">
              <Card>
                <CardContent className="p-6 text-center">
                  <div className="text-2xl font-bold text-red-600 mb-2">{unreadCount}</div>
                  <p className="text-sm text-gray-600">Unread Messages</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6 text-center">
                  <div className="text-2xl font-bold text-blue-600 mb-2">
                    {mockMessages.filter((m) => m.replies > 0).length}
                  </div>
                  <p className="text-sm text-gray-600">Active Conversations</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6 text-center">
                  <div className="text-2xl font-bold text-green-600 mb-2">
                    {mockMessages.reduce((sum, m) => sum + m.replies, 0)}
                  </div>
                  <p className="text-sm text-gray-600">Total Replies</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6 text-center">
                  <div className="text-2xl font-bold text-purple-600 mb-2">
                    {mockMessages.filter((m) => m.priority === "high").length}
                  </div>
                  <p className="text-sm text-gray-600">High Priority</p>
                </CardContent>
              </Card>
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  )
}
