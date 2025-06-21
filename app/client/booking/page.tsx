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
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
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
    id: "personal",
    name: "Personal Training",
    duration: "60 min",
    description: "One-on-one focused training",
  },
  {
    id: "strength",
    name: "Strength Training",
    duration: "60 min",
    description: "Build muscle and power",
  },
  {
    id: "cardio",
    name: "Cardio Session",
    duration: "60 min",
    description: "High-intensity cardiovascular training",
  },
  {
    id: "flexibility",
    name: "Flexibility & Mobility",
    duration: "60 min",
    description: "Enhance range of motion and flexibility",
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

export default function BookingPage() {
  const [selectedType, setSelectedType] = useState("");
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedTime, setSelectedTime] = useState("");
  const [showTrainerModal, setShowTrainerModal] = useState(true);
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

  const supabase = createClient();

  useEffect(() => {
    const fetchAvailableTimeSlots = async () => {
      if (!selectedTrainer || !selectedDate) return;

      try {
        setLoadingTimeSlots(true);

        const dateObj = new Date(selectedDate + "T00:00:00Z");
        const jsDay = dateObj.getUTCDay();
        const selectedDayOfWeek = jsDay === 0 ? 7 : jsDay;

        console.log("Date debugging:", {
          selectedDate,
          dateString: selectedDate + "T00:00:00Z",
          dateObj,
          utcString: dateObj.toUTCString(),
          jsDay,
          selectedDayOfWeek,
          dayName: getDayName(jsDay),
        });

        // 1. Get trainer's regular availability for this day
        const { data: availabilityData, error: availabilityError } =
          await supabase
            .from("trainer_availability")
            .select("*")
            .eq("trainer_id", selectedTrainer.id)
            .eq("weekday", selectedDayOfWeek);

        if (availabilityError) throw availabilityError;

        // 2. Get trainer's unavailability for the specific date
        const { data: unavailabilityData, error: unavailabilityError } =
          await supabase
            .from("trainer_unavailable_slots")
            .select("*")
            .eq("trainer_id", selectedTrainer.id)
            .eq("date", selectedDate);

        if (unavailabilityError) throw unavailabilityError;

        // 3. Get existing sessions for the selected date
        const { data: sessionData, error: sessionError } = await supabase
          .from("sessions")
          .select("start_time, end_time")
          .eq("trainer_id", selectedTrainer.id)
          .eq("date", selectedDate)
          .neq("status", "cancelled"); // Exclude cancelled sessions

        if (sessionError) throw sessionError;

        console.log("Availability data:", {
          regular: availabilityData,
          unavailable: unavailabilityData,
          sessions: sessionData,
        });

        if (!availabilityData?.length) {
          console.log("No availability found for this day");
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

        console.log("Generated time slots:", allSlots);

        setAvailableTimeSlots(allSlots);
        setLoadingTimeSlots(false);
      } catch (error) {
        console.error("Error fetching time slots:", error);
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
          .select("id, full_name, email, avatar_url");

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
      if (!user) return;

      const { data: profile, error } = await supabase
        .from("users")
        .select("*")
        .eq("id", user.id)
        .single();

      if (error) {
        console.error("Error fetching user profile:", error);
        return;
      }

      setUserProfile(profile);
    };

    fetchUserProfile();
  }, [user, supabase]);

  const handleTrainerSelect = (trainer: Trainer) => {
    setSelectedTrainer(trainer);
    setShowTrainerModal(false);
    // Set initial date to today when trainer is selected
    setSelectedDate(format(new Date(), "yyyy-MM-dd"));
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

  // Update selectedDate when date changes
  useEffect(() => {
    if (date) {
      setSelectedDate(format(date, "yyyy-MM-dd"));
    }
  }, [date]);

  // Format the booking date in a friendly way
  const getFormattedBookingDate = () => {
    if (!selectedDate) return "";
    // Add time component and parse in local timezone
    const dateObj = new Date(`${selectedDate}T00:00:00`);
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

  // Update selectedDate when selectedDateObj changes
  useEffect(() => {
    if (selectedDateObj) {
      setSelectedDate(format(selectedDateObj, "yyyy-MM-dd"));
    }
  }, [selectedDateObj]);

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

    // Get the current session
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (
      !selectedTrainer ||
      !selectedDate ||
      !selectedTimeSlot ||
      !selectedType ||
      !session?.user ||
      !userProfile
    ) {
      console.log("Missing required fields:", {
        hasTrainer: !!selectedTrainer,
        hasDate: !!selectedDate,
        hasTimeSlot: !!selectedTimeSlot,
        hasType: !!selectedType,
        hasUser: !!session?.user,
        hasUserProfile: !!userProfile,
      });
      setErrorMessage(
        "Please select all booking details and ensure you're logged in"
      );
      setShowErrorDialog(true);
      return;
    }

    // Check if user has connected Google Calendar
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("google_refresh_token, google_account_connected")
      .eq("id", session.user.id)
      .single();

    if (
      !userData?.google_account_connected ||
      !userData?.google_refresh_token
    ) {
      setErrorMessage(
        "Please connect your Google Calendar first to enable booking. Go to Settings to connect."
      );
      setShowErrorDialog(true);
      return;
    }

    // Check if trainer has connected Google Calendar
    const { data: trainerData, error: trainerError } = await supabase
      .from("users")
      .select("google_refresh_token, google_account_connected")
      .eq("id", selectedTrainer.id)
      .single();

    if (
      !trainerData?.google_account_connected ||
      !trainerData?.google_refresh_token
    ) {
      setErrorMessage(
        "The selected trainer hasn't connected their Google Calendar yet. Please try again later or select another trainer."
      );
      setShowErrorDialog(true);
      return;
    }

    setIsBooking(true);
    try {
      console.log("Creating session in database...");
      // 1. Create session in the database
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
        console.error("Session creation error:", sessionError);
        throw sessionError;
      }

      console.log("Session created:", sessionData);

      // Send email notification to trainer
      const emailPayload = {
        trainer_email: selectedTrainer.email,
        trainer_name: selectedTrainer.full_name,
        client_name: userProfile.full_name,
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

      console.log("Sending email notification...", emailPayload);
      const emailRes = await fetch("/api/email/session-created", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(emailPayload),
      });

      if (!emailRes.ok) {
        console.warn(
          "Failed to send email notification:",
          await emailRes.text()
        );
        // Don't throw error here, as the session was created successfully
      } else {
        console.log("Email notification sent successfully");
      }

      // 2. Add to Google Calendar for both client and trainer
      const sessionDetails = {
        summary: `${getSelectedSessionType()?.name} with ${
          selectedTrainer.full_name
        }`,
        description: `Training session: ${
          getSelectedSessionType()?.name
        }\nTrainer: ${selectedTrainer.full_name}`,
        start: {
          dateTime: `${selectedDate}T${selectedTimeSlot.startTime}`,
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        },
        end: {
          dateTime: `${selectedDate}T${selectedTimeSlot.endTime}`,
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        },
      };

      console.log("Adding to client calendar...", sessionDetails);

      try {
        // Create event in client's calendar
        const clientCalendarRes = await fetch("/api/google/calendar/event", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(sessionDetails),
        });

        if (!clientCalendarRes.ok) {
          const errorText = await clientCalendarRes.text();
          console.error("Client calendar error:", errorText);
          throw new Error(errorText || "Failed to add to client calendar");
        }

        const clientCalendarData = await clientCalendarRes.json();
        console.log("Client calendar response:", clientCalendarData);

        // Update session with client's Google Calendar event ID
        const { error: updateError } = await supabase
          .from("sessions")
          .update({ google_event_id: clientCalendarData.eventId })
          .eq("id", sessionData.id);

        if (updateError) {
          console.error("Session update error:", updateError);
          throw updateError;
        }

        console.log("Adding to trainer calendar...");
        // Create event in trainer's calendar
        const trainerCalendarRes = await fetch(
          `/api/google/calendar/event?trainerId=${selectedTrainer.id}`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(sessionDetails),
          }
        );

        if (!trainerCalendarRes.ok) {
          const errorText = await trainerCalendarRes.text();
          console.error("Trainer calendar error:", errorText);
          throw new Error(errorText || "Failed to add to trainer calendar");
        }

        console.log("Booking completed successfully!");
        setShowBookingDialog(false);
        setShowSuccessDialog(true);
      } catch (error) {
        // If calendar creation fails, delete the session
        await supabase.from("sessions").delete().eq("id", sessionData.id);
        throw error;
      }
    } catch (error) {
      console.error("Booking error:", error);
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
                          src={trainer.avatar_url}
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
                {sessionTypes.map((type) => (
                  <div
                    key={type.id}
                    className={`p-4 border rounded-lg cursor-pointer transition-all ${
                      selectedType === type.id
                        ? "border-red-600 bg-red-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                    onClick={() => setSelectedType(type.id)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-medium">{type.name}</h3>
                      <Badge variant="outline">{type.duration}</Badge>
                    </div>
                    <p className="text-sm text-gray-600">{type.description}</p>
                    {selectedType === type.id && (
                      <CheckCircle className="h-5 w-5 text-red-600 mt-2" />
                    )}
                  </div>
                ))}
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
                          selected={selectedDateObj}
                          onChange={(date: Date | null) => {
                            if (date) {
                              setSelectedDateObj(date);
                            }
                          }}
                          minDate={new Date()}
                          maxDate={addDays(new Date(), 90)}
                          dateFormat="EEEE, MMMM d, yyyy"
                          inline
                          calendarClassName="!bg-white rounded-lg shadow-sm border border-input"
                          dayClassName={(date) =>
                            date &&
                            selectedDateObj &&
                            date.getTime() === selectedDateObj.getTime()
                              ? "bg-red-600 text-white rounded-md hover:bg-red-700"
                              : "hover:bg-gray-100 rounded-md"
                          }
                          renderCustomHeader={({
                            date,
                            decreaseMonth,
                            increaseMonth,
                            prevMonthButtonDisabled,
                            nextMonthButtonDisabled,
                          }) => (
                            <div className="flex items-center justify-center px-2 py-2">
                              <button
                                onClick={decreaseMonth}
                                disabled={prevMonthButtonDisabled}
                                type="button"
                                className="p-1 hover:bg-gray-100 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                <ChevronLeft className="h-4 w-4" />
                              </button>
                              <div className="flex-1 text-center">
                                {format(date, "MMMM yyyy")}
                              </div>
                              <button
                                onClick={increaseMonth}
                                disabled={nextMonthButtonDisabled}
                                type="button"
                                className="p-1 hover:bg-gray-100 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                <ChevronRight className="h-4 w-4" />
                              </button>
                            </div>
                          )}
                          filterDate={(date: Date) => {
                            // Disable past dates
                            if (isBefore(date, startOfToday())) return false;
                            // Get the day of week (0-6, where 0 is Sunday)
                            const dayOfWeek = date.getDay();
                            // Check if trainer is available on this day
                            if (!selectedTrainer) return false;
                            const hasAvailability = trainerAvailability.some(
                              (slot: TrainerAvailability) =>
                                slot.weekday === dayOfWeek
                            );
                            return hasAvailability;
                          }}
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
    </div>
  );
}
