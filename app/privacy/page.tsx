import type { Metadata } from "next";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Privacy Policy - Fitness Trainer Scheduler",
  description:
    "Privacy policy and data handling practices for Fitness Trainer Scheduler",
};

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-white p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <Button
          variant="ghost"
          size="sm"
          className="mb-4 hover:bg-white/50"
          asChild
        >
          <Link href="/login">
            <ArrowLeft />
            Back to Login
          </Link>
        </Button>

        <Card className="shadow-xl border-0">
          <CardContent className="p-6 md:p-8">
            <h1 className="text-3xl font-bold mb-8">Privacy Policy</h1>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">Introduction</h2>
              <p className="text-muted-foreground mb-4">
                Welcome to Fitness Trainer Scheduler. We are committed to
                protecting your personal information and your right to privacy.
                This Privacy Policy explains how we collect, use, and safeguard
                your information when you use our platform.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">
                What Information We Collect
              </h2>
              <p className="text-muted-foreground mb-4">
                We collect information that you provide directly to us,
                including:
              </p>
              <ul className="list-disc list-inside text-muted-foreground mb-4 ml-4">
                <li>
                  Personal identification information (name, email address,
                  phone number)
                </li>
                <li>
                  Profile information (fitness goals, health data, preferences)
                </li>
                <li>Payment and billing information</li>
                <li>Communication data between trainers and clients</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">
                How We Use Your Information
              </h2>
              <p className="text-muted-foreground mb-4">
                We use the collected information for various purposes,
                including:
              </p>
              <ul className="list-disc list-inside text-muted-foreground mb-4 ml-4">
                <li>Providing and maintaining our services</li>
                <li>Personalizing your experience</li>
                <li>Processing payments and transactions</li>
                <li>Communicating with you about updates and services</li>
                <li>Improving our platform and user experience</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">Data Security</h2>
              <p className="text-muted-foreground mb-4">
                We implement appropriate security measures to protect your
                personal information. This includes encryption, secure servers,
                and regular security assessments. However, no method of
                transmission over the internet is 100% secure.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">
                Third-Party Services
              </h2>
              <p className="text-muted-foreground mb-4">
                We may use third-party services for various aspects of our
                platform, including payment processing and analytics. These
                providers have their own privacy policies and may collect and
                use your information according to their practices.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">Your Rights</h2>
              <p className="text-muted-foreground mb-4">
                You have certain rights regarding your personal information,
                including:
              </p>
              <ul className="list-disc list-inside text-muted-foreground mb-4 ml-4">
                <li>Accessing your personal data</li>
                <li>Correcting inaccurate information</li>
                <li>Requesting deletion of your information</li>
                <li>Opting out of marketing communications</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">Contact Us</h2>
              <p className="text-muted-foreground mb-4">
                If you have any questions about this Privacy Policy or our
                practices, please contact us at:
              </p>
              <p className="text-muted-foreground">
                Email: alexrendler@yahoo.com
                <br />
              </p>
            </section>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
