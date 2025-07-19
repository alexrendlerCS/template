"use client";

import { useState, useEffect, useRef } from "react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Calendar as CalendarIcon,
  Plus,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  AlertCircle,
  Loader2,
  Users,
  User,
  Clock,
  Edit,
  Move,
  Calendar,
} from "lucide-react";
import { GoogleCalendarBanner } from "@/components/GoogleCalendarBanner";
import { createClient } from "@/lib/supabaseClient";
import {
  DndContext,
  closestCenter,
  useDraggable,
  useDroppable,
  DragOverlay,
} from "@dnd-kit/core";
import { useToast } from "@/components/ui/use-toast";
import { DatePicker } from "@/components/DatePicker";
import { isGoogleCalendarEnabled } from "@/lib/config/features";

interface DatabaseSession {
  id: string;
  summary: string;
  description?: string;
  start: {
    dateTime: string;
  };
  end: {
    dateTime: string;
  };
  status: string;
  attendees?: Array<{
    email: string;
    displayName?: string;
    responseStatus?: string;
  }>;
  _dbData?: {
    client_id: string;
    trainer_id: string;
    type: string;
    notes?: string;
    duration_minutes?: number;
  };
  users?: {
    full_name: string;
    email: string;
  };
}

interface PackageInfo {
  client_id: string;
  client_name: string;
  package_type: string;
  sessions_included: number;
  sessions_used: number;
  remaining: number;
}

interface PackageSummary {
  [packageType: string]: {
    total_remaining: number;
    total_included: number;
    total_used: number;
  };
}

// Add color palette for clients
const clientColors = [
  { bg: "bg-red-50", border: "border-red-100", text: "text-red-900" },
  { bg: "bg-blue-50", border: "border-blue-100", text: "text-blue-900" },
  { bg: "bg-green-50", border: "border-green-100", text: "text-green-900" },
  { bg: "bg-purple-50", border: "border-purple-100", text: "text-purple-900" },
  { bg: "bg-orange-50", border: "border-orange-100", text: "text-orange-900" },
  { bg: "bg-teal-50", border: "border-teal-100", text: "text-teal-900" },
  { bg: "bg-pink-50", border: "border-pink-100", text: "text-pink-900" },
  { bg: "bg-indigo-50", border: "border-indigo-100", text: "text-indigo-900" },
];

// Helper function to get consistent color for a client
function getClientColor(
  clientEmail: string | undefined,
  clientName: string
): (typeof clientColors)[0] {
  // Create a consistent hash from client identifier
  const identifier = clientEmail || clientName;
  let hash = 0;
  for (let i = 0; i < identifier.length; i++) {
    hash = (hash << 5) - hash + identifier.charCodeAt(i);
    hash = hash & hash; // Convert to 32-bit integer
  }
  // Use absolute value of hash to get positive index
  const colorIndex = Math.abs(hash) % clientColors.length;
  return clientColors[colorIndex];
}

// Helper function to format event time
function formatEventTime(dateTimeStr: string) {
  const date = new Date(dateTimeStr);
  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

// Helper function to get client name from session
function getClientName(session: any): string {
  return (
    session.users?.full_name ||
    session.attendees?.[0]?.displayName ||
    "Unknown Client"
  );
}

// Helper function to get session type
function getSessionType(session: any): string {
  return session.type || session._dbData?.type || "Unknown Type";
}

const daysOfWeek = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

// Session types for trainer to choose from
const sessionTypes = [
  {
    id: "In-Person Training",
    name: "In-Person Training",
    duration: "60 min",
    description: "One-on-one personal training sessions at our facility",
  },
  {
    id: "Virtual Training",
    name: "Virtual Training",
    duration: "60 min",
    description: "Live online training sessions from the comfort of your home",
  },
  {
    id: "Partner Training",
    name: "Partner Training",
    duration: "60 min",
    description: "Train with a partner for a more engaging workout experience",
  },
];

export default function TrainerSchedulePage() {
  const [viewMode, setViewMode] = useState<"week" | "month">("week");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedClient, setSelectedClient] = useState("all");
  const [isAddSessionOpen, setIsAddSessionOpen] = useState(false);
  const [events, setEvents] = useState<DatabaseSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isGoogleConnected, setIsGoogleConnected] = useState(true);
  const [trainerAvailability, setTrainerAvailability] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [selectedClientForSession, setSelectedClientForSession] = useState("");
  const [selectedDateForSession, setSelectedDateForSession] = useState("");
  const [selectedTimeForSession, setSelectedTimeForSession] = useState("");
  const [selectedSessionType, setSelectedSessionType] = useState("");
  const [sessionNotes, setSessionNotes] = useState("");
  const [isCreatingSession, setIsCreatingSession] = useState(false);
  const [availableTimeSlots, setAvailableTimeSlots] = useState<string[]>([]);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [showErrorDialog, setShowErrorDialog] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [sessionTrackingInfo, setSessionTrackingInfo] = useState<{
    sessionsBefore: number;
    sessionsAfter: number;
    packageType: string;
    clientName: string;
  } | null>(null);
  const [packageInfo, setPackageInfo] = useState<PackageInfo[]>([]);
  const [packageSummary, setPackageSummary] = useState<PackageSummary>({});
  const [uniqueClients, setUniqueClients] = useState<string[]>([]);
  const supabase = createClient();
  const [activeDragSession, setActiveDragSession] =
    useState<DatabaseSession | null>(null);
  const [draggedSessionId, setDraggedSessionId] = useState<string | null>(null);
  const [dragOverDate, setDragOverDate] = useState<string | null>(null);
  const [showRescheduleDialog, setShowRescheduleDialog] = useState(false);
  const [rescheduleTarget, setRescheduleTarget] = useState<{
    session: DatabaseSession;
    newDateStr: string;
    newTime?: string;
  } | null>(null);
  const { toast } = useToast();
  const [isUpdating, setIsUpdating] = useState(false);
  const [isSyncingCalendar, setIsSyncingCalendar] = useState(false);
  const [feedbackDialog, setFeedbackDialog] = useState<{
    open: boolean;
    title: string;
    message: string;
  }>({ open: false, title: "", message: "" });
  const [isEditMode, setIsEditMode] = useState(false);
  const [showEditSessionDialog, setShowEditSessionDialog] = useState(false);
  const [editingSession, setEditingSession] = useState<DatabaseSession | null>(
    null
  );
  const [editSessionData, setEditSessionData] = useState({
    date: "",
    startTime: "",
    endTime: "",
    sessionType: "",
  });
  const [isUpdatingSession, setIsUpdatingSession] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const firstSessionRowRef = useRef<HTMLDivElement>(null);

  // Replace dynamic time slot logic with static 30-min slots from 12:00 AM to 11:30 PM
  function generateStaticTimeSlots() {
    const slots = [];
    let current = new Date(2000, 0, 1, 0, 0, 0); // 12:00 AM
    const end = new Date(2000, 0, 1, 23, 30, 0); // 11:30 PM
    while (current <= end) {
      slots.push(
        current.toLocaleTimeString("en-US", {
          hour: "numeric",
          minute: "2-digit",
          hour12: true,
        })
      );
      current.setMinutes(current.getMinutes() + 30);
    }
    return slots;
  }

  // Handle client filter from URL query parameter
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const clientParam = urlParams.get("client");
    if (clientParam) {
      const decodedClient = decodeURIComponent(clientParam);
      setSelectedClient(decodedClient);
    }
  }, []);

  // Function to get unique clients from database sessions
  const getUniqueClients = () => {
    return uniqueClients;
  };

  // Function to filter events by selected client
  const filterEventsByClient = (eventsToFilter: DatabaseSession[]) => {
    if (selectedClient === "all") {
      return eventsToFilter;
    }
    return eventsToFilter.filter((event) => {
      const clientName = getClientName(event);
      return clientName === selectedClient;
    });
  };

  // Function to sort events by client name
  const sortEventsByClient = (eventsToSort: DatabaseSession[]) => {
    return [...eventsToSort].sort((a, b) => {
      const clientA = getClientName(a);
      const clientB = getClientName(b);
      return clientA.localeCompare(clientB);
    });
  };

  // Function to fetch events
  const fetchEvents = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get current trainer's session
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.user) {
        throw new Error("No authenticated user found");
      }

      // Fetch sessions from database for this trainer
      const { data: sessionsData, error } = await supabase
        .from("sessions")
        .select(
          `
          id,
          client_id,
          trainer_id,
          date,
          start_time,
          end_time,
          type,
          status,
          notes,
          session_notes,
          created_at,
          users!sessions_client_id_fkey (
            full_name,
            email
          )
        `
        )
        .eq("trainer_id", session.user.id)
        .in("status", ["confirmed", "pending"])
        .order("date", { ascending: true })
        .order("start_time", { ascending: true });

      if (error) {
        console.error("Error fetching sessions:", error);
        setError("Failed to load sessions");
        return;
      }

      console.log("Fetched sessions from database:", sessionsData);

      // Convert database sessions to the format expected by the UI
      const convertedEvents =
        sessionsData?.map((session: any) => ({
          id: session.id,
          summary: `${session.type} with ${session.users?.full_name || "Unknown Client"}`,
          description: session.session_notes || session.notes || "",
          start: {
            dateTime: `${session.date}T${session.start_time}`,
          },
          end: {
            dateTime: `${session.date}T${session.end_time}`,
          },
          status: session.status,
          attendees: [
            {
              email: session.users?.email || "",
              displayName: session.users?.full_name || "Unknown Client",
              responseStatus: "accepted",
            },
          ],
          // Add database fields for reference
          _dbData: {
            client_id: session.client_id,
            trainer_id: session.trainer_id,
            type: session.type,
            notes: session.session_notes || session.notes,
            duration_minutes: session._dbData?.duration_minutes,
          },
        })) || [];

      setEvents(convertedEvents);

      // Extract unique client names from database sessions
      const clientNames = new Set<string>();
      sessionsData?.forEach((session: any) => {
        const clientName = session.users?.full_name;
        if (clientName && clientName !== "Unknown Client") {
          clientNames.add(clientName);
        }
      });

      const uniqueClientNames = Array.from(clientNames).sort();
      console.log(
        "👥 Extracted unique clients from sessions:",
        uniqueClientNames
      );
      setUniqueClients(uniqueClientNames);

      setIsGoogleConnected(true); // Keep this for UI consistency
    } catch (err) {
      setError("Failed to load sessions");
      console.error("Error fetching sessions:", err);
    } finally {
      setLoading(false);
    }
  };

  // Function to fetch clients
  const fetchClients = async () => {
    try {
      const { data: clientsData, error } = await supabase
        .from("users")
        .select("id, full_name, email")
        .eq("role", "client")
        .order("full_name");

      if (error) {
        console.error("Error fetching clients:", error);
        return;
      }

      setClients(clientsData || []);
    } catch (error) {
      console.error("Error fetching clients:", error);
    }
  };

  // Function to fetch package information for all clients
  const fetchPackageInfo = async () => {
    console.log("🚀 fetchPackageInfo called!");
    try {
      console.log("🔄 Starting package info fetch...");

      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.user) {
        console.log("❌ No session found, skipping package fetch");
        return;
      }

      console.log("👤 Fetching packages for trainer:", session.user.id);

      // Fetch all packages with client information
      const { data: packages, error } = await supabase
        .from("packages")
        .select(
          `
          *,
          users!packages_client_id_fkey (
            full_name,
            email
          )
        `
        )
        .eq("status", "active")
        .order("purchase_date", { ascending: false });

      if (error) {
        console.error("❌ Error fetching packages:", error);
        return;
      }

      console.log("📦 Raw packages data:", {
        totalPackages: packages?.length || 0,
        packages: packages?.map((pkg) => ({
          id: pkg.id,
          client_id: pkg.client_id,
          client_name: pkg.users?.full_name,
          package_type: pkg.package_type,
          sessions_included: pkg.sessions_included,
          sessions_used: pkg.sessions_used,
          status: pkg.status,
          remaining: (pkg.sessions_included || 0) - (pkg.sessions_used || 0),
        })),
      });

      // Process package data
      const processedPackages: PackageInfo[] =
        packages?.map((pkg) => ({
          client_id: pkg.client_id,
          client_name: pkg.users?.full_name || "Unknown Client",
          package_type: pkg.package_type,
          sessions_included: pkg.sessions_included || 0,
          sessions_used: pkg.sessions_used || 0,
          remaining: (pkg.sessions_included || 0) - (pkg.sessions_used || 0),
        })) || [];

      console.log("🔧 Processed packages:", {
        totalProcessed: processedPackages.length,
        packages: processedPackages,
      });

      console.log("🔄 Setting packageInfo state with:", processedPackages);
      setPackageInfo(processedPackages);

      // Calculate summary for all clients
      const summary: PackageSummary = {};
      processedPackages.forEach((pkg) => {
        if (!summary[pkg.package_type]) {
          summary[pkg.package_type] = {
            total_remaining: 0,
            total_included: 0,
            total_used: 0,
          };
        }
        summary[pkg.package_type].total_remaining += pkg.remaining;
        summary[pkg.package_type].total_included += pkg.sessions_included;
        summary[pkg.package_type].total_used += pkg.sessions_used;
      });

      console.log("📊 Package summary for all clients:", summary);
      console.log("🔄 Setting packageSummary state with:", summary);
      setPackageSummary(summary);

      // Log breakdown by client
      const clientBreakdown = processedPackages.reduce(
        (acc, pkg) => {
          if (!acc[pkg.client_name]) {
            acc[pkg.client_name] = {};
          }
          if (!acc[pkg.client_name][pkg.package_type]) {
            acc[pkg.client_name][pkg.package_type] = {
              remaining: 0,
              included: 0,
              used: 0,
            };
          }
          acc[pkg.client_name][pkg.package_type].remaining += pkg.remaining;
          acc[pkg.client_name][pkg.package_type].included +=
            pkg.sessions_included;
          acc[pkg.client_name][pkg.package_type].used += pkg.sessions_used;
          return acc;
        },
        {} as Record<
          string,
          Record<string, { remaining: number; included: number; used: number }>
        >
      );

      console.log("👥 Package breakdown by client:", clientBreakdown);
    } catch (error) {
      console.error("❌ Error fetching package info:", error);
    }
  };

  // Initial load
  useEffect(() => {
    console.log("🏁 Initial useEffect triggered");
    console.log(
      "🔍 fetchPackageInfo function exists:",
      typeof fetchPackageInfo
    );
    fetchEvents();
    fetchClients();
    console.log("📦 About to call fetchPackageInfo...");
    fetchPackageInfo();
    console.log("✅ Initial useEffect completed");
  }, []);

  // Refetch package info when events are updated (new sessions created)
  useEffect(() => {
    if (events.length > 0) {
      fetchPackageInfo();
    }
  }, [events]);

  // Log when selected client changes
  useEffect(() => {
    console.log("🔄 Selected client changed:", {
      selectedClient,
      timestamp: new Date().toISOString(),
    });
  }, [selectedClient]);

  // Log when package state changes
  useEffect(() => {
    console.log("📦 packageInfo state changed:", {
      length: packageInfo.length,
      packages: packageInfo,
    });
  }, [packageInfo]);

  useEffect(() => {
    console.log("📊 packageSummary state changed:", packageSummary);
  }, [packageSummary]);

  // Generate time slots when date is selected
  useEffect(() => {
    generateTimeSlotsForDate(selectedDateForSession);
  }, [selectedDateForSession, trainerAvailability]);

  // Function to generate time slots based on trainer availability for a specific date
  const generateTimeSlotsForDate = (date: string) => {
    if (!date || !trainerAvailability.length) {
      setAvailableTimeSlots([]);
      return;
    }

    // Parse the date string as local time to avoid timezone issues
    const [year, month, day] = date.split("-").map(Number);
    const selectedDate = new Date(year, month - 1, day); // Local time
    // JS: 0=Sunday, 1=Monday, ..., 6=Saturday
    // DB: 0=Sunday, 1=Monday, ..., 6=Saturday (same as JS)
    const jsDay = selectedDate.getDay();
    const weekday = jsDay; // Keep 0-6 numbering (Sunday=0, Monday=1, etc.)

    // Find availability for this weekday
    const dayAvailability = trainerAvailability.filter(
      (availability) => availability.weekday === weekday
    );

    if (dayAvailability.length === 0) {
      setAvailableTimeSlots([]);
      return;
    }

    const timeSlotsSet = new Set<string>();

    dayAvailability.forEach((availability) => {
      const startTime = new Date(`2000-01-01T${availability.start_time}`);
      const endTime = new Date(`2000-01-01T${availability.end_time}`);

      // Generate 30-minute slots from start_time to end_time - 1 hour
      let currentTime = new Date(startTime);
      const endTimeMinusOneHour = new Date(endTime.getTime() - 60 * 60 * 1000); // Subtract 1 hour

      while (currentTime <= endTimeMinusOneHour) {
        const timeString = currentTime.toLocaleTimeString("en-US", {
          hour: "numeric",
          minute: "2-digit",
          hour12: true,
        });
        timeSlotsSet.add(timeString);
        currentTime.setMinutes(currentTime.getMinutes() + 30); // Add 30 minutes
      }
    });

    // Convert to array and sort
    const sortedTimeSlots = Array.from(timeSlotsSet).sort((a, b) => {
      const timeA = new Date(`2000-01-01T${a}`);
      const timeB = new Date(`2000-01-01T${b}`);
      return timeA.getTime() - timeB.getTime();
    });

    setAvailableTimeSlots(sortedTimeSlots);
  };

  // Function to create a new session
  const handleCreateSession = async () => {
    console.debug("=== SESSION CREATION STARTED ===");
    console.debug("Form data:", {
      client: selectedClientForSession,
      date: selectedDateForSession,
      time: selectedTimeForSession,
      type: selectedSessionType,
      notes: sessionNotes,
    });

    if (
      !selectedClientForSession ||
      !selectedDateForSession ||
      !selectedTimeForSession ||
      !selectedSessionType
    ) {
      console.warn("❌ Missing required form data");
      return;
    }

    setIsCreatingSession(true);

    try {
      // Get current trainer's session
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.user) {
        throw new Error("No authenticated user found");
      }

      // Parse selectedTimeForSession (e.g., "10:30 AM") to HH:mm:ss
      const timeMatch = selectedTimeForSession.match(/(\d+):(\d+)\s*(AM|PM)/);
      let startHour = parseInt(timeMatch?.[1] || "0", 10);
      const startMinute = parseInt(timeMatch?.[2] || "0", 10);
      const period = timeMatch?.[3] || "AM";
      if (period === "PM" && startHour !== 12) startHour += 12;
      if (period === "AM" && startHour === 12) startHour = 0;
      const startTimeStr = `${String(startHour).padStart(2, "0")}:${String(startMinute).padStart(2, "0")}:00`;

      // Calculate end time (60 minutes after start time)
      const endDate = new Date(`2000-01-01T${startTimeStr}`);
      endDate.setMinutes(endDate.getMinutes() + 60);
      const endTimeStr = endDate.toTimeString().slice(0, 8);

      // Check for existing session conflicts using overlap logic (like client booking)
      console.debug("=== SESSION CONFLICT CHECK DEBUG ===");
      console.debug("Selected client ID:", selectedClientForSession);
      console.debug("Selected date (raw):", selectedDateForSession);
      console.debug("Selected date type:", typeof selectedDateForSession);
      console.debug("Selected time (raw):", startTimeStr);
      console.debug("Selected time type:", typeof startTimeStr);
      console.debug("Calculated end time:", endTimeStr);

      // Helper function to convert time string to minutes since midnight
      const timeToMinutes = (time: string): number => {
        const [hours, minutes] = time
          .split(":")
          .map((num) => parseInt(num, 10));
        return hours * 60 + minutes;
      };

      // Helper function to check if two time slots overlap
      const doSessionsOverlap = (
        start1: string,
        end1: string,
        start2: string,
        end2: string
      ): boolean => {
        const start1Mins = timeToMinutes(start1);
        const end1Mins = timeToMinutes(end1);
        const start2Mins = timeToMinutes(start2);
        const end2Mins = timeToMinutes(end2);

        // Sessions overlap if one doesn't end before the other starts
        const overlaps = !(end1Mins <= start2Mins || end2Mins <= start1Mins);

        console.debug(
          `Overlap check: ${start1}-${end1} vs ${start2}-${end2} = ${overlaps}`
        );
        console.debug(
          `  Times in minutes: ${start1Mins}-${end1Mins} vs ${start2Mins}-${end2Mins}`
        );

        return overlaps;
      };

      // Get ALL sessions for this client on this date
      console.debug("Fetching ALL sessions for client on this date...");
      const { data: allClientSessions, error: clientSessionsError } =
        await supabase
          .from("sessions")
          .select("*")
          .eq("client_id", selectedClientForSession)
          .eq("date", selectedDateForSession)
          .in("status", ["confirmed", "pending"]);

      if (clientSessionsError) {
        console.error("Error fetching client sessions:", clientSessionsError);
      }

      console.debug("All client sessions on this date:", allClientSessions);

      // Check for client session overlaps
      let clientHasConflict = false;
      if (allClientSessions && allClientSessions.length > 0) {
        console.debug("=== CLIENT SESSION OVERLAP CHECK ===");
        for (const existingSession of allClientSessions) {
          const overlaps = doSessionsOverlap(
            startTimeStr,
            endTimeStr,
            existingSession.start_time,
            existingSession.end_time
          );

          if (overlaps) {
            console.warn("🚨 CLIENT CONFLICT FOUND:", {
              existingSession: {
                id: existingSession.id,
                start_time: existingSession.start_time,
                end_time: existingSession.end_time,
                type: existingSession.type,
                status: existingSession.status,
              },
              requestedSession: {
                start_time: startTimeStr,
                end_time: endTimeStr,
              },
            });
            clientHasConflict = true;
            break;
          }
        }
      }

      // Get ALL sessions for this trainer on this date
      console.debug("Fetching ALL sessions for trainer on this date...");
      const { data: allTrainerSessions, error: trainerSessionsError } =
        await supabase
          .from("sessions")
          .select("*")
          .eq("trainer_id", session.user.id)
          .eq("date", selectedDateForSession)
          .in("status", ["confirmed", "pending"]);

      if (trainerSessionsError) {
        console.error("Error fetching trainer sessions:", trainerSessionsError);
      }

      console.debug("All trainer sessions on this date:", allTrainerSessions);

      // Check for trainer session overlaps
      let trainerHasConflict = false;
      if (allTrainerSessions && allTrainerSessions.length > 0) {
        console.debug("=== TRAINER SESSION OVERLAP CHECK ===");
        for (const existingSession of allTrainerSessions) {
          const overlaps = doSessionsOverlap(
            startTimeStr,
            endTimeStr,
            existingSession.start_time,
            existingSession.end_time
          );

          if (overlaps) {
            console.warn("🚨 TRAINER CONFLICT FOUND:", {
              existingSession: {
                id: existingSession.id,
                client_id: existingSession.client_id,
                start_time: existingSession.start_time,
                end_time: existingSession.end_time,
                type: existingSession.type,
                status: existingSession.status,
              },
              requestedSession: {
                start_time: startTimeStr,
                end_time: endTimeStr,
              },
            });
            trainerHasConflict = true;
            break;
          }
        }
      }

      // Check for exact time match (original logic)
      console.debug("=== EXACT TIME MATCH CHECK ===");
      const { data: exactTimeSessions, error: exactTimeError } = await supabase
        .from("sessions")
        .select("*")
        .eq("client_id", selectedClientForSession)
        .eq("date", selectedDateForSession)
        .eq("start_time", startTimeStr)
        .in("status", ["confirmed", "pending"]);

      console.debug("Exact time match sessions:", exactTimeSessions);

      if (exactTimeError) {
        console.error("Error checking exact time match:", exactTimeError);
      }

      // Check for errors in fetching sessions
      if (clientSessionsError || trainerSessionsError || exactTimeError) {
        setErrorMessage(
          "Error checking for existing sessions. Please try again."
        );
        setShowErrorDialog(true);
        setIsCreatingSession(false);
        return;
      }

      // Check for conflicts using overlap logic
      if (clientHasConflict) {
        console.warn("🚨 BOOKING BLOCKED: Client has conflicting session");
        setErrorMessage(
          "This client already has a session booked that overlaps with the selected time."
        );
        setShowErrorDialog(true);
        setIsCreatingSession(false);
        return;
      }

      if (trainerHasConflict) {
        console.warn("🚨 BOOKING BLOCKED: Trainer has conflicting session");
        setErrorMessage(
          "You already have a session booked that overlaps with the selected time."
        );
        setShowErrorDialog(true);
        setIsCreatingSession(false);
        return;
      }

      // Also check for exact time match (for debugging)
      if (exactTimeSessions && exactTimeSessions.length > 0) {
        console.warn(
          "🚨 EXACT TIME MATCH FOUND (but no overlap detected):",
          exactTimeSessions
        );
        console.warn(
          "Comparing startTimeStr:",
          startTimeStr,
          "with DB start_time(s):",
          exactTimeSessions.map((s: any) => s.start_time)
        );
      }

      console.debug("✅ No conflicts found - proceeding with session creation");

      // Check package availability BEFORE creating the session
      console.debug("=== PACKAGE AVAILABILITY CHECK ===");
      const { data: packages, error: packageError } = await supabase
        .from("packages")
        .select("*")
        .eq("client_id", selectedClientForSession)
        .eq("package_type", selectedSessionType)
        .eq("status", "active")
        .order("expiry_date", { ascending: true });

      if (packageError) {
        console.error("Error fetching packages:", packageError);
        setErrorMessage(
          "Error checking client's package availability. Please try again."
        );
        setShowErrorDialog(true);
        setIsCreatingSession(false);
        return;
      }

      // Log all packages for debugging
      console.debug("All packages for client:", {
        clientId: selectedClientForSession,
        sessionType: selectedSessionType,
        totalPackages: packages?.length || 0,
        packages: packages?.map((p) => ({
          id: p.id,
          package_type: p.package_type,
          sessions_included: p.sessions_included,
          sessions_used: p.sessions_used,
          status: p.status,
          expiry_date: p.expiry_date,
          available: (p.sessions_included || 0) > (p.sessions_used || 0),
        })),
      });

      // Find the first package with available sessions
      const packageToUpdate = packages?.find(
        (pkg) => (pkg.sessions_included || 0) > (pkg.sessions_used || 0)
      );

      console.debug("Selected package to update:", packageToUpdate);

      if (!packageToUpdate) {
        // Provide detailed error message based on what we found
        if (!packages || packages.length === 0) {
          setErrorMessage(
            `This client has no active packages for "${selectedSessionType}". Please ask them to purchase a package first.`
          );
        } else {
          const expiredPackages = packages.filter(
            (p) => p.expiry_date && new Date(p.expiry_date) < new Date()
          );
          const usedUpPackages = packages.filter(
            (p) => (p.sessions_included || 0) <= (p.sessions_used || 0)
          );

          if (expiredPackages.length > 0) {
            setErrorMessage(
              `This client's "${selectedSessionType}" package has expired. Please ask them to renew their package.`
            );
          } else if (usedUpPackages.length > 0) {
            setErrorMessage(
              `This client has used all sessions in their "${selectedSessionType}" package. Please ask them to purchase more sessions.`
            );
          } else {
            setErrorMessage(
              `This client does not have any available sessions for "${selectedSessionType}". Please ask them to purchase or renew a package.`
            );
          }
        }
        setShowErrorDialog(true);
        setIsCreatingSession(false);
        return;
      }

      console.debug(
        "✅ Package availability confirmed - proceeding with session creation"
      );

      const userTimezone =
        Intl.DateTimeFormat().resolvedOptions().timeZone || "America/Denver";
      // Insert into sessions table
      const { data: sessionData, error: sessionError } = await supabase
        .from("sessions")
        .insert({
          client_id: selectedClientForSession,
          trainer_id: session.user.id,
          date: selectedDateForSession,
          start_time: startTimeStr,
          end_time: endTimeStr,
          duration_minutes: null,
          type: selectedSessionType,
          status: "confirmed",
          notes: null,
          is_recurring: false,
          google_event_id: null,
          session_notes: sessionNotes || null,
          timezone: userTimezone,
        })
        .select()
        .single();

      if (sessionError) {
        setErrorMessage("Failed to create session. Please try again.");
        setShowErrorDialog(true);
        throw sessionError;
      }

      // Store session count before booking
      const sessionsBefore = packageToUpdate.sessions_used || 0;
      const sessionsAfter = sessionsBefore + 1;

      // Now update the package (increment sessions_used)
      console.debug("Updating package:", {
        packageId: packageToUpdate.id,
        currentSessionsUsed: packageToUpdate.sessions_used,
        newSessionsUsed: (packageToUpdate.sessions_used || 0) + 1,
        packageType: packageToUpdate.package_type,
        clientId: packageToUpdate.client_id,
      });

      const { data: updateData, error: updateError } = await supabase
        .from("packages")
        .update({ sessions_used: (packageToUpdate.sessions_used || 0) + 1 })
        .eq("id", packageToUpdate.id)
        .select();

      console.debug("Package update result:", { updateData, updateError });

      if (updateError) {
        console.error("Package update error:", updateError);
        setErrorMessage(
          "Error updating package usage. Session was created, but package usage was not updated."
        );
        setShowErrorDialog(true);
        setIsCreatingSession(false);
        return;
      }

      // Get client and trainer details for calendar event
      const selectedClient = clients.find(
        (c) => c.id === selectedClientForSession
      );

      let calendarSuccess = true;
      let calendarErrorMsg = "";
      let trainerEventId = null;
      let clientEventId = null;

      if (selectedClient) {
        // Create calendar event for trainer
        const baseEventDetails = {
          description: `${selectedSessionType} training session${sessionNotes ? ` - ${sessionNotes}` : ""}`,
          start: {
            dateTime: `${selectedDateForSession}T${startTimeStr}`,
            timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          },
          end: {
            dateTime: `${selectedDateForSession}T${endTimeStr}`,
            timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          },
          attendees: [
            { email: selectedClient.email },
            { email: session.user.email || "" },
          ],
          reminders: {
            useDefault: true,
          },
        };

        // Trainer calendar event
        try {
          const trainerEventDetails = {
            ...baseEventDetails,
            summary: `${selectedSessionType} with ${selectedClient.full_name}`,
          };

          const trainerEventResponse = await fetch(
            `/api/google/calendar/event?trainerId=${session.user.id}`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify(trainerEventDetails),
            }
          );

          if (trainerEventResponse.ok) {
            const trainerEventData = await trainerEventResponse.json();
            trainerEventId = trainerEventData.eventId;
          } else {
            calendarSuccess = false;
            calendarErrorMsg += "Failed to create trainer calendar event. ";
          }
        } catch (error) {
          calendarSuccess = false;
          calendarErrorMsg += "Error creating trainer calendar event. ";
        }

        // Client calendar event
        try {
          const clientEventDetails = {
            ...baseEventDetails,
            summary: `${selectedSessionType} with ${session.user.user_metadata?.full_name || "Trainer"}`,
          };

          const clientEventResponse = await fetch(
            `/api/google/calendar/client-event?clientId=${selectedClientForSession}`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify(clientEventDetails),
            }
          );

          if (clientEventResponse.ok) {
            const clientEventData = await clientEventResponse.json();
            clientEventId = clientEventData.eventId;
          } else {
            calendarSuccess = false;
            // Check if the client doesn't have Google Calendar connected
            if (clientEventResponse.status === 400) {
              const responseText = await clientEventResponse.text();
              if (
                responseText.includes("Client Google Calendar not connected")
              ) {
                calendarErrorMsg +=
                  "Client's Google Calendar is not connected. The session was booked successfully, but the client will need to connect their Google Calendar to view it there. ";
              } else {
                calendarErrorMsg += "Failed to create client calendar event. ";
              }
            } else {
              calendarErrorMsg += "Failed to create client calendar event. ";
            }
          }
        } catch (error) {
          calendarSuccess = false;
          // Check if the error is related to Google Calendar not being connected
          if (
            error instanceof Error &&
            error.message.includes("Client Google Calendar not connected")
          ) {
            calendarErrorMsg +=
              "Client's Google Calendar is not connected. The session was booked successfully, but the client will need to connect their Google Calendar to view it there. ";
          } else {
            calendarErrorMsg += "Error creating client calendar event. ";
          }
        }
      }

      // Reset form and close dialog
      setSelectedClientForSession("");
      setSelectedDateForSession("");
      setSelectedTimeForSession("");
      setSelectedSessionType("");
      setSessionNotes("");
      setIsAddSessionOpen(false);

      // Refresh events
      fetchEvents();

      // Refresh package information to update session counts
      fetchPackageInfo();

      // Get client name and package type for tracking info
      const clientForTracking = clients.find(
        (c) => c.id === selectedClientForSession
      );
      const selectedSessionTypeName =
        sessionTypes.find((t) => t.id === selectedSessionType)?.name ||
        selectedSessionType;

      // Set session tracking information
      setSessionTrackingInfo({
        sessionsBefore,
        sessionsAfter,
        packageType: selectedSessionTypeName,
        clientName: clientForTracking?.full_name || "Unknown Client",
      });

      // Show success or error dialog
      if (calendarSuccess) {
        console.debug("✅ Session created successfully with calendar events");
        setShowSuccessDialog(true);
      } else {
        console.warn(
          "⚠️ Session created but calendar events failed:",
          calendarErrorMsg
        );
        setErrorMessage(
          calendarErrorMsg ||
            "Session booked, but there was a problem adding to Google Calendar."
        );
        setShowErrorDialog(true);
      }

      // After creating calendar events, update the session with the event IDs
      if (trainerEventId || clientEventId) {
        try {
          const updateData: any = {};
          if (trainerEventId) {
            updateData.google_event_id = trainerEventId;
          }
          if (clientEventId) {
            updateData.client_google_event_id = clientEventId;
          }
          await supabase
            .from("sessions")
            .update(updateData)
            .eq("id", sessionData.id);
        } catch (error) {
          console.error(
            "Error updating session with Google Calendar event IDs:",
            error
          );
        }
      }

      // Send email notification to trainer
      try {
        // Format time strings to 12-hour format
        const formatTimeTo12Hour = (timeStr: string) => {
          const [hours, minutes] = timeStr.split(":");
          const hour = parseInt(hours, 10);
          const period = hour >= 12 ? "PM" : "AM";
          const formattedHour = hour % 12 || 12;
          return `${formattedHour}:${minutes} ${period}`;
        };

        const emailPayload = {
          trainer_email: session.user.email || "",
          trainer_name: session.user.user_metadata?.full_name || "Trainer",
          client_name: selectedClient?.full_name || "Client",
          date: selectedDateForSession,
          start_time: formatTimeTo12Hour(startTimeStr),
          end_time: formatTimeTo12Hour(endTimeStr),
          session_type: selectedSessionTypeName,
          notes: sessionNotes || undefined,
        };

        await fetch("/api/email/session-created", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(emailPayload),
        });

        console.debug("✅ Email notification sent successfully");
      } catch (emailError) {
        console.error("❌ Failed to send email notification:", emailError);
        // Don't fail the session creation if email fails
      }
    } catch (error) {
      console.error("❌ Error creating session:", error);
      setErrorMessage(
        "An unexpected error occurred while creating the session. Please try again."
      );
      setShowErrorDialog(true);
    } finally {
      setIsCreatingSession(false);
    }
  };

  const getWeekDates = (date: Date) => {
    const week = [];
    const startOfWeek = new Date(date);
    const day = startOfWeek.getDay();
    const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1); // Adjust for Monday start
    startOfWeek.setDate(diff);

    for (let i = 0; i < 7; i++) {
      const day = new Date(startOfWeek);
      day.setDate(startOfWeek.getDate() + i);
      week.push(day);
    }
    return week;
  };

  const getSessionsForDate = (date: Date) => {
    const filteredEvents = events.filter((event) => {
      const eventDate = new Date(event.start.dateTime);
      return (
        eventDate.getFullYear() === date.getFullYear() &&
        eventDate.getMonth() === date.getMonth() &&
        eventDate.getDate() === date.getDate()
      );
    });

    // Apply client filtering and sorting
    const clientFilteredEvents = filterEventsByClient(filteredEvents);
    const sortedEvents = sortEventsByClient(clientFilteredEvents);

    console.log(`Sessions for ${date.toDateString()}:`, sortedEvents);
    return sortedEvents;
  };

  const getSessionsForTimeSlot = (date: Date, time: string) => {
    const sessions = getSessionsForDate(date);
    // Compute slot start and end time
    const slotMatch = time.match(/(\d+):(\d+)\s*(AM|PM)/);
    if (!slotMatch) return [];
    let slotHour = parseInt(slotMatch[1]);
    const slotMinute = parseInt(slotMatch[2]);
    const slotPeriod = slotMatch[3];
    if (slotPeriod === "PM" && slotHour !== 12) slotHour += 12;
    if (slotPeriod === "AM" && slotHour === 12) slotHour = 0;
    const slotStart = new Date(date);
    slotStart.setHours(slotHour, slotMinute, 0, 0);
    const slotEnd = new Date(slotStart.getTime() + 30 * 60 * 1000); // 30 min slot

    return sessions.filter((session) => {
      const eventStart = new Date(session.start.dateTime);
      const eventEnd = new Date(session.end.dateTime);
      // Check if session overlaps this slot
      return eventStart < slotEnd && eventEnd > slotStart;
    });
  };

  const navigateWeek = (direction: "prev" | "next") => {
    setCurrentDate((prev) => {
      const newDate = new Date(prev);
      newDate.setDate(prev.getDate() + (direction === "prev" ? -7 : 7));
      return newDate;
    });
  };

  const navigateMonth = (direction: "prev" | "next") => {
    setCurrentDate((prev) => {
      const newDate = new Date(prev);
      if (direction === "prev") {
        newDate.setMonth(prev.getMonth() - 1);
      } else {
        newDate.setMonth(prev.getMonth() + 1);
      }
      return newDate;
    });
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }

    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(day);
    }

    return days;
  };

  const isToday = (day: number | null) => {
    if (!day) return false;
    const today = new Date();
    return (
      today.getDate() === day &&
      today.getMonth() === currentDate.getMonth() &&
      today.getFullYear() === currentDate.getFullYear()
    );
  };

  const getSessionsForDay = (day: number | null) => {
    if (!day) return [];

    const filteredEvents = events.filter((event) => {
      const eventDate = new Date(event.start.dateTime);
      return (
        eventDate.getFullYear() === currentDate.getFullYear() &&
        eventDate.getMonth() === currentDate.getMonth() &&
        eventDate.getDate() === day
      );
    });

    // Apply client filtering and sorting
    const clientFilteredEvents = filterEventsByClient(filteredEvents);
    const sortedEvents = sortEventsByClient(clientFilteredEvents);

    return sortedEvents;
  };

  const renderEvent = (event: DatabaseSession) => {
    const clientName = getClientName(event);
    const sessionType = getSessionType(event);
    const startTime = new Date(event.start.dateTime);
    const endTime = new Date(event.end.dateTime);
    const duration = (endTime.getTime() - startTime.getTime()) / (1000 * 60); // in minutes

    // Get client's email from users field or attendees as fallback
    const clientEmail = event.users?.email || event.attendees?.[0]?.email;
    const clientColor = getClientColor(clientEmail, clientName);

    const handleSessionClick = (e: React.MouseEvent) => {
      e.stopPropagation();
      if (isEditMode) {
        openEditSessionDialog(event);
      }
    };

    return (
      <div
        key={event.id}
        className={`rounded-md p-2 ${clientColor.bg} ${clientColor.border} border shadow-sm hover:shadow-md transition-all duration-200 transform hover:scale-[1.02] ${
          isEditMode ? "cursor-pointer" : "cursor-grab"
        }`}
        onClick={handleSessionClick}
      >
        <div
          className={`text-xs font-bold ${clientColor.text} mb-1 leading-tight`}
        >
          {sessionType}
        </div>
        <div
          className={`text-xs ${clientColor.text} opacity-90 font-medium leading-tight`}
        >
          with {clientName}
        </div>
        <div
          className={`text-xs ${clientColor.text} opacity-75 mt-1 flex items-center gap-1`}
        >
          <Clock className="h-3 w-3" />
          {formatEventTime(event.start.dateTime)} -{" "}
          {formatEventTime(event.end.dateTime)}
        </div>
        {event.description && (
          <div
            className={`text-xs ${clientColor.text} opacity-60 mt-1 line-clamp-2`}
          >
            {event.description}
          </div>
        )}
      </div>
    );
  };

  const handleDragStart = (event: any) => {
    const session = events.find((s) => s.id === event.active.id);
    setActiveDragSession(session || null);
    setDraggedSessionId(event.active.id);
  };
  const handleDragEnd = (event: any) => {
    setActiveDragSession(null);
    setDraggedSessionId(null);
    setDragOverDate(null);
    if (!event.over || !event.active) return;
    const session = events.find((s) => s.id === event.active.id);
    if (!session) return;
    // Debug: log drop target ID
    console.log("DnD drop target ID:", event.over.id);
    // Parse new date and time from drop target id using '|', decode time
    const [newDateStr, encodedTime] = event.over.id.split("|");
    console.log("Parsed newDateStr:", newDateStr, "encodedTime:", encodedTime);
    const newTime = decodeURIComponent(encodedTime);
    console.log("Decoded newTime:", newTime);
    // Parse old date and time
    const oldDate = session.start.dateTime.split("T")[0];
    const oldTime = formatEventTime(session.start.dateTime);
    // If dropped on the same slot, do nothing
    if (oldDate === newDateStr && oldTime === newTime) {
      return;
    }
    // Open confirmation dialog
    setRescheduleTarget({ session, newDateStr, newTime });
    setShowRescheduleDialog(true);
  };
  const handleDragOver = (event: any) => {
    if (event.over) {
      setDragOverDate(event.over.id);
    } else {
      setDragOverDate(null);
    }
  };

  const openEditSessionDialog = (session: DatabaseSession) => {
    const sessionDate = session.start.dateTime.split("T")[0];
    const startTime = session.start.dateTime.split("T")[1].slice(0, 5); // HH:MM format
    const sessionTypeValue = session._dbData?.type || "Training";

    // Calculate end time as 1 hour after start time
    const calculateEndTime = (startTimeStr: string) => {
      const [hours, minutes] = startTimeStr.split(":").map(Number);
      const startDate = new Date(2000, 0, 1, hours, minutes);
      startDate.setHours(startDate.getHours() + 1);
      return `${String(startDate.getHours()).padStart(2, "0")}:${String(startDate.getMinutes()).padStart(2, "0")}`;
    };

    const endTime = calculateEndTime(startTime);

    setEditingSession(session);
    setEditSessionData({
      date: sessionDate,
      startTime: startTime,
      endTime: endTime,
      sessionType: sessionTypeValue,
    });
    setShowEditSessionDialog(true);
  };

  const handleUpdateSession = async () => {
    if (!editingSession) return;

    setIsUpdatingSession(true);
    try {
      // Validate inputs
      if (
        !editSessionData.date ||
        !editSessionData.startTime ||
        !editSessionData.endTime ||
        !editSessionData.sessionType
      ) {
        setFeedbackDialog({
          open: true,
          title: "Validation Error",
          message: "Please fill in all required fields.",
        });
        return;
      }

      // Check for overlaps
      if (
        isOverlap(
          events,
          editSessionData.date,
          editSessionData.startTime,
          editSessionData.endTime,
          editingSession.id,
          String(editingSession._dbData?.trainer_id || "")
        )
      ) {
        setFeedbackDialog({
          open: true,
          title: "Error",
          message:
            "There is already a session at this day and time. Please choose a different time.",
        });
        return;
      }

      // Update session via API
      const response = await fetch(`/api/sessions/${editingSession.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: editSessionData.date,
          start_time: editSessionData.startTime,
          end_time: editSessionData.endTime,
          type: editSessionData.sessionType,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setFeedbackDialog({
          open: true,
          title: "Error",
          message: data.error || "Failed to update session",
        });
        return;
      }

      // Sync Google Calendar events
      try {
        if (isGoogleCalendarEnabled()) {
          await syncGoogleCalendarEvents(
            editingSession,
            editSessionData.date,
            editSessionData.startTime,
            editSessionData.endTime
          );
          setFeedbackDialog({
            open: true,
            title: "Session Updated",
            message: `Session updated successfully. Google Calendar events have been synchronized.`,
          });
        } else {
          setFeedbackDialog({
            open: true,
            title: "Session Updated",
            message: `Session updated successfully.`,
          });
        }
      } catch (syncError) {
        console.error("[Calendar Sync Error]:", syncError);
        setFeedbackDialog({
          open: true,
          title: "Session Updated",
          message: `Session updated successfully. Note: Google Calendar sync failed.`,
        });
      }

      setShowEditSessionDialog(false);
      setEditingSession(null);

      // Refresh events
      await fetchEvents();
    } catch (error) {
      console.error("Error updating session:", error);
      setFeedbackDialog({
        open: true,
        title: "Error",
        message: "Failed to update session. Please try again.",
      });
    } finally {
      setIsUpdatingSession(false);
    }
  };

  // Find the first time slot index with a session in the current week
  function getFirstSessionRowIndex() {
    const weekDates = getWeekDates(currentDate);
    const timeSlots = generateStaticTimeSlots();
    for (let i = 0; i < timeSlots.length; i++) {
      for (let j = 0; j < weekDates.length; j++) {
        const sessions = getSessionsForTimeSlot(weekDates[j], timeSlots[i]);
        if (sessions.length > 0) {
          return i;
        }
      }
    }
    return null;
  }

  // Auto-scroll to the first session row when events or week change
  useEffect(() => {
    const firstIndex = getFirstSessionRowIndex();
    if (
      firstIndex !== null &&
      scrollContainerRef.current &&
      firstSessionRowRef.current
    ) {
      const container = scrollContainerRef.current;
      let targetRow = firstSessionRowRef.current;
      // Try to get the previous sibling (row above), but only if it's an HTMLDivElement
      const prev = targetRow.previousElementSibling;
      if (prev && prev instanceof HTMLDivElement) {
        targetRow = prev;
      }
      const headerHeight = 48; // Adjust if your header is taller/shorter
      const rowHeight = targetRow.offsetHeight;
      container.scrollTop = targetRow.offsetTop - container.offsetTop - headerHeight + rowHeight / 2;
    }
  }, [events, currentDate]);

  // Update renderWeekView to use DroppableTimeSlot for each cell
  const renderWeekView = () => {
    const weekDates = getWeekDates(currentDate);
    const startDate = weekDates[0];
    const endDate = weekDates[6];
    const timeSlots = generateStaticTimeSlots();
    const firstSessionRowIndex = getFirstSessionRowIndex();

    return (
      <DndContext
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragOver={handleDragOver}
      >
        <div className="flex flex-col h-full">
          {/* Sticky header group: controls + days/dates header */}
          <div className="sticky top-0 z-30 bg-white">
            <div className="flex items-center justify-between mb-0 px-2 sm:px-4 pt-4 pb-2 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div className="w-1 h-8 bg-gradient-to-b from-red-500 to-red-600 rounded-full"></div>
                <h2 className="text-lg sm:text-xl font-bold text-gray-900">
                  Week of {startDate.toLocaleDateString("en-US", { month: "long", day: "numeric" })} - {endDate.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
                </h2>
              </div>
              <div className="flex items-center gap-2">
                {/* Edit Mode Toggle */}
                <div className="flex items-center gap-2 mr-4 border-r border-gray-300 pr-4">
                  <span className="text-sm font-medium text-gray-700">Mode:</span>
                  <div className="flex bg-gray-100 rounded-lg p-1">
                    <button
                      onClick={() => setIsEditMode(false)}
                      className={`flex items-center gap-1 px-3 py-1 rounded-md text-sm font-medium transition-colors ${!isEditMode ? "bg-red-600 text-white shadow-sm" : "text-gray-600 hover:text-gray-900"}`}
                    >
                      <Move className="h-3 w-3" /> Drag
                    </button>
                    <button
                      onClick={() => setIsEditMode(true)}
                      className={`flex items-center gap-1 px-3 py-1 rounded-md text-sm font-medium transition-colors ${isEditMode ? "bg-red-600 text-white shadow-sm" : "text-gray-600 hover:text-gray-900"}`}
                    >
                      <Edit className="h-3 w-3" /> Edit
                    </button>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigateWeek("prev")}
                  className="hover:bg-gray-50 border-gray-300"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigateWeek("next")}
                  className="hover:bg-gray-50 border-gray-300"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
          {/* Header and grid alignment wrapper - both in the same scrollable container */}
          <div className="flex-1 overflow-x-auto">
            <div ref={scrollContainerRef} className="h-[600px] overflow-y-auto w-full">
              {/* Sticky header row inside the scrollable container */}
              <div className="sticky top-0 z-30 bg-white">
                <div className="grid grid-cols-[80px_repeat(7,1fr)] min-w-[700px] bg-white border-b border-gray-200">
                  {/* Time column header (empty) */}
                  <div className="bg-gradient-to-b from-gray-50 to-gray-100 h-10 sm:h-12" />
                  {/* Day/date headers */}
                  {weekDates.map((date, index) => (
                    <div
                      key={date.toISOString()}
                      className={`flex flex-col items-center justify-center h-10 sm:h-12 px-2 sm:px-4 bg-gradient-to-b from-gray-50 to-white border-l border-gray-200 ${isToday(date.getDate()) ? "bg-gradient-to-b from-red-50 to-red-100" : ""}`}
                    >
                      <span className={`text-xs sm:text-sm font-semibold uppercase tracking-wide ${isToday(date.getDate()) ? "text-red-800" : "text-gray-900"}`}>{daysOfWeek[index]}</span>
                      <span className={`text-base sm:text-lg font-bold ${isToday(date.getDate()) ? "text-red-600" : "text-gray-700"}`}>{date.getDate()}</span>
                    </div>
                  ))}
                </div>
              </div>
              {/* The grid itself */}
              <div className="grid grid-cols-[80px_repeat(7,1fr)] gap-0 bg-white rounded-xl shadow-lg overflow-hidden min-w-[700px] border border-gray-200 divide-x divide-gray-300">
                {/* Time column */}
                <div className="bg-gradient-to-b from-gray-50 to-gray-100">
                  <div className="h-10 sm:h-12 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100" />
                  {timeSlots.map((time, i) => (
                    <div
                      key={time}
                      ref={i === firstSessionRowIndex ? firstSessionRowRef : undefined}
                      className="h-16 sm:h-20 bg-gradient-to-r from-gray-50 to-gray-100 p-1 sm:p-2 text-xs sm:text-sm font-medium text-gray-600 flex items-center justify-end pr-2 sm:pr-4 border-b border-gray-100"
                    >
                      {time}
                    </div>
                  ))}
                </div>
                {/* Days columns */}
                {weekDates.map((date, index) => (
                  <DroppableTimeSlot
                    key={date.toISOString()}
                    date={date}
                    time={timeSlots[0]}
                  >
                    <div className={`bg-white ${isToday(date.getDate()) ? "bg-red-50" : ""}`}>
                      <div className="h-10 sm:h-12 border-b border-gray-200 p-1 sm:p-2 bg-gradient-to-b from-gray-50 to-white" />
                      {timeSlots.map((time, i) => {
                        const sessions = getSessionsForTimeSlot(date, time);
                        return (
                          <DroppableTimeSlot
                            key={`${date.toISOString()}|${time}`}
                            date={date}
                            time={time}
                          >
                            <div
                              ref={i === firstSessionRowIndex ? firstSessionRowRef : undefined}
                              className={`h-16 sm:h-20 border-b border-gray-200 p-1 sm:p-2 relative transition-colors duration-150 ${isToday(date.getDate()) ? "bg-red-50 hover:bg-red-100 border-red-200" : "bg-white hover:bg-gray-50 border-gray-100"}`}
                            >
                              {sessions.map((session) => (
                                <DraggableSession
                                  key={session.id}
                                  session={session}
                                  isEditMode={isEditMode}
                                >
                                  {renderEvent(session)}
                                </DraggableSession>
                              ))}
                            </div>
                          </DroppableTimeSlot>
                        );
                      })}
                    </div>
                  </DroppableTimeSlot>
                ))}
              </div>
            </div>
          </div>
          <DragOverlay>
            {activeDragSession ? renderEvent(activeDragSession) : null}
          </DragOverlay>
        </div>
      </DndContext>
    );
  };

  const renderMonthView = () => {
    const days = getDaysInMonth(currentDate);
    const monthName = currentDate.toLocaleDateString("en-US", {
      month: "long",
      year: "numeric",
    });

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between mb-4 px-2 sm:px-0">
          <div className="flex items-center gap-3">
            <div className="w-1 h-10 bg-gradient-to-b from-red-500 to-red-600 rounded-full"></div>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">
              {monthName}
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigateMonth("prev")}
              className="hover:bg-gray-50 border-gray-300"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigateMonth("next")}
              className="hover:bg-gray-50 border-gray-300"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <div className="grid grid-cols-7 gap-0 bg-white rounded-xl shadow-lg overflow-hidden min-w-[700px] border border-gray-200 h-[calc(100vh-12rem)] divide-x divide-gray-300">
            {/* Day headers */}
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
              <div
                key={day}
                className="bg-gradient-to-b from-gray-50 to-gray-100 p-1 sm:p-3 text-xs sm:text-sm text-center font-semibold text-gray-900 uppercase tracking-wide border-b border-gray-200"
              >
                {day}
              </div>
            ))}

            {/* Calendar days */}
            {days.map((day, index) => (
              <div
                key={index}
                className={`bg-white p-1 sm:p-2 min-h-[80px] sm:min-h-[120px] border-b border-gray-200 hover:bg-gray-50 transition-colors duration-150 overflow-y-auto ${
                  isToday(day)
                    ? "bg-red-50 hover:bg-red-100 ring-2 ring-red-500 ring-opacity-50"
                    : ""
                }`}
              >
                {day && (
                  <>
                    <div
                      className={`text-base sm:text-lg font-bold mb-1 sm:mb-2 text-right ${isToday(day) ? "text-red-600" : "text-gray-900"}`}
                    >
                      {day}
                    </div>
                    <div className="space-y-1">
                      {getSessionsForDay(day).map(renderEvent)}
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  // Function to get package summary for selected client
  const getSelectedClientPackageSummary = (): PackageSummary => {
    console.log(
      "🎯 Getting package summary for selected client:",
      selectedClient
    );
    console.log("📋 Available package info:", packageInfo);

    if (selectedClient === "all") {
      console.log("👥 Returning summary for all clients:", packageSummary);
      return packageSummary;
    }

    // Filter packages for selected client
    const clientPackages = packageInfo.filter(
      (pkg) => pkg.client_name === selectedClient
    );

    console.log("🔍 Filtered packages for client:", {
      selectedClient,
      filteredPackages: clientPackages,
      totalFiltered: clientPackages.length,
    });

    const summary: PackageSummary = {};
    clientPackages.forEach((pkg) => {
      if (!summary[pkg.package_type]) {
        summary[pkg.package_type] = {
          total_remaining: 0,
          total_included: 0,
          total_used: 0,
        };
      }
      summary[pkg.package_type].total_remaining += pkg.remaining;
      summary[pkg.package_type].total_included += pkg.sessions_included;
      summary[pkg.package_type].total_used += pkg.sessions_used;
    });

    console.log("📊 Calculated summary for selected client:", {
      client: selectedClient,
      summary: summary,
    });

    return summary;
  };

  // Component to render package summary
  const renderPackageSummary = () => {
    const summary = getSelectedClientPackageSummary();
    const packageTypes = Object.keys(summary);

    console.log("🎨 Rendering package summary:", {
      selectedClient,
      summary,
      packageTypes,
      hasPackages: packageTypes.length > 0,
    });

    if (packageTypes.length === 0) {
      console.log("⚠️ No packages found for display");
      return (
        <div className="flex items-center space-x-2 text-sm text-gray-500">
          <span>No active packages</span>
        </div>
      );
    }

    console.log("✅ Rendering package summary with data:", {
      packageTypes,
      summary,
    });

    return (
      <div className="flex items-center space-x-3">
        <span className="text-sm font-medium text-gray-700">
          Sessions Remaining:
        </span>
        <div className="flex items-center space-x-2">
          {packageTypes.map((packageType) => {
            const data = summary[packageType];
            const shortName = packageType.split(" ")[0]; // "In-Person" -> "In-Person"
            console.log(`📊 Rendering ${packageType}:`, {
              shortName,
              remaining: data.total_remaining,
              included: data.total_included,
              used: data.total_used,
            });
            return (
              <div
                key={packageType}
                className="flex items-center space-x-1 px-2 py-1 bg-gray-100 rounded-md"
              >
                <span className="text-xs font-medium text-gray-600">
                  {shortName}:
                </span>
                <span className="text-xs font-bold text-gray-900">
                  {data.total_remaining}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // Function to get selected client's package info for selected session type
  const getSelectedClientPackageInfo = () => {
    if (!selectedClientForSession || !selectedSessionType) {
      return null;
    }

    // Find the client's name from the clients array
    const client = clients.find((c) => c.id === selectedClientForSession);
    if (!client) {
      return null;
    }

    // Find packages for this specific client and session type
    const clientPackages = packageInfo.filter(
      (pkg) =>
        pkg.client_id === selectedClientForSession &&
        pkg.package_type === selectedSessionType
    );

    if (clientPackages.length === 0) {
      return {
        clientName: client.full_name,
        sessionType: selectedSessionType,
        remaining: 0,
        included: 0,
        used: 0,
        hasPackage: false,
        canBookSession: false,
      };
    }

    // Sum up all packages for this client and session type
    const totalRemaining = clientPackages.reduce(
      (sum, pkg) => sum + pkg.remaining,
      0
    );
    const totalIncluded = clientPackages.reduce(
      (sum, pkg) => sum + pkg.sessions_included,
      0
    );
    const totalUsed = clientPackages.reduce(
      (sum, pkg) => sum + pkg.sessions_used,
      0
    );

    return {
      clientName: client.full_name,
      sessionType: selectedSessionType,
      remaining: totalRemaining,
      included: totalIncluded,
      used: totalUsed,
      hasPackage: true,
      canBookSession: totalRemaining > 0,
    };
  };

  // Function to check if session creation should be disabled
  const isSessionCreationDisabled = () => {
    if (
      !selectedClientForSession ||
      !selectedDateForSession ||
      !selectedTimeForSession ||
      !selectedSessionType ||
      availableTimeSlots.length === 0
    ) {
      return true;
    }

    const packageInfo = getSelectedClientPackageInfo();
    if (!packageInfo) {
      return true;
    }

    // Disable if no package exists or no sessions remaining
    return !packageInfo.hasPackage || !packageInfo.canBookSession;
  };

  // Overlap check helper
  function isOverlap(
    sessions: any[],
    newDate: string,
    newStartTime: string,
    newEndTime: string,
    sessionId: string,
    trainerId: string
  ): boolean {
    // Only check sessions for the same trainer, on the same date, excluding the current session
    return sessions.some((s: any) => {
      if (s.id === sessionId) return false;
      if (s._dbData?.trainer_id !== trainerId) return false;
      if (s.start.dateTime.split("T")[0] !== newDate) return false;
      const sStart = s.start.dateTime.split("T")[1]?.slice(0, 5) || "";
      const sEnd = s.end.dateTime.split("T")[1]?.slice(0, 5) || "";
      // Overlap if not (end <= start2 or end2 <= start)
      return !(newEndTime <= sStart || sEnd <= newStartTime);
    });
  }

  if (!isGoogleConnected) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle>Connect Google Calendar</CardTitle>
            <CardContent>
              <GoogleCalendarBanner />
            </CardContent>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <>
      <div className="flex-1 bg-white">
        <header className="border-b border-gray-200 bg-white px-6 py-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <SidebarTrigger />
              <div className="flex items-center gap-3">
                <div className="w-1 h-8 bg-gradient-to-b from-red-500 to-red-600 rounded-full"></div>
                <h1 className="text-3xl font-bold text-gray-900">Schedule</h1>
              </div>
              {/* Package Summary Display */}
              {renderPackageSummary()}
            </div>
            <div className="flex items-center space-x-4">
              {/* Client Filter */}
              <div className="flex items-center space-x-2">
                <Users className="h-4 w-4 text-gray-500" />
                <Select
                  value={selectedClient}
                  onValueChange={setSelectedClient}
                >
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Filter by client" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Clients</SelectItem>
                    {getUniqueClients().map((client) => (
                      <SelectItem key={client} value={client}>
                        {client}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center space-x-2 bg-gray-100 p-1 rounded-lg">
                <Button
                  variant={viewMode === "week" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("week")}
                  className={
                    viewMode === "week"
                      ? "bg-white shadow-sm text-gray-900 hover:bg-gray-50"
                      : "text-gray-600 hover:text-gray-900 hover:bg-transparent"
                  }
                >
                  Week
                </Button>
                <Button
                  variant={viewMode === "month" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("month")}
                  className={
                    viewMode === "month"
                      ? "bg-white shadow-sm text-gray-900 hover:bg-gray-50"
                      : "text-gray-600 hover:text-gray-900 hover:bg-transparent"
                  }
                >
                  Month
                </Button>
              </div>
              <Button
                onClick={() => setIsAddSessionOpen(true)}
                className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 shadow-md hover:shadow-lg transition-all duration-200"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Session
              </Button>
            </div>
          </div>
        </header>

        <main className="p-4">
          {loading ? (
            <div className="flex items-center justify-center h-[calc(100vh-10rem)]">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-[calc(100vh-10rem)]">
              <div className="text-center text-red-600">
                <AlertCircle className="h-8 w-8 mx-auto mb-2" />
                {error}
              </div>
            </div>
          ) : viewMode === "week" ? (
            renderWeekView()
          ) : viewMode === "month" ? (
            renderMonthView()
          ) : null}
        </main>
      </div>

      {/* Add Session Dialog */}
      <Dialog open={isAddSessionOpen} onOpenChange={setIsAddSessionOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Session</DialogTitle>
            <DialogDescription>
              Create a new training session for a client
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Client Selection */}
            <div className="space-y-2">
              <Label htmlFor="client">Client</Label>
              <Select
                value={selectedClientForSession}
                onValueChange={setSelectedClientForSession}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a client" />
                </SelectTrigger>
                <SelectContent>
                  {clients.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Session Type */}
            <div className="space-y-2">
              <Label htmlFor="sessionType">Session Type</Label>
              <Select
                value={selectedSessionType}
                onValueChange={setSelectedSessionType}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select session type" />
                </SelectTrigger>
                <SelectContent>
                  {sessionTypes.map((type) => (
                    <SelectItem key={type.id} value={type.id}>
                      {type.name} ({type.duration})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Package Information */}
            {(() => {
              const packageInfo = getSelectedClientPackageInfo();
              if (!packageInfo) return null;

              // Determine if we should show red background
              const showRedBackground =
                !packageInfo.hasPackage || !packageInfo.canBookSession;
              const bgColor = showRedBackground ? "bg-red-50" : "bg-gray-50";
              const borderColor = showRedBackground
                ? "border-red-200"
                : "border-gray-200";

              return (
                <div className="space-y-2">
                  <div
                    className={`p-3 ${bgColor} rounded-lg border ${borderColor}`}
                  >
                    <div className="text-sm font-medium text-gray-900 mb-1">
                      Package Status for {packageInfo.clientName}
                    </div>
                    {packageInfo.hasPackage ? (
                      <div className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Session Type:</span>
                          <span className="font-medium">
                            {packageInfo.sessionType}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">
                            Sessions Remaining:
                          </span>
                          <span
                            className={`font-bold ${packageInfo.remaining > 0 ? "text-green-600" : "text-red-600"}`}
                          >
                            {packageInfo.remaining}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Sessions Used:</span>
                          <span className="font-medium">
                            {packageInfo.used} / {packageInfo.included}
                          </span>
                        </div>
                        {packageInfo.remaining === 0 && (
                          <div className="text-xs text-red-600 font-medium mt-1">
                            ⚠️ No sessions remaining for this package type
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-sm text-red-600 font-medium">
                        ⚠️ No active package found for {packageInfo.sessionType}
                      </div>
                    )}
                  </div>
                </div>
              );
            })()}

            {/* Date Selection */}
            <div className="space-y-2">
              <Label htmlFor="date">Date</Label>
              <DatePicker
                value={selectedDateForSession}
                onChange={setSelectedDateForSession}
                min={new Date().toISOString().split("T")[0]}
                id="date"
              />
            </div>

            {/* Time Selection */}
            <div className="space-y-2">
              <Label htmlFor="time">Time</Label>
              <Select
                value={selectedTimeForSession}
                onValueChange={setSelectedTimeForSession}
                disabled={availableTimeSlots.length === 0}
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={
                      availableTimeSlots.length === 0
                        ? "No availability for selected date"
                        : "Select time"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {availableTimeSlots.map((time) => (
                    <SelectItem key={time} value={time}>
                      {time}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {availableTimeSlots.length === 0 && selectedDateForSession && (
                <p className="text-sm text-gray-500">
                  No available time slots for the selected date. Please choose a
                  different date.
                </p>
              )}
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea
                placeholder="Add any notes about the session..."
                value={sessionNotes}
                onChange={(e) => setSessionNotes(e.target.value)}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter className="flex space-x-2 sm:space-x-0">
            <Button
              variant="outline"
              onClick={() => setIsAddSessionOpen(false)}
              disabled={isCreatingSession}
            >
              Cancel
            </Button>
            <Button
              className="bg-red-600 hover:bg-red-700"
              onClick={handleCreateSession}
              disabled={isCreatingSession || isSessionCreationDisabled()}
            >
              {isCreatingSession ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Session"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Success Dialog */}
      <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Session Booked!</DialogTitle>
            <DialogDescription>
              The session was successfully booked and added to both calendars.
            </DialogDescription>
          </DialogHeader>

          {sessionTrackingInfo && (
            <div className="space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h4 className="font-medium text-green-800 mb-2">
                  Session Tracking
                </h4>
                <div className="space-y-2 text-sm text-green-700">
                  <p>
                    <strong>Client:</strong> {sessionTrackingInfo.clientName}
                  </p>
                  <p>
                    <strong>Package:</strong> {sessionTrackingInfo.packageType}
                  </p>
                  <div className="flex items-center space-x-2">
                    <span>Sessions used:</span>
                    <span className="font-mono bg-green-100 px-2 py-1 rounded">
                      {sessionTrackingInfo.sessionsBefore}
                    </span>
                    <span>→</span>
                    <span className="font-mono bg-green-100 px-2 py-1 rounded">
                      {sessionTrackingInfo.sessionsAfter}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button onClick={() => setShowSuccessDialog(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Error Dialog */}
      <Dialog open={showErrorDialog} onOpenChange={setShowErrorDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Booking Error</DialogTitle>
            <DialogDescription>{errorMessage}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={() => setShowErrorDialog(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reschedule Confirmation Dialog */}
      <Dialog
        open={showRescheduleDialog}
        onOpenChange={setShowRescheduleDialog}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Reschedule</DialogTitle>
            <DialogDescription>
              You are moving this session to{" "}
              <b>{rescheduleTarget?.newDateStr}</b> at{" "}
              <b>{rescheduleTarget?.newTime}</b>.<br />
              You can change the time by clicking the session after moving.
              <br />
              Do you want to proceed?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <button
              className="bg-gray-200 px-4 py-2 rounded mr-2"
              onClick={() => setShowRescheduleDialog(false)}
              disabled={isUpdating}
            >
              Cancel
            </button>
            <button
              className="bg-blue-600 text-white px-4 py-2 rounded flex items-center gap-2"
              disabled={isUpdating || isSyncingCalendar}
              onClick={async () => {
                setIsUpdating(true);
                if (rescheduleTarget) {
                  const { session, newDateStr, newTime } = rescheduleTarget;
                  const newStartTime = parseTimeStringTo24Hour(newTime || "");
                  const duration = session._dbData?.duration_minutes || 60;
                  const newEndTime = addMinutesToTime(newStartTime, duration);
                  // Overlap check
                  if (
                    isOverlap(
                      events,
                      newDateStr,
                      newStartTime,
                      newEndTime,
                      session.id,
                      String(session._dbData?.trainer_id || "")
                    )
                  ) {
                    setFeedbackDialog({
                      open: true,
                      title: "Error",
                      message:
                        "There is already a session at this day and time. Please change the time first before dragging to this day.",
                    });
                    setIsUpdating(false);
                    return;
                  }
                  // Call PATCH API
                  try {
                    const resp = await fetch(`/api/sessions/${session.id}`, {
                      method: "PATCH",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        date: newDateStr,
                        start_time: newStartTime,
                        end_time: newEndTime,
                      }),
                    });
                    const data = await resp.json();
                    console.log(
                      "[Reschedule PATCH] Response status:",
                      resp.status,
                      "data:",
                      data
                    );
                    if (!resp.ok) {
                      setFeedbackDialog({
                        open: true,
                        title: "Error",
                        message: data.error || "Failed to update session",
                      });
                    } else {
                      // Show syncing state
                      setIsSyncingCalendar(true);

                      // Sync Google Calendar events
                      try {
                        await syncGoogleCalendarEvents(
                          session,
                          newDateStr,
                          newStartTime,
                          newEndTime
                        );
                        setFeedbackDialog({
                          open: true,
                          title: "Session rescheduled",
                          message: `Session moved to ${newDateStr} at ${newTime}. Google Calendar events updated.`,
                        });
                      } catch (syncError) {
                        console.error("[Calendar Sync Error]:", syncError);
                        setFeedbackDialog({
                          open: true,
                          title: "Session rescheduled",
                          message: `Session moved to ${newDateStr} at ${newTime}. Note: Google Calendar sync failed.`,
                        });
                      } finally {
                        setIsSyncingCalendar(false);
                      }

                      setShowRescheduleDialog(false);
                      // Refresh events
                      console.log(
                        "[Reschedule PATCH] Calling fetchEvents to refresh calendar..."
                      );
                      await fetchEvents();
                      console.log("[Reschedule PATCH] fetchEvents complete.");
                    }
                  } catch (err) {
                    setFeedbackDialog({
                      open: true,
                      title: "Error",
                      message: "Failed to update session",
                    });
                  }
                }
                setIsUpdating(false);
              }}
            >
              {isUpdating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : isSyncingCalendar ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Syncing Calendar...
                </>
              ) : (
                "Confirm"
              )}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Feedback Dialog */}
      <Dialog
        open={feedbackDialog.open}
        onOpenChange={(open) => setFeedbackDialog((f) => ({ ...f, open }))}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{feedbackDialog.title}</DialogTitle>
            <DialogDescription>{feedbackDialog.message}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <button
              className="bg-blue-600 text-white px-4 py-2 rounded"
              onClick={() => setFeedbackDialog((f) => ({ ...f, open: false }))}
            >
              OK
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Session Dialog */}
      <Dialog
        open={showEditSessionDialog}
        onOpenChange={setShowEditSessionDialog}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Session</DialogTitle>
            <DialogDescription>
              Update the session details. Changes will be reflected in both
              calendars.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Date */}
            <div className="space-y-2">
              <Label htmlFor="edit-date">Date</Label>
              <DatePicker
                value={editSessionData.date}
                onChange={(date) =>
                  setEditSessionData((prev) => ({ ...prev, date }))
                }
                min={new Date().toISOString().split("T")[0]}
                id="edit-date"
              />
            </div>

            {/* Start Time */}
            <div className="space-y-2">
              <Label htmlFor="edit-start-time">Start Time</Label>
              <Input
                id="edit-start-time"
                type="time"
                value={editSessionData.startTime}
                onChange={(e) => {
                  const newStartTime = e.target.value;
                  // Calculate new end time as 1 hour after start time
                  const calculateEndTime = (startTimeStr: string) => {
                    const [hours, minutes] = startTimeStr
                      .split(":")
                      .map(Number);
                    const startDate = new Date(2000, 0, 1, hours, minutes);
                    startDate.setHours(startDate.getHours() + 1);
                    return `${String(startDate.getHours()).padStart(2, "0")}:${String(startDate.getMinutes()).padStart(2, "0")}`;
                  };

                  setEditSessionData((prev) => ({
                    ...prev,
                    startTime: newStartTime,
                    endTime: calculateEndTime(newStartTime),
                  }));
                }}
              />
            </div>

            {/* End Time (Auto-calculated) */}
            <div className="space-y-2">
              <Label htmlFor="edit-end-time">End Time</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="edit-end-time"
                  type="time"
                  value={editSessionData.endTime}
                  disabled
                  className="bg-gray-50 text-gray-600"
                />
                <span className="text-sm text-gray-500">
                  (Auto-calculated: 1 hour after start)
                </span>
              </div>
            </div>

            {/* Session Type */}
            <div className="space-y-2">
              <Label htmlFor="edit-session-type">Session Type</Label>
              <Select
                value={editSessionData.sessionType}
                onValueChange={(value) =>
                  setEditSessionData((prev) => ({
                    ...prev,
                    sessionType: value,
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select session type" />
                </SelectTrigger>
                <SelectContent>
                  {sessionTypes.map((type) => (
                    <SelectItem key={type.id} value={type.name}>
                      {type.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowEditSessionDialog(false)}
              disabled={isUpdatingSession}
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpdateSession}
              disabled={isUpdatingSession}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {isUpdatingSession ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                "Update Session"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

// Draggable session wrapper
function DraggableSession({
  session,
  children,
  isEditMode,
}: {
  session: DatabaseSession;
  children: React.ReactNode;
  isEditMode: boolean;
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: session.id,
    data: { session },
    disabled: isEditMode,
  });
  return (
    <div
      ref={setNodeRef}
      {...(isEditMode ? {} : attributes)}
      {...(isEditMode ? {} : listeners)}
      style={{
        opacity: isDragging ? 0.5 : 1,
        cursor: isEditMode ? "pointer" : "grab",
      }}
      className={isDragging ? "ring-2 ring-blue-500" : ""}
    >
      {children}
    </div>
  );
}

// Droppable day column wrapper
function DroppableTimeSlot({
  date,
  time,
  children,
}: {
  date: Date;
  time: string;
  children: React.ReactNode;
}) {
  // Use local date string instead of ISO string to avoid timezone issues
  const localDateStr = date.toLocaleDateString("en-CA"); // YYYY-MM-DD format
  const id = `${localDateStr}|${encodeURIComponent(time)}`;
  const { setNodeRef, isOver } = useDroppable({ id });
  return (
    <div
      ref={setNodeRef}
      className={
        isOver ? "bg-blue-50 border-blue-400 border-2 transition-colors" : ""
      }
    >
      {children}
    </div>
  );
}

// Helper to parse '10:00 AM' to '10:00:00' (24-hour format)
function parseTimeStringTo24Hour(timeStr: string): string {
  const [time, modifier] = timeStr.split(" ");
  let [hours, minutes] = time.split(":").map(Number);
  if (modifier === "PM" && hours !== 12) hours += 12;
  if (modifier === "AM" && hours === 12) hours = 0;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:00`;
}
// Helper to add minutes to a time string (HH:mm:ss)
function addMinutesToTime(time: string, minutesToAdd: number): string {
  const [h, m, s] = time.split(":").map(Number);
  const date = new Date(2000, 0, 1, h, m, s || 0);
  date.setMinutes(date.getMinutes() + minutesToAdd);
  return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}:00`;
}

// Function to sync Google Calendar events after session update
async function syncGoogleCalendarEvents(
  session: DatabaseSession,
  newDate: string,
  newStartTime: string,
  newEndTime: string
) {
  // Check if Google Calendar is enabled for current tier
  if (!isGoogleCalendarEnabled()) {
    console.log("[Calendar Sync] Google Calendar feature is disabled for current tier");
    return;
  }

  console.log("[Calendar Sync] Starting sync for session:", session.id);

  // Get client and trainer details
  const clientId = session._dbData?.client_id;
  const trainerId = session._dbData?.trainer_id;

  if (!clientId || !trainerId) {
    throw new Error("Missing client or trainer ID");
  }

  // Build event details
  const startDateTime = new Date(`${newDate}T${newStartTime}`);
  const endDateTime = new Date(`${newDate}T${newEndTime}`);

  const eventDetails = {
    type: session._dbData?.type || "Training",
    clientName: session.users?.full_name || "Client",
    description: `${session._dbData?.type || "Training"} session${session.description ? ` - ${session.description}` : ""}`,
    start: {
      dateTime: startDateTime.toISOString(),
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    },
    end: {
      dateTime: endDateTime.toISOString(),
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    },
    attendees: session.users?.email ? [{ email: session.users.email }] : [],
    reminders: {
      useDefault: true,
    },
  };

  // Update the current session
  console.log("[Calendar Sync] Updating current session calendar events");
  const response = await fetch(
    `/api/google/calendar/update-event?trainerId=${trainerId}&clientId=${clientId}&sessionId=${session.id}`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(eventDetails),
    }
  );

  if (!response.ok) {
    console.error(
      "[Calendar Sync] Current session calendar update failed:",
      response.status
    );
    const errorText = await response.text();
    console.error("[Calendar Sync] Error details:", errorText);
    throw new Error("Failed to update current session calendar events");
  }

  const results = await response.json();
  console.log("[Calendar Sync] Current session update results:", results);

  // Note: Removed sync-all-sessions call as it's unnecessary and causes 404 errors
  // The current session was already updated successfully above
  // Other sessions don't need to be updated when only one session changes

  console.log("[Calendar Sync] Sync completed successfully");
}
