"use client"

import { useState } from "react"
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { TrainerSidebar } from "@/components/trainer-sidebar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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
import { Users, Search, Plus, Mail, Phone, Calendar, DollarSign, MoreHorizontal, MessageSquare } from "lucide-react"

const mockClients = [
  {
    id: 1,
    name: "Sarah Johnson",
    email: "sarah@email.com",
    phone: "+1 (555) 123-4567",
    sessionsRemaining: 8,
    totalSessions: 24,
    lastSession: "2024-01-12",
    nextSession: "2024-01-15 10:00",
    status: "active",
    joinDate: "2023-12-01",
    totalSpent: 1440,
    avatar: "/placeholder.svg?height=40&width=40",
  },
  {
    id: 2,
    name: "Mike Chen",
    email: "mike@email.com",
    phone: "+1 (555) 234-5678",
    sessionsRemaining: 3,
    totalSessions: 15,
    lastSession: "2024-01-10",
    nextSession: "2024-01-16 14:00",
    status: "active",
    joinDate: "2023-11-15",
    totalSpent: 900,
    avatar: "/placeholder.svg?height=40&width=40",
  },
  {
    id: 3,
    name: "Emma Davis",
    email: "emma@email.com",
    phone: "+1 (555) 345-6789",
    sessionsRemaining: 0,
    totalSessions: 12,
    lastSession: "2024-01-08",
    nextSession: null,
    status: "payment_due",
    joinDate: "2023-10-20",
    totalSpent: 720,
    avatar: "/placeholder.svg?height=40&width=40",
  },
  {
    id: 4,
    name: "James Wilson",
    email: "james@email.com",
    phone: "+1 (555) 456-7890",
    sessionsRemaining: 12,
    totalSessions: 18,
    lastSession: "2024-01-11",
    nextSession: "2024-01-18 09:00",
    status: "active",
    joinDate: "2023-09-10",
    totalSpent: 1080,
    avatar: "/placeholder.svg?height=40&width=40",
  },
  {
    id: 5,
    name: "Lisa Rodriguez",
    email: "lisa@email.com",
    phone: "+1 (555) 567-8901",
    sessionsRemaining: 5,
    totalSessions: 30,
    lastSession: "2024-01-13",
    nextSession: "2024-01-17 11:00",
    status: "active",
    joinDate: "2023-08-05",
    totalSpent: 1800,
    avatar: "/placeholder.svg?height=40&width=40",
  },
]

export default function TrainerClientsPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "payment_due">("all")

  const filteredClients = mockClients.filter((client) => {
    const matchesSearch =
      client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.email.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus = statusFilter === "all" || client.status === statusFilter

    return matchesSearch && matchesStatus
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800"
      case "payment_due":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case "active":
        return "Active"
      case "payment_due":
        return "Payment Due"
      default:
        return "Unknown"
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
                <h1 className="text-2xl font-bold text-gray-900">Clients</h1>
              </div>
              <Dialog>
                <DialogTrigger asChild>
                  <Button className="bg-red-600 hover:bg-red-700">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Client
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add New Client</DialogTitle>
                    <DialogDescription>Add a new client to your training roster</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">First Name</label>
                        <Input placeholder="John" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Last Name</label>
                        <Input placeholder="Doe" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Email</label>
                      <Input type="email" placeholder="john@email.com" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Phone</label>
                      <Input placeholder="+1 (555) 123-4567" />
                    </div>
                    <Button className="w-full bg-red-600 hover:bg-red-700">Add Client</Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </header>

          <main className="p-6">
            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Total Clients</p>
                      <p className="text-2xl font-bold">{mockClients.length}</p>
                    </div>
                    <Users className="h-8 w-8 text-red-600" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Active Clients</p>
                      <p className="text-2xl font-bold">{mockClients.filter((c) => c.status === "active").length}</p>
                    </div>
                    <Users className="h-8 w-8 text-green-600" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Payment Due</p>
                      <p className="text-2xl font-bold">
                        {mockClients.filter((c) => c.status === "payment_due").length}
                      </p>
                    </div>
                    <DollarSign className="h-8 w-8 text-red-600" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                      <p className="text-2xl font-bold">
                        ${mockClients.reduce((sum, c) => sum + c.totalSpent, 0).toLocaleString()}
                      </p>
                    </div>
                    <DollarSign className="h-8 w-8 text-green-600" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Filters and Search */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Client Management</CardTitle>
                <CardDescription>Search and filter your clients</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search clients by name or email..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant={statusFilter === "all" ? "default" : "outline"}
                      onClick={() => setStatusFilter("all")}
                      className={statusFilter === "all" ? "bg-red-600 hover:bg-red-700" : ""}
                    >
                      All
                    </Button>
                    <Button
                      variant={statusFilter === "active" ? "default" : "outline"}
                      onClick={() => setStatusFilter("active")}
                      className={statusFilter === "active" ? "bg-red-600 hover:bg-red-700" : ""}
                    >
                      Active
                    </Button>
                    <Button
                      variant={statusFilter === "payment_due" ? "default" : "outline"}
                      onClick={() => setStatusFilter("payment_due")}
                      className={statusFilter === "payment_due" ? "bg-red-600 hover:bg-red-700" : ""}
                    >
                      Payment Due
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Client List */}
            <Card>
              <CardHeader>
                <CardTitle>Clients ({filteredClients.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {filteredClients.map((client) => (
                    <div
                      key={client.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center space-x-4">
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={client.avatar || "/placeholder.svg"} />
                          <AvatarFallback className="bg-red-600 text-white">
                            {client.name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h3 className="font-medium text-lg">{client.name}</h3>
                          <div className="flex items-center space-x-4 text-sm text-gray-500">
                            <div className="flex items-center space-x-1">
                              <Mail className="h-4 w-4" />
                              <span>{client.email}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Phone className="h-4 w-4" />
                              <span>{client.phone}</span>
                            </div>
                          </div>
                          <div className="flex items-center space-x-4 text-sm text-gray-500 mt-1">
                            <span>Joined: {new Date(client.joinDate).toLocaleDateString()}</span>
                            <span>Total spent: ${client.totalSpent}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-6">
                        <div className="text-center">
                          <p className="text-sm text-gray-500">Sessions</p>
                          <p className="font-medium">
                            {client.sessionsRemaining}/{client.totalSessions}
                          </p>
                        </div>
                        <div className="text-center">
                          <p className="text-sm text-gray-500">Last Session</p>
                          <p className="font-medium">{new Date(client.lastSession).toLocaleDateString()}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-sm text-gray-500">Next Session</p>
                          <p className="font-medium">
                            {client.nextSession ? new Date(client.nextSession).toLocaleDateString() : "Not scheduled"}
                          </p>
                        </div>
                        <div className="flex items-center space-x-3">
                          <Badge className={getStatusColor(client.status)}>{getStatusText(client.status)}</Badge>
                          <div className="flex space-x-1">
                            <Button size="sm" variant="outline">
                              <MessageSquare className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="outline">
                              <Calendar className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="outline">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </main>
        </div>
      </div>
    </SidebarProvider>
  )
}
