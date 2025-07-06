"use client";

import { useState, useEffect } from "react";
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
} from "lucide-react";
import { GoogleCalendarBanner } from "@/components/GoogleCalendarBanner";
import { createClient } from "@/lib/supabaseClient";

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
  };
  users?: {
    full_name: string;
    email: string;
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
  const [timeSlots, setTimeSlots] = useState<string[]>([]);
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
  const supabase = createClient();

  // Handle client filter from URL query parameter
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const clientParam = urlParams.get("client");
    if (clientParam) {
      const decodedClient = decodeURIComponent(clientParam);
      setSelectedClient(decodedClient);
    }
  }, []);

  // Function to get unique clients from events
  const getUniqueClients = () => {
    const clients = new Set<string>();
    events.forEach((event) => {
      const clientName = getClientName(event);
      if (clientName && clientName !== "Client") {
        clients.add(clientName);
      }
    });
    return Array.from(clients).sort();
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

  // Function to fetch trainer availability and generate time slots
  const fetchTrainerAvailability = async () => {
    try {
      // Get current trainer's session
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.user) {
        console.error("No authenticated user found");
        return;
      }

      console.log("🔍 Fetching trainer availability for:", session.user.id);

      // Fetch trainer availability
      const { data: availability, error } = await supabase
        .from("trainer_availability")
        .select("*")
        .eq("trainer_id", session.user.id);

      if (error) {
        console.error("❌ Error fetching trainer availability:", error);
        return;
      }

      console.log("✅ Trainer availability fetched:", availability);
      setTrainerAvailability(availability || []);

      // Generate time slots based on availability
      if (availability && availability.length > 0) {
        const timeSlotsSet = new Set<string>();

        availability.forEach((slot) => {
          const startTime = new Date(`2000-01-01T${slot.start_time}`);
          const endTime = new Date(`2000-01-01T${slot.end_time}`);

          // Generate hourly slots from start_time to end_time - 1 hour
          let currentTime = new Date(startTime);
          const endTimeMinusOneHour = new Date(
            endTime.getTime() - 60 * 60 * 1000
          ); // Subtract 1 hour

          while (currentTime <= endTimeMinusOneHour) {
            const timeString = currentTime.toLocaleTimeString("en-US", {
              hour: "numeric",
              minute: "2-digit",
              hour12: true,
            });
            timeSlotsSet.add(timeString);
            currentTime.setHours(currentTime.getHours() + 1);
          }
        });

        // Convert to array and sort
        const sortedTimeSlots = Array.from(timeSlotsSet).sort((a, b) => {
          const timeA = new Date(`2000-01-01T${a}`);
          const timeB = new Date(`2000-01-01T${b}`);
          return timeA.getTime() - timeB.getTime();
        });

        console.log("🕐 Generated time slots:", sortedTimeSlots);
        setTimeSlots(sortedTimeSlots);
      } else {
        // Fallback to default time slots if no availability found
        const defaultTimeSlots = [
          "8:00 AM",
          "9:00 AM",
          "10:00 AM",
          "11:00 AM",
          "12:00 PM",
          "1:00 PM",
          "2:00 PM",
          "3:00 PM",
          "4:00 PM",
          "5:00 PM",
          "6:00 PM",
          "7:00 PM",
        ];
        setTimeSlots(defaultTimeSlots);
      }
    } catch (error) {
      console.error("❌ Error in fetchTrainerAvailability:", error);
      // Fallback to default time slots
      const defaultTimeSlots = [
        "8:00 AM",
        "9:00 AM",
        "10:00 AM",
        "11:00 AM",
        "12:00 PM",
        "1:00 PM",
        "2:00 PM",
        "3:00 PM",
        "4:00 PM",
        "5:00 PM",
        "6:00 PM",
        "7:00 PM",
      ];
      setTimeSlots(defaultTimeSlots);
    }
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
          },
        })) || [];

      setEvents(convertedEvents);
      setIsGoogleConnected(true); // Keep this for UI consistency
    } catch (err) {
      setError("Failed to load sessions");
      console.error("Error fetching sessions:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
    fetchTrainerAvailability();
    fetchClients();
  }, [currentDate]);

  // Generate time slots when date is selected
  useEffect(() => {
    generateTimeSlotsForDate(selectedDateForSession);
  }, [selectedDateForSession, trainerAvailability]);

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
    // DB: 1=Monday, 2=Tuesday, ..., 7=Sunday
    const jsDay = selectedDate.getDay();
    const weekday = jsDay === 0 ? 7 : jsDay; // 1 (Mon) - 7 (Sun)

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
    if (
      !selectedClientForSession ||
      !selectedDateForSession ||
      !selectedTimeForSession ||
      !selectedSessionType
    ) {
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
        })
        .select()
        .single();

      if (sessionError) {
        setErrorMessage("Failed to create session. Please try again.");
        setShowErrorDialog(true);
        throw sessionError;
      }

      // Get package information BEFORE booking to track sessions
      const { data: packages, error: packageError } = await supabase
        .from("packages")
        .select("*")
        .eq("client_id", selectedClientForSession)
        .eq("package_type", selectedSessionType)
        .eq("status", "active")
        .order("expiry_date", { ascending: true });

      if (packageError) {
        setErrorMessage(
          "Error fetching packages. Session was created, but package usage was not updated."
        );
        setShowErrorDialog(true);
        setIsCreatingSession(false);
        return;
      }
      // Find the first package with available sessions
      console.debug("Available packages for client:", {
        clientId: selectedClientForSession,
        sessionType: selectedSessionType,
        packages: packages?.map((p) => ({
          id: p.id,
          package_type: p.package_type,
          sessions_included: p.sessions_included,
          sessions_used: p.sessions_used,
          status: p.status,
          available: (p.sessions_included || 0) > (p.sessions_used || 0),
        })),
      });

      const packageToUpdate =
        packages &&
        packages.find(
          (pkg) => (pkg.sessions_included || 0) > (pkg.sessions_used || 0)
        );

      console.debug("Selected package to update:", packageToUpdate);

      if (!packageToUpdate) {
        setErrorMessage(
          "This client does not have any available sessions for this package type. Please ask them to purchase or renew a package."
        );
        setShowErrorDialog(true);
        setIsCreatingSession(false);
        return;
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

          if (!trainerEventResponse.ok) {
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

          if (!clientEventResponse.ok) {
            calendarSuccess = false;
            calendarErrorMsg += "Failed to create client calendar event. ";
          }
        } catch (error) {
          calendarSuccess = false;
          calendarErrorMsg += "Error creating client calendar event. ";
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
        setShowSuccessDialog(true);
      } else {
        setErrorMessage(
          calendarErrorMsg ||
            "Session booked, but there was a problem adding to Google Calendar."
        );
        setShowErrorDialog(true);
      }
    } catch (error) {
      console.error("Error creating session:", error);
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
    return sessions.filter((session) => {
      const eventTime = new Date(session.start.dateTime);
      const eventHour = eventTime.getHours();
      const eventMinute = eventTime.getMinutes();

      // Parse the time slot (e.g., "9:00 AM" -> 9, 0)
      const timeMatch = time.match(/(\d+):(\d+)\s*(AM|PM)/);
      if (!timeMatch) return false;

      let slotHour = parseInt(timeMatch[1]);
      const slotMinute = parseInt(timeMatch[2]);
      const period = timeMatch[3];

      // Convert to 24-hour format
      if (period === "PM" && slotHour !== 12) {
        slotHour += 12;
      } else if (period === "AM" && slotHour === 12) {
        slotHour = 0;
      }

      // Check if event starts within this time slot (within 1 hour)
      return (
        eventHour === slotHour &&
        eventMinute >= slotMinute &&
        eventMinute < slotMinute + 60
      );
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

    // Get client's email from attendees or use name as fallback
    const clientEmail = event.attendees?.find(
      (a) => a.responseStatus !== "declined"
    )?.email;
    const clientColor = getClientColor(clientEmail, clientName);

    return (
      <div
        key={event.id}
        className={`rounded-md p-2 ${clientColor.bg} ${clientColor.border} border shadow-sm hover:shadow-md transition-all duration-200 transform hover:scale-[1.02] cursor-pointer`}
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
          <div className="w-1.5 h-1.5 rounded-full bg-current opacity-60"></div>
          {formatEventTime(event.start.dateTime)} • {duration}min
        </div>
      </div>
    );
  };

  const renderWeekView = () => {
    const weekDates = getWeekDates(currentDate);
    const startDate = weekDates[0];
    const endDate = weekDates[6];

    return (
      <div className="flex flex-col h-full">
        <div className="flex items-center justify-between mb-4 px-2 sm:px-4">
          <div className="flex items-center gap-3">
            <div className="w-1 h-8 bg-gradient-to-b from-red-500 to-red-600 rounded-full"></div>
            <h2 className="text-lg sm:text-xl font-bold text-gray-900">
              Week of{" "}
              {startDate.toLocaleDateString("en-US", {
                month: "long",
                day: "numeric",
              })}{" "}
              -{" "}
              {endDate.toLocaleDateString("en-US", {
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
            </h2>
          </div>
          <div className="flex items-center gap-2">
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

        <div className="flex-1 overflow-x-auto">
          <div className="grid grid-cols-[80px_repeat(7,1fr)] gap-0 bg-white rounded-xl shadow-lg overflow-hidden min-w-[700px] h-[calc(100vh-12rem)] border border-gray-200 divide-x divide-gray-300">
            {/* Time column */}
            <div className="bg-gradient-to-b from-gray-50 to-gray-100">
              <div className="h-10 sm:h-12 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100" />
              {timeSlots.map((time) => (
                <div
                  key={time}
                  className="h-16 sm:h-20 bg-gradient-to-r from-gray-50 to-gray-100 p-1 sm:p-2 text-xs sm:text-sm font-medium text-gray-600 flex items-center justify-end pr-2 sm:pr-4 border-b border-gray-100"
                >
                  {time}
                </div>
              ))}
            </div>

            {/* Days columns */}
            {weekDates.map((date, index) => (
              <div
                key={date.toISOString()}
                className={`bg-white ${isToday(date.getDate()) ? "bg-red-50" : ""}`}
              >
                <div
                  className={`h-10 sm:h-12 border-b border-gray-200 p-1 sm:p-2 bg-gradient-to-b from-gray-50 to-white ${isToday(date.getDate()) ? "bg-gradient-to-b from-red-50 to-red-100" : ""}`}
                >
                  <div className="flex items-center justify-between">
                    <div
                      className={`text-xs sm:text-sm font-semibold uppercase tracking-wide ${isToday(date.getDate()) ? "text-red-800" : "text-gray-900"}`}
                    >
                      {daysOfWeek[index]}
                    </div>
                    <div
                      className={`text-base sm:text-lg font-bold ${isToday(date.getDate()) ? "text-red-600" : "text-gray-700"}`}
                    >
                      {date.getDate()}
                    </div>
                  </div>
                </div>
                {timeSlots.map((time) => {
                  const sessions = getSessionsForTimeSlot(date, time);
                  return (
                    <div
                      key={`${date.toISOString()}-${time}`}
                      className={`h-16 sm:h-20 border-b border-gray-200 p-1 sm:p-2 relative transition-colors duration-150 ${
                        isToday(date.getDate())
                          ? "bg-red-50 hover:bg-red-100 border-red-200"
                          : "bg-white hover:bg-gray-50 border-gray-100"
                      }`}
                    >
                      {sessions.map(renderEvent)}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
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

            {/* Date Selection */}
            <div className="space-y-2">
              <Label htmlFor="date">Date</Label>
              <Input
                type="date"
                value={selectedDateForSession}
                onChange={(e) => setSelectedDateForSession(e.target.value)}
                min={new Date().toISOString().split("T")[0]}
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
              disabled={
                isCreatingSession ||
                !selectedClientForSession ||
                !selectedDateForSession ||
                !selectedTimeForSession ||
                !selectedSessionType ||
                availableTimeSlots.length === 0
              }
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
    </>
  );
}
