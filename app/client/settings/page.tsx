"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { SidebarTrigger } from "@/components/ui/sidebar";
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
                Sync your training sessions and reminders
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

// Contract Management Section
function ContractSection() {
  const [contractSigned, setContractSigned] = useState(false);
  const [contractSignedAt, setContractSignedAt] = useState<string | null>(null);
  const [contractUrl, setContractUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    const checkContractStatus = async () => {
      setLoading(true);
      try {
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();
        if (userError || !user) {
          console.error("Failed to get user:", userError);
          setLoading(false);
          return;
        }

        // Fetch the latest contract for this user
        const { data: contractData, error: contractError } = await supabase
          .from("contracts")
          .select("pdf_url, signed_at")
          .eq("user_id", user.id)
          .order("signed_at", { ascending: false })
          .limit(1)
          .single();

        if (contractError && contractError.code !== "PGRST116") {
          // PGRST116 = no rows found
          console.error("Failed to fetch contract:", contractError);
        }

        if (contractData) {
          setContractSigned(true);
          setContractSignedAt(contractData.signed_at || null);
          setContractUrl(contractData.pdf_url || null);
        } else {
          setContractSigned(false);
          setContractSignedAt(null);
          setContractUrl(null);
        }
      } catch (error) {
        console.error("Error checking contract status:", error);
      }
      setLoading(false);
    };

    checkContractStatus();
  }, [supabase]);

  const handleViewContract = () => {
    if (contractUrl) {
      window.open(contractUrl, "_blank");
    }
  };

  const handleDownloadContract = async () => {
    if (contractUrl) {
      try {
        const response = await fetch(contractUrl);
        const blob = await response.blob();
        saveAs(blob, "Training_Agreement.pdf");
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
          <span>Contract Management</span>
        </CardTitle>
        <CardDescription>
          View and manage your signed training agreement
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between p-4 border rounded-lg">
          <div className="flex items-center space-x-3">
            <div className="bg-green-600 p-2 rounded">
              <FileText className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="font-medium">Training Agreement</p>
              <p className="text-sm text-gray-500">
                {contractSigned
                  ? `Signed on ${contractSignedAt ? new Date(contractSignedAt).toLocaleDateString() : "Unknown date"}`
                  : "Not signed yet"}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {contractSigned ? (
              <>
                <Badge
                  variant="outline"
                  className="text-green-600 border-green-600"
                >
                  Signed
                </Badge>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleViewContract}
                  disabled={!contractUrl || loading}
                >
                  <Eye className="h-4 w-4 mr-2" />
                  View
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDownloadContract}
                  disabled={!contractUrl || loading}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
              </>
            ) : (
              <Badge
                variant="outline"
                className="text-orange-600 border-orange-600"
              >
                Not Signed
              </Badge>
            )}
          </div>
        </div>

        {!contractSigned && (
          <div className="bg-yellow-50 p-4 rounded text-yellow-800 text-center font-medium">
            You need to sign the training agreement before booking sessions.
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function ClientSettings() {
  const [notifications, setNotifications] = useState({
    email: true,
    sms: false,
    push: true,
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-background px-4 md:px-6">
        <SidebarTrigger />
        <h1 className="text-xl font-bold text-gray-900">Settings</h1>
      </div>
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {/* Contract Management */}
          <Suspense fallback={<div>Loading contract settings...</div>}>
            <ContractSection />
          </Suspense>

          {/* Calendar Integration */}
          <Suspense fallback={<div>Loading calendar settings...</div>}>
            <GoogleCalendarSection />
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

          {/* Payment Methods */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <CreditCard className="h-5 w-5 text-red-600" />
                <span>Payment Methods</span>
              </CardTitle>
              <CardDescription>
                Manage your payment methods and billing information
              </CardDescription>
            </CardHeader>
            <CardContent className="py-12 flex flex-col items-center justify-center">
              <span className="text-gray-500 text-sm mb-2">
                Payment method management
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
                Earn rewards for referring friends and family
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
  );
}
