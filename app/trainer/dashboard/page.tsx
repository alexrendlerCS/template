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
  const [totalClients, setTotalClients] = useState<number | null>(null);
  const [clientsThisMonth, setClientsThisMonth] = useState<number>(0);
  const [clientsLastMonth, setClientsLastMonth] = useState<number>(0);
  const [todaysSessions, setTodaysSessions] = useState<any[]>([]);
  const [completedSessions, setCompletedSessions] = useState<number>(0);
  const [upcomingSessions, setUpcomingSessions] = useState<number>(0);
  const [trainerId, setTrainerId] = useState<string | null>(null);
  const [sessionsThisMonth, setSessionsThisMonth] = useState<number>(0);
  const [sessionsLastMonth, setSessionsLastMonth] = useState<number>(0);
  const [revenueThisMonth, setRevenueThisMonth] = useState<number>(0);
  const [revenueLastMonth, setRevenueLastMonth] = useState<number>(0);
  const [pendingPaymentsCount, setPendingPaymentsCount] = useState<number>(0);
  const [pendingPaymentsAmount, setPendingPaymentsAmount] = useState<number>(0);

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

  useEffect(() => {
    // Fetch total clients from users table
    async function fetchTotalClients() {
      console.log("[DEBUG] Fetching total clients from users table...");
      const { data, error, count } = await supabase
        .from("users")
        .select("*", { count: "exact" })
        .eq("role", "client");
      console.log("[DEBUG] Supabase response:", { data, error, count });
      if (error) {
        console.error("[DEBUG] Error fetching total clients:", error);
        setTotalClients(null);
      } else {
        setTotalClients(count ?? (data ? data.length : 0));
        console.log(
          "[DEBUG] Set totalClients to:",
          count ?? (data ? data.length : 0)
        );
      }
    }
    fetchTotalClients();

    // Fetch client growth for this and last month
    async function fetchClientGrowth() {
      const now = new Date();
      const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const startOfLastMonth = new Date(
        now.getFullYear(),
        now.getMonth() - 1,
        1
      );
      const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

      // This month
      const { count: thisMonthCount, error: thisMonthError } = await supabase
        .from("users")
        .select("*", { count: "exact" })
        .eq("role", "client")
        .gte("created_at", startOfThisMonth.toISOString());
      if (thisMonthError) {
        console.error(
          "[DEBUG] Error fetching this month clients:",
          thisMonthError
        );
        setClientsThisMonth(0);
      } else {
        setClientsThisMonth(thisMonthCount ?? 0);
      }

      // Last month
      const { count: lastMonthCount, error: lastMonthError } = await supabase
        .from("users")
        .select("*", { count: "exact" })
        .eq("role", "client")
        .gte("created_at", startOfLastMonth.toISOString())
        .lte("created_at", endOfLastMonth.toISOString());
      if (lastMonthError) {
        console.error(
          "[DEBUG] Error fetching last month clients:",
          lastMonthError
        );
        setClientsLastMonth(0);
      } else {
        setClientsLastMonth(lastMonthCount ?? 0);
      }
    }
    fetchClientGrowth();

    // Fetch today's sessions for this trainer
    async function fetchTodaysSessions() {
      // Get trainer id from session
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.user) {
        console.log("[DEBUG] No session user found in fetchTodaysSessions");
        return;
      }
      setTrainerId(session.user.id);
      const now = new Date();
      // Use local date instead of UTC to avoid timezone issues
      const todayStr = now.toLocaleDateString("en-CA"); // Returns YYYY-MM-DD format
      console.log(`[DEBUG] Current date/time: ${now}`);
      console.log(
        `[DEBUG] Current timezone offset: ${now.getTimezoneOffset()} minutes`
      );
      console.log(`[DEBUG] Today string: ${todayStr}`);
      console.log(
        `[DEBUG] Fetching sessions for trainer_id: ${session.user.id} on date: ${todayStr}`
      );

      // First, let's see ALL sessions for this trainer to understand the date format
      const { data: allSessions, error: allSessionsError } = await supabase
        .from("sessions")
        .select("*")
        .eq("trainer_id", session.user.id)
        .order("date", { ascending: true });

      if (allSessionsError) {
        console.error("[DEBUG] Error fetching all sessions:", allSessionsError);
      } else {
        console.log(`[DEBUG] All sessions for trainer:`, allSessions);
      }

      // Fetch all sessions for today for this trainer
      const { data: sessions, error } = await supabase
        .from("sessions")
        .select("*")
        .eq("trainer_id", session.user.id)
        .eq("date", todayStr);
      if (error) {
        console.error("[DEBUG] Error fetching today's sessions:", error);
        setTodaysSessions([]);
        setCompletedSessions(0);
        setUpcomingSessions(0);
        return;
      }
      console.log(`[DEBUG] Raw sessions fetched:`, sessions);
      setTodaysSessions(sessions ?? []);
      // Calculate completed and upcoming
      const nowTime = now.getTime();
      let completed = 0;
      let upcoming = 0;
      (sessions ?? []).forEach((s) => {
        // Combine date and end_time to get session end datetime
        const endDateTime = new Date(`${s.date}T${s.end_time}`);
        console.log(
          `[DEBUG] Session id: ${s.id}, date: ${s.date}, end_time: ${s.end_time}, endDateTime: ${endDateTime}, now: ${now}`
        );
        if (endDateTime.getTime() < nowTime) completed++;
        else upcoming++;
      });
      console.log(
        `[DEBUG] Completed sessions: ${completed}, Upcoming sessions: ${upcoming}`
      );
      setCompletedSessions(completed);
      setUpcomingSessions(upcoming);
    }
    fetchTodaysSessions();

    // Fetch monthly sessions for this trainer
    async function fetchMonthlySessions() {
      // Get trainer id from session
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.user) {
        console.log("[DEBUG] No session user found in fetchMonthlySessions");
        return;
      }

      const now = new Date();
      const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const startOfLastMonth = new Date(
        now.getFullYear(),
        now.getMonth() - 1,
        1
      );
      const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
      const endOfThisMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

      console.log(
        `[DEBUG] Fetching monthly sessions for trainer_id: ${session.user.id}`
      );
      console.log(
        `[DEBUG] This month range: ${startOfThisMonth.toLocaleDateString("en-CA")} to ${endOfThisMonth.toLocaleDateString("en-CA")}`
      );
      console.log(
        `[DEBUG] Last month range: ${startOfLastMonth.toLocaleDateString("en-CA")} to ${endOfLastMonth.toLocaleDateString("en-CA")}`
      );
      console.log(`[DEBUG] Current date: ${now.toLocaleDateString("en-CA")}`);
      console.log(
        `[DEBUG] Start of this month: ${startOfThisMonth.toLocaleDateString("en-CA")}`
      );
      console.log(
        `[DEBUG] End of this month: ${endOfThisMonth.toLocaleDateString("en-CA")}`
      );
      console.log(
        `[DEBUG] End of last month: ${endOfLastMonth.toLocaleDateString("en-CA")}`
      );

      // This month sessions
      const { data: thisMonthSessions, error: thisMonthError } = await supabase
        .from("sessions")
        .select("*")
        .eq("trainer_id", session.user.id)
        .gte("date", startOfThisMonth.toLocaleDateString("en-CA"))
        .lte("date", endOfThisMonth.toLocaleDateString("en-CA"));

      if (thisMonthError) {
        console.error(
          "[DEBUG] Error fetching this month sessions:",
          thisMonthError
        );
        setSessionsThisMonth(0);
      } else {
        console.log(`[DEBUG] This month sessions:`, thisMonthSessions);
        console.log(
          `[DEBUG] This month sessions count:`,
          thisMonthSessions?.length ?? 0
        );
        setSessionsThisMonth(thisMonthSessions?.length ?? 0);
      }

      // Last month sessions
      const { data: lastMonthSessions, error: lastMonthError } = await supabase
        .from("sessions")
        .select("*")
        .eq("trainer_id", session.user.id)
        .gte("date", startOfLastMonth.toLocaleDateString("en-CA"))
        .lte("date", endOfLastMonth.toLocaleDateString("en-CA"));

      if (lastMonthError) {
        console.error(
          "[DEBUG] Error fetching last month sessions:",
          lastMonthError
        );
        setSessionsLastMonth(0);
      } else {
        console.log(`[DEBUG] Last month sessions:`, lastMonthSessions);
        setSessionsLastMonth(lastMonthSessions?.length ?? 0);
      }
    }
    fetchMonthlySessions();

    // Fetch monthly revenue for this trainer
    async function fetchMonthlyRevenue() {
      // Get trainer id from session
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.user) {
        console.log("[DEBUG] No session user found in fetchMonthlyRevenue");
        return;
      }

      const now = new Date();
      const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const startOfLastMonth = new Date(
        now.getFullYear(),
        now.getMonth() - 1,
        1
      );
      const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
      const endOfThisMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

      console.log(
        `[DEBUG] Fetching monthly revenue for trainer_id: ${session.user.id}`
      );
      console.log(
        `[DEBUG] Revenue this month range: ${startOfThisMonth.toLocaleDateString("en-CA")} to ${endOfThisMonth.toLocaleDateString("en-CA")}`
      );
      console.log(
        `[DEBUG] Revenue last month range: ${startOfLastMonth.toLocaleDateString("en-CA")} to ${endOfLastMonth.toLocaleDateString("en-CA")}`
      );

      // Debug: First, let's see ALL payments to verify we can access the table
      const { data: allPayments, error: allPaymentsError } = await supabase
        .from("payments")
        .select("*");

      if (allPaymentsError) {
        console.error("[DEBUG] Error fetching all payments:", allPaymentsError);
      } else {
        console.log(`[DEBUG] All payments in table:`, allPayments);
        console.log(`[DEBUG] Total payments count:`, allPayments?.length || 0);
        if (allPayments && allPayments.length > 0) {
          console.log(
            `[DEBUG] Sample payment paid_at:`,
            allPayments[0].paid_at
          );
          console.log(`[DEBUG] Sample payment status:`, allPayments[0].status);
        }
      }

      // Helper to format date as YYYY-MM-DD HH:mm:ss
      function formatDateWithTime(date: Date, isEndOfDay = false) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");

        if (isEndOfDay) {
          return `${year}-${month}-${day} 23:59:59`;
        } else {
          return `${year}-${month}-${day} 00:00:00`;
        }
      }

      // This month revenue
      const thisMonthStart = formatDateWithTime(startOfThisMonth);
      const thisMonthEnd = formatDateWithTime(endOfThisMonth, true);
      console.log(
        `[DEBUG] Querying payments with: .gte("paid_at", "${thisMonthStart}") .lte("paid_at", "${thisMonthEnd}") .eq("status", "completed")`
      );

      const { data: thisMonthPayments, error: thisMonthError } = await supabase
        .from("payments")
        .select("amount")
        .gte("paid_at", thisMonthStart)
        .lte("paid_at", thisMonthEnd)
        .eq("status", "completed");

      if (thisMonthError) {
        console.error(
          "[DEBUG] Error fetching this month payments:",
          thisMonthError
        );
        setRevenueThisMonth(0);
      } else {
        console.log(
          `[DEBUG] This month payments raw response:`,
          thisMonthPayments
        );
        console.log(
          `[DEBUG] This month payments count:`,
          thisMonthPayments?.length || 0
        );

        if (thisMonthPayments && thisMonthPayments.length > 0) {
          console.log(
            `[DEBUG] Individual payment amounts:`,
            thisMonthPayments.map((p) => ({
              amount: p.amount,
              parsed: parseFloat(p.amount || 0),
            }))
          );
        }

        const totalThisMonth = (thisMonthPayments || []).reduce(
          (sum, payment) => {
            const parsedAmount = parseFloat(payment.amount || 0);
            console.log(
              `[DEBUG] Adding payment amount: ${payment.amount} -> parsed: ${parsedAmount}, running sum: ${sum + parsedAmount}`
            );
            return sum + parsedAmount;
          },
          0
        );
        console.log(`[DEBUG] This month revenue total: $${totalThisMonth}`);
        setRevenueThisMonth(totalThisMonth);
      }

      // Last month revenue
      const lastMonthStart = formatDateWithTime(startOfLastMonth);
      const lastMonthEnd = formatDateWithTime(endOfLastMonth, true);
      console.log(
        `[DEBUG] Querying last month payments with: .gte("paid_at", "${lastMonthStart}") .lte("paid_at", "${lastMonthEnd}") .eq("status", "completed")`
      );

      const { data: lastMonthPayments, error: lastMonthError } = await supabase
        .from("payments")
        .select("amount")
        .gte("paid_at", lastMonthStart)
        .lte("paid_at", lastMonthEnd)
        .eq("status", "completed");

      if (lastMonthError) {
        console.error(
          "[DEBUG] Error fetching last month payments:",
          lastMonthError
        );
        setRevenueLastMonth(0);
      } else {
        console.log(
          `[DEBUG] Last month payments raw response:`,
          lastMonthPayments
        );
        console.log(
          `[DEBUG] Last month payments count:`,
          lastMonthPayments?.length || 0
        );

        if (lastMonthPayments && lastMonthPayments.length > 0) {
          console.log(
            `[DEBUG] Individual last month payment amounts:`,
            lastMonthPayments.map((p) => ({
              amount: p.amount,
              parsed: parseFloat(p.amount || 0),
            }))
          );
        }

        const totalLastMonth = (lastMonthPayments || []).reduce(
          (sum, payment) => {
            const parsedAmount = parseFloat(payment.amount || 0);
            console.log(
              `[DEBUG] Adding last month payment amount: ${payment.amount} -> parsed: ${parsedAmount}, running sum: ${sum + parsedAmount}`
            );
            return sum + parsedAmount;
          },
          0
        );
        console.log(`[DEBUG] Last month revenue total: $${totalLastMonth}`);
        setRevenueLastMonth(totalLastMonth);
      }
    }
    fetchMonthlyRevenue();

    // Fetch pending payments
    async function fetchPendingPayments() {
      console.log(`[DEBUG] Fetching pending payments...`);

      const { data: pendingPayments, error: pendingError } = await supabase
        .from("payments")
        .select("amount")
        .eq("status", "pending");

      if (pendingError) {
        console.error("[DEBUG] Error fetching pending payments:", pendingError);
        setPendingPaymentsCount(0);
        setPendingPaymentsAmount(0);
      } else {
        console.log(`[DEBUG] Pending payments:`, pendingPayments);
        console.log(
          `[DEBUG] Pending payments count:`,
          pendingPayments?.length || 0
        );

        const totalPendingAmount = (pendingPayments || []).reduce(
          (sum, payment) => {
            const parsedAmount = parseFloat(payment.amount || 0);
            console.log(
              `[DEBUG] Adding pending payment amount: ${payment.amount} -> parsed: ${parsedAmount}, running sum: ${sum + parsedAmount}`
            );
            return sum + parsedAmount;
          },
          0
        );

        console.log(`[DEBUG] Total pending amount: $${totalPendingAmount}`);
        setPendingPaymentsCount(pendingPayments?.length || 0);
        setPendingPaymentsAmount(totalPendingAmount);
      }
    }
    fetchPendingPayments();
  }, [supabase]);

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
                  <div className="text-2xl font-bold">
                    {totalClients !== null ? (
                      totalClients
                    ) : (
                      <span className="text-gray-400">--</span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {clientsThisMonth - clientsLastMonth >= 0 ? "+" : ""}
                    {clientsThisMonth - clientsLastMonth} from last month
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
                  <div className="text-2xl font-bold">
                    {todaysSessions.length}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {completedSessions} completed, {upcomingSessions} upcoming
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
                  <div className="text-2xl font-bold">{sessionsThisMonth}</div>
                  <p className="text-xs text-muted-foreground">
                    {sessionsThisMonth - sessionsLastMonth >= 0 ? "+" : ""}
                    {sessionsThisMonth - sessionsLastMonth} from last month
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
                  <div className="text-2xl font-bold">
                    ${revenueThisMonth.toLocaleString()}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {revenueLastMonth > 0 ? (
                      <>
                        {revenueThisMonth >= revenueLastMonth ? "+" : ""}
                        {Math.round(
                          ((revenueThisMonth - revenueLastMonth) /
                            revenueLastMonth) *
                            100
                        )}
                        % from last month
                      </>
                    ) : (
                      "No revenue last month"
                    )}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Pending Payments
                  </CardTitle>
                  <Clock className="h-4 w-4 text-yellow-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {pendingPaymentsCount}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    ${pendingPaymentsAmount.toLocaleString()} total pending
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Today's Schedule */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Calendar className="h-5 w-5 text-red-600" />
                  <span>Today's Schedule</span>
                  <span className="ml-2 text-xs text-muted-foreground">
                    ({todaysSessions.length} total, {completedSessions}{" "}
                    completed, {upcomingSessions} upcoming)
                  </span>
                </CardTitle>
                <CardDescription>
                  Manage your sessions for today
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {todaysSessions.length === 0 ? (
                    <div className="text-center text-gray-400">
                      No sessions scheduled for today.
                    </div>
                  ) : (
                    todaysSessions.map((session) => (
                      <div
                        key={session.id}
                        className="flex items-center justify-between p-4 border rounded-lg"
                      >
                        <div className="flex items-center space-x-4">
                          <div className="text-center">
                            <p className="font-medium">{session.start_time}</p>
                            <p className="text-sm text-gray-500">
                              {session.date}
                            </p>
                          </div>
                          <div>
                            <p className="font-medium">{session.type}</p>
                            <p className="text-sm text-gray-500">
                              {session.status}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge
                            variant={
                              session.status === "completed"
                                ? "default"
                                : "secondary"
                            }
                          >
                            {session.status.charAt(0).toUpperCase() +
                              session.status.slice(1)}
                          </Badge>
                        </div>
                      </div>
                    ))
                  )}
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
