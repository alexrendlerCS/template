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
import { useEffect, useState } from "react";
import { ContractFlowModal } from "@/components/ContractFlowModal";
import { createClient } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import GoogleCalendarPopup from "@/components/GoogleCalendarPopup";

const mockUpcomingSessions = [
  {
    id: 1,
    date: "2024-01-15",
    time: "10:00 AM",
    type: "Personal Training",
    trainer: "John Doe",
  },
  {
    id: 2,
    date: "2024-01-17",
    time: "2:00 PM",
    type: "Strength Training",
    trainer: "John Doe",
  },
  {
    id: 3,
    date: "2024-01-19",
    time: "11:00 AM",
    type: "Cardio Session",
    trainer: "John Doe",
  },
];

const mockPaymentHistory = [
  { id: 1, date: "2024-01-10", amount: 240, sessions: 4, status: "completed" },
  { id: 2, date: "2023-12-15", amount: 180, sessions: 3, status: "completed" },
  { id: 3, date: "2023-11-20", amount: 300, sessions: 5, status: "completed" },
];

interface UserStatus {
  contractAccepted: boolean;
  googleConnected: boolean;
  userName: string;
}

export default function ClientDashboard() {
  const [loading, setLoading] = useState(true);
  const [showContractModal, setShowContractModal] = useState(false);
  const [showCalendarPopup, setShowCalendarPopup] = useState(false);
  const [userStatus, setUserStatus] = useState<UserStatus>({
    contractAccepted: false,
    googleConnected: false,
    userName: "Client",
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
          console.log("No session found, redirecting to login");
          router.push("/login");
          return;
        }

        console.log("Fetching user data for auth ID:", session.user.id);

        const { data: userData, error } = await supabase
          .from("users")
          .select("contract_accepted, google_account_connected, full_name")
          .eq("id", session.user.id)
          .single();

        if (error) {
          console.error("Error fetching user data:", error);
          return;
        }

        console.log("User data from Supabase:", userData);

        if (userData) {
          // Explicitly check for null/undefined before using ||
          const contractAccepted =
            userData.contract_accepted === null
              ? false
              : userData.contract_accepted;
          const googleConnected =
            userData.google_account_connected === null
              ? false
              : userData.google_account_connected;

          console.log("Setting user status:", {
            contractAccepted,
            googleConnected,
            userName: userData.full_name || "Client",
          });

          setUserStatus({
            contractAccepted,
            googleConnected,
            userName: userData.full_name || "Client",
          });

          // Directly check contract status from the fresh data
          if (
            userData.contract_accepted === false ||
            userData.contract_accepted === null
          ) {
            console.log("Contract not accepted, showing modal");
            setShowContractModal(true);
          } else if (!googleConnected) {
            console.log(
              "Contract accepted but Google not connected, showing calendar popup"
            );
            setShowCalendarPopup(true);
          }
        } else {
          console.log("No user data found for auth ID:", session.user.id);
        }
      } catch (error) {
        console.error("Error checking user status:", error);
      } finally {
        setLoading(false);
      }
    };

    checkUserStatus();
  }, []);

  console.log("Rendering dashboard:", {
    loading,
    showContractModal,
    contractAccepted: userStatus.contractAccepted,
    googleConnected: userStatus.googleConnected,
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-lg font-medium">Loading...</p>
      </div>
    );
  }

  return (
    <DashboardWrapper>
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
                  <AvatarImage src="/placeholder.svg?height=64&width=64" />
                  <AvatarFallback className="bg-white text-red-600 text-xl font-bold">
                    {userStatus.userName
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h2 className="text-2xl font-bold">
                    Welcome back, {userStatus.userName}!
                  </h2>
                  <p className="text-red-100">
                    Your next training session is scheduled for tomorrow at
                    10:00 AM
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
                    {mockUpcomingSessions.map((session) => (
                      <div
                        key={session.id}
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-center space-x-4">
                          <div className="text-center">
                            <p className="font-medium text-red-600">
                              {session.time}
                            </p>
                            <p className="text-sm text-gray-500">
                              {session.date}
                            </p>
                          </div>
                          <div>
                            <p className="font-medium">{session.type}</p>
                            <p className="text-sm text-gray-500">
                              with {session.trainer}
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
                    ))}
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
                    {mockPaymentHistory.map((payment) => (
                      <div
                        key={payment.id}
                        className="flex items-center justify-between p-3 border rounded-lg"
                      >
                        <div>
                          <p className="font-medium">
                            {payment.sessions} Training Sessions
                          </p>
                          <p className="text-sm text-gray-500">
                            {payment.date}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold">${payment.amount}</p>
                          <div className="flex items-center space-x-1">
                            <CheckCircle className="h-4 w-4 text-green-600" />
                            <span className="text-sm text-green-600">Paid</span>
                          </div>
                        </div>
                      </div>
                    ))}
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
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <p className="text-2xl font-bold text-green-600">8</p>
                    <p className="text-sm text-gray-600">Sessions Remaining</p>
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Current Package:</span>
                      <span className="font-medium">10 Sessions</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Sessions Used:</span>
                      <span className="font-medium">2</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Package Expires:</span>
                      <span className="font-medium">March 15, 2024</span>
                    </div>
                  </div>

                  <div className="pt-4 border-t">
                    <Button className="w-full bg-red-600 hover:bg-red-700 mb-2">
                      <CreditCard className="h-4 w-4 mr-2" />
                      Buy More Sessions
                    </Button>
                    <Button variant="outline" className="w-full">
                      View Pricing Plans
                    </Button>
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
                  <Link href="/client/payment-methods">
                    <Button variant="outline" className="w-full justify-start">
                      <CreditCard className="h-4 w-4 mr-2" />
                      Payment Methods
                    </Button>
                  </Link>
                </CardContent>
              </Card>

              {/* Upcoming Payment Alert */}
              <Card className="border-orange-200 bg-orange-50">
                <CardContent className="p-4">
                  <div className="flex items-start space-x-3">
                    <AlertCircle className="h-5 w-5 text-orange-600 mt-0.5" />
                    <div>
                      <p className="font-medium text-orange-800">
                        Payment Reminder
                      </p>
                      <p className="text-sm text-orange-700 mt-1">
                        Your current package expires in 45 days. Consider
                        renewing to avoid interruption.
                      </p>
                      <Button
                        size="sm"
                        className="mt-3 bg-orange-600 hover:bg-orange-700"
                      >
                        Renew Now
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>

        {/* Move ContractFlowModal outside of layout containers */}
        <ContractFlowModal
          open={showContractModal}
          onOpenChange={(open) => {
            setShowContractModal(open);
            // Only redirect to login if the contract wasn't accepted
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

        {/* Keep GoogleCalendarPopup */}
        <GoogleCalendarPopup
          open={showCalendarPopup}
          onOpenChange={setShowCalendarPopup}
        />
      </div>
    </DashboardWrapper>
  );
}
