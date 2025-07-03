"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { TrainerSidebar } from "@/components/trainer-sidebar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Users,
  Search,
  Plus,
  Mail,
  Phone,
  Calendar,
  DollarSign,
  MoreHorizontal,
  MessageSquare,
  Loader2,
} from "lucide-react";
import { createClient } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import { startOfMonth } from "date-fns";

// Interface for real client data
interface Client {
  id: string;
  full_name: string;
  email: string;
  avatar_url: string | null;
  google_account_connected: boolean;
  contract_accepted: boolean;
  created_at: string;
}

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
];

export default function TrainerClientsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "active" | "no_upcoming" | "new_this_month"
  >("all");
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();
  const router = useRouter();
  const [clientsWithNoUpcoming, setClientsWithNoUpcoming] = useState<number>(0);
  const [newClientsThisMonth, setNewClientsThisMonth] = useState<number>(0);
  const sessionsDataRef = useRef<any[]>([]);

  // Fetch clients data
  const fetchClients = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Get current trainer's session
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.user) {
        router.push("/login");
        return;
      }

      // Fetch all clients with their info
      const { data: clientsData, error: clientsError } = await supabase
        .from("users")
        .select(
          `
          id,
          full_name,
          email,
          avatar_url,
          google_account_connected,
          contract_accepted,
          created_at
        `
        )
        .eq("role", "client")
        .order("created_at", { ascending: false });

      if (clientsError) {
        console.error("Error fetching clients:", clientsError);
        setError("Failed to fetch clients");
        return;
      }

      // Process avatar URLs for each client
      const processedClients = await Promise.all(
        (clientsData || []).map(async (client) => {
          let avatarUrl = client.avatar_url;
          if (avatarUrl) {
            const { data: publicUrl } = supabase.storage
              .from("avatars")
              .getPublicUrl(avatarUrl);
            avatarUrl = publicUrl.publicUrl;
          }

          return {
            ...client,
            avatar_url: avatarUrl,
          };
        })
      );

      setClients(processedClients);

      // New Clients This Month
      const now = new Date();
      const monthStart = startOfMonth(now);
      setNewClientsThisMonth(
        processedClients.filter((c) => new Date(c.created_at) >= monthStart)
          .length
      );

      // Clients With No Upcoming Sessions
      // Fetch all sessions for this trainer
      console.log(
        "[DEBUG] Client IDs:",
        processedClients.map((c) => c.id)
      );
      const { data: sessionsData, error: sessionsError } = await supabase
        .from("sessions")
        .select("id, client_id, date")
        .eq("trainer_id", session.user.id);
      console.log("[DEBUG] sessionsData:", sessionsData);
      if (sessionsError) {
        setClientsWithNoUpcoming(0);
      } else {
        const today = new Date().toISOString().slice(0, 10);
        console.log("[DEBUG] Today:", today);
        // Map client_id to array of future sessions
        const clientFutureSessions: Record<string, boolean> = {};
        for (const c of processedClients) clientFutureSessions[c.id] = false;
        (sessionsData || []).forEach((s) => {
          if (s.date >= today) clientFutureSessions[s.client_id] = true;
        });
        console.log("[DEBUG] clientFutureSessions:", clientFutureSessions);
        const noUpcomingCount = Object.values(clientFutureSessions).filter(
          (v) => !v
        ).length;
        console.log(
          "[DEBUG] Clients With No Upcoming Sessions:",
          noUpcomingCount
        );
        setClientsWithNoUpcoming(noUpcomingCount);
      }

      sessionsDataRef.current = sessionsData || [];
    } catch (error) {
      console.error("Error in fetchClients:", error);
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  }, [supabase, router]);

  // Fetch clients on component mount
  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  // Filter clients based on search and status
  const filteredClients = clients.filter((client) => {
    const matchesSearch =
      client.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.email.toLowerCase().includes(searchTerm.toLowerCase());

    let matchesStatus = true;
    if (statusFilter === "active") {
      matchesStatus = client.google_account_connected;
    } else if (statusFilter === "no_upcoming") {
      matchesStatus = !clientHasUpcomingSession(client.id);
    } else if (statusFilter === "new_this_month") {
      const now = new Date();
      const monthStart = startOfMonth(now);
      matchesStatus = new Date(client.created_at) >= monthStart;
    }

    return matchesSearch && matchesStatus;
  });

  // Helper to check if a client has an upcoming session
  function clientHasUpcomingSession(clientId: string) {
    // Use the same logic as the stat card
    if (!sessionsDataRef.current) return false;
    const today = new Date().toISOString().slice(0, 10);
    return sessionsDataRef.current.some(
      (s) => s.client_id === clientId && s.date >= today
    );
  }

  const getStatusColor = (client: Client) => {
    if (client.sessions_remaining === 0) {
      return "bg-red-100 text-red-800";
    } else if (client.google_account_connected) {
      return "bg-green-100 text-green-800";
    } else {
      return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusText = (client: Client) => {
    if (client.sessions_remaining === 0) {
      return "Payment Due";
    } else if (client.google_account_connected) {
      return "Active";
    } else {
      return "Inactive";
    }
  };

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
                    <DialogDescription>
                      Add a new client to your training roster
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">
                          First Name
                        </label>
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
                    <Button className="w-full bg-red-600 hover:bg-red-700">
                      Add Client
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </header>

          <main className="p-6">
            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-4 gap-6 mb-8">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">
                        Total Clients
                      </p>
                      <p className="text-2xl font-bold">
                        {loading ? (
                          <Loader2 className="h-6 w-6 animate-spin" />
                        ) : (
                          clients.length
                        )}
                      </p>
                    </div>
                    <Users className="h-8 w-8 text-red-600" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">
                        Active Clients
                      </p>
                      <p className="text-2xl font-bold">
                        {loading ? (
                          <Loader2 className="h-6 w-6 animate-spin" />
                        ) : (
                          clients.filter((c) => c.google_account_connected)
                            .length
                        )}
                      </p>
                    </div>
                    <Users className="h-8 w-8 text-green-600" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">
                        New Clients This Month
                      </p>
                      <p className="text-2xl font-bold">
                        {loading ? (
                          <Loader2 className="h-6 w-6 animate-spin" />
                        ) : (
                          newClientsThisMonth
                        )}
                      </p>
                    </div>
                    <Users className="h-8 w-8 text-blue-600" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">
                        Clients With No Upcoming Sessions
                      </p>
                      <p className="text-2xl font-bold">
                        {loading ? (
                          <Loader2 className="h-6 w-6 animate-spin" />
                        ) : (
                          clientsWithNoUpcoming
                        )}
                      </p>
                    </div>
                    <Users className="h-8 w-8 text-gray-600" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Filters and Search */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Client Management</CardTitle>
                <CardDescription>
                  Search and filter your clients
                </CardDescription>
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
                      className={
                        statusFilter === "all"
                          ? "bg-red-600 hover:bg-red-700"
                          : ""
                      }
                    >
                      All
                    </Button>
                    <Button
                      variant={
                        statusFilter === "active" ? "default" : "outline"
                      }
                      onClick={() => setStatusFilter("active")}
                      className={
                        statusFilter === "active"
                          ? "bg-red-600 hover:bg-red-700"
                          : ""
                      }
                    >
                      Active
                    </Button>
                    <Button
                      variant={
                        statusFilter === "no_upcoming" ? "default" : "outline"
                      }
                      onClick={() => setStatusFilter("no_upcoming")}
                      className={
                        statusFilter === "no_upcoming"
                          ? "bg-red-600 hover:bg-red-700"
                          : ""
                      }
                    >
                      No Upcoming Sessions
                    </Button>
                    <Button
                      variant={
                        statusFilter === "new_this_month"
                          ? "default"
                          : "outline"
                      }
                      onClick={() => setStatusFilter("new_this_month")}
                      className={
                        statusFilter === "new_this_month"
                          ? "bg-red-600 hover:bg-red-700"
                          : ""
                      }
                    >
                      New This Month
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
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-red-600" />
                    <span className="ml-2 text-gray-600">
                      Loading clients...
                    </span>
                  </div>
                ) : error ? (
                  <div className="text-center py-8">
                    <p className="text-red-600 mb-4">{error}</p>
                    <Button onClick={fetchClients} variant="outline">
                      Try Again
                    </Button>
                  </div>
                ) : filteredClients.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-600">No clients found</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredClients.map((client) => (
                      <div
                        key={client.id}
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-center space-x-4">
                          <Avatar className="h-12 w-12">
                            <AvatarImage
                              src={client.avatar_url || "/placeholder-user.jpg"}
                              alt={client.full_name}
                            />
                            <AvatarFallback className="bg-red-600 text-white">
                              {client.full_name
                                .split(" ")
                                .map((n) => n[0])
                                .join("")}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <h3 className="font-medium text-lg">
                              {client.full_name}
                            </h3>
                            <div className="flex items-center space-x-4 text-sm text-gray-500">
                              <div className="flex items-center space-x-1">
                                <Mail className="h-4 w-4" />
                                <span>{client.email}</span>
                              </div>
                            </div>
                            <div className="flex items-center space-x-4 text-sm text-gray-500 mt-1">
                              <span>
                                Joined:{" "}
                                {new Date(
                                  client.created_at
                                ).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-6">
                          <Badge className={getStatusColor(client)}>
                            {getStatusText(client)}
                          </Badge>
                          <div className="flex space-x-1">
                            <Button size="sm" variant="outline">
                              <MessageSquare className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="outline">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
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
