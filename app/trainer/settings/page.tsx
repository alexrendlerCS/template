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

export default function TrainerSettings() {
  const [notifications, setNotifications] = useState({
    email: true,
    sms: false,
    push: true,
  });
  const [showAddSessions, setShowAddSessions] = useState(false);

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
                      <td
                        className="px-4 py-3 text-center text-gray-500 text-base font-medium"
                        colSpan={2}
                      >
                        More Promo Code/Discounts Options Coming Soon
                      </td>
                    </tr>
                  </tbody>
                </table>
                      </div>
              <AddSessionsModal
                open={showAddSessions}
                onOpenChange={setShowAddSessions}
                      />
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
