import type { Metadata } from "next";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Terms of Service - Fitness Trainer Scheduler",
  description:
    "Terms and conditions for using the Fitness Trainer Scheduler platform",
};

export default function TermsOfService() {
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
            <h1 className="text-3xl font-bold mb-8">Terms of Service</h1>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">
                Acceptance of Terms
              </h2>
              <p className="text-muted-foreground mb-4">
                By accessing or using the Fitness Trainer Scheduler platform,
                you agree to be bound by these Terms of Service. If you disagree
                with any part of these terms, you may not access or use our
                services.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">
                Use of the Platform
              </h2>
              <p className="text-muted-foreground mb-4">
                Our platform provides tools and services for fitness trainers
                and clients to connect, schedule sessions, and manage their
                fitness journey. You agree to use the platform only for its
                intended purposes and in compliance with all applicable laws and
                regulations.
              </p>
              <ul className="list-disc list-inside text-muted-foreground mb-4 ml-4">
                <li>You must be at least 18 years old to use our services</li>
                <li>
                  You are responsible for maintaining the security of your
                  account
                </li>
                <li>
                  You agree not to misuse or abuse our platform or services
                </li>
                <li>
                  You will not attempt to circumvent any platform security
                  measures
                </li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">User Accounts</h2>
              <p className="text-muted-foreground mb-4">
                To access certain features of the platform, you must register
                for an account. You agree to provide accurate, current, and
                complete information during registration and to update such
                information to keep it accurate, current, and complete.
              </p>
              <p className="text-muted-foreground mb-4">
                You are responsible for safeguarding your account credentials
                and for any activities or actions under your account. You must
                notify us immediately upon becoming aware of any breach of
                security or unauthorized use of your account.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">
                Payments and Subscriptions
              </h2>
              <p className="text-muted-foreground mb-4">
                Certain aspects of our service may require payment of fees. You
                agree to pay all applicable fees and taxes in connection with
                your activities on the platform. All payments are non-refundable
                unless otherwise specified.
              </p>
              <ul className="list-disc list-inside text-muted-foreground mb-4 ml-4">
                <li>
                  Subscription fees are billed in advance on a recurring basis
                </li>
                <li>You may cancel your subscription at any time</li>
                <li>Refunds are handled according to our refund policy</li>
                <li>We reserve the right to modify our pricing with notice</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">Termination</h2>
              <p className="text-muted-foreground mb-4">
                We reserve the right to terminate or suspend your account and
                access to our services immediately, without prior notice or
                liability, for any reason whatsoever, including without
                limitation if you breach these Terms of Service.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">
                Limitation of Liability
              </h2>
              <p className="text-muted-foreground mb-4">
                In no event shall Fitness Trainer Scheduler, nor its directors,
                employees, partners, agents, suppliers, or affiliates, be liable
                for any indirect, incidental, special, consequential or punitive
                damages, including without limitation, loss of profits, data,
                use, goodwill, or other intangible losses.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">Governing Law</h2>
              <p className="text-muted-foreground mb-4">
                These Terms shall be governed by and construed in accordance
                with the laws of Colorado, without regard to its conflict of law
                principles. You agree that any legal action or proceeding
                arising under or related to these Terms shall be brought
                exclusively in the courts located in Colroado, and you hereby
                consent to the personal jurisdiction and venue therein. Our
                failure to enforce any right or provision of these Terms shall
                not be deemed a waiver of such right or provision. If any
                provision of these Terms is found to be invalid or unenforceable
                by a court, the remaining provisions of these Terms will remain
                in full force and effect. These Terms constitute the entire
                agreement between us regarding our services and supersede and
                replace any prior agreements we might have had between us
                regarding the service.
              </p>
            </section>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
