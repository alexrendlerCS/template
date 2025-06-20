import type { Metadata } from "next";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Privacy Policy - Coach Kilday LLC",
  description:
    "Privacy policy and data handling practices for Coach Kilday LLC",
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
                Welcome to Coach Kilday LLC. We are committed to protecting your
                personal information and your right to privacy. This Privacy
                Policy outlines how we collect, use, store, and protect your
                information when you engage with our services—whether online,
                in-person, or through our coaching platform.
              </p>
              <p className="text-muted-foreground mb-4">
                By using our website, services, coaching programs, mobile
                communication, or online tools, you consent to the data
                practices described in this policy.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">
                What Information We Collect
              </h2>
              <p className="text-muted-foreground mb-4">
                We collect the following types of information directly from you
                or through your interaction with our services:
              </p>
              <ul className="list-disc list-inside text-muted-foreground mb-4 ml-4">
                <li>
                  Personal identification information: Name, phone number, email
                  address, date of birth
                </li>
                <li>
                  Health & fitness information: Fitness goals, progress updates,
                  health history, body metrics, exercise and nutrition
                  preferences
                </li>
                <li>
                  Account and profile information: Check-in data, photos,
                  communication records, coaching preferences
                </li>
                <li>
                  Payment and billing information: Payment details collected and
                  processed securely via third-party providers
                </li>
                <li>
                  Technical data: IP address, browser type, device type, and
                  usage data if you access our digital platforms
                </li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">
                How We Use Your Information
              </h2>
              <p className="text-muted-foreground mb-4">
                We use your information to deliver an effective, personalized,
                and secure coaching experience. Specifically, we may use your
                data for:
              </p>
              <ul className="list-disc list-inside text-muted-foreground mb-4 ml-4">
                <li>
                  Program creation, progress tracking, and fitness coaching
                </li>
                <li>
                  Communicating updates, appointment reminders, or coaching
                  feedback
                </li>
                <li>Processing transactions and managing billing</li>
                <li>Analyzing and improving our services and systems</li>
                <li>
                  Sending motivational, educational, or promotional content
                  (with your consent)
                </li>
              </ul>
              <p className="text-muted-foreground mb-4">
                We do not sell or share your information for third-party
                marketing purposes.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">Data Security</h2>
              <p className="text-muted-foreground mb-4">
                We implement strict security measures to protect your
                information, including:
              </p>
              <ul className="list-disc list-inside text-muted-foreground mb-4 ml-4">
                <li>Secure server infrastructure and encryption protocols</li>
                <li>
                  Limiting access to client data only to authorized personnel
                </li>
                <li>
                  Secure third-party platforms for payment and data management
                </li>
                <li>Regular reviews of data protection practices</li>
              </ul>
              <p className="text-muted-foreground mb-4">
                However, no method of data transmission or storage is 100%
                secure, and we cannot guarantee absolute security. We retain
                personal data only as long as necessary to fulfill the purposes
                outlined in this policy, unless a longer retention period is
                required by law or contractual obligation. Users may request
                data deletion at any time.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">
                Third-Party Services
              </h2>
              <p className="text-muted-foreground mb-4">
                We may utilize third-party providers for:
              </p>
              <ul className="list-disc list-inside text-muted-foreground mb-4 ml-4">
                <li>Payment processing (e.g., Stripe, Square)</li>
                <li>
                  Client communication and scheduling (e.g., MyCoach Ai, Google
                  Calendar, Calendly)
                </li>
                <li>Marketing (e.g., Instagram, Mailchimp)</li>
              </ul>
              <p className="text-muted-foreground mb-4">
                These services have their own privacy policies, and we encourage
                you to review them if you use these tools in connection with our
                services.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">Google User Data</h2>
              <p className="text-muted-foreground mb-4">
                If you choose to sign in with your Google account and connect
                your Google Calendar, we may request access to your calendar
                data via Google's OAuth 2.0 system.
              </p>
              <p className="text-muted-foreground mb-4">
                We use this data solely to:
              </p>
              <ul className="list-disc list-inside text-muted-foreground mb-4 ml-4">
                <li>
                  Allow you (clients and/or trainers) to view your calendar
                  inside our platform
                </li>
                <li>Add new appointments or sessions that you schedule</li>
                <li>Ensure no conflicts with your existing calendar events</li>
              </ul>
              <p className="text-muted-foreground mb-4">
                We do not use Google user data for any advertising, analytics,
                or sharing purposes. You can revoke access at any time via your
                Google Account settings:{" "}
                <Link
                  href="https://myaccount.google.com/permissions"
                  className="text-blue-600 hover:underline"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  https://myaccount.google.com/permissions
                </Link>
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">Your Rights</h2>
              <p className="text-muted-foreground mb-4">
                You have the right to:
              </p>
              <ul className="list-disc list-inside text-muted-foreground mb-4 ml-4">
                <li>Access your personal information at any time</li>
                <li>Correct inaccuracies in your data</li>
                <li>
                  Request deletion of your data (subject to legal and
                  contractual obligations)
                </li>
                <li>
                  Withdraw consent from receiving promotional emails or texts
                </li>
              </ul>
              <p className="text-muted-foreground mb-4">
                To exercise these rights, contact us at haley@coachkilday.com.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">
                Children's Privacy
              </h2>
              <p className="text-muted-foreground mb-4">
                We do not knowingly collect personal data from minors without
                parental or guardian consent.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">
                Changes to This Policy
              </h2>
              <p className="text-muted-foreground mb-4">
                We may update this Privacy Policy from time to time. If we make
                material changes, we will notify you by email or through our
                platform.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">Contact Us</h2>
              <p className="text-muted-foreground mb-4">
                If you have any questions, concerns, or requests related to this
                Privacy Policy or your personal data, please reach out to:
              </p>
              <p className="text-muted-foreground">
                Coach Kilday LLC
                <br />
                haley@coachkilday.com
              </p>
            </section>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
