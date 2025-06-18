"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CheckCircle } from "lucide-react";
import { createClient } from "@/lib/supabaseClient";

interface GoogleCalendarSuccessDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function GoogleCalendarSuccessDialog({
  open,
  onOpenChange,
}: GoogleCalendarSuccessDialogProps) {
  const [userRole, setUserRole] = useState<"trainer" | "client" | null>(null);
  const supabase = createClient();

  useEffect(() => {
    const getUserRole = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from("users")
        .select("role")
        .eq("id", user.id)
        .single();

      if (data?.role) {
        setUserRole(data.role as "trainer" | "client");
      }
    };

    if (open) {
      getUserRole();
    }
  }, [open, supabase]);

  const getMessage = () => {
    if (userRole === "trainer") {
      return "Your Google Calendar has been successfully connected and a dedicated calendar for managing your client training sessions has been created. All your training sessions will now be automatically synced to this calendar.";
    } else {
      return "Your Google Calendar has been successfully connected and a dedicated calendar for your training sessions has been created. All your scheduled sessions will now be automatically synced to this calendar.";
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-center">
            <CheckCircle className="h-6 w-6 text-green-500" />
            <span>Google Calendar Connected!</span>
          </DialogTitle>
          <DialogDescription className="text-center pt-2">
            {getMessage()}
          </DialogDescription>
        </DialogHeader>
        <div className="flex justify-center pt-4">
          <Button
            onClick={() => onOpenChange(false)}
            className="bg-green-600 hover:bg-green-700"
          >
            Got it!
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
