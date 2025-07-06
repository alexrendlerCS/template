"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Upload,
  Palette,
  CreditCard,
  Calendar,
  Bell,
  Shield,
  Save,
  Tag,
  Mail,
  Gift,
  FileText,
  Download,
  Eye,
} from "lucide-react";
import GoogleCalendarPopup from "@/components/GoogleCalendarPopup";
import GoogleCalendarSuccessDialog from "@/components/GoogleCalendarSuccessDialog";
import { createClient } from "@/lib/supabaseClient";
import { saveAs } from "file-saver";

// Separate the Google Calendar section into its own client component
function GoogleCalendarSection() {
  const [showGooglePopup, setShowGooglePopup] = useState(false);
  const [showGoogleSuccess, setShowGoogleSuccess] = useState(false);
  const [isGoogleConnected, setIsGoogleConnected] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    let mounted = true;

    const checkGoogleStatus = async () => {
      try {
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();
        if (userError || !user) {
          console.error("Failed to get user:", userError);
          return;
        }

        const { data: userData, error: dbError } = await supabase
          .from("users")
          .select("google_account_connected")
          .eq("id", user.id)
          .single();

        if (dbError) {
          console.error("Failed to fetch user data:", dbError);
          return;
        }

        if (mounted) {
          setIsGoogleConnected(!!userData?.google_account_connected);
        }
      } catch (error) {
        console.error("Error checking Google status:", error);
      }
    };

    checkGoogleStatus();

    return () => {
      mounted = false;
    };
  }, [supabase]);

  const handleGoogleSuccess = useCallback(() => {
    setIsGoogleConnected(true);
    setShowGoogleSuccess(true);
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Calendar className="h-5 w-5 text-red-600" />
          <span>Calendar Integration</span>
        </CardTitle>
        <CardDescription>
          Sync with your calendar for seamless scheduling
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between p-4 border rounded-lg">
          <div className="flex items-center space-x-3">
            <div className="bg-blue-600 p-2 rounded">
              <Calendar className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="font-medium">Google Calendar</p>
              <p className="text-sm text-gray-500">
                Sync your availability and bookings
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {isGoogleConnected ? (
              <Badge
                variant="outline"
                className="text-green-600 border-green-600"
              >
                Connected
              </Badge>
            ) : (
              <>
                <Badge
                  variant="outline"
                  className="text-orange-600 border-orange-600"
                >
                  Not Connected
                </Badge>
                <Button
                  variant="outline"
                  onClick={() => setShowGooglePopup(true)}
                >
                  Connect
                </Button>
              </>
            )}
          </div>
        </div>

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
      </CardContent>
    </Card>
  );
}

function ClientContractsSection() {
  const [contracts, setContracts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    const fetchContractsAndUsers = async () => {
      setLoading(true);
      // Fetch all contracts (no join)
      const { data: contractsData, error: contractsError } = await supabase
        .from("contracts")
        .select("id, pdf_url, signed_at, user_id")
        .order("signed_at", { ascending: false });
      if (contractsError) {
        console.error("Failed to fetch contracts:", contractsError);
        setContracts([]);
        setLoading(false);
        return;
      }
      // Get unique user_ids
      const userIds = Array.from(
        new Set((contractsData || []).map((c) => c.user_id))
      );
      // Fetch user info for all user_ids
      let usersMap: Record<string, { full_name?: string; email?: string }> = {};
      if (userIds.length > 0) {
        const { data: usersData, error: usersError } = await supabase
          .from("users")
          .select("id, full_name, email")
          .in("id", userIds);
        if (!usersError && usersData) {
          usersMap = Object.fromEntries(
            usersData.map((u: any) => [
              u.id,
              { full_name: u.full_name, email: u.email },
            ])
          );
        }
      }
      // Attach user info to contracts
      const contractsWithUser = (contractsData || []).map((c) => ({
        ...c,
        user: usersMap[c.user_id] || null,
      }));
      setContracts(contractsWithUser);
      setLoading(false);
    };
    fetchContractsAndUsers();
  }, [supabase]);

  const handleView = (url: string) => {
    if (url) window.open(url, "_blank");
  };

  const handleDownload = async (url: string, clientName: string) => {
    if (url) {
      try {
        const response = await fetch(url);
        const blob = await response.blob();
        saveAs(
          blob,
          `${clientName.replace(/\s+/g, "_")}_Training_Agreement.pdf`
        );
      } catch (err) {
        alert("Failed to download contract PDF");
      }
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <FileText className="h-5 w-5 text-red-600" />
          <span>Client Contracts</span>
        </CardTitle>
        <CardDescription>
          View and download signed contracts from your clients
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div>Loading contracts...</div>
        ) : contracts.length === 0 ? (
          <div className="text-gray-500">No contracts found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                    Client
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                    Email
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                    Date Signed
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {contracts.map((contract) => (
                  <tr key={contract.id}>
                    <td className="px-4 py-2 whitespace-nowrap">
                      {contract.user?.full_name || contract.user_id}
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap">
                      {contract.user?.email || "-"}
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap">
                      {contract.signed_at
                        ? new Date(contract.signed_at).toLocaleDateString()
                        : "-"}
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleView(contract.pdf_url)}
                        disabled={!contract.pdf_url}
                      >
                        <Eye className="h-4 w-4 mr-1" /> View
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          handleDownload(
                            contract.pdf_url,
                            contract.user?.full_name || contract.user_id
                          )
                        }
                        disabled={!contract.pdf_url}
                      >
                        <Download className="h-4 w-4 mr-1" /> Download
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function TrainerSettings() {
  const [notifications, setNotifications] = useState({
    email: true,
    sms: false,
    push: true,
  });

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <TrainerSidebar />
        <div className="flex-1">
          <header className="border-b bg-white px-6 py-4">
            <div className="flex items-center space-x-4">
              <SidebarTrigger />
              <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
            </div>
          </header>

          <main className="p-6 max-w-4xl">
            <div className="space-y-8">
              {/* Calendar Integration */}
              <Suspense fallback={<div>Loading calendar settings...</div>}>
                <GoogleCalendarSection />
              </Suspense>

              {/* Client Contracts */}
              <Suspense fallback={<div>Loading client contracts...</div>}>
                <ClientContractsSection />
              </Suspense>

              {/* Notifications */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Bell className="h-5 w-5 text-red-600" />
                    <span>Notifications</span>
                  </CardTitle>
                  <CardDescription>
                    Manage how you receive notifications
                  </CardDescription>
                </CardHeader>
                <CardContent className="py-12 flex flex-col items-center justify-center">
                  <span className="text-gray-500 text-sm mb-2">
                    Notifications functionality
                  </span>
                  <span className="text-lg font-semibold text-gray-700">
                    Coming Soon
                  </span>
                </CardContent>
              </Card>

              {/* Promo Codes & Discounts */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Tag className="h-5 w-5 text-red-600" />
                    <span>Promo Codes & Discounts</span>
                  </CardTitle>
                  <CardDescription>
                    Create and manage promotional codes for your clients
                  </CardDescription>
                </CardHeader>
                <CardContent className="py-12 flex flex-col items-center justify-center">
                  <span className="text-gray-500 text-sm mb-2">
                    Promo code functionality
                  </span>
                  <span className="text-lg font-semibold text-gray-700">
                    Coming Soon
                  </span>
                </CardContent>
              </Card>

              {/* Bulk Message */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Mail className="h-5 w-5 text-red-600" />
                    <span>Bulk Message</span>
                  </CardTitle>
                  <CardDescription>
                    Send announcements or updates to multiple clients at once
                  </CardDescription>
                </CardHeader>
                <CardContent className="py-12 flex flex-col items-center justify-center">
                  <span className="text-gray-500 text-sm mb-2">
                    Bulk messaging functionality
                  </span>
                  <span className="text-lg font-semibold text-gray-700">
                    Coming Soon
                  </span>
                </CardContent>
              </Card>

              {/* Referral Program */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Gift className="h-5 w-5 text-red-600" />
                    <span>Referral Program</span>
                  </CardTitle>
                  <CardDescription>
                    Reward clients for referring friends and family
                  </CardDescription>
                </CardHeader>
                <CardContent className="py-12 flex flex-col items-center justify-center">
                  <span className="text-gray-500 text-sm mb-2">
                    Referral program functionality
                  </span>
                  <span className="text-lg font-semibold text-gray-700">
                    Coming Soon
                  </span>
                </CardContent>
              </Card>

              {/* Save Button */}
              <div className="flex justify-end">
                <Button className="bg-red-600 hover:bg-red-700">
                  <Save className="h-4 w-4 mr-2" />
                  Save All Changes
                </Button>
              </div>
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
