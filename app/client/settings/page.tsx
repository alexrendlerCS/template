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
  Loader2,
} from "lucide-react";
import GoogleCalendarPopup from "@/components/GoogleCalendarPopup";
import GoogleCalendarSuccessDialog from "@/components/GoogleCalendarSuccessDialog";
import { createClient } from "@/lib/supabaseClient";
import { saveAs } from "file-saver";
import { useToast } from "@/components/ui/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

// Separate the Google Calendar section into its own client component
function GoogleCalendarSection() {
  const [showGooglePopup, setShowGooglePopup] = useState(false);
  const [showGoogleSuccess, setShowGoogleSuccess] = useState(false);
  const [showSyncDialog, setShowSyncDialog] = useState(false);
  const [isGoogleConnected, setIsGoogleConnected] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<any>(null);
  const supabase = createClient();
  const { toast } = useToast();

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

  const handleSyncCalendar = async () => {
    try {
      console.log("[DEBUG] Starting client calendar sync process");
      setIsSyncing(true);
      setShowSyncDialog(false);

      console.log(
        "[DEBUG] Making API call to /api/google/calendar/sync/client"
      );
      const response = await fetch("/api/google/calendar/sync/client", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      console.log("[DEBUG] API response status:", response.status);
      const result = await response.json();
      console.log("[DEBUG] API response data:", result);

      if (response.ok) {
        console.log("[DEBUG] Sync successful, setting result:", result);
        setSyncResult(result);
        toast({
          title: "Calendar Sync Complete",
          description: result.message,
        });
      } else {
        console.error(
          "[ERROR] Sync failed with status:",
          response.status,
          "Error:",
          result.error
        );
        setSyncResult({
          success: false,
          error: result.error || "Failed to sync calendar",
          syncResults: {
            total: 0,
            successful: 0,
            failed: 0,
            errors: [result.error || "Unknown error occurred"],
          },
        });
        toast({
          title: "Sync Failed",
          description: result.error || "Failed to sync calendar",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("[ERROR] Sync error:", error);
      setSyncResult({
        success: false,
        error: "An unexpected error occurred",
        syncResults: {
          total: 0,
          successful: 0,
          failed: 0,
          errors: [error instanceof Error ? error.message : "Unknown error"],
        },
      });
      toast({
        title: "Sync Failed",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      console.log("[DEBUG] Sync process completed, setting isSyncing to false");
      setIsSyncing(false);
    }
  };

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
              <>
                <Badge
                  variant="outline"
                  className="text-gray-600 border-gray-600 cursor-pointer hover:bg-gray-50"
                  onClick={() => setShowSyncDialog(true)}
                >
                  {isSyncing ? (
                    <>
                      <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                      Syncing...
                    </>
                  ) : (
                    "Sync"
                  )}
                </Badge>
                <Badge
                  variant="outline"
                  className="text-green-600 border-green-600"
                >
                  Connected
                </Badge>
              </>
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
          calendarName="My Training Sessions"
        />

        {/* Sync Confirmation Dialog */}
        <Dialog open={showSyncDialog} onOpenChange={setShowSyncDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Sync Calendar</DialogTitle>
              <DialogDescription>
                This will create a new Google Calendar and sync all your
                existing training sessions to it.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0">
                    <svg
                      className="h-5 w-5 text-yellow-400"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-sm font-medium text-yellow-800">
                      Important Warning
                    </h3>
                    <div className="mt-2 text-sm text-yellow-700">
                      <ul className="list-disc list-inside space-y-1">
                        <li>
                          A new calendar called "My Training Sessions" will be
                          created
                        </li>
                        <li>
                          All your existing booked sessions will be synced to
                          this new calendar
                        </li>
                        <li>
                          The old calendar will no longer be used for new
                          sessions
                        </li>
                        <li>This action cannot be undone</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowSyncDialog(false)}
                disabled={isSyncing}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSyncCalendar}
                disabled={isSyncing}
                className="bg-red-600 hover:bg-red-700"
              >
                {isSyncing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Syncing...
                  </>
                ) : (
                  "Create New Calendar & Sync"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Sync Results Dialog */}
        {syncResult && (
          <Dialog open={!!syncResult} onOpenChange={() => setSyncResult(null)}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {syncResult.success ? "Sync Results" : "Sync Failed"}
                </DialogTitle>
                <DialogDescription>
                  {syncResult.success
                    ? "Calendar sync has been completed"
                    : "There was an error during the sync process"}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                {syncResult.success ? (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-center space-x-2">
                      <svg
                        className="h-5 w-5 text-green-400"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <span className="text-sm font-medium text-green-800">
                        {syncResult.message}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="flex items-center space-x-2">
                      <svg
                        className="h-5 w-5 text-red-400"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <span className="text-sm font-medium text-red-800">
                        {syncResult.error}
                      </span>
                    </div>
                  </div>
                )}

                {syncResult.syncResults && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Total sessions:</span>
                      <span className="font-medium">
                        {syncResult.syncResults?.total || 0}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Successfully synced:</span>
                      <span className="font-medium text-green-600">
                        {syncResult.syncResults?.successful || 0}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Failed to sync:</span>
                      <span className="font-medium text-red-600">
                        {syncResult.syncResults?.failed || 0}
                      </span>
                    </div>
                  </div>
                )}

                {syncResult.syncResults?.errors &&
                  syncResult.syncResults.errors.length > 0 && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <h4 className="text-sm font-medium text-red-800 mb-2">
                        Errors:
                      </h4>
                      <div className="text-xs text-red-700 space-y-1 max-h-32 overflow-y-auto">
                        {syncResult.syncResults.errors.map(
                          (error: string, index: number) => (
                            <div key={index} className="p-2 bg-red-100 rounded">
                              {error}
                            </div>
                          )
                        )}
                      </div>
                    </div>
                  )}
              </div>
              <DialogFooter>
                <Button onClick={() => setSyncResult(null)}>
                  {syncResult.success ? "Close" : "Try Again"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
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
