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
import { ContractErrorDisplay } from "./ContractErrorDisplay";

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

      console.log("Starting contract acceptance process...");

      // Get the current session
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError) {
        console.error("Session error:", sessionError);
        throw new Error(
          "Your session has expired. Please refresh the page and try again."
        );
      }

      if (!session?.user) {
        console.error("No user session found");
        throw new Error("You are not logged in. Please log in and try again.");
      }

      console.log("User authenticated:", session.user.email);

      // Check user role to ensure they're accessing the correct flow
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("role")
        .eq("id", session.user.id)
        .single();

      console.log("Role validation check:", {
        userId: session.user.id,
        userData,
        userError,
        role: userData?.role,
      });

      if (userError) {
        console.error("Failed to fetch user role:", userError);
        throw new Error(
          "Account error: Unable to verify your account type. Please contact support."
        );
      }

      if (!userData) {
        throw new Error(
          "Account error: User profile not found. Please contact support."
        );
      }

      if (userData.role !== "client") {
        throw new Error(
          `You are logged in as a ${userData.role}. Please log in with your client account to accept the contract.`
        );
      }

      // Validate signature before sending
      if (!signature || signature.length < 100) {
        console.error("Invalid signature data");
        throw new Error(
          "Please provide a complete signature before submitting."
        );
      }

      console.log("Preparing contract data...");
      const contractData = {
        clientName,
        email,
        phone,
        startDate,
        location,
        signature,
        signatureDate: new Date().toISOString().split("T")[0],
        userId: session.user.id,
      };

      console.log("Contract data prepared:", {
        clientName: contractData.clientName,
        email: contractData.email,
        phone: contractData.phone,
        startDate: contractData.startDate,
        location: contractData.location,
        signatureLength: contractData.signature.length,
        userId: contractData.userId,
      });

      // Generate and send the contract
      console.log("Sending contract generation request...");
      const response = await fetch("/api/contract/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(contractData),
      });

      console.log("Response status:", response.status);
      const responseData = await response.json();
      console.log("Response data:", responseData);

      if (!response.ok) {
        console.error("Contract generation failed:", responseData);

        // Handle specific error cases
        if (response.status === 400) {
          if (responseData.error?.includes("Missing required fields")) {
            throw new Error(
              "Please fill in all required information before submitting."
            );
          } else if (responseData.error?.includes("Invalid signature")) {
            throw new Error(
              "Please provide a valid signature. Try signing again."
            );
          } else if (
            responseData.error?.includes("Please provide a valid signature")
          ) {
            throw new Error(
              "Your signature appears to be incomplete. Please sign your full name."
            );
          } else if (responseData.error?.includes("Missing userId")) {
            throw new Error(
              "Account error: Please log out and log back in, then try again."
            );
          } else {
            throw new Error(
              responseData.error ||
                "Please check your information and try again."
            );
          }
        } else if (response.status === 401) {
          throw new Error("Your session has expired. Please log in again.");
        } else if (response.status === 403) {
          throw new Error(
            "You don't have permission to perform this action. Please contact support."
          );
        } else if (response.status === 500) {
          if (responseData.error?.includes("Server configuration error")) {
            throw new Error(
              "System error: Please contact support immediately."
            );
          } else if (
            responseData.error?.includes("Failed to upload contract")
          ) {
            throw new Error(
              "Unable to save your contract. Please try again or contact support."
            );
          } else if (responseData.error?.includes("Failed to save contract")) {
            throw new Error(
              "Unable to save your contract to our system. Please try again."
            );
          } else if (
            responseData.error?.includes("Failed to process signature")
          ) {
            throw new Error(
              "There was an issue processing your signature. Please try signing again."
            );
          } else {
            throw new Error(
              "A system error occurred. Please try again or contact support if the problem persists."
            );
          }
        } else {
          throw new Error(
            responseData.error ||
              "An unexpected error occurred. Please try again."
          );
        }
      }

      console.log("Contract generated successfully, updating user status...");

      // Update the user's contract acceptance status
      const { error: updateError } = await supabase
        .from("users")
        .update({
          contract_accepted: true,
          contract_signed_at: new Date().toISOString(),
        })
        .eq("id", session.user.id);

      if (updateError) {
        console.error("Failed to update user contract status:", updateError);

        // Handle specific database errors
        if (updateError.code === "PGRST116") {
          throw new Error(
            "Account error: Your user profile is missing. Please contact support."
          );
        } else if (updateError.code === "23505") {
          throw new Error(
            "Contract already accepted. You can proceed to the next step."
          );
        } else if (updateError.code === "42501") {
          throw new Error(
            "Permission error: Please contact support to resolve this issue."
          );
        } else {
          throw new Error(
            "Contract was generated but we couldn't update your status. Please contact support."
          );
        }
      }

      console.log("User contract status updated successfully");

      // Call the onAccept callback if provided
      if (onAccept) {
        console.log("Calling onAccept callback...");
        await onAccept();
      }

      console.log("Contract acceptance process completed successfully");
    } catch (error) {
      console.error("Error accepting contract:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Failed to accept contract";
      setError(errorMessage);

      // Log additional context for debugging
      console.error("Error context:", {
        clientName,
        email,
        phone,
        startDate,
        location,
        signatureLength: signature?.length || 0,
        userAgent: navigator.userAgent,
        timestamp: new Date().toISOString(),
      });
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
        <div className="mb-4">
          <ContractErrorDisplay
            error={error}
            onRetry={() => {
              setError(null);
              handleAgree();
            }}
            onLogout={() => {
              router.push("/login");
            }}
          />
        </div>
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
