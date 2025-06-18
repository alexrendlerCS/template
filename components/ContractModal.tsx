"use client";

import { useState } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { Button } from "@/components/ui/button";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import {
  Dialog,
  DialogContent as BaseDialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogPortal,
  DialogOverlay,
} from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import type { Database } from "@/lib/database.types";
import { cn } from "@/lib/utils";
import { forwardRef } from "react";

// Custom DialogContent without close button
const DialogContent = forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>
>(({ className, children, ...props }, ref) => (
  <DialogPortal>
    <DialogOverlay />
    <DialogPrimitive.Content
      ref={ref}
      className={cn(
        "fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg",
        className
      )}
      {...props}
    >
      {children}
    </DialogPrimitive.Content>
  </DialogPortal>
));
DialogContent.displayName = "DialogContent";

interface ContractModalProps {
  onAccept?: () => Promise<void>;
  onOpenChange?: (open: boolean) => void;
}

export function ContractModal({ onAccept, onOpenChange }: ContractModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClientComponentClient<Database>();

  const handleAgree = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Get the current session
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError) {
        throw new Error("Failed to get session");
      }

      if (!session?.user) {
        throw new Error("Not authenticated");
      }

      // Update the user's contract acceptance status
      const { error: updateError } = await supabase
        .from("users")
        .update({
          contract_accepted: true,
          contract_signed_at: new Date().toISOString(),
        })
        .eq("id", session.user.id);

      if (updateError) {
        throw updateError;
      }

      // Call the onAccept callback if provided
      if (onAccept) {
        await onAccept();
      }

      // Close the modal
      if (onOpenChange) {
        onOpenChange(false);
      }

      // Refresh the page to update UI state
      router.refresh();
    } catch (error) {
      console.error("Error accepting contract:", error);
      setError(
        error instanceof Error ? error.message : "Failed to accept contract"
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={true} onOpenChange={undefined}>
      <DialogContent className="max-w-3xl h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">
            Client Agreement
          </DialogTitle>
          <DialogDescription className="space-y-2 text-sm text-muted-foreground">
            Please review and accept the following terms and conditions to
            continue.
            <span className="block mt-2 text-yellow-600 dark:text-yellow-500 font-medium">
              ⚠️ This agreement must be accepted before you can proceed with
              using the platform. You cannot skip this step.
            </span>
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto my-4 p-4 border rounded-lg">
          <h2 className="text-xl font-semibold mb-4">Terms and Conditions</h2>
          <div className="space-y-4">
            <p>
              This agreement ("Agreement") is entered into between the personal
              trainer ("Trainer") and the client ("Client") for the provision of
              personal training services.
            </p>

            <h3 className="font-semibold">1. Services</h3>
            <p>
              The Trainer agrees to provide personal training services to the
              Client, including but not limited to fitness assessments, exercise
              programming, and nutritional guidance.
            </p>

            <h3 className="font-semibold">2. Client Responsibilities</h3>
            <p>
              The Client agrees to: - Attend scheduled sessions on time - Follow
              the exercise and nutrition program provided - Provide accurate
              health information - Notify the Trainer of any health concerns
            </p>

            <h3 className="font-semibold">3. Cancellation Policy</h3>
            <p>
              Sessions must be cancelled at least 24 hours in advance. Late
              cancellations or no-shows may result in session forfeiture.
            </p>

            <h3 className="font-semibold">4. Payment Terms</h3>
            <p>
              Payment is due at the time of booking. Packages are non-refundable
              and expire within the specified timeframe.
            </p>

            <h3 className="font-semibold">5. Liability</h3>
            <p>
              The Client acknowledges that participation in physical activity
              involves inherent risks and agrees to hold the Trainer harmless
              for any injuries or damages.
            </p>
          </div>
        </div>

        {error && (
          <div className="text-red-600 text-sm mb-4 text-center">{error}</div>
        )}

        <div className="flex justify-center mt-4">
          <Button
            onClick={handleAgree}
            disabled={isLoading}
            className="w-full max-w-md"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              "I Agree"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
