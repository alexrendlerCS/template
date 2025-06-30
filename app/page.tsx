import Link from "next/link";
import { Calendar, Users2, CreditCard, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      <main className="container mx-auto px-4 py-16 flex flex-col items-center text-center">
        {/* Hero Section */}
        <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-gray-900 mb-4">
          Fitness Trainer Scheduler
        </h1>
        <p className="text-xl text-gray-600 mb-12 max-w-2xl">
          Streamline your fitness journey with easy session booking, progress
          tracking, and seamless payments.
        </p>
        <Link href="/login">
          <Button size="lg" className="mb-16 group">
            Get Started
            <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
          </Button>
        </Link>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-5xl">
          <Card className="border-2 hover:border-primary/50 transition-colors">
            <CardContent className="pt-6">
              <div className="rounded-full bg-primary/10 p-3 w-fit mx-auto mb-4">
                <Calendar className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">
                Smart Session Booking
              </h3>
              <p className="text-gray-600">
                Book sessions with your trainer effortlessly. Manage your
                schedule with our intuitive calendar interface.
              </p>
            </CardContent>
          </Card>

          <Card className="border-2 hover:border-primary/50 transition-colors">
            <CardContent className="pt-6">
              <div className="rounded-full bg-primary/10 p-3 w-fit mx-auto mb-4">
                <Users2 className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">
                Dedicated Dashboards
              </h3>
              <p className="text-gray-600">
                Separate interfaces for trainers and clients. Track progress,
                manage sessions, and communicate efficiently.
              </p>
            </CardContent>
          </Card>

          <Card className="border-2 hover:border-primary/50 transition-colors">
            <CardContent className="pt-6">
              <div className="rounded-full bg-primary/10 p-3 w-fit mx-auto mb-4">
                <CreditCard className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Secure Payments</h3>
              <p className="text-gray-600">
                Handle payments securely through our integrated payment system.
                Manage subscriptions with ease.
              </p>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
