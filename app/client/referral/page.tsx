"use client";

import { SidebarTrigger } from "@/components/ui/sidebar";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Gift, Link as LinkIcon, Users } from "lucide-react";
import { useState } from "react";

const mockReferralCode = "client456";
const referralLink = `${typeof window !== "undefined" ? window.location.origin : "https://yourapp.com"}/signup?ref=${mockReferralCode}`;

export default function ClientReferralPage() {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-background px-4 md:px-6">
        <SidebarTrigger />
        <h1 className="text-xl font-bold text-gray-900">Referral Program</h1>
      </div>
      <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Gift className="h-5 w-5 text-red-600" />
              <span>Invite Friends & Earn Rewards</span>
            </CardTitle>
            <CardDescription>
              Share your unique referral link. Earn rewards when friends join
              and purchase training packages!
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center gap-2 bg-gray-50 border rounded p-3">
              <LinkIcon className="h-4 w-4 text-gray-400" />
              <span className="truncate text-sm font-mono">{referralLink}</span>
              <Button
                size="sm"
                variant="outline"
                onClick={handleCopy}
                className="ml-2"
              >
                {copied ? "Copied!" : "Copy"}
              </Button>
            </div>
            <div className="bg-gray-50 p-4 rounded flex items-center gap-3">
              <Users className="h-5 w-5 text-blue-600" />
              <div>
                <div className="font-medium">Referred Friends</div>
                <div className="text-sm text-gray-500">
                  Coming Soon: See who you've referred and your reward status.
                </div>
              </div>
            </div>
            <div className="bg-yellow-50 p-4 rounded text-yellow-800 text-center font-medium">
              Reward tracking and redemption features are coming soon!
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
