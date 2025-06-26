"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Menu } from "lucide-react";
import { SidebarTrigger } from "@/components/ui/sidebar";

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
        priceId: "price_1Re45TEKMzESB1Ye4taAItdk",
      },
      {
        id: "inperson-3",
        name: "3x Per Week",
        sessionsPerWeek: 3,
        hourlyRate: 115,
        monthlySessionCount: 12,
        monthlyPrice: 1380,
        priceId: "price_PLACEHOLDER_2",
      },
      {
        id: "inperson-4",
        name: "4x Per Week",
        sessionsPerWeek: 4,
        hourlyRate: 110,
        monthlySessionCount: 16,
        monthlyPrice: 1760,
        priceId: "price_PLACEHOLDER_3",
      },
      {
        id: "inperson-5",
        name: "5x Per Week",
        sessionsPerWeek: 5,
        hourlyRate: 100,
        monthlySessionCount: 20,
        monthlyPrice: 2000,
        priceId: "price_PLACEHOLDER_4",
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
        priceId: "price_PLACEHOLDER_5",
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

export default function PackagesPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState<string | null>(null);

  const handleCheckout = async (pkg: Package, section: PackageSection) => {
    try {
      setIsLoading(pkg.priceId);
      const response = await fetch("/api/stripe/checkout-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          priceId: pkg.priceId,
          packageType: section.title,
          sessionsIncluded: pkg.monthlySessionCount,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create checkout session");
      }

      const { url } = await response.json();
      router.push(url);
    } catch (error) {
      console.error("Checkout error:", error);
      // You might want to show an error toast here
    } finally {
      setIsLoading(null);
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
            <h1 className="text-xl font-bold text-gray-900">
              Training Packages
            </h1>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-12">
          {packageSections.map((section) => (
            <div key={section.title} className="space-y-6">
              <div>
                <h2 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
                  <span>{section.icon}</span>
                  <span>{section.title}</span>
                </h2>
                <p className="mt-2 text-lg text-gray-600">
                  {section.description}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {section.packages.map((pkg) => (
                  <Card key={pkg.id} className="flex flex-col">
                    <CardHeader>
                      <CardTitle className="text-xl">{pkg.name}</CardTitle>
                      <CardDescription>
                        ${pkg.hourlyRate}/hour • {pkg.monthlySessionCount}{" "}
                        sessions/month
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="flex-grow">
                      <div className="space-y-4">
                        <div className="text-4xl font-bold text-gray-900">
                          ${pkg.monthlyPrice}
                          <span className="text-base font-normal text-gray-500">
                            /month
                          </span>
                        </div>
                        <ul className="space-y-2 text-sm text-gray-600">
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
                        className="w-full bg-red-600 hover:bg-red-700 text-white py-6"
                        onClick={() => handleCheckout(pkg, section)}
                        disabled={isLoading === pkg.priceId}
                      >
                        {isLoading === pkg.priceId
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
