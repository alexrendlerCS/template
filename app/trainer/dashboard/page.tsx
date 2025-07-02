"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
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
import GoogleCalendarSuccessDialog from "@/components/GoogleCalendarSuccessDialog";
import { GoogleCalendarBanner } from "@/components/GoogleCalendarBanner";
import { createClient } from "@/lib/supabaseClient";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "@/components/ui/use-toast";

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

// Add URL parameter handler component
function URLParamHandler({
  onSuccess,
  onError,
}: {
  onSuccess: (calendarName: string) => void;
  onError: (error: string) => void;
}) {
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    // Only run once on mount
    const success = searchParams.get("success");
    const error = searchParams.get("error");
    const calendarNameParam = searchParams.get("calendarName");

    if (success === "true" && calendarNameParam) {
      onSuccess(decodeURIComponent(calendarNameParam));
      // Use router.replace instead of window.history for better Next.js integration
      router.replace(window.location.pathname);
    } else if (error) {
      console.error("OAuth error:", error);
      onError(decodeURIComponent(error));
      router.replace(window.location.pathname);
    }
  }, []); // Empty dependency array since we only want this to run once on mount

  return null;
}

// Add Google Calendar section component
function GoogleCalendarSection({
  isConnected,
  onConnect,
}: {
  isConnected: boolean;
  onConnect: () => void;
}) {
  if (isConnected) {
    return (
      <div className="flex items-center space-x-2">
        <CheckCircle className="h-5 w-5 text-green-500" />
        <span className="text-sm text-muted-foreground">
          Google Calendar connected
        </span>
      </div>
    );
  }

  return (
    <Button
      variant="outline"
      size="sm"
      className="flex items-center space-x-2"
      onClick={onConnect}
    >
      <Calendar className="h-4 w-4" />
      <span>Connect Google Calendar</span>
    </Button>
  );
}

export default function TrainerDashboard() {
  console.log("Trainer Dashboard - Component Mounted");

  const [searchTerm, setSearchTerm] = useState("");
  const [showContractModal, setShowContractModal] = useState(false);
  const [showGooglePopup, setShowGooglePopup] = useState(false);
  const [showGoogleSuccess, setShowGoogleSuccess] = useState(false);
  const [userStatus, setUserStatus] = useState({
    contractAccepted: false,
    googleConnected: false,
    userName: "",
    avatarUrl: null as string | null,
  });
  const supabase = createClient();
  const router = useRouter();

  // Add OAuth success and error handlers
  const handleOAuthSuccess = useCallback((calendarName: string) => {
    setShowGoogleSuccess(true);
    setUserStatus((prev) => ({ ...prev, googleConnected: true }));
  }, []);

  const handleOAuthError = useCallback((error: string) => {
    toast({
      title: "Error",
      description: error,
      variant: "destructive",
    });
  }, []);

  const checkUserStatus = useCallback(async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.user) {
        console.log("No session found, redirecting to login");
        router.push("/login");
        return;
      }

      console.log("Checking trainer status for user:", session.user.id);

      const { data: userData, error: userError } = await supabase
        .from("users")
        .select(
          "contract_accepted, google_account_connected, full_name, avatar_url, role"
        )
        .eq("id", session.user.id)
        .single();

      if (userError) {
        console.error("Error fetching trainer data:", userError);
        return;
      }

      console.log("Full trainer data:", userData);

      if (userData.role !== "trainer") {
        console.log("Non-trainer accessing trainer dashboard, redirecting");
        router.push("/client/dashboard");
        return;
      }

      if (userData) {
        const contractAccepted = userData.contract_accepted || false;
        const googleConnected = userData.google_account_connected || false;

        console.log("Setting trainer status:", {
          contractAccepted,
          googleConnected,
          userName: userData.full_name || "",
          avatarUrl: userData.avatar_url,
        });

        setUserStatus({
          contractAccepted,
          googleConnected,
          userName: userData.full_name || "",
          avatarUrl: userData.avatar_url,
        });

        if (!contractAccepted) {
          console.log("Showing contract modal - contract not accepted");
          setShowContractModal(true);
        } else if (!googleConnected) {
          console.log("Showing Google popup - Google not connected");
          setShowGooglePopup(true);
        } else {
          console.log("Both contract accepted and Google connected");
        }
      }
    } catch (error) {
      console.error("Error checking trainer status:", error);
    }
  }, [router, supabase]);

  useEffect(() => {
    checkUserStatus();
  }, [checkUserStatus]);

  const handleContractComplete = useCallback(async () => {
    setUserStatus((prev) => ({ ...prev, contractAccepted: true }));
    setShowContractModal(false);
    await router.refresh();
    // Use the callback form to ensure we have the latest state
    setShowGooglePopup(true);
  }, [router]);

  const handleGoogleSuccess = useCallback(() => {
    setUserStatus((prev) => ({ ...prev, googleConnected: true }));
    setShowGooglePopup(false);
    setShowGoogleSuccess(true);
  }, []);

  // Add function to handle calendar connection
  const handleConnectCalendar = useCallback(() => {
    setShowGooglePopup(true);
  }, []);

  // Memoize the filtered clients to prevent unnecessary recalculations
  const filteredClients = useMemo(
    () =>
      mockClients.filter(
        (client) =>
          client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          client.email.toLowerCase().includes(searchTerm.toLowerCase())
      ),
    [searchTerm]
  );

  // Memoize the modals to prevent unnecessary re-renders
  const modals = useMemo(
    () => (
      <>
        <ContractFlowModal
          open={showContractModal}
          onOpenChange={(open) => {
            setShowContractModal(open);
            if (!open) {
              router.push("/login");
            }
          }}
          onComplete={handleContractComplete}
        />

        <GoogleCalendarPopup
          open={showGooglePopup}
          onOpenChange={setShowGooglePopup}
          onSuccess={handleGoogleSuccess}
        />

        <GoogleCalendarSuccessDialog
          open={showGoogleSuccess}
          onOpenChange={setShowGoogleSuccess}
          calendarName="Training Sessions"
        />

        {(showGooglePopup || showGoogleSuccess) && (
          <URLParamHandler
            onSuccess={handleOAuthSuccess}
            onError={handleOAuthError}
          />
        )}
      </>
    ),
    [
      showContractModal,
      showGooglePopup,
      showGoogleSuccess,
      handleContractComplete,
      handleGoogleSuccess,
      handleOAuthSuccess,
      handleOAuthError,
      router,
    ]
  );

  // If contract not accepted, only show the contract modal
  if (!userStatus.contractAccepted) {
    return modals;
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        {modals}
        <TrainerSidebar />
        <div className="flex-1">
          <header className="border-b">
            <div className="flex h-16 items-center px-4 gap-4">
              <SidebarTrigger />
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search clients..."
                    className="pl-8"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
              <GoogleCalendarSection
                isConnected={userStatus.googleConnected}
                onConnect={handleConnectCalendar}
              />
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
      </div>
    </SidebarProvider>
  );
}
