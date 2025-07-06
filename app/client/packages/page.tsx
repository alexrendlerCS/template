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
import {
  ArrowLeft,
  Menu,
  CheckCircle,
  Loader2,
  PlusCircle,
} from "lucide-react";
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
import CountUp from "react-countup";
import { useRef } from "react";

interface Package {
  id: string;
  name: string;
  sessionsPerWeek: number;
  hourlyRate: number;
  monthlyPrice: number;
  monthlySessionCount: number;
  priceId: string;
}

interface PackageSection {
  title: string;
  description: string;
  icon: string;
  packages: Package[];
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

const packageSections: PackageSection[] = [
  {
    title: "In-Person Training",
    description: "Get personalized attention with face-to-face sessions",
    icon: "🏋️",
    packages: [
      {
        id: "inperson-2",
        name: "2x Per Week",
        sessionsPerWeek: 2,
        hourlyRate: 125,
        monthlySessionCount: 8,
        monthlyPrice: 1000,
        priceId: "price_1Re6vXEKMzESB1YewPm98DzS",
      },
      {
        id: "inperson-3",
        name: "3x Per Week",
        sessionsPerWeek: 3,
        hourlyRate: 115,
        monthlySessionCount: 12,
        monthlyPrice: 1380,
        priceId: "price_1Re6vXEKMzESB1YebU76tDfH",
      },
      {
        id: "inperson-4",
        name: "4x Per Week",
        sessionsPerWeek: 4,
        hourlyRate: 110,
        monthlySessionCount: 16,
        monthlyPrice: 1760,
        priceId: "price_1Re6vXEKMzESB1YerK6MPNU9",
      },
      {
        id: "inperson-5",
        name: "5x Per Week",
        sessionsPerWeek: 5,
        hourlyRate: 100,
        monthlySessionCount: 20,
        monthlyPrice: 2000,
        priceId: "price_1Re6vXEKMzESB1YehCkpeMxB",
      },
    ],
  },
  {
    title: "Virtual Training",
    description: "Train from anywhere with our expert virtual coaching",
    icon: "💻",
    packages: [
      {
        id: "virtual-2",
        name: "2x Per Week",
        sessionsPerWeek: 2,
        hourlyRate: 115,
        monthlySessionCount: 8,
        monthlyPrice: 920,
        priceId: "price_1ReKRuEKMzESB1YeSGoCqnWe",
      },
      {
        id: "virtual-3",
        name: "3x Per Week",
        sessionsPerWeek: 3,
        hourlyRate: 105,
        monthlySessionCount: 12,
        monthlyPrice: 1260,
        priceId: "price_PLACEHOLDER_6",
      },
      {
        id: "virtual-4",
        name: "4x Per Week",
        sessionsPerWeek: 4,
        hourlyRate: 100,
        monthlySessionCount: 16,
        monthlyPrice: 1600,
        priceId: "price_PLACEHOLDER_7",
      },
      {
        id: "virtual-5",
        name: "5x Per Week",
        sessionsPerWeek: 5,
        hourlyRate: 90,
        monthlySessionCount: 20,
        monthlyPrice: 1800,
        priceId: "price_PLACEHOLDER_8",
      },
    ],
  },
  {
    title: "Partner Training",
    description: "Train with a friend and share the journey (Price per person)",
    icon: "👫",
    packages: [
      {
        id: "partner-2",
        name: "2x Per Week",
        sessionsPerWeek: 2,
        hourlyRate: 85,
        monthlySessionCount: 8,
        monthlyPrice: 680,
        priceId: "price_PLACEHOLDER_9",
      },
      {
        id: "partner-3",
        name: "3x Per Week",
        sessionsPerWeek: 3,
        hourlyRate: 80,
        monthlySessionCount: 12,
        monthlyPrice: 960,
        priceId: "price_PLACEHOLDER_10",
      },
      {
        id: "partner-4",
        name: "4x Per Week",
        sessionsPerWeek: 4,
        hourlyRate: 75,
        monthlySessionCount: 16,
        monthlyPrice: 1200,
        priceId: "price_PLACEHOLDER_11",
      },
      {
        id: "partner-5",
        name: "5x Per Week",
        sessionsPerWeek: 5,
        hourlyRate: 70,
        monthlySessionCount: 20,
        monthlyPrice: 1400,
        priceId: "price_PLACEHOLDER_12",
      },
    ],
  },
];

interface PurchasedPackageInfo {
  type: string;
  sessions: number;
}

function PackagesContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState<string | null>(null);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [showCanceledDialog, setShowCanceledDialog] = useState(false);
  const [hasShownMessage, setHasShownMessage] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [loadingPackages, setLoadingPackages] = useState(false);
  const [sessionsByType, setSessionsByType] = useState<PackageTypeCount[]>([]);
  const [purchasedPackage, setPurchasedPackage] =
    useState<PurchasedPackageInfo | null>(null);
  const [shouldFetchPackages, setShouldFetchPackages] = useState(false);
  const { user, setUser } = useUser();
  const supabase = createClient();
  const [retryCount, setRetryCount] = useState(0);
  const MAX_RETRIES = 3;
  const RETRY_DELAY = 2000; // 2 seconds
  const [showSingleSessionModal, setShowSingleSessionModal] = useState(false);
  const [selectedSessionType, setSelectedSessionType] =
    useState<PackageType | null>(null);
  const singleSessionPrice = 150;
  const singleSessionSection: PackageSection = {
    title: selectedSessionType || "In-Person Training",
    description: "Single session purchase",
    icon: "✨",
    packages: [],
  };
  const singleSessionPkg: Package = {
    id: "single-session",
    name: "Single Session",
    sessionsPerWeek: 1,
    hourlyRate: singleSessionPrice,
    monthlyPrice: singleSessionPrice,
    monthlySessionCount: 1,
    priceId: "single-session",
  };

  // Function to fetch user's package information
  const fetchPackageInformation = async () => {
    console.log("=== Starting fetchPackageInformation ===");
    console.log("Current user state:", {
      userId: user?.id,
      isAuthenticated: !!user,
      email: user?.email,
    });

    if (!user?.id) {
      console.log(
        "❌ No user ID found for fetching packages - will retry when user is available"
      );
      setShouldFetchPackages(true);
      return false;
    }

    setLoadingPackages(true);
    try {
      const sessionIdFromUrl = searchParams.get("session_id");

      console.log("🔍 Fetching all payments...");
      const { data: payments, error: paymentError } = await supabase
        .from("payments")
        .select("*")
        .eq("client_id", user.id)
        .order("paid_at", { ascending: false }); // ✅ CORRECT

      if (paymentError) {
        console.error("❌ Error fetching payments:", paymentError);
        return false;
      }

      console.log("💰 All payments:", payments);

      let targetPayment = payments?.[0]; // fallback
      if (sessionIdFromUrl) {
        const match = payments?.find((p) => p.session_id === sessionIdFromUrl);
        if (match) {
          console.log("🎯 Matched payment using session_id:", sessionIdFromUrl);
          targetPayment = match;
        } else {
          console.warn(
            "⚠️ No matching payment for session_id:",
            sessionIdFromUrl
          );
        }
      }

      if (!targetPayment) {
        console.log("ℹ️ No valid payment found");
        return false;
      }

      let packageType = targetPayment.package_type;

      if (!packageType) {
        console.log("🔍 package_type missing, looking it up...");
        const { data: packageFromTransaction } = await supabase
          .from("packages")
          .select("package_type")
          .eq("transaction_id", targetPayment.transaction_id)
          .single();

        if (packageFromTransaction) {
          console.log(
            "✅ Found package_type via transaction:",
            packageFromTransaction.package_type
          );
          packageType = packageFromTransaction.package_type;
        }
      }

      if (packageType) {
        setPurchasedPackage({
          type: packageType,
          sessions: targetPayment.session_count,
        });

        console.log("🎁 Set purchased package:", {
          type: packageType,
          sessions: targetPayment.session_count,
        });
      }

      // Load all package sessions and calculate remaining
      const { data: packages, error: packagesError } = await supabase
        .from("packages")
        .select("*")
        .eq("client_id", user.id)
        .order("purchase_date", { ascending: false });

      if (packagesError) {
        console.error("❌ Failed to fetch all packages:", packagesError);
        return false;
      }

      const packageTypes: Record<string, PackageTypeCount> = {
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

      packages.forEach((pkg) => {
        const type = pkg.package_type;
        if (packageTypes[type]) {
          const remaining =
            (pkg.sessions_included || 0) - (pkg.sessions_used || 0);
          packageTypes[type].remaining += remaining;
          packageTypes[type].total += pkg.sessions_included || 0;
        }
      });

      const sessionTypesArray = Object.values(packageTypes);
      setSessionsByType(sessionTypesArray);
      console.log("✅ Sessions by type:", sessionTypesArray);

      return true;
    } catch (error) {
      console.error("❌ Error in fetchPackageInformation:", error);
      return false;
    } finally {
      setLoadingPackages(false);
      setShouldFetchPackages(false);
    }
  };

  // Effect to handle initial mount and URL parameters
  useEffect(() => {
    const success = searchParams.get("success");
    const canceled = searchParams.get("canceled");

    console.log("🔄 Initial mount effect:", {
      success,
      canceled,
      hasShownMessage,
      isClient,
      hasUser: !!user,
      userId: user?.id,
    });

    setIsClient(true);

    if (!hasShownMessage) {
      if (success === "true") {
        console.log("✨ Success parameter detected on mount - showing dialog");
        setShowSuccessDialog(true);
        setHasShownMessage(true);
        setShouldFetchPackages(true);
      } else if (canceled === "true") {
        console.log("❌ Canceled parameter detected on mount");
        setShowCanceledDialog(true);
        setHasShownMessage(true);
      }
    }
  }, []);

  // Effect to watch for user data and fetch packages when ready
  useEffect(() => {
    console.log("👤 User state changed:", {
      hasUser: !!user,
      userId: user?.id,
      shouldFetch: shouldFetchPackages,
      retryCount,
    });

    if (user?.id && shouldFetchPackages) {
      console.log("✅ User data available, fetching packages...");
      fetchPackageInformation().then((foundPackages) => {
        // If no packages found and we haven't exceeded retries, try again
        if (
          !foundPackages &&
          retryCount < MAX_RETRIES &&
          searchParams.get("success") === "true"
        ) {
          console.log(
            `🔄 No packages found, scheduling retry ${retryCount + 1} of ${MAX_RETRIES}...`
          );
          setTimeout(() => {
            setRetryCount((prev) => prev + 1);
            setShouldFetchPackages(true);
          }, RETRY_DELAY);
        }
      });
    }
  }, [user, shouldFetchPackages, retryCount]);

  // Effect to handle URL parameter changes
  useEffect(() => {
    if (!isClient) return;

    const success = searchParams.get("success");
    const canceled = searchParams.get("canceled");

    console.log("🔄 URL parameters changed:", {
      success,
      canceled,
      hasShownMessage,
      showSuccessDialog,
      hasUser: !!user,
      userId: user?.id,
    });

    if (!hasShownMessage) {
      if (success === "true") {
        console.log("✨ Success parameter detected from URL change");
        setShowSuccessDialog(true);
        setHasShownMessage(true);
        setShouldFetchPackages(true);
      } else if (canceled === "true") {
        console.log("❌ Canceled parameter detected from URL change");
        setShowCanceledDialog(true);
        setHasShownMessage(true);
      }
    }
  }, [searchParams, isClient]);

  // Clean up URL when dialog is closed
  useEffect(() => {
    if (!isClient) return;

    // Only clean up if we've shown the message and the dialog is now closed
    if (hasShownMessage && !showSuccessDialog && !showCanceledDialog) {
      const success = searchParams.get("success");
      const canceled = searchParams.get("canceled");

      if (success === "true" || canceled === "true") {
        console.log("Cleaning up URL parameters");
        window.history.replaceState({}, "", "/client/packages");
      }
    }
  }, [hasShownMessage, showSuccessDialog, showCanceledDialog, isClient]);

  useEffect(() => {
    const initializeUser = async () => {
      try {
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();
        if (error) {
          console.error("Error getting session:", error);
          router.push("/login");
          return;
        }

        if (!session?.user) {
          console.log("No session found, redirecting to login");
          router.push("/login");
          return;
        }

        setUser(session.user);
      } catch (error) {
        console.error("Error initializing user:", error);
        router.push("/login");
      }
    };

    initializeUser();
  }, []);

  const handleCheckout = async (pkg: Package, section: PackageSection) => {
    try {
      if (!user?.id) {
        console.error("User not logged in");
        router.push("/login");
        return;
      }

      setIsLoading(pkg.id);

      // Ensure the package type is correctly formatted
      const packageType = section.title.endsWith("Training")
        ? section.title
        : `${section.title} Training`;

      console.log("🛍️ Creating checkout session with:", {
        userId: user.id,
        packageType,
        sessionsIncluded: pkg.monthlySessionCount,
        sectionTitle: section.title,
        validTypes: [
          "In-Person Training",
          "Virtual Training",
          "Partner Training",
        ],
      });

      const response = await fetch("/api/stripe/checkout-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: user.id,
          packageType: packageType,
          sessionsIncluded: pkg.monthlySessionCount,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create checkout session");
      }

      const { url } = await response.json();
      if (url) {
        window.location.href = url;
      } else {
        throw new Error("No checkout URL received");
      }
    } catch (error) {
      console.error("Checkout error:", error);
      console.error("Error initializing user:", error);
      router.push("/login");
    } finally {
      setIsLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Single Session Modal */}
      <Dialog
        open={showSingleSessionModal}
        onOpenChange={setShowSingleSessionModal}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-center mb-2">
              Try a Single Session
            </DialogTitle>
            <DialogDescription className="text-center text-base text-gray-700 mb-4">
              Not ready to commit? Try one session for now and if you enjoy it,
              come back and try one of our many package options.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-4">
            <div className="text-lg font-semibold text-gray-800 text-center mb-2">
              Select Session Type
            </div>
            {(
              [
                "In-Person Training",
                "Virtual Training",
                "Partner Training",
              ] as PackageType[]
            ).map((type) => (
              <Button
                key={type}
                variant={selectedSessionType === type ? "default" : "outline"}
                className="w-full justify-start text-base py-3"
                onClick={() => setSelectedSessionType(type)}
              >
                {type}
              </Button>
            ))}
          </div>
          <div className="text-center text-lg font-semibold py-2">
            Price: <span className="text-green-700">$150</span>
          </div>
          <DialogFooter>
            <Button
              className="w-full bg-green-600 hover:bg-green-700 text-lg py-3"
              disabled={!selectedSessionType}
              onClick={() => {
                if (selectedSessionType) {
                  handleCheckout(singleSessionPkg, {
                    ...singleSessionSection,
                    title: selectedSessionType,
                  });
                  setShowSingleSessionModal(false);
                  setSelectedSessionType(null);
                }
              }}
            >
              Continue to Checkout
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Success Dialog */}
      <Dialog
        open={showSuccessDialog}
        onOpenChange={(open) => {
          console.log("🔄 Dialog state changing:", {
            open,
            loadingPackages,
            hasPackages: sessionsByType.length > 0,
            purchasedPackage,
            hasUser: !!user,
            userId: user?.id,
          });

          if (!open) {
            setShowSuccessDialog(false);
            window.history.replaceState({}, "", "/client/packages");
            router.push("/client/booking");
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
              Thank you for investing in your fitness journey!
            </DialogDescription>
          </DialogHeader>
          <div className="py-6">
            {loadingPackages ? (
              <div className="flex items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-gray-500" />
              </div>
            ) : (
              <div className="space-y-6">
                {/* Newly Purchased Package Highlight */}
                {purchasedPackage && (
                  <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4 text-center animate-fade-in">
                    <div className="text-green-600 text-sm font-medium mb-1">
                      Just Added
                    </div>
                    <div className="text-2xl font-bold text-green-700 mb-2">
                      +<CountUp end={purchasedPackage.sessions} duration={5} />{" "}
                      Sessions
                    </div>
                    <div className="text-green-600 font-medium">
                      {purchasedPackage.type}
                    </div>
                  </div>
                )}

                {/* Session summary */}
                <div className="space-y-3">
                  <div className="text-gray-600 text-sm font-medium text-center mb-2">
                    Your Available Sessions
                  </div>
                  {sessionsByType.map((packageType) => {
                    const isNewlyPurchased =
                      purchasedPackage?.type === packageType.type;
                    return (
                      <div
                        key={packageType.type}
                        className={`p-4 rounded-lg ${
                          isNewlyPurchased
                            ? "bg-green-50 border-2 border-green-200"
                            : packageType.remaining > 0
                              ? "bg-gray-50 border border-gray-200"
                              : "bg-gray-50 border border-gray-100"
                        }`}
                      >
                        <div className="flex justify-between items-center">
                          <div className="text-gray-700 font-medium">
                            {packageType.type}
                          </div>
                          <div className="text-sm">
                            <span
                              className={`font-semibold ${
                                isNewlyPurchased
                                  ? "text-green-600"
                                  : packageType.remaining > 0
                                    ? "text-gray-700"
                                    : "text-gray-500"
                              }`}
                            >
                              {isNewlyPurchased ? (
                                <CountUp
                                  end={packageType.remaining}
                                  duration={5}
                                />
                              ) : (
                                packageType.remaining
                              )}{" "}
                              sessions
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="text-center space-y-2">
                  <p className="text-sm text-gray-600 font-medium">
                    Time to crush those fitness goals! 💪
                  </p>
                  <p className="text-xs text-gray-500">
                    Your trainer can't wait to get started with you
                  </p>
                </div>
              </div>
            )}
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
            router.push("/client/packages");
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
                router.push("/client/packages");
              }}
            >
              Return to Packages
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
            <h1 className="text-xl font-bold text-gray-900">
              Training Packages
            </h1>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8 py-4 sm:py-8">
        <div className="space-y-8 sm:space-y-12">
          {packageSections.map((section) => (
            <div key={section.title} className="space-y-4 sm:space-y-6">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
                <div>
                  <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center gap-2">
                    <span>{section.icon}</span>
                    <span>{section.title}</span>
                  </h2>
                  <p className="mt-1 sm:mt-2 text-base sm:text-lg text-gray-600">
                    {section.description}
                  </p>
                </div>
                {section.title === "In-Person Training" && (
                  <Button
                    className="bg-blue-600 hover:bg-blue-700 text-white text-base sm:text-lg px-4 sm:px-6 py-2 sm:py-3 rounded shadow-lg font-semibold transition-all duration-150 w-full sm:w-auto"
                    onClick={() => setShowSingleSessionModal(true)}
                  >
                    <PlusCircle className="h-5 w-5 mr-2" />
                    Try a Single Session
                  </Button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                {section.packages.map((pkg) => (
                  <Card key={pkg.id} className="flex flex-col">
                    <CardHeader className="pb-2 sm:pb-4">
                      <CardTitle className="text-lg sm:text-xl">
                        {pkg.name}
                      </CardTitle>
                      <CardDescription className="text-sm sm:text-base">
                        ${pkg.hourlyRate}/hour • {pkg.monthlySessionCount}{" "}
                        sessions/month
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="flex-grow pb-2 sm:pb-4">
                      <div className="space-y-2 sm:space-y-4">
                        <div className="text-2xl sm:text-4xl font-bold text-gray-900">
                          ${pkg.monthlyPrice}
                          <span className="text-xs sm:text-base font-normal text-gray-500">
                            /month
                          </span>
                        </div>
                        <ul className="space-y-1 sm:space-y-2 text-xs sm:text-sm text-gray-600">
                          <li>• {pkg.sessionsPerWeek}x sessions per week</li>
                          <li>
                            • {pkg.monthlySessionCount} sessions per month
                          </li>
                          <li>• ${pkg.hourlyRate} per hour</li>
                        </ul>
                      </div>
                    </CardContent>
                    <CardFooter>
                      <Button
                        className="w-full bg-red-600 hover:bg-red-700 text-white py-4 sm:py-6 text-base sm:text-lg"
                        onClick={() => handleCheckout(pkg, section)}
                        disabled={isLoading === pkg.id}
                      >
                        {isLoading === pkg.id
                          ? "Loading..."
                          : "Purchase Package"}
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}

export default function PackagesPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin text-red-600 mx-auto" />
            <p className="mt-2 text-gray-600">Loading packages...</p>
          </div>
        </div>
      }
    >
      <PackagesContent />
    </Suspense>
  );
}
