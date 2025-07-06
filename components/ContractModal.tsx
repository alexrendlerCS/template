"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";
import {
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { ContractTemplate } from "./ContractTemplate";

interface ContractModalProps {
  onAccept?: () => Promise<void>;
  onBack?: () => void;
  onOpenChange?: (open: boolean) => void;
  clientName: string;
  email: string;
  phone: string;
  startDate: string;
  location: string;
  signature: string;
  isMinor?: boolean;
}

export function ContractModal({
  onAccept,
  onBack,
  onOpenChange,
  clientName,
  email,
  phone,
  startDate,
  location,
  signature,
  isMinor = false,
}: ContractModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

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

      // Generate and send the contract
      const response = await fetch("/api/contract/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          clientName,
          email,
          phone,
          startDate,
          location,
          signature,
          signatureDate: new Date().toISOString().split("T")[0],
          userId: session.user.id,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to generate contract");
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
    <>
      <DialogHeader className="flex flex-row items-center">
        <Button variant="ghost" size="icon" className="mr-2" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
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
        </div>
      </DialogHeader>

      <div className="flex-1 overflow-y-auto my-4 p-4 border rounded-lg">
        <ContractTemplate
          clientName={clientName}
          email={email}
          phone={phone}
          startDate={startDate}
          location={location}
          signature={signature}
          signatureDate={new Date().toISOString().split("T")[0]}
          isMinor={isMinor}
          trainerSignature=""
          trainerSignatureDate=""
        />
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
    </>
  );
}
