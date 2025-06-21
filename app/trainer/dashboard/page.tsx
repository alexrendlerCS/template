"use client";

import { useState, useEffect } from "react";
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
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Calendar,
  Search,
  DollarSign,
  Users,
  Clock,
  CheckCircle,
  QrCode,
  CreditCard,
  BarChart3,
} from "lucide-react";
import { ContractFlowModal } from "@/components/ContractFlowModal";
import GoogleCalendarPopup from "@/components/GoogleCalendarPopup";
import { createClient } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";

const mockClients = [
  {
    id: 1,
    name: "Sarah Johnson",
    email: "sarah@email.com",
    sessions: 8,
    nextSession: "2024-01-15 10:00",
    status: "active",
  },
  {
    id: 2,
    name: "Mike Chen",
    email: "mike@email.com",
    sessions: 3,
    nextSession: "2024-01-16 14:00",
    status: "active",
  },
  {
    id: 3,
    name: "Emma Davis",
    email: "emma@email.com",
    sessions: 0,
    nextSession: null,
    status: "payment_due",
  },
];

const mockSessions = [
  {
    id: 1,
    client: "Sarah Johnson",
    time: "10:00 AM",
    date: "2024-01-15",
    type: "Personal Training",
    status: "scheduled",
  },
  {
    id: 2,
    client: "Mike Chen",
    time: "2:00 PM",
    date: "2024-01-16",
    type: "Strength Training",
    status: "scheduled",
  },
  {
    id: 3,
    client: "Emma Davis",
    time: "11:00 AM",
    date: "2024-01-17",
    type: "Cardio Session",
    status: "pending_payment",
  },
];

const mockPayments = [
  {
    id: 1,
    client: "Sarah Johnson",
    amount: 240,
    date: "2024-01-10",
    sessions: 4,
    status: "completed",
  },
  {
    id: 2,
    client: "Mike Chen",
    amount: 180,
    date: "2024-01-12",
    sessions: 3,
    status: "completed",
  },
];

interface ModalProps {
  onAccept?: () => Promise<void>;
  onOpenChange?: (open: boolean) => void;
  open?: boolean;
}

export default function TrainerDashboard() {
  const [searchTerm, setSearchTerm] = useState("");
  const [showContractModal, setShowContractModal] = useState(false);
  const [showCalendarPopup, setShowCalendarPopup] = useState(false);
  const [userStatus, setUserStatus] = useState({
    contractAccepted: false,
    googleConnected: false,
  });
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    const checkUserStatus = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session?.user) {
          router.push("/login");
          return;
        }

        const { data: userData } = await supabase
          .from("users")
          .select("contract_accepted, google_calendar_connected")
          .eq("id", session.user.id)
          .single();

        if (userData) {
          const contractAccepted = userData.contract_accepted || false;
          const googleConnected = userData.google_calendar_connected || false;

          setUserStatus({
            contractAccepted,
            googleConnected,
          });

          // Show contract modal immediately if contract not accepted
          if (!contractAccepted) {
            setShowContractModal(true);
          }
          // Show calendar popup if contract accepted but Google not connected
          else if (!googleConnected) {
            setShowCalendarPopup(true);
          }
        }
      } catch (error) {
        console.error("Error checking user status:", error);
      }
    };

    checkUserStatus();
  }, []);

  // Prevent rendering dashboard content until contract is accepted
  if (!userStatus.contractAccepted && showContractModal) {
    return (
      <ContractFlowModal
        open={showContractModal}
        onOpenChange={(open) => {
          setShowContractModal(open);
          if (!open) {
            // If they try to close without accepting, redirect to login
            router.push("/login");
          }
        }}
        onComplete={async () => {
          setUserStatus((prev) => ({ ...prev, contractAccepted: true }));
          await router.refresh();
          setShowContractModal(false);
          // Show calendar popup after contract is accepted
          if (!userStatus.googleConnected) {
            setShowCalendarPopup(true);
          }
        }}
      />
    );
  }

  const filteredClients = mockClients.filter(
    (client) =>
      client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <TrainerSidebar />
        <div className="flex-1">
          <header className="border-b bg-white px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <SidebarTrigger />
                <h1 className="text-2xl font-bold text-gray-900">
                  Trainer Dashboard
                </h1>
              </div>
              <div className="flex items-center space-x-4">
                <Avatar>
                  <AvatarImage src="/placeholder.svg?height=40&width=40" />
                  <AvatarFallback className="bg-red-600 text-white">
                    JD
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium text-gray-900">John Doe</p>
                  <p className="text-sm text-gray-500">Certified Trainer</p>
                </div>
              </div>
            </div>
          </header>

          <main className="p-6 space-y-6">
            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Total Clients
                  </CardTitle>
                  <Users className="h-4 w-4 text-red-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">12</div>
                  <p className="text-xs text-muted-foreground">
                    +2 from last month
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Today's Sessions
                  </CardTitle>
                  <Clock className="h-4 w-4 text-red-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">5</div>
                  <p className="text-xs text-muted-foreground">
                    3 completed, 2 upcoming
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Monthly Sessions
                  </CardTitle>
                  <BarChart3 className="h-4 w-4 text-red-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">18</div>
                  <p className="text-xs text-muted-foreground">
                    +3 from last month
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Monthly Revenue
                  </CardTitle>
                  <DollarSign className="h-4 w-4 text-red-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">$3,240</div>
                  <p className="text-xs text-muted-foreground">
                    +12% from last month
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Pending Payments
                  </CardTitle>
                  <CreditCard className="h-4 w-4 text-red-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">$420</div>
                  <p className="text-xs text-muted-foreground">2 clients</p>
                </CardContent>
              </Card>
            </div>

            {/* Today's Schedule */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Calendar className="h-5 w-5 text-red-600" />
                  <span>Today's Schedule</span>
                </CardTitle>
                <CardDescription>
                  Manage your sessions for today
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {mockSessions.map((session) => (
                    <div
                      key={session.id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="flex items-center space-x-4">
                        <div className="text-center">
                          <p className="font-medium">{session.time}</p>
                          <p className="text-sm text-gray-500">
                            {session.date}
                          </p>
                        </div>
                        <div>
                          <p className="font-medium">{session.client}</p>
                          <p className="text-sm text-gray-500">
                            {session.type}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge
                          variant={
                            session.status === "scheduled"
                              ? "default"
                              : "destructive"
                          }
                        >
                          {session.status === "scheduled"
                            ? "Scheduled"
                            : "Payment Due"}
                        </Badge>
                        {session.status === "scheduled" && (
                          <Button
                            size="sm"
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Complete
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Client Management */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Users className="h-5 w-5 text-red-600" />
                    <span>Client Management</span>
                  </CardTitle>
                  <CardDescription>
                    Search and manage your clients
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="relative">
                      <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        placeholder="Search clients..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                    <div className="space-y-3">
                      {filteredClients.map((client) => (
                        <div
                          key={client.id}
                          className="flex items-center justify-between p-3 border rounded-lg"
                        >
                          <div>
                            <p className="font-medium">{client.name}</p>
                            <p className="text-sm text-gray-500">
                              {client.email}
                            </p>
                            <p className="text-sm text-gray-500">
                              {client.sessions} sessions remaining
                            </p>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Badge
                              variant={
                                client.status === "active"
                                  ? "default"
                                  : "destructive"
                              }
                            >
                              {client.status === "active"
                                ? "Active"
                                : "Payment Due"}
                            </Badge>
                            {client.status === "payment_due" && (
                              <Button size="sm" variant="outline">
                                <QrCode className="h-4 w-4 mr-1" />
                                Send Payment
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Recent Payments */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <DollarSign className="h-5 w-5 text-red-600" />
                    <span>Recent Payments</span>
                  </CardTitle>
                  <CardDescription>
                    Track your recent transactions
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {mockPayments.map((payment) => (
                      <div
                        key={payment.id}
                        className="flex items-center justify-between p-3 border rounded-lg"
                      >
                        <div>
                          <p className="font-medium">{payment.client}</p>
                          <p className="text-sm text-gray-500">
                            {payment.sessions} sessions
                          </p>
                          <p className="text-sm text-gray-500">
                            {payment.date}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-green-600">
                            ${payment.amount}
                          </p>
                          <Badge
                            variant="default"
                            className="bg-green-100 text-green-800"
                          >
                            Completed
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                  <Button variant="outline" className="w-full mt-4">
                    View All Payments
                  </Button>
                </CardContent>
              </Card>
            </div>
          </main>
        </div>

        {/* Modals */}
        <ContractFlowModal
          open={showContractModal}
          onOpenChange={(open) => {
            setShowContractModal(open);
            if (!open && !userStatus.contractAccepted) {
              router.push("/login");
            }
          }}
          onComplete={async () => {
            setUserStatus((prev) => ({ ...prev, contractAccepted: true }));
            setShowContractModal(false);
            if (!userStatus.googleConnected) {
              setShowCalendarPopup(true);
            }
          }}
        />

        <GoogleCalendarPopup
          open={showCalendarPopup}
          onOpenChange={(open) => {
            setShowCalendarPopup(open);
            if (!open) {
              setUserStatus((prev) => ({ ...prev, googleConnected: true }));
            }
          }}
        />
      </div>
    </SidebarProvider>
  );
}
