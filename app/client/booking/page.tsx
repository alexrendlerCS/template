"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Calendar,
  Clock,
  ArrowLeft,
  CheckCircle,
  Menu,
  User,
  ChevronLeft,
  ChevronRight,
  Loader2,
  AlertCircle,
} from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabaseClient";
import { Database } from "@/lib/database.types";
import {
  addMinutes,
  format,
  isAfter,
  isBefore,
  parseISO,
  startOfToday,
  addDays,
} from "date-fns";
import { Calendar as RadixCalendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarIcon } from "@radix-ui/react-icons";
import { cn } from "@/lib/utils";
import { DatePicker } from "@/components/DatePicker";
import { useUser } from "@/lib/store/user";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import CountUp from "react-countup";
import { formatLocalDate, getTodayString } from "@/lib/utils";

type UserProfile = Database["public"]["Tables"]["users"]["Row"];

const mockAvailableSlots = [
  { date: "2024-01-15", slots: ["9:00 AM", "10:00 AM", "2:00 PM", "4:00 PM"] },
  { date: "2024-01-16", slots: ["10:00 AM", "11:00 AM", "3:00 PM"] },
  { date: "2024-01-17", slots: ["9:00 AM", "1:00 PM", "2:00 PM", "5:00 PM"] },
  { date: "2024-01-18", slots: ["8:00 AM", "10:00 AM", "3:00 PM"] },
  { date: "2024-01-19", slots: ["9:00 AM", "11:00 AM", "2:00 PM", "4:00 PM"] },
];

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

interface Trainer {
  id: string;
  full_name: string;
  email: string;
  avatar_url?: string;
}

interface TrainerAvailability {
  id: string;
  trainer_id: string;
  weekday: number; // 0-6 for Sunday-Saturday
  start_time: string; // HH:mm format
  end_time: string; // HH:mm format
  created_at: string;
}

interface TrainerUnavailability {
  id: string;
  trainer_id: string;
  date: string;
  start_time: string;
  end_time: string;
  reason?: string;
  created_at: string;
}

interface Session {
  id: string;
  trainer_id: string;
  client_id: string;
  date: string;
  start_time: string;
  end_time: string;
  type: string;
  status: string;
  created_at: string;
}

interface TimeSlot {
  startTime: string;
  endTime: string;
  isAvailable: boolean;
}

interface PackageTypeCount {
  type: string;
  remaining: number;
  total: number;
}

type PackageType =
  | "In-Person Training"
  | "Virtual Training"
  | "Partner Training";

type PackageTypeCounts = {
  [K in PackageType]: PackageTypeCount;
};

// Helper function to convert time string to minutes since midnight
const timeToMinutes = (time: string): number => {
  const [hours, minutes] = time.split(":").map((num) => parseInt(num, 10));
  return hours * 60 + minutes;
};

// Helper function to check if a time slot overlaps with any blocked periods
const isSlotUnavailable = (
  slotStart: string,
  slotEnd: string,
  unavailablePeriods: Array<{ start_time: string; end_time: string }>,
  existingSessions: Array<{ start_time: string; end_time: string }>
): boolean => {
  const slotStartMins = timeToMinutes(slotStart);
  const slotEndMins = timeToMinutes(slotEnd);

  // Check unavailable periods
  const hasUnavailableConflict = unavailablePeriods.some((period) => {
    const periodStartMins = timeToMinutes(period.start_time);
    const periodEndMins = timeToMinutes(period.end_time);
    return !(slotEndMins <= periodStartMins || slotStartMins >= periodEndMins);
  });

  // Check existing sessions
  const hasSessionConflict = existingSessions.some((session) => {
    const sessionStartMins = timeToMinutes(session.start_time);
    const sessionEndMins = timeToMinutes(session.end_time);
    return !(
      slotEndMins <= sessionStartMins || slotStartMins >= sessionEndMins
    );
  });

  return hasUnavailableConflict || hasSessionConflict;
};

// Helper function to format time for display
const formatTimeForDisplay = (timeString: string) => {
  const [hours, minutes] = timeString.split(":");
  const date = new Date();
  date.setHours(parseInt(hours, 10));
  date.setMinutes(parseInt(minutes, 10));
  return format(date, "h:mm a");
};

// Helper function to generate time slots
const generateTimeSlots = (
  startTime: string,
  endTime: string,
  unavailablePeriods: Array<{ start_time: string; end_time: string }> = [],
  existingSessions: Array<{ start_time: string; end_time: string }> = []
): TimeSlot[] => {
  const slots: TimeSlot[] = [];

  // Parse start and end times
  const [startHours, startMinutes] = startTime
    .split(":")
    .map((num) => parseInt(num, 10));
  const [endHours, endMinutes] = endTime
    .split(":")
    .map((num) => parseInt(num, 10));

  // Create Date objects for comparison
  const start = new Date();
  start.setHours(startHours, startMinutes, 0);

  const end = new Date();
  end.setHours(endHours, endMinutes, 0);

  let current = new Date(start);

  // Generate slots in 30-minute increments
  while (current < end) {
    // Calculate the start and end times for this 60-minute session
    const slotStartTime = format(current, "HH:mm:ss");
    const sessionEnd = new Date(current.getTime() + 60 * 60000); // 60 minutes later

    // Only add the slot if the full 60-minute session fits within the availability window
    if (sessionEnd <= end) {
      const slotEndTime = format(sessionEnd, "HH:mm:ss");

      // Check if this slot overlaps with any unavailable periods or existing sessions
      const isUnavailable = isSlotUnavailable(
        slotStartTime,
        slotEndTime,
        unavailablePeriods,
        existingSessions
      );

      slots.push({
        startTime: slotStartTime,
        endTime: slotEndTime,
        isAvailable: !isUnavailable,
      });
    }

    // Move to next 30-minute increment
    current = new Date(current.getTime() + 30 * 60000);
  }

  return slots;
};

// Helper function to get day name
const getDayName = (index: number): string => {
  const days = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];
  return days[index] || "";
};

// Helper function to safely parse a YYYY-MM-DD string to a local Date object
function parseLocalDateString(dateStr: string): Date {
  const [year, month, day] = dateStr.split("-").map(Number);
  return new Date(year, month - 1, day);
}

export default function BookingPage() {
  const [selectedType, setSelectedType] = useState("");
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedTime, setSelectedTime] = useState("");
  const [showTrainerModal, setShowTrainerModal] = useState(false);
  const [showNoSessionsDialog, setShowNoSessionsDialog] = useState(false);
  const [showCurrentSessionsDialog, setShowCurrentSessionsDialog] =
    useState(false);
  const [trainers, setTrainers] = useState<Trainer[]>([]);
  const [selectedTrainer, setSelectedTrainer] = useState<Trainer | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [availableTimeSlots, setAvailableTimeSlots] = useState<TimeSlot[]>([]);
  const [loadingTimeSlots, setLoadingTimeSlots] = useState(false);
  const [date, setDate] = useState<Date | undefined>();
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<TimeSlot | null>(
    null
  );
  const [showBookingDialog, setShowBookingDialog] = useState(false);
  const [selectedDateObj, setSelectedDateObj] = useState<Date | null>(null);
  const [trainerAvailability, setTrainerAvailability] = useState<
    TrainerAvailability[]
  >([]);
  const { user } = useUser();
  const [isBooking, setIsBooking] = useState(false);
  const router = useRouter();
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [showErrorDialog, setShowErrorDialog] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const [sessionsRemaining, setSessionsRemaining] = useState<number>(0);
  const [sessionsByType, setSessionsByType] = useState<PackageTypeCount[]>([]);

  const supabase = createClient();

  useEffect(() => {
    const fetchAvailableTimeSlots = async () => {
      if (!selectedTrainer || !selectedDate) return;

      try {
        setLoadingTimeSlots(true);

        // Parse selectedDate as local date
        const dateObj = parseLocalDateString(selectedDate);
        const jsDay = dateObj.getDay(); // 0=Sunday, 1=Monday, ..., 6=Saturday
        const selectedDayOfWeek = jsDay;

        console.log("[DEBUG] fetchAvailableTimeSlots:", {
          selectedDate,
          dateObj: dateObj.toString(),
          jsDay,
          selectedDayOfWeek,
          dayName: getDayName(jsDay),
          trainerId: selectedTrainer.id,
        });

        // 1. Get trainer's regular availability for this day
        const { data: availabilityData, error: availabilityError } =
          await supabase
            .from("trainer_availability")
            .select("*")
            .eq("trainer_id", selectedTrainer.id)
            .eq("weekday", selectedDayOfWeek);

        console.log("[DEBUG] DB availability query result:", {
          weekdayQueried: selectedDayOfWeek,
          availabilityData,
          availabilityError,
        });

        if (availabilityError) throw availabilityError;

        // 2. Get trainer's unavailability for the specific date
        const { data: unavailabilityData, error: unavailabilityError } =
          await supabase
            .from("trainer_unavailable_slots")
            .select("*")
            .eq("trainer_id", selectedTrainer.id)
            .eq("date", selectedDate);

        console.log("[DEBUG] DB unavailability query result:", {
          unavailabilityData,
          unavailabilityError,
        });

        if (unavailabilityError) throw unavailabilityError;

        // 3. Get existing sessions for the selected date
        const { data: sessionData, error: sessionError } = await supabase
          .from("sessions")
          .select("start_time, end_time")
          .eq("trainer_id", selectedTrainer.id)
          .eq("date", selectedDate)
          .neq("status", "cancelled"); // Exclude cancelled sessions

        console.log("[DEBUG] DB sessions query result:", {
          sessionData,
          sessionError,
        });

        if (sessionError) throw sessionError;

        if (!availabilityData?.length) {
          console.log("[DEBUG] No availability found for this day", {
            selectedDayOfWeek,
            dayName: getDayName(selectedDayOfWeek),
            selectedDate,
          });
          setAvailableTimeSlots([]);
          setLoadingTimeSlots(false);
          return;
        }

        // Handle multiple availability windows for the same day
        let allSlots: TimeSlot[] = [];

        // Sort availability windows by start time
        const sortedAvailability = availabilityData.sort((a, b) =>
          a.start_time.localeCompare(b.start_time)
        );

        // Generate slots for each availability window
        for (const availability of sortedAvailability) {
          const windowSlots = generateTimeSlots(
            availability.start_time,
            availability.end_time,
            unavailabilityData || [],
            sessionData || []
          );
          allSlots = [...allSlots, ...windowSlots];
        }

        console.log("[DEBUG] Generated time slots:", allSlots);

        setAvailableTimeSlots(allSlots);
        setLoadingTimeSlots(false);
      } catch (error) {
        console.error("[DEBUG] Error fetching time slots:", error);
        setError(
          error instanceof Error ? error.message : "Failed to load time slots"
        );
        setLoadingTimeSlots(false);
      }
    };

    fetchAvailableTimeSlots();
  }, [selectedTrainer, selectedDate]);

  useEffect(() => {
    const fetchTrainers = async () => {
      try {
        setLoading(true);
        setError(null);

        // First check if user is authenticated
        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser();

        if (authError) {
          console.error("Authentication error details:", {
            message: authError.message,
            status: authError.status,
            name: authError.name,
            stack: authError.stack,
          });
          throw new Error("Authentication failed: " + authError.message);
        }

        if (!user) {
          throw new Error("Not authenticated - no user found");
        }

        console.log("Authenticated as user:", {
          id: user.id,
          email: user.email,
          role: user.user_metadata?.role,
        });

        // Get current user's role first
        const { data: userData, error: userError } = await supabase
          .from("users")
          .select("role")
          .eq("id", user.id)
          .single();

        if (userError) {
          console.error("Error fetching user role:", userError);
          throw new Error("Failed to verify user role: " + userError.message);
        }

        console.log("Current user role:", userData?.role);

        // Then fetch trainers
        const { data: trainersData, error: trainersError } = await supabase
          .from("users")
          .select("id, full_name, email, avatar_url")
          .eq("role", "trainer");

        if (trainersError) {
          console.error("Trainers fetch error details:", {
            message: trainersError.message,
            code: trainersError.code,
            details: trainersError.details,
            hint: trainersError.hint,
          });
          throw new Error("Failed to fetch trainers: " + trainersError.message);
        }

        console.log("Fetched trainers count:", trainersData?.length);

        // Only ensure required fields
        const validTrainers = (trainersData || []).filter(
          (trainer) => trainer.full_name && trainer.email
        );

        console.log("Valid trainers count:", validTrainers.length);
        setTrainers(validTrainers);
      } catch (err) {
        console.error("Error fetching trainers (full error):", {
          error: err,
          message: err instanceof Error ? err.message : "Unknown error",
          stack: err instanceof Error ? err.stack : undefined,
          type: typeof err,
        });
        setError(
          err instanceof Error
            ? err.message
            : "Failed to load trainers. Please try again."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchTrainers();
  }, [supabase]);

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!user) {
        console.log("No user found for profile fetch");
        return;
      }

      console.log("Fetching user profile for ID:", user.id);

      const { data: profile, error } = await supabase
        .from("users")
        .select("*")
        .eq("id", user.id)
        .single();

      if (error) {
        console.error("Error fetching user profile:", error);
        return;
      }

      if (!profile) {
        console.error("No profile found for user:", user.id);
        return;
      }

      console.log("Successfully fetched user profile:", {
        id: profile.id,
        full_name: profile.full_name,
        role: profile.role,
      });

      setUserProfile(profile);
    };

    fetchUserProfile();
  }, [user, supabase]);

  // Add an additional effect to monitor profile state
  useEffect(() => {
    console.log("User profile state updated:", {
      exists: !!userProfile,
      id: userProfile?.id,
      name: userProfile?.full_name,
    });
  }, [userProfile]);

  useEffect(() => {
    const checkRemainingSession = async () => {
      console.log("Starting session check...");
      setIsCheckingSession(true);

      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        console.log("Auth check result:", { userId: user?.id });

        if (!user) {
          console.log("No authenticated user found");
          setIsCheckingSession(false);
          return;
        }

        // Get all active packages for the user
        const { data: packages, error: packagesError } = await supabase
          .from("packages")
          .select("*")
          .eq("client_id", user.id)
          .order("purchase_date", { ascending: false });

        if (packagesError) {
          console.error("Failed to fetch packages:", packagesError);
          setSessionsRemaining(0);
          setSessionsByType([]);
          setShowNoSessionsDialog(true);
          setIsCheckingSession(false);
          return;
        }

        console.log("Fetched packages:", packages);

        // Group packages by type and calculate remaining sessions
        const packageTypes: PackageTypeCounts = {
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

        if (packages && packages.length > 0) {
          packages.forEach((pkg) => {
            const type = pkg.package_type as PackageType;
            if (packageTypes[type]) {
              const remaining =
                (pkg.sessions_included || 0) - (pkg.sessions_used || 0);
              packageTypes[type].remaining += remaining;
              packageTypes[type].total += pkg.sessions_included || 0;
            }
          });
        }

        // Convert to array and include all types
        const sessionSummary = Object.values(packageTypes);

        console.log("Sessions by type:", sessionSummary);
        setSessionsByType(sessionSummary);

        // Calculate total remaining sessions
        const totalRemaining = sessionSummary.reduce(
          (total, type) => total + type.remaining,
          0
        );
        setSessionsRemaining(totalRemaining);

        if (totalRemaining === 0) {
          setShowNoSessionsDialog(true);
        } else {
          setShowCurrentSessionsDialog(true);
        }
      } catch (error) {
        console.error("Session check error:", error);
        setSessionsRemaining(0);
        setSessionsByType([]);
        setShowNoSessionsDialog(true);
      } finally {
        setIsCheckingSession(false);
      }
    };

    checkRemainingSession();
  }, [supabase]);

  const handleTrainerSelect = (trainer: Trainer) => {
    setSelectedTrainer(trainer);
    setShowTrainerModal(false);
    // Set initial date to today when trainer is selected
    setSelectedDate(getTodayString());
  };

  const handleDateSelect = (date: string) => {
    setSelectedDate(date);
    setSelectedTime("");
  };

  const handleTimeSelect = (timeSlot: TimeSlot) => {
    if (!timeSlot.isAvailable) return;
    setSelectedTime(timeSlot.startTime);
  };

  // Group time slots by date for the existing UI
  const timeSlotsByDate: Record<string, TimeSlot[]> = Object.fromEntries([
    [selectedDate, availableTimeSlots],
  ]);

  const handleBooking = () => {
    // Mock booking logic
    alert(
      `Session booked: ${selectedType} on ${selectedDate} at ${selectedTime}`
    );
  };

  // Update selectedDate when date changes (from DatePicker)
  useEffect(() => {
    if (date) {
      // Always set as local YYYY-MM-DD string
      setSelectedDate(formatLocalDate(date));
    }
  }, [date]);

  // Update selectedDate when selectedDateObj changes
  useEffect(() => {
    if (selectedDateObj) {
      setSelectedDate(formatLocalDate(selectedDateObj));
    }
  }, [selectedDateObj]);

  // When displaying the selected date in the input field, always use local parsing
  // (handled in DatePicker component already)

  // When using selectedDate for logic, always parse as local
  const getFormattedBookingDate = () => {
    if (!selectedDate) return "";
    const dateObj = parseLocalDateString(selectedDate);
    return format(dateObj, "EEEE, MMMM d, yyyy");
  };

  // Format the booking time in 12-hour format
  const getFormattedBookingTime = () => {
    if (!selectedTimeSlot) return "";
    const timeDate = new Date(`2000-01-01T${selectedTimeSlot.startTime}`);
    return format(timeDate, "h:mm a");
  };

  // Get the selected session type details
  const getSelectedSessionType = () => {
    return sessionTypes.find((type) => type.id === selectedType);
  };

  // Check if we can show the booking button
  const canShowBookingButton =
    selectedTrainer && selectedDate && selectedTimeSlot && selectedType;

  // Fetch trainer availability when trainer is selected
  useEffect(() => {
    const fetchTrainerAvailability = async () => {
      if (!selectedTrainer) return;

      const { data, error } = await supabase
        .from("trainer_availability")
        .select("*")
        .eq("trainer_id", selectedTrainer.id);

      if (error) {
        console.error("Error fetching trainer availability:", error);
        return;
      }

      setTrainerAvailability(data || []);
    };

    fetchTrainerAvailability();
  }, [selectedTrainer, supabase]);

  const handleBookingConfirmation = async () => {
    console.log("Starting booking process...");
    setIsBooking(true);

    try {
      // Get the current session
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.user) {
        throw new Error("No authenticated user found");
      }

      // If profile is missing, fetch it
      let currentProfile = userProfile;
      if (!currentProfile) {
        console.log("Fetching user profile...");
        const { data: profile, error: profileError } = await supabase
          .from("users")
          .select("*")
          .eq("id", session.user.id)
          .single();

        if (profileError) {
          throw new Error(`Failed to load profile: ${profileError.message}`);
        }

        if (profile) {
          console.log("Successfully fetched user profile:", profile);
          currentProfile = profile;
          setUserProfile(profile);
        } else {
          throw new Error("No profile found");
        }
      }

      // Now validate with complete data
      const errorDetails = {
        missingTrainer: !selectedTrainer,
        missingDate: !selectedDate,
        missingTimeSlot: !selectedTimeSlot,
        missingType: !selectedType,
        missingUser: !session?.user,
        missingProfile: !currentProfile,
      };

      const missingFields = Object.entries(errorDetails)
        .filter(([_, isMissing]) => isMissing)
        .map(([field]) => field.replace("missing", "").toLowerCase());

      if (missingFields.length > 0) {
        throw new Error(`Missing required fields: ${missingFields.join(", ")}`);
      }

      // At this point we know all these values exist due to validation above
      if (!selectedTrainer || !selectedTimeSlot || !currentProfile) {
        throw new Error("Required booking data is missing");
      }

      // TypeScript now knows these values are not null
      const { data: sessionData, error: sessionError } = await supabase
        .from("sessions")
        .insert({
          client_id: session.user.id,
          trainer_id: selectedTrainer.id,
          date: selectedDate,
          start_time: selectedTimeSlot.startTime,
          end_time: selectedTimeSlot.endTime,
          type: selectedType,
          status: "confirmed",
        })
        .select()
        .single();

      if (sessionError) {
        throw sessionError;
      }

      // Find the corresponding package type for the session
      const sessionType = sessionTypes.find((t) => t.id === selectedType);
      const sessionTypeName = sessionType?.name;

      console.log("Session type mapping:", {
        selectedTypeId: selectedType,
        foundType: sessionType,
        mappedName: sessionTypeName,
        allTypes: sessionTypes.map((t) => ({ id: t.id, name: t.name })),
      });

      if (!sessionTypeName) {
        throw new Error(`Invalid session type: ${selectedType}`);
      }

      console.log("Finding package for session type:", sessionTypeName);

      // Debug: Check all active packages first
      const { data: allPackages, error: allPackagesError } = await supabase
        .from("packages")
        .select("*")
        .eq("client_id", session.user.id)
        .eq("status", "active");

      console.log("All active packages:", {
        count: allPackages?.length || 0,
        packages: allPackages,
      });

      // Get the user's packages
      const { data: userPackages, error: packagesError } = await supabase
        .from("packages")
        .select("*")
        .eq("client_id", session.user.id)
        .eq("package_type", sessionTypeName)
        .eq("status", "active")
        .order("purchase_date", { ascending: false });

      if (packagesError) {
        console.error("Package lookup error:", packagesError);
        throw packagesError;
      }

      console.log("Package lookup results:", {
        sessionType: selectedType,
        sessionTypeName,
        foundPackages: userPackages?.length || 0,
        packages: userPackages,
      });

      // Find the first package with remaining sessions
      const packageToUpdate = userPackages?.find(
        (pkg) => (pkg.sessions_included || 0) - (pkg.sessions_used || 0) > 0
      );

      if (!packageToUpdate) {
        throw new Error("No available package found for this session type");
      }

      console.log("Updating package:", {
        packageId: packageToUpdate.id,
        currentUsed: packageToUpdate.sessions_used,
        newUsed: (packageToUpdate.sessions_used || 0) + 1,
        packageType: packageToUpdate.package_type,
        totalSessions: packageToUpdate.sessions_included,
      });

      // First get the current value to ensure we have the latest
      const { data: currentPackage, error: getCurrentError } = await supabase
        .from("packages")
        .select("sessions_used")
        .eq("id", packageToUpdate.id)
        .single();

      if (getCurrentError) {
        throw new Error(
          `Failed to get current package state: ${getCurrentError.message}`
        );
      }

      console.log("Current package state:", currentPackage);

      // Use RPC call to increment the sessions_used count
      const { data: updateData, error: updateError } = await supabase.rpc(
        "increment_sessions_used",
        {
          package_id: packageToUpdate.id,
        }
      );

      console.log("Package update response:", {
        success: !updateError,
        error: updateError,
        updatedData: updateData,
      });

      if (updateError) {
        // If package update fails, delete the session to maintain consistency
        console.error("Failed to update package:", {
          error: updateError,
          packageId: packageToUpdate.id,
          currentValue: currentPackage?.sessions_used,
        });

        const { error: deleteError } = await supabase
          .from("sessions")
          .delete()
          .eq("id", sessionData.id);

        if (deleteError) {
          console.error(
            "Failed to delete session after package update failure:",
            deleteError
          );
        }

        throw new Error(`Failed to update package: ${updateError.message}`);
      }

      // Verify the update was successful
      const { data: verifyData, error: verifyError } = await supabase
        .from("packages")
        .select("sessions_used")
        .eq("id", packageToUpdate.id)
        .single();

      console.log("Package update verification:", {
        success:
          !verifyError &&
          verifyData?.sessions_used ===
            (currentPackage?.sessions_used || 0) + 1,
        expectedUsed: (currentPackage?.sessions_used || 0) + 1,
        actualUsed: verifyData?.sessions_used,
        verifyError,
      });

      // If verification fails, we should roll back
      if (
        !verifyError &&
        verifyData?.sessions_used !== (currentPackage?.sessions_used || 0) + 1
      ) {
        console.error(
          "Package update verification failed - rolling back session"
        );
        await supabase.from("sessions").delete().eq("id", sessionData.id);
        throw new Error(
          "Failed to verify package update - session has been rolled back"
        );
      }

      // Create calendar events for both trainer and client
      console.log("Creating calendar events...");

      let trainerEventId = null;
      let clientEventId = null;

      const baseEventDetails = {
        description: `${sessionTypeName} training session`,
        start: {
          dateTime: new Date(
            `${selectedDate}T${selectedTimeSlot.startTime}`
          ).toISOString(),
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        },
        end: {
          dateTime: new Date(
            `${selectedDate}T${selectedTimeSlot.endTime}`
          ).toISOString(),
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        },
        attendees: [
          { email: currentProfile.email },
          { email: selectedTrainer.email },
        ],
        reminders: {
          useDefault: true,
        },
      };

      // Create event in trainer's calendar with client's name
      try {
        console.log("Creating trainer calendar event for trainer:", {
          trainerId: selectedTrainer.id,
          trainerEmail: selectedTrainer.email,
        });

        const trainerEventDetails = {
          ...baseEventDetails,
          summary: `${sessionTypeName} with ${currentProfile.full_name}`,
        };

        const trainerEventResponse = await fetch(
          `/api/google/calendar/event?trainerId=${selectedTrainer.id}`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(trainerEventDetails),
          }
        );

        if (!trainerEventResponse.ok) {
          const trainerEventResult = await trainerEventResponse.text();
          console.warn("Failed to create trainer calendar event:", {
            status: trainerEventResponse.status,
            statusText: trainerEventResponse.statusText,
            result: trainerEventResult,
          });
        } else {
          const trainerEventData = await trainerEventResponse.json();
          trainerEventId = trainerEventData.eventId;
          console.log(
            "Trainer calendar event created successfully:",
            trainerEventId
          );
          console.log("Trainer event response data:", trainerEventData);
        }
      } catch (error) {
        console.warn("Error creating trainer calendar event:", {
          error,
          trainerId: selectedTrainer.id,
          trainerEmail: selectedTrainer.email,
        });
      }

      // Create event in client's calendar with trainer's name
      try {
        const clientEventDetails = {
          ...baseEventDetails,
          summary: `${sessionTypeName} with ${selectedTrainer.full_name}`,
        };

        const clientEventResponse = await fetch(
          `/api/google/calendar/client-event?clientId=${session.user.id}`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(clientEventDetails),
          }
        );

        if (!clientEventResponse.ok) {
          const clientEventResult = await clientEventResponse.text();
          console.warn("Failed to create client calendar event:", {
            status: clientEventResponse.status,
            statusText: clientEventResponse.statusText,
            result: clientEventResult,
          });
        } else {
          const clientEventData = await clientEventResponse.json();
          clientEventId = clientEventData.eventId;
          console.log(
            "Client calendar event created successfully:",
            clientEventId
          );
          console.log("Client event response data:", clientEventData);
        }
      } catch (error) {
        console.warn("Error creating client calendar event:", error);
      }

      // Update session with Google Calendar event IDs if they were created successfully
      console.log("About to update session with event IDs:", {
        sessionId: sessionData.id,
        trainerEventId,
        clientEventId,
        hasTrainerEvent: !!trainerEventId,
        hasClientEvent: !!clientEventId,
      });

      if (trainerEventId || clientEventId) {
        try {
          const updateData: any = {};
          if (trainerEventId) {
            updateData.google_event_id = trainerEventId;
          }
          if (clientEventId) {
            updateData.client_google_event_id = clientEventId;
          }

          console.log("Updating session with data:", updateData);

          const { error: updateError } = await supabase
            .from("sessions")
            .update(updateData)
            .eq("id", sessionData.id);

          if (updateError) {
            console.error(
              "Failed to update session with Google Calendar event IDs:",
              updateError
            );
            // Don't fail the entire operation, just log the error
          } else {
            console.log("✅ Session updated with Google Calendar event IDs:", {
              sessionId: sessionData.id,
              trainerEventId,
              clientEventId,
            });

            // Verify the update actually worked by fetching the session again
            console.log("🔍 Verifying database update...");
            const { data: verifySession, error: verifyError } = await supabase
              .from("sessions")
              .select("google_event_id, client_google_event_id")
              .eq("id", sessionData.id)
              .single();

            if (verifyError) {
              console.error("❌ Error verifying session update:", verifyError);
            } else {
              console.log("✅ Database verification result:", {
                sessionId: sessionData.id,
                google_event_id: verifySession.google_event_id,
                client_google_event_id: verifySession.client_google_event_id,
                expectedTrainerEvent: trainerEventId,
                expectedClientEvent: clientEventId,
                trainerMatch: verifySession.google_event_id === trainerEventId,
                clientMatch:
                  verifySession.client_google_event_id === clientEventId,
              });
            }
          }
        } catch (error) {
          console.error(
            "Error updating session with Google Calendar event IDs:",
            error
          );
          // Don't fail the entire operation, just log the error
        }
      } else {
        console.log(
          "No event IDs to update - both trainerEventId and clientEventId are null"
        );
      }

      // Send email notification with type-safe values
      const emailPayload = {
        trainer_email: selectedTrainer.email,
        trainer_name: selectedTrainer.full_name,
        client_name: currentProfile.full_name,
        date: selectedDate,
        start_time: format(
          parseISO(`2000-01-01T${selectedTimeSlot.startTime}`),
          "h:mm a"
        ),
        end_time: format(
          parseISO(`2000-01-01T${selectedTimeSlot.endTime}`),
          "h:mm a"
        ),
        session_type: getSelectedSessionType()?.name || selectedType,
      };

      await fetch("/api/email/session-created", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(emailPayload),
      });

      setShowBookingDialog(false);
      setShowSuccessDialog(true);
    } catch (error) {
      console.error("Error during booking:", error);
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Failed to book session. Please try again."
      );
      setShowErrorDialog(true);
    } finally {
      setIsBooking(false);
    }
  };

  // Add loading state display
  if (isCheckingSession) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Checking session availability...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-background px-4 md:px-6">
        <SidebarTrigger>
          <Button variant="ghost" size="icon" className="md:hidden">
            <Menu className="h-6 w-6" />
            <span className="sr-only">Toggle sidebar</span>
          </Button>
        </SidebarTrigger>
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center space-x-4">
            <Link href="/client/dashboard">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
            </Link>
            <h1 className="text-xl font-bold text-gray-900">Book a Session</h1>
          </div>
        </div>
      </div>

      {/* Trainer Selection Modal */}
      <Dialog open={showTrainerModal} onOpenChange={setShowTrainerModal}>
        <DialogContent
          className="sm:max-w-xl"
          onInteractOutside={(e) => e.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle>Select a Trainer</DialogTitle>
            <DialogDescription>
              Choose a trainer to book your session with
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto"></div>
                <p className="mt-2 text-gray-600">Loading trainers...</p>
              </div>
            ) : error ? (
              <div className="text-center py-8">
                <p className="text-red-600">{error}</p>
                <Button
                  onClick={() => window.location.reload()}
                  variant="outline"
                  className="mt-4"
                >
                  Try Again
                </Button>
              </div>
            ) : trainers.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-600">
                  No trainers available at the moment.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {trainers.map((trainer) => (
                  <div
                    key={trainer.id}
                    className="flex items-center p-4 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                    onClick={() => handleTrainerSelect(trainer)}
                  >
                    <Avatar className="h-12 w-12">
                      {trainer.avatar_url ? (
                        <AvatarImage
                          src={`https://gpbarexscmauxziijhxe.supabase.co/storage/v1/object/public/avatars/${trainer.avatar_url}`}
                          alt={trainer.full_name}
                        />
                      ) : (
                        <AvatarFallback className="bg-red-100 text-red-600">
                          {trainer.full_name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </AvatarFallback>
                      )}
                    </Avatar>
                    <div className="ml-4 flex-1">
                      <h3 className="font-medium text-gray-900">
                        {trainer.full_name}
                      </h3>
                      <p className="text-sm text-gray-500">{trainer.email}</p>
                    </div>
                    <Button variant="ghost" size="icon">
                      <ArrowLeft className="h-4 w-4 rotate-180" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {/* Session Type Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <span className="bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">
                  1
                </span>
                <span>Choose Session Type</span>
              </CardTitle>
              <CardDescription>
                Select the type of training session you'd like to book
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {sessionTypes.map((type) => {
                  // Find corresponding package type to check remaining sessions
                  const packageType = sessionsByType.find(
                    (pkg) => pkg.type === type.name
                  );
                  const sessionsRemaining = packageType?.remaining || 0;
                  const isDisabled = sessionsRemaining === 0;

                  return (
                    <div
                      key={type.id}
                      className={`p-4 border rounded-lg transition-all ${
                        isDisabled
                          ? "opacity-50 cursor-not-allowed border-gray-200"
                          : selectedType === type.id
                            ? "border-red-600 bg-red-50 cursor-pointer"
                            : "border-gray-200 hover:border-gray-300 cursor-pointer"
                      }`}
                      onClick={() => {
                        if (!isDisabled) {
                          setSelectedType(type.id);
                        }
                      }}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-medium">{type.name}</h3>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{type.duration}</Badge>
                          <Badge
                            variant={isDisabled ? "secondary" : "default"}
                            className={
                              isDisabled
                                ? "bg-gray-100"
                                : sessionsRemaining === 1
                                  ? "bg-red-100 text-red-700"
                                  : sessionsRemaining <= 3
                                    ? "bg-yellow-100 text-yellow-700"
                                    : "bg-green-100 text-green-700"
                            }
                          >
                            {sessionsRemaining} remaining
                          </Badge>
                        </div>
                      </div>
                      <p className="text-sm text-gray-600">
                        {type.description}
                      </p>
                      {selectedType === type.id && !isDisabled && (
                        <CheckCircle className="h-5 w-5 text-red-600 mt-2" />
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Date & Time Selection */}
          {selectedTrainer && (
            <section>
              <h2 className="text-lg font-semibold mb-4">
                2. Select Date & Time
              </h2>
              {loadingTimeSlots ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto"></div>
                  <p className="mt-2 text-gray-600">
                    Loading available times...
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Date Selection */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <span className="bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">
                          2
                        </span>
                        <span>Select Date</span>
                      </CardTitle>
                      <CardDescription>
                        Choose your preferred training date
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-col space-y-4">
                        <DatePicker
                          value={
                            selectedDateObj
                              ? formatLocalDate(selectedDateObj)
                              : ""
                          }
                          onChange={(date) => {
                            if (date) {
                              // Parse as local date, not UTC
                              const [year, month, day] = date
                                .split("-")
                                .map(Number);
                              setSelectedDateObj(
                                new Date(year, month - 1, day)
                              );
                            }
                          }}
                          min={getTodayString()}
                          id="booking-date"
                        />
                      </div>
                    </CardContent>
                  </Card>

                  {/* Time Slots */}
                  {selectedDate && (
                    <div>
                      <h3 className="text-lg font-medium mb-3">
                        Available Time Slots
                      </h3>
                      {loadingTimeSlots ? (
                        <div className="flex items-center justify-center p-4">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                        </div>
                      ) : availableTimeSlots.length > 0 ? (
                        <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                          {availableTimeSlots.map((slot, index) => (
                            <Button
                              key={index}
                              variant={
                                selectedTimeSlot === slot
                                  ? "default"
                                  : "outline"
                              }
                              className={cn(
                                "w-full",
                                !slot.isAvailable &&
                                  "opacity-50 cursor-not-allowed"
                              )}
                              onClick={() => setSelectedTimeSlot(slot)}
                              disabled={!slot.isAvailable}
                            >
                              {formatTimeForDisplay(slot.startTime)}
                            </Button>
                          ))}
                        </div>
                      ) : (
                        <p className="text-muted-foreground">
                          No available time slots for the selected date.
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}
            </section>
          )}

          {/* Booking Summary and Button */}
          {canShowBookingButton && (
            <Card className="mt-8">
              <CardHeader>
                <CardTitle>Booking Summary</CardTitle>
                <CardDescription>
                  Review your session details before booking
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-500">
                      Session Type
                    </p>
                    <p className="text-base">
                      {getSelectedSessionType()?.name}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-500">Trainer</p>
                    <p className="text-base">{selectedTrainer?.full_name}</p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-500">Date</p>
                    <p className="text-base">{getFormattedBookingDate()}</p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-500">Time</p>
                    <p className="text-base">{getFormattedBookingTime()}</p>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button
                  className="w-full bg-red-600 hover:bg-red-700 text-lg py-6"
                  onClick={() => setShowBookingDialog(true)}
                >
                  Book Session
                </Button>
              </CardFooter>
            </Card>
          )}

          {/* Booking Confirmation Dialog */}
          <Dialog open={showBookingDialog} onOpenChange={setShowBookingDialog}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Confirm Your Booking</DialogTitle>
                <DialogDescription>
                  Please review the details of your training session
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4">
                {/* Session Type */}
                <div className="flex items-start space-x-3">
                  <div className="bg-red-100 p-2 rounded-full">
                    <CalendarIcon className="h-5 w-5 text-red-600" />
                  </div>
                  <div>
                    <h4 className="font-medium">Session Type</h4>
                    <p className="text-sm text-gray-500">
                      {getSelectedSessionType()?.name} (
                      {getSelectedSessionType()?.duration})
                    </p>
                  </div>
                </div>

                {/* Trainer */}
                <div className="flex items-start space-x-3">
                  <div className="bg-red-100 p-2 rounded-full">
                    <User className="h-5 w-5 text-red-600" />
                  </div>
                  <div>
                    <h4 className="font-medium">Trainer</h4>
                    <p className="text-sm text-gray-500">
                      {selectedTrainer?.full_name}
                    </p>
                  </div>
                </div>

                {/* Date */}
                <div className="flex items-start space-x-3">
                  <div className="bg-red-100 p-2 rounded-full">
                    <Calendar className="h-5 w-5 text-red-600" />
                  </div>
                  <div>
                    <h4 className="font-medium">Date</h4>
                    <p className="text-sm text-gray-500">
                      {getFormattedBookingDate()}
                    </p>
                  </div>
                </div>

                {/* Time */}
                <div className="flex items-start space-x-3">
                  <div className="bg-red-100 p-2 rounded-full">
                    <Clock className="h-5 w-5 text-red-600" />
                  </div>
                  <div>
                    <h4 className="font-medium">Time</h4>
                    <p className="text-sm text-gray-500">
                      {getFormattedBookingTime()}
                    </p>
                  </div>
                </div>
              </div>

              <DialogFooter className="flex space-x-2 sm:space-x-0">
                <Button
                  variant="outline"
                  onClick={() => setShowBookingDialog(false)}
                  disabled={isBooking}
                >
                  Cancel
                </Button>
                <Button
                  className="bg-red-600 hover:bg-red-700"
                  onClick={handleBookingConfirmation}
                  disabled={isBooking}
                >
                  {isBooking ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Booking...
                    </>
                  ) : (
                    "Confirm Booking"
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </main>

      {error && (
        <div className="mt-4 p-4 bg-destructive/10 text-destructive rounded-md">
          {error}
        </div>
      )}

      {/* Success Dialog */}
      <AlertDialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Booking Successful!</AlertDialogTitle>
            <AlertDialogDescription>
              Your training session has been booked successfully. You can view
              your upcoming sessions in your dashboard.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction
              onClick={() => {
                setShowSuccessDialog(false);
                router.push("/client/dashboard");
              }}
            >
              Go to Dashboard
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Error Dialog */}
      <AlertDialog open={showErrorDialog} onOpenChange={setShowErrorDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Booking Failed</AlertDialogTitle>
            <AlertDialogDescription>{errorMessage}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setShowErrorDialog(false)}>
              Try Again
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Current Sessions Dialog */}
      <Dialog
        open={showCurrentSessionsDialog}
        onOpenChange={(open) => {
          setShowCurrentSessionsDialog(open);
          if (!open) {
            setShowTrainerModal(true);
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              Available Training Sessions
            </DialogTitle>
            <DialogDescription>
              You have{" "}
              <span className="font-semibold">{sessionsRemaining}</span> total
              training {sessionsRemaining === 1 ? "session" : "sessions"}{" "}
              remaining across your packages.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="space-y-4">
              {sessionsByType.map((packageType) => (
                <div
                  key={packageType.type}
                  className={`${
                    packageType.remaining >= 4
                      ? "bg-green-50"
                      : packageType.remaining >= 2
                        ? "bg-yellow-50"
                        : "bg-red-50"
                  } p-4 rounded-lg`}
                >
                  <h3
                    className={`font-semibold ${
                      packageType.remaining >= 4
                        ? "text-green-700"
                        : packageType.remaining >= 2
                          ? "text-yellow-700"
                          : "text-red-700"
                    }`}
                  >
                    {packageType.type}
                  </h3>
                  <div className="mt-2 flex justify-between items-center">
                    <span
                      className={`text-sm ${
                        packageType.remaining >= 4
                          ? "text-green-600"
                          : packageType.remaining >= 2
                            ? "text-yellow-600"
                            : "text-red-600"
                      }`}
                    >
                      {packageType.remaining} remaining
                    </span>
                    <Badge
                      variant="secondary"
                      className={`${
                        packageType.remaining >= 4
                          ? "bg-green-100"
                          : packageType.remaining >= 2
                            ? "bg-yellow-100"
                            : "bg-red-100"
                      }`}
                    >
                      {packageType.remaining}/{packageType.total} sessions
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
            <p className="text-sm text-gray-500 mt-4 text-center">
              Click continue to proceed with booking your next session.
            </p>
          </div>
          <div className="flex justify-end space-x-2 pt-4">
            <Button
              onClick={() => {
                setShowCurrentSessionsDialog(false);
                setShowTrainerModal(true);
              }}
            >
              Continue to Booking
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* No Sessions Dialog */}
      <Dialog
        open={showNoSessionsDialog}
        onOpenChange={(open) => {
          if (!open) {
            router.push("/client/dashboard");
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-500" />
              No Available Sessions
            </DialogTitle>
            <DialogDescription>
              You currently don't have any sessions left. Please purchase a new
              package before booking another session.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="space-y-4">
              {sessionsByType.map((packageType) => (
                <div
                  key={packageType.type}
                  className="bg-red-50 p-4 rounded-lg"
                >
                  <h3 className="font-semibold text-red-700">
                    {packageType.type}
                  </h3>
                  <div className="mt-2 flex justify-between items-center">
                    <span className="text-sm text-red-600">
                      {packageType.remaining} remaining
                    </span>
                    <Badge variant="secondary" className="bg-red-100">
                      {packageType.remaining}/{packageType.total} sessions
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
            <p className="text-sm text-gray-500 mt-4 text-center">
              Purchase more sessions to continue booking training sessions.
            </p>
          </div>
          <div className="flex justify-end space-x-2 pt-4">
            <Button
              variant="outline"
              onClick={() => router.push("/client/dashboard")}
            >
              Back to Dashboard
            </Button>
            <Button onClick={() => router.push("/client/packages")}>
              View Packages
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
