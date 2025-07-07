"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useUser } from "@/lib/store/user";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2 } from "lucide-react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { createClient } from "@/lib/supabaseClient";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

function ClientCheckoutContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [showCanceledDialog, setShowCanceledDialog] = useState(false);
  const [hasShownMessage, setHasShownMessage] = useState(false);
  const { user, setUser } = useUser();
  const supabase = createClient();
  const [promoCode, setPromoCode] = useState("");
  const [promoError, setPromoError] = useState("");

  // Read query params for clientId, packageType, sessionsIncluded
  const clientId = searchParams.get("clientId");
  const packageType = searchParams.get("packageType") || "In-Person Training";
  const sessionsIncluded = parseInt(
    searchParams.get("sessionsIncluded") || "8",
    10
  );

  // Package info for display
  const packageInfo = {
    title: packageType,
    description: `Purchase ${sessionsIncluded} ${packageType} session${sessionsIncluded > 1 ? "s" : ""}.`,
    icon: "🏋️",
    package: {
      id: `${packageType.toLowerCase().replace(/\s/g, "-")}-${sessionsIncluded}`,
      name: `${sessionsIncluded} Session${sessionsIncluded > 1 ? "s" : ""}`,
      sessionsPerWeek: sessionsIncluded / 4,
      hourlyRate: 125, // You may want to adjust this or make dynamic
      monthlySessionCount: sessionsIncluded,
      monthlyPrice: undefined, // Not shown
      priceId: undefined, // Not used
    },
  };

  // Effect to handle initial mount and URL parameters
  useEffect(() => {
    const success = searchParams.get("success");
    const canceled = searchParams.get("canceled");
    setHasShownMessage(false);
    if (success === "true") {
      setShowSuccessDialog(true);
      setHasShownMessage(true);
    } else if (canceled === "true") {
      setShowCanceledDialog(true);
      setHasShownMessage(true);
    }
  }, [searchParams]);

  // User authentication check
  useEffect(() => {
    const initializeUser = async () => {
      try {
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();
        if (error) {
          router.push("/login");
          return;
        }
        if (!session?.user) {
          router.push("/login");
          return;
        }
        setUser(session.user);
      } catch (error) {
        router.push("/login");
      }
    };
    initializeUser();
  }, []);

  const handleCheckout = async () => {
    try {
      setPromoError("");
      if (!user?.id) {
        router.push("/login");
        return;
      }
      setIsLoading(true);
      const response = await fetch("/api/stripe/checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          packageType,
          sessionsIncluded,
          promoCode: promoCode.trim() || undefined,
        }),
      });
      if (!response.ok) {
        const data = await response.json();
        setPromoError(data.error || "Failed to create checkout session");
        setIsLoading(false);
        return;
      }
      const { url } = await response.json();
      if (url) {
        window.location.href = url;
      } else {
        throw new Error("No checkout URL received");
      }
    } catch (error) {
      setPromoError("Failed to create checkout session");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Success Dialog */}
      <Dialog
        open={showSuccessDialog}
        onOpenChange={(open) => {
          setShowSuccessDialog(open);
          if (!open) {
            router.push("/client/dashboard");
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-center gap-2 text-xl">
              <span className="text-2xl">🎉</span>
              Successful Purchase!
            </DialogTitle>
            <DialogDescription className="text-center pt-2">
              Thank you for your purchase!
            </DialogDescription>
          </DialogHeader>
          <div className="py-6 text-center">
            <div className="text-green-600 text-lg font-bold mb-2">
              {packageInfo.title}
            </div>
            <div className="text-2xl font-bold text-green-700 mb-2">
              +{sessionsIncluded} Sessions
            </div>
            <div className="text-green-600 font-medium">
              Ready to book with your trainer!
            </div>
          </div>
          <DialogFooter className="flex justify-end space-x-2">
            <Button
              variant="outline"
              onClick={() => {
                setShowSuccessDialog(false);
                router.push("/client/dashboard");
              }}
            >
              Go to Dashboard
            </Button>
            <Button
              className="bg-green-600 hover:bg-green-700"
              onClick={() => {
                setShowSuccessDialog(false);
                router.push("/client/booking");
              }}
            >
              Book Your First Session
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Canceled Dialog */}
      <Dialog
        open={showCanceledDialog}
        onOpenChange={(open) => {
          setShowCanceledDialog(open);
          if (!open) {
            router.push("/client/checkout");
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Purchase Canceled</DialogTitle>
            <DialogDescription>
              Your package purchase was canceled. No charges have been made to
              your account.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              onClick={() => {
                setShowCanceledDialog(false);
                router.push("/client/checkout");
              }}
            >
              Return to Checkout
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-background px-4 md:px-6">
        <SidebarTrigger>
          <Button variant="ghost" size="icon" className="md:hidden">
            <ArrowLeft className="h-6 w-6" />
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
            <h1 className="text-xl font-bold text-gray-900">
              Purchase Sessions
            </h1>
          </div>
        </div>
      </div>

      <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-12">
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <span>{packageInfo.icon}</span>
                <span>{packageInfo.title}</span>
              </h2>
              <p className="mt-2 text-lg text-gray-600">
                {packageInfo.description}
              </p>
            </div>
            <div className="grid grid-cols-1 gap-6">
              <Card className="flex flex-col">
                <CardHeader>
                  <CardTitle className="text-xl">
                    {packageInfo.package.name}
                  </CardTitle>
                  <CardDescription>
                    {sessionsIncluded} sessions • {packageType}
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex-grow">
                  <div className="space-y-4">
                    <ul className="space-y-2 text-sm text-gray-600">
                      <li>• {sessionsIncluded} sessions</li>
                      <li>• {packageType}</li>
                      <li>• Book anytime after purchase</li>
                    </ul>
                    <div className="mt-4">
                      <label
                        htmlFor="promo-code"
                        className="block text-sm font-medium text-gray-700 mb-1"
                      >
                        Promo Code (optional)
                      </label>
                      <input
                        id="promo-code"
                        type="text"
                        value={promoCode}
                        onChange={(e) => setPromoCode(e.target.value)}
                        className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500"
                        placeholder="Enter promo code"
                        disabled={isLoading}
                        autoComplete="off"
                      />
                      {promoError && (
                        <div className="text-red-600 text-sm mt-1">
                          {promoError}
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button
                    className="w-full bg-red-600 hover:bg-red-700 text-white py-6"
                    onClick={handleCheckout}
                    disabled={isLoading}
                  >
                    {isLoading ? "Loading..." : `Purchase Package`}
                  </Button>
                </CardFooter>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function ClientCheckoutPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin text-red-600 mx-auto" />
            <p className="mt-2 text-gray-600">Loading checkout...</p>
          </div>
        </div>
      }
    >
      <ClientCheckoutContent />
    </Suspense>
  );
}
