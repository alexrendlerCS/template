"use client";

import { useState, useEffect, useCallback, Suspense, useRef } from "react";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";

type DiscountCodeType = {
  id: string;
  code: string;
  percent_off: number | null;
  amount_off: number | null;
  currency: string | null;
  max_redemptions: number | null;
  expires_at: string | null;
  created_at: string;
  stripe_promotion_code_id: string;
};

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
      console.log("[DEBUG] Starting calendar sync process");
      setIsSyncing(true);
      setShowSyncDialog(false);

      console.log("[DEBUG] Making API call to /api/google/calendar/sync");
      const response = await fetch("/api/google/calendar/sync", {
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
                Sync your availability and bookings
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
          calendarName="Training Sessions"
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
                          A new calendar called "Training Sessions" will be
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

function AddSessionsModal({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [sessionType, setSessionType] = useState<string>("");
  const [numSessions, setNumSessions] = useState<number>(1);
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const supabase = createClient();
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      setLoading(true);
      supabase
        .from("users")
        .select("id, full_name, email")
        .eq("role", "client")
        .then(({ data, error }) => {
          if (!error && data) setClients(data);
          setLoading(false);
        });
    }
  }, [open, supabase]);

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      // Check for existing package
      const { data: existing, error: pkgError } = await supabase
        .from("packages")
        .select("id, sessions_included, original_sessions")
        .eq("client_id", selectedUserId)
        .eq("package_type", sessionType)
        .eq("status", "active")
        .single();
      if (pkgError && pkgError.code !== "PGRST116") throw pkgError;
      if (existing) {
        // Add sessions to existing package
        const { error: updateError } = await supabase
          .from("packages")
          .update({
            sessions_included: existing.sessions_included + numSessions,
            original_sessions: (existing.original_sessions || 0) + numSessions,
          })
          .eq("id", existing.id);
        if (updateError) throw updateError;
        setSuccessMessage(
          `Added ${numSessions} session(s) to ${clients.find((c) => c.id === selectedUserId)?.full_name || "user"}.`
        );
      } else {
        // Create new package
        const { error: createError } = await supabase.from("packages").insert({
          client_id: selectedUserId,
          package_type: sessionType,
          sessions_included: numSessions,
          original_sessions: numSessions,
          status: "active",
          purchase_date: new Date().toISOString().split("T")[0],
        });
        if (createError) throw createError;
        setSuccessMessage(
          `Created new package and added ${numSessions} session(s) to ${clients.find((c) => c.id === selectedUserId)?.full_name || "user"}.`
        );
      }
      setShowSuccess(true);
      onOpenChange(false);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "An unknown error occurred";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
      setShowConfirm(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Sessions to User</DialogTitle>
          <DialogDescription>
            Select a client, session type, and number of sessions to add.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div>
            <Label>Client</Label>
            <select
              className="w-full border rounded p-2 mt-1"
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
              disabled={loading}
            >
              <option value="">Select a client...</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.full_name} ({c.email})
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label>Session Type</Label>
            <select
              className="w-full border rounded p-2 mt-1"
              value={sessionType}
              onChange={(e) => setSessionType(e.target.value)}
            >
              <option>In-Person Training</option>
              <option>Virtual Training</option>
              <option>Partner Training</option>
            </select>
          </div>
          <div>
            <Label>Number of Sessions</Label>
            <Input
              type="number"
              min={1}
              value={numSessions}
              onChange={(e) => setNumSessions(Number(e.target.value))}
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            className="w-full bg-red-600 hover:bg-red-700"
            disabled={submitting || !selectedUserId || numSessions < 1}
            onClick={() => setShowConfirm(true)}
          >
            {submitting ? "Adding..." : "Add Sessions"}
          </Button>
        </DialogFooter>
      </DialogContent>
      {/* Confirmation Dialog */}
      <Dialog open={showConfirm} onOpenChange={setShowConfirm}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Confirm Add Sessions</DialogTitle>
            <DialogDescription>
              Are you sure you want to{" "}
              <span className="font-bold text-blue-700">
                give {numSessions} free session(s)
              </span>{" "}
              to{" "}
              <span className="font-bold">
                {clients.find((c) => c.id === selectedUserId)?.full_name ||
                  "this user"}
              </span>
              ? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfirm(false)}>
              Cancel
            </Button>
            <Button
              className="w-full bg-red-600 hover:bg-red-700 text-white"
              onClick={handleSubmit}
              disabled={submitting}
            >
              {submitting ? "Adding..." : "Confirm"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Success Dialog */}
      <Dialog open={showSuccess} onOpenChange={setShowSuccess}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader className="text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100 mb-4">
              <svg
                className="h-6 w-6 text-green-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <DialogTitle className="text-xl font-semibold text-green-800 text-center">
              Sessions Added Successfully!
            </DialogTitle>
            <DialogDescription className="text-gray-600 mt-2 text-center">
              {successMessage}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-6">
            <Button
              className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-md transition-colors"
              onClick={() => setShowSuccess(false)}
            >
              Great! Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Dialog>
  );
}

function CreatePromoCodeModal({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [code, setCode] = useState("");
  const [discountType, setDiscountType] = useState("percent");
  const [value, setValue] = useState("");
  const [maxRedemptions, setMaxRedemptions] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [showHowTo, setShowHowTo] = useState(false);
  const [createdCode, setCreatedCode] = useState("");
  const supabase = createClient();
  const { toast } = useToast();

  const handleSubmit = async () => {
    setSubmitting(true);
    setError("");
    try {
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) {
        setError("User not found");
        setSubmitting(false);
        return;
      }
      const res = await fetch("/api/discount-codes/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code,
          discountType,
          value: Number(value),
          maxRedemptions: maxRedemptions ? Number(maxRedemptions) : undefined,
          expiresAt: expiresAt || undefined,
          currency: discountType === "amount" ? "usd" : undefined,
          trainerId: user.id,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setSuccess(true);
        setCreatedCode(code);
        setShowHowTo(true);
        toast({ title: "Promo code created!", description: `Code: ${code}` });
      } else {
        setError(data.error || "Failed to create promo code");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create Promo Code</DialogTitle>
            <DialogDescription>
              Fill out the details below to create a new discount code for your
              clients.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label>Code</Label>
              <Input
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="SUMMER20"
              />
            </div>
            <div>
              <Label>Discount Type</Label>
              <select
                className="w-full border rounded p-2 mt-1"
                value={discountType}
                onChange={(e) => setDiscountType(e.target.value)}
              >
                <option value="percent">Percent Off (%)</option>
                <option value="amount">Amount Off ($)</option>
              </select>
            </div>
            <div>
              <Label>Value</Label>
              <Input
                type="number"
                min={1}
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder={discountType === "percent" ? "20" : "10"}
              />
            </div>
            <div>
              <Label>Max Redemptions (optional)</Label>
              <Input
                type="number"
                min={1}
                value={maxRedemptions}
                onChange={(e) => setMaxRedemptions(e.target.value)}
                placeholder="100"
              />
            </div>
            <div>
              <Label>Expiry Date (optional)</Label>
              <Input
                type="date"
                value={expiresAt}
                onChange={(e) => setExpiresAt(e.target.value)}
              />
            </div>
            {error && <div className="text-red-600 text-sm mt-2">{error}</div>}
            {success && (
              <div className="text-green-600 text-sm mt-2">
                Promo code created successfully!
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              className="bg-red-600 hover:bg-red-700"
              onClick={handleSubmit}
              disabled={submitting || !code || !value}
            >
              {submitting ? "Creating..." : "Create Promo Code"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* How to Use Promo Code Popup */}
      <Dialog open={showHowTo} onOpenChange={setShowHowTo}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Promo Code Created!</DialogTitle>
            <DialogDescription>
              Share this code with your clients:
            </DialogDescription>
          </DialogHeader>
          <div className="text-2xl font-bold text-center bg-gray-100 rounded p-2 mb-4">
            {createdCode}
          </div>
          <ul className="list-disc list-inside text-gray-700 space-y-2">
            <li>
              Clients can enter this code at checkout to receive a discount.
            </li>
            <li>
              You can set a maximum number of redemptions and an expiry date for
              the code.
            </li>
            <li>
              Clients will see the discount applied on the Stripe checkout page.
            </li>
            <li>
              To test, go to the client packages page, add a package, and enter
              this code at checkout.
            </li>
          </ul>
          <DialogFooter>
            <Button
              className="bg-red-600 hover:bg-red-700"
              onClick={() => setShowHowTo(false)}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function PromoCodesTable({ trainerId }: { trainerId: string }) {
  const [codes, setCodes] = useState<DiscountCodeType[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();
  const { toast } = useToast();

  useEffect(() => {
    if (!trainerId) return;
    setLoading(true);
    supabase
      .from("discount_codes")
      .select(
        "id, code, percent_off, amount_off, currency, max_redemptions, expires_at, created_at, stripe_promotion_code_id"
      )
      .eq("created_by", trainerId)
      .order("created_at", { ascending: false })
      .then(({ data, error }) => {
        if (!error && data) setCodes(data);
        setLoading(false);
      });
  }, [trainerId, supabase]);

  const copyToClipboard = (code: string) => {
    navigator.clipboard.writeText(code);
    toast({
      title: "Copied!",
      description: `Promo code ${code} copied to clipboard.`,
    });
  };

  if (loading)
    return <div className="py-4 text-gray-500">Loading promo codes...</div>;
  if (!codes.length)
    return <div className="py-4 text-gray-500">No promo codes found.</div>;

  return (
    <div className="overflow-x-auto mt-6">
      <table className="min-w-full divide-y divide-gray-200">
        <thead>
          <tr>
            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
              Code
            </th>
            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
              Type
            </th>
            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
              Value
            </th>
            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
              Max Redemptions
            </th>
            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
              Expiry
            </th>
            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
              Status
            </th>
            <th className="px-4 py-2"></th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {codes.map((c) => {
            const isExpired =
              c.expires_at && new Date(c.expires_at) < new Date();
            return (
              <tr key={c.id}>
                <td className="px-4 py-2 font-mono text-base">{c.code}</td>
                <td className="px-4 py-2">
                  {c.percent_off ? "Percent" : "Amount"}
                </td>
                <td className="px-4 py-2">
                  {c.percent_off
                    ? `${c.percent_off}%`
                    : (typeof c.amount_off === 'number' ? `$${(c.amount_off / 100).toFixed(2)}` : "")}
                </td>
                <td className="px-4 py-2">{c.max_redemptions || "-"}</td>
                <td className="px-4 py-2">
                  {c.expires_at
                    ? new Date(c.expires_at).toLocaleDateString()
                    : "-"}
                </td>
                <td className="px-4 py-2">
                  {isExpired ? (
                    <span className="text-red-600 font-medium">Expired</span>
                  ) : (
                    <span className="text-green-600 font-medium">Active</span>
                  )}
                </td>
                <td className="px-4 py-2 text-right">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copyToClipboard(c.code)}
                  >
                    Copy
                  </Button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default function TrainerSettings() {
  const [notifications, setNotifications] = useState({
    email: true,
    sms: false,
    push: true,
  });
  const [showAddSessions, setShowAddSessions] = useState(false);
  const [showCreatePromo, setShowCreatePromo] = useState(false);
  const [trainerId, setTrainerId] = useState("");

  useEffect(() => {
    createClient()
      .auth.getUser()
      .then(({ data }) => {
        if (data?.user?.id) setTrainerId(data.user.id);
      });
  }, []);

  return (
    <>
      <header className="border-b bg-white px-6 py-4">
        <div className="flex items-center space-x-4">
          <SidebarTrigger />
          <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        </div>
      </header>

      <main className="p-6 max-w-4xl mx-auto">
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
            <CardContent className="py-8">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <tbody className="bg-white divide-y divide-gray-200">
                    <tr>
                      <td className="px-4 py-3 text-base font-medium text-gray-800">
                        Add Free Sessions to a user's account
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button
                          className="bg-red-600 hover:bg-red-700 text-white"
                          onClick={() => setShowAddSessions(true)}
                        >
                          Add Sessions to User
                        </Button>
                      </td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 text-base font-medium text-gray-800">
                        Create a Promo Code
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button
                          className="bg-red-600 hover:bg-red-700 text-white"
                          onClick={() => setShowCreatePromo(true)}
                        >
                          Create Promo Code
                        </Button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <AddSessionsModal
                open={showAddSessions}
                onOpenChange={setShowAddSessions}
              />
              <CreatePromoCodeModal
                open={showCreatePromo}
                onOpenChange={setShowCreatePromo}
              />
              {trainerId && <PromoCodesTable trainerId={trainerId} />}
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
        </div>
      </main>
    </>
  );
}
