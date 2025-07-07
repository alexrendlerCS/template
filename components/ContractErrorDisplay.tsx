"use client";

import {
  AlertCircle,
  RefreshCw,
  LogOut,
  Mail,
  Phone,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface ContractErrorDisplayProps {
  error: string;
  onRetry?: () => void;
  onLogout?: () => void;
}

export function ContractErrorDisplay({
  error,
  onRetry,
  onLogout,
}: ContractErrorDisplayProps) {
  const getErrorType = (errorMessage: string) => {
    if (
      errorMessage.includes("session") ||
      errorMessage.includes("logged in")
    ) {
      return "session";
    } else if (
      errorMessage.includes("role") ||
      errorMessage.includes("account type")
    ) {
      return "role";
    } else if (errorMessage.includes("signature")) {
      return "signature";
    } else if (errorMessage.includes("email")) {
      return "email";
    } else if (
      errorMessage.includes("permission") ||
      errorMessage.includes("support")
    ) {
      return "system";
    } else {
      return "general";
    }
  };

  const getErrorIcon = (errorType: string) => {
    switch (errorType) {
      case "session":
        return <LogOut className="h-5 w-5" />;
      case "role":
        return <User className="h-5 w-5" />;
      case "signature":
        return <AlertCircle className="h-5 w-5" />;
      case "email":
        return <Mail className="h-5 w-5" />;
      case "system":
        return <AlertCircle className="h-5 w-5" />;
      default:
        return <AlertCircle className="h-5 w-5" />;
    }
  };

  const getErrorBadge = (errorType: string) => {
    switch (errorType) {
      case "session":
        return <Badge variant="secondary">Session Issue</Badge>;
      case "role":
        return <Badge variant="outline">Account Type</Badge>;
      case "signature":
        return <Badge variant="destructive">Signature Issue</Badge>;
      case "email":
        return <Badge variant="outline">Email Issue</Badge>;
      case "system":
        return <Badge variant="destructive">System Error</Badge>;
      default:
        return <Badge variant="secondary">General Error</Badge>;
    }
  };

  const getErrorGuidance = (errorType: string) => {
    switch (errorType) {
      case "session":
        return [
          "Your session has expired or is invalid.",
          "Try refreshing the page or logging out and back in.",
          "Make sure you're using the same browser you logged in with.",
        ];
      case "role":
        return [
          "You're logged in with the wrong account type.",
          "Log out and log in with your client account.",
          "Make sure you selected 'Client' when signing up.",
        ];
      case "signature":
        return [
          "There's an issue with your signature.",
          "Try signing again with your full name.",
          "Make sure you're signing on a touch-enabled device.",
        ];
      case "email":
        return [
          "There's an issue with your email address.",
          "Check that your email is confirmed.",
          "Make sure you're using the email you signed up with.",
        ];
      case "system":
        return [
          "This appears to be a system error.",
          "Try again in a few minutes.",
          "If the problem persists, contact support.",
        ];
      default:
        return [
          "An unexpected error occurred.",
          "Try refreshing the page and trying again.",
          "If the problem continues, contact support.",
        ];
    }
  };

  const errorType = getErrorType(error);

  return (
    <Card className="border-red-200 bg-red-50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {getErrorIcon(errorType)}
            <CardTitle className="text-red-800">Contract Error</CardTitle>
          </div>
          {getErrorBadge(errorType)}
        </div>
        <CardDescription className="text-red-700">{error}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <h4 className="font-medium text-red-800">What you can try:</h4>
          <ul className="space-y-1 text-sm text-red-700">
            {getErrorGuidance(errorType).map((guidance, index) => (
              <li key={index} className="flex items-start gap-2">
                <span className="text-red-500 mt-1">•</span>
                <span>{guidance}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="flex gap-2 pt-2">
          {onRetry && (
            <Button
              variant="outline"
              size="sm"
              onClick={onRetry}
              className="flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Try Again
            </Button>
          )}
          {onLogout && (
            <Button
              variant="outline"
              size="sm"
              onClick={onLogout}
              className="flex items-center gap-2"
            >
              <LogOut className="h-4 w-4" />
              Log Out
            </Button>
          )}
        </div>

        <div className="pt-2 border-t border-red-200">
          <p className="text-xs text-red-600">
            <strong>Need help?</strong> Contact support at{" "}
            <a href="mailto:haley@coachkilday.com" className="underline">
              haley@coachkilday.com
            </a>{" "}
            or call{" "}
            <a href="tel:+1234567890" className="underline">
              (123) 456-7890
            </a>
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
