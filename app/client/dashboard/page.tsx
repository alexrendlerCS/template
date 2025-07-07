"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { SidebarTrigger } from "@/components/ui/sidebar";
import {
  Calendar,
  CreditCard,
  Clock,
  User,
  CheckCircle,
  AlertCircle,
  Menu,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { DashboardWrapper } from "./DashboardWrapper";
import { useEffect, useState, Suspense } from "react";
import { ContractFlowModal } from "@/components/ContractFlowModal";
import { createClient } from "@/lib/supabaseClient";
import { useRouter, useSearchParams } from "next/navigation";
import GoogleCalendarPopup from "@/components/GoogleCalendarPopup";
import GoogleCalendarSuccessDialog from "@/components/GoogleCalendarSuccessDialog";
import { GoogleCalendarBanner } from "@/components/GoogleCalendarBanner";
import { toast } from "@/components/ui/use-toast";

// Interface for the final processed session
interface Session {
  id: string; // Updated to string since Supabase IDs are UUIDs
  date: string;
  start_time: string;
  type: string;
  trainer_id: string;
  users: {
    full_name: string;
  };
}

// Interface for the raw Supabase response
interface RawSupabaseSession {
  id: string;
  date: string;
  start_time: string;
  type: string;
  trainer_id: string;
  users: {
    full_name: string;
  };
}

interface SupabaseResponse {
  id: string;
  date: string;
  start_time: string;
  type: string;
  trainer_id: string;
  users: Array<{
    full_name: string;
  }>;
}

// Add payment history interface
interface Payment {
  id: string;
  paid_at: string;
  amount: number;
  session_count: number;
  status: string;
}

interface UserStatus {
  contractAccepted: boolean;
  googleConnected: boolean;
  userName: string;
  avatarUrl: string | null;
}

// Add helper functions for date and time formatting
const formatDate = (dateStr: string) => {
  // Create date object and adjust for timezone
  const date = new Date(dateStr);
  date.setMinutes(date.getMinutes() + date.getTimezoneOffset());
  return date.toLocaleDateString();
};

const formatTime = (timeStr: string) => {
  // Parse the time string (expected format: "HH:MM:SS")
  const [hours, minutes] = timeStr.split(":");
  const hour = parseInt(hours, 10);
  const period = hour >= 12 ? "PM" : "AM";
  const formattedHour = hour % 12 || 12; // Convert 0 to 12 for 12 AM
  return `${formattedHour}:${minutes} ${period}`;
};

// Add helper function to format the next session message
const getNextSessionMessage = (sessions: Session[]) => {
  if (!sessions.length) {
    return "You have no upcoming sessions scheduled";
  }

  const nextSession = sessions[0];
  const date = new Date(nextSession.date);
  date.setMinutes(date.getMinutes() + date.getTimezoneOffset());

  // Get relative date description
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const sessionDate = new Date(date);
  sessionDate.setHours(0, 0, 0, 0);

  let dateText;
  const diffDays = Math.round(
    (sessionDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
  );

  switch (diffDays) {
    case 0:
      dateText = "today";
      break;
    case 1:
      dateText = "tomorrow";
      break;
    default:
      dateText = `on ${date.toLocaleDateString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
      })}`;
  }

  return `Your next training session is ${dateText} at ${formatTime(
    nextSession.start_time
  )} with ${nextSession.users.full_name}`;
};

interface PackageTypeCount {
  type: string;
  remaining: number;
  total: number;
}

// Add this helper function at the top with other helper functions
const calculateExpirationDate = (purchaseDate: string) => {
  const purchase = new Date(purchaseDate);
  const nextMonth = new Date(
    purchase.getFullYear(),
    purchase.getMonth() + 1,
    4
  ); // 4th of next month
  return nextMonth;
};

const getDaysUntilExpiration = (expirationDate: Date) => {
  const now = new Date();
  const diffTime = expirationDate.getTime() - now.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

// Create a new component for URL parameter handling
function URLParamHandler({
  onSuccess,
  onError,
}: {
  onSuccess: (calendarName: string) => void;
  onError: (error: string) => void;
}) {
  const searchParams = useSearchParams();

  useEffect(() => {
    const success = searchParams.get("success");
    const error = searchParams.get("error");
    const calendarNameParam = searchParams.get("calendarName");

    if (success === "true") {
      // Show success dialog with calendar name
      if (calendarNameParam) {
        onSuccess(decodeURIComponent(calendarNameParam));
      }

      // Clear URL parameters but keep the history
      setTimeout(() => {
        const newUrl = window.location.pathname;
        window.history.replaceState({}, "", newUrl);
      }, 100);
    } else if (error) {
      console.error("OAuth error:", error);
      onError(decodeURIComponent(error));

      // Clear URL parameters
      const newUrl = window.location.pathname;
      window.history.replaceState({}, "", newUrl);
    }
  }, [searchParams, onSuccess, onError]);

  return null;
}

// Add this component after the interfaces and before the main component
function GoogleCalendarSection({
  isConnected,
  onConnect,
}: {
  isConnected: boolean;
  onConnect: () => void;
}) {
  if (isConnected) return null;

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Calendar className="h-5 w-5 text-red-600" />
          <span>Connect Google Calendar</span>
        </CardTitle>
        <CardDescription>
          Sync your training sessions with Google Calendar
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
          <div className="flex-shrink-0">
            <Image
              src="/placeholder-logo.svg"
              alt="Google Calendar"
              width={48}
              height={48}
              className="rounded"
            />
          </div>
          <div className="flex-grow">
            <h4 className="font-medium mb-1">Never Miss a Session</h4>
            <p className="text-sm text-gray-600">
              Connect your Google Calendar to automatically sync your training
              sessions and receive reminders
            </p>
          </div>
        </div>
        <Button
          onClick={onConnect}
          className="w-full bg-red-600 hover:bg-red-700 text-white"
        >
          <Calendar className="h-4 w-4 mr-2" />
          Connect Google Calendar
        </Button>
      </CardContent>
    </Card>
  );
}

export default function ClientDashboard() {
  const [showCalendarPopup, setShowCalendarPopup] = useState(false);
  const [showContractModal, setShowContractModal] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [calendarName, setCalendarName] = useState("");
  const [loading, setLoading] = useState(true);
  const [userStatus, setUserStatus] = useState<UserStatus>({
    contractAccepted: false,
    googleConnected: false,
    userName: "",
    avatarUrl: null,
  });
  const [upcomingSessions, setUpcomingSessions] = useState<Session[]>([]);
  const [paymentHistory, setPaymentHistory] = useState<Payment[]>([]);
  const [sessionsByType, setSessionsByType] = useState<PackageTypeCount[]>([]);
  const [totalSessionsRemaining, setTotalSessionsRemaining] = useState(0);
  const [totalSessionsUsed, setTotalSessionsUsed] = useState(0);
  const [earliestExpirationDate, setEarliestExpirationDate] =
    useState<Date | null>(null);
  const [isCompletingContract, setIsCompletingContract] = useState(false);
  const supabase = createClient();
  const router = useRouter();

  // Move fetchUpcomingSessions to component scope
  const fetchUpcomingSessions = async (userId: string) => {
    try {
      console.log("Fetching upcoming sessions for user:", userId);
      const { data: rawSessions, error } = await supabase
        .from("sessions")
        .select(
          `
          id,
          date,
          start_time,
          type,
          trainer_id,
          users!sessions_trainer_id_fkey (
            full_name
          )
        `
        )
        .eq("client_id", userId)
        .gte("date", new Date().toISOString().split("T")[0])
        .order("date", { ascending: true })
        .order("start_time", { ascending: true });

      if (error) {
        console.error("Error fetching sessions:", error);
        return;
      }

      console.log("Raw sessions data:", rawSessions);

      const typedSessions =
        (rawSessions as any[])?.map((rawSession) => {
          // Get trainer name from the users array
          const users = Array.isArray(rawSession.users)
            ? rawSession.users
            : [rawSession.users];
          const trainerName = users[0]?.full_name || "Unknown Trainer";

          const session: Session = {
            id: rawSession.id,
            date: rawSession.date,
            start_time: rawSession.start_time,
            type: rawSession.type,
            trainer_id: rawSession.trainer_id,
            users: {
              full_name: trainerName,
            },
          };

          if (rawSession.type === "Partner Training") {
            return {
              ...session,
              trainerId: rawSession.trainer_id,
              usersData: {
                full_name: trainerName,
              },
            };
          }

          return session;
        }) || [];

      console.log("Processed sessions:", typedSessions);
      setUpcomingSessions(typedSessions);
    } catch (error) {
      console.error("Error in fetchUpcomingSessions:", error);
    }
  };

  const handleOAuthSuccess = (calendarName: string) => {
    setCalendarName(calendarName);
    setShowSuccessDialog(true);
    checkUserStatus();
  };

  const handleOAuthError = (error: string) => {
    toast({
      title: "Error",
      description: error,
      variant: "destructive",
    });
    checkUserStatus();
  };

  // Move checkUserStatus to component scope
  const checkUserStatus = async () => {
    setLoading(true);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.user) {
        console.log("No session found, redirecting to login");
        router.push("/login");
        return;
      }

      console.log("Fetching user data for auth ID:", session.user.id);

      // Force cache revalidation by adding nocache parameter
      const { data: userData, error } = await supabase
        .from("users")
        .select(
          "contract_accepted, google_account_connected, full_name, avatar_url"
        )
        .eq("id", session.user.id)
        .single();

      if (error) {
        console.error("Error fetching user data:", error);
        return;
      }

      console.log("User data from Supabase:", userData);

      if (userData) {
        const contractAccepted =
          userData.contract_accepted === null
            ? false
            : userData.contract_accepted;
        const googleConnected =
          userData.google_account_connected === null
            ? false
            : userData.google_account_connected;

        // Get the avatar URL directly from the storage bucket
        let avatarUrl = userData.avatar_url;
        if (avatarUrl) {
          const { data: publicUrl } = supabase.storage
            .from("avatars")
            .getPublicUrl(avatarUrl);
          avatarUrl = publicUrl.publicUrl;
        }

        console.log("Setting user status with:", {
          contractAccepted,
          googleConnected,
          userName: userData.full_name || "Client",
          avatarUrl,
        });

        setUserStatus({
          contractAccepted,
          googleConnected,
          userName: userData.full_name || "Client",
          avatarUrl,
        });

        if (
          userData.contract_accepted === false ||
          userData.contract_accepted === null
        ) {
          console.log("Contract not accepted, showing modal");
          setShowContractModal(true);
          setShowCalendarPopup(false);
          setShowSuccessDialog(false);
        } else if (!googleConnected) {
          console.log(
            "Contract accepted but Google not connected, showing calendar popup"
          );
          setShowContractModal(false);
          setShowCalendarPopup(true);
          setShowSuccessDialog(false);
        } else {
          console.log("Both contract accepted and Google connected");
          setShowContractModal(false);
          setShowCalendarPopup(false);
        }

        // Fetch upcoming sessions after user data is confirmed
        await fetchUpcomingSessions(session.user.id);
      } else {
        console.log("No user data found for auth ID:", session.user.id);
      }
    } catch (error) {
      console.error("Error checking user status:", error);
    } finally {
      setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    checkUserStatus();
  }, []);

  // Add effect to handle cookie-based state updates
  useEffect(() => {
    const checkGoogleConnected = async () => {
      try {
        const response = await fetch("/api/auth/google/status");
        const data = await response.json();

        if (data.connected) {
          // Update local state
          setUserStatus((prev) => ({
            ...prev,
            googleConnected: true,
          }));
        }
      } catch (error) {
        console.error("Failed to check Google connection status:", error);
      }
    };

    // Check status every 5 seconds while calendar popup is shown
    let interval: NodeJS.Timeout;
    if (showCalendarPopup) {
      interval = setInterval(checkGoogleConnected, 5000);
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [showCalendarPopup]);

  // Update fetchPackageInfo to calculate expiration
  useEffect(() => {
    const fetchPackageInfo = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (!session?.user) return;

        const { data: packages, error: packagesError } = await supabase
          .from("packages")
          .select("*")
          .eq("client_id", session.user.id)
          .order("purchase_date", { ascending: false });

        if (packagesError) {
          console.error("Failed to fetch packages:", packagesError);
          return;
        }

        // Group packages by type and calculate remaining sessions
        const packageTypes: Record<string, PackageTypeCount> = {
          "In-Person Training": {
            type: "In-Person Training",
            remaining: 0,
            total: 0,
          },
          "Virtual Training": {
            type: "Virtual Training",
            remaining: 0,
            total: 0,
          },
          "Partner Training": {
            type: "Partner Training",
            remaining: 0,
            total: 0,
          },
        };

        let totalUsed = 0;
        let totalRemaining = 0;
        let earliestExpiration: Date | null = null;

        if (packages && packages.length > 0) {
          packages.forEach((pkg) => {
            const type = pkg.package_type;
            if (packageTypes[type]) {
              const remaining =
                (pkg.sessions_included || 0) - (pkg.sessions_used || 0);
              if (remaining > 0) {
                // Only consider expiration for packages with remaining sessions
                const expiration = calculateExpirationDate(pkg.purchase_date);
                if (!earliestExpiration || expiration < earliestExpiration) {
                  earliestExpiration = expiration;
                }
              }
              packageTypes[type].remaining += remaining;
              packageTypes[type].total += pkg.sessions_included || 0;
              totalUsed += pkg.sessions_used || 0;
              totalRemaining += remaining;
            }
          });
        }

        setSessionsByType(Object.values(packageTypes));
        setTotalSessionsRemaining(totalRemaining);
        setTotalSessionsUsed(totalUsed);
        setEarliestExpirationDate(earliestExpiration);
      } catch (error) {
        console.error("Error fetching package info:", error);
      }
    };

    fetchPackageInfo();
  }, [supabase]);

  // Add new effect for fetching payment history
  useEffect(() => {
    const fetchPaymentHistory = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session?.user) return;

        const { data: payments, error } = await supabase
          .from("payments")
          .select("*")
          .eq("client_id", session.user.id)
          .eq("status", "completed")
          .order("paid_at", { ascending: false })
          .limit(5);

        if (error) {
          console.error("Error fetching payment history:", error);
          return;
        }

        setPaymentHistory(payments || []);
      } catch (error) {
        console.error("Error in fetchPaymentHistory:", error);
      }
    };

    fetchPaymentHistory();
  }, [supabase]);

  console.log("Rendering dashboard:", {
    loading,
    showContractModal,
    contractAccepted: userStatus.contractAccepted,
    googleConnected: userStatus.googleConnected,
  });

  // Get initials from user name
  const initials = userStatus.userName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase();

  const handleConnectCalendar = () => {
    setShowCalendarPopup(true);
  };

  const renderModals = () => {
    return (
      <>
        <GoogleCalendarPopup
          open={showCalendarPopup}
          onOpenChange={(open) => {
            console.log("Google Calendar popup onOpenChange:", {
              open,
              userStatus,
            });
            setShowCalendarPopup(open);
            // Don't redirect when closing the calendar popup
          }}
        />

        <GoogleCalendarSuccessDialog
          open={showSuccessDialog}
          onOpenChange={setShowSuccessDialog}
          calendarName={calendarName}
        />

        <ContractFlowModal
          open={showContractModal}
          onOpenChange={(open) => {
            setShowContractModal(open);
            // Only redirect to login if the contract wasn't accepted AND we're not in the process of completing it
            if (
              !open &&
              !userStatus.contractAccepted &&
              !isCompletingContract
            ) {
              router.push("/login");
            }
          }}
          onComplete={async () => {
            setIsCompletingContract(true);
            // Refresh user status from database to ensure we have the latest data
            await checkUserStatus();
            setShowContractModal(false);
            setIsCompletingContract(false);
          }}
        />
      </>
    );
  };

  // Update the payment reminder section in the return statement
  const renderPaymentReminder = () => {
    if (!earliestExpirationDate || totalSessionsRemaining === 0) return null;

    const daysUntilExpiration = getDaysUntilExpiration(earliestExpirationDate);
    if (daysUntilExpiration <= 0) return null;

    const urgency =
      daysUntilExpiration <= 7
        ? "red"
        : daysUntilExpiration <= 14
          ? "orange"
          : "yellow";
    const colorClasses = {
      red: {
        border: "border-red-200",
        bg: "bg-red-50",
        text: "text-red-800",
        description: "text-red-700",
        button: "bg-red-600 hover:bg-red-700",
        icon: "text-red-600",
      },
      orange: {
        border: "border-orange-200",
        bg: "bg-orange-50",
        text: "text-orange-800",
        description: "text-orange-700",
        button: "bg-orange-600 hover:bg-orange-700",
        icon: "text-orange-600",
      },
      yellow: {
        border: "border-yellow-200",
        bg: "bg-yellow-50",
        text: "text-yellow-800",
        description: "text-yellow-700",
        button: "bg-yellow-600 hover:bg-yellow-700",
        icon: "text-yellow-600",
      },
    };

    const colors = colorClasses[urgency];

    return (
      <Card className={`${colors.border} ${colors.bg}`}>
        <CardContent className="p-4">
          <div className="flex items-start space-x-3">
            <AlertCircle className={`h-5 w-5 ${colors.icon} mt-0.5`} />
            <div>
              <p className={`font-medium ${colors.text}`}>
                Package Expiration Reminder
              </p>
              <p className={`text-sm ${colors.description} mt-1`}>
                {daysUntilExpiration === 1
                  ? "Your package expires tomorrow"
                  : `Your package expires in ${daysUntilExpiration} days`}
                {totalSessionsRemaining > 0 &&
                  ` with ${totalSessionsRemaining} sessions remaining`}
                .
                {daysUntilExpiration <= 7
                  ? " Renew now to avoid interruption."
                  : " Consider renewing soon."}
              </p>
              <Link href="/client/packages">
                <Button size="sm" className={`mt-3 ${colors.button}`}>
                  Renew Now
                </Button>
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-lg font-medium">Loading...</p>
      </div>
    );
  }

  return (
    <DashboardWrapper>
      <Suspense fallback={null}>
        <URLParamHandler
          onSuccess={handleOAuthSuccess}
          onError={handleOAuthError}
        />
      </Suspense>
      <div className="min-h-screen bg-gray-50">
        <div className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-background px-4 md:px-6">
          <SidebarTrigger>
            <Button variant="ghost" size="icon" className="md:hidden">
              <Menu className="h-6 w-6" />
              <span className="sr-only">Toggle sidebar</span>
            </Button>
          </SidebarTrigger>
        </div>
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Welcome Banner */}
          <Card className="mb-8 bg-gradient-to-r from-red-600 to-red-700 text-white border-0">
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage
                    src={userStatus.avatarUrl || "/placeholder-user.jpg"}
                    alt={userStatus.userName}
                    onError={(e) => {
                      console.error(
                        "Dashboard avatar image failed to load:",
                        e
                      );
                      console.log(
                        "Attempted avatar URL:",
                        userStatus.avatarUrl
                      );
                      // Force fallback to initials
                      e.currentTarget.style.display = "none";
                    }}
                  />
                  <AvatarFallback className="bg-white text-red-600 text-xl font-bold">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h2 className="text-2xl font-bold">
                    Welcome back, {userStatus.userName}!
                  </h2>
                  <p className="text-red-100">
                    {getNextSessionMessage(upcomingSessions)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column - Sessions & Calendar */}
            <div className="lg:col-span-2 space-y-6">
              {/* Upcoming Sessions */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Calendar className="h-5 w-5 text-red-600" />
                    <span>Upcoming Sessions</span>
                  </CardTitle>
                  <CardDescription>
                    Your scheduled training sessions
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {upcomingSessions.length > 0 ? (
                      upcomingSessions.map((session) => (
                        <div
                          key={session.id}
                          className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                        >
                          <div className="flex items-center space-x-4">
                            <div className="text-center">
                              <p className="font-medium text-red-600">
                                {formatTime(session.start_time)}
                              </p>
                              <p className="text-sm text-gray-500">
                                {formatDate(session.date)}
                              </p>
                            </div>
                            <div>
                              <p className="font-medium">{session.type}</p>
                              <p className="text-sm text-gray-500">
                                with {session.users.full_name}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Badge
                              variant="default"
                              className="bg-green-100 text-green-800"
                            >
                              Confirmed
                            </Badge>
                            <Button size="sm" variant="outline">
                              Reschedule
                            </Button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-6 text-gray-500">
                        No upcoming sessions scheduled
                      </div>
                    )}
                  </div>
                  <div className="mt-6 pt-4 border-t">
                    <Link href="/client/booking">
                      <Button className="w-full bg-red-600 hover:bg-red-700">
                        <Calendar className="h-4 w-4 mr-2" />
                        Book New Session
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>

              {/* Payment History */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Clock className="h-5 w-5 text-red-600" />
                    <span>Payment History</span>
                  </CardTitle>
                  <CardDescription>Your transaction history</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {paymentHistory.length > 0 ? (
                      paymentHistory.map((payment) => (
                        <div
                          key={payment.id}
                          className="flex items-center justify-between p-3 border rounded-lg"
                        >
                          <div>
                            <p className="font-medium">
                              {payment.session_count} Training Sessions
                            </p>
                            <p className="text-sm text-gray-500">
                              {new Date(payment.paid_at).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold">
                              ${payment.amount.toFixed(2)}
                            </p>
                            <div className="flex items-center space-x-1">
                              <CheckCircle className="h-4 w-4 text-green-600" />
                              <span className="text-sm text-green-600">
                                {payment.status.charAt(0).toUpperCase() +
                                  payment.status.slice(1)}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-6 text-gray-500">
                        No payment history available
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right Column - Payment Summary */}
            <div className="space-y-6">
              {/* Payment Summary */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <CreditCard className="h-5 w-5 text-red-600" />
                    <span>Payment Summary</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div
                    className={`text-center p-4 ${
                      totalSessionsRemaining <= 1 ? "bg-red-50" : "bg-green-50"
                    } rounded-lg`}
                  >
                    <p
                      className={`text-2xl font-bold ${
                        totalSessionsRemaining <= 1
                          ? "text-red-600"
                          : "text-green-600"
                      }`}
                    >
                      {totalSessionsRemaining}
                    </p>
                    <p className="text-sm text-gray-600">Sessions Remaining</p>
                  </div>

                  <div className="space-y-3">
                    <div className="space-y-1">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Current Packages:</span>
                        <span className="font-medium">
                          {sessionsByType[0]?.remaining}{" "}
                          {sessionsByType[0]?.type.split(" ")[0]}
                        </span>
                      </div>
                      <div className="flex flex-col items-end text-right">
                        {sessionsByType.slice(1).map((type) => (
                          <span key={type.type} className="font-medium">
                            {type.remaining} {type.type.split(" ")[0]}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Sessions Used:</span>
                      <span className="font-medium">{totalSessionsUsed}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Package Expires:</span>
                      <span className="font-medium">
                        {new Date(
                          new Date().getFullYear(),
                          new Date().getMonth() + 1,
                          1
                        ).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </span>
                    </div>
                  </div>

                  <div className="pt-4 border-t">
                    <Link href="/client/packages">
                      <Button className="w-full bg-red-600 hover:bg-red-700 mb-2">
                        <CreditCard className="h-4 w-4 mr-2" />
                        Buy More Sessions
                      </Button>
                    </Link>
                    <Link href="/client/packages">
                      <Button variant="outline" className="w-full">
                        View Pricing Plans
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Link href="/client/messages">
                    <Button variant="outline" className="w-full justify-start">
                      <User className="h-4 w-4 mr-2" />
                      Contact Trainer
                    </Button>
                  </Link>
                  <Link href="/client/calendar">
                    <Button variant="outline" className="w-full justify-start">
                      <Calendar className="h-4 w-4 mr-2" />
                      View Full Calendar
                    </Button>
                  </Link>
                  <Link href="/client/packages">
                    <Button variant="outline" className="w-full justify-start">
                      <CreditCard className="h-4 w-4 mr-2" />
                      View Packages
                    </Button>
                  </Link>
                </CardContent>
              </Card>

              {renderPaymentReminder()}

              <GoogleCalendarSection
                isConnected={userStatus.googleConnected}
                onConnect={handleConnectCalendar}
              />
            </div>
          </div>
        </main>
      </div>
      {renderModals()}
    </DashboardWrapper>
  );
}
