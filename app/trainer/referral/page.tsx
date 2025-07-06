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

const mockReferralCode = "trainer123";
const referralLink = `${typeof window !== "undefined" ? window.location.origin : "https://yourapp.com"}/signup?ref=${mockReferralCode}`;

export default function TrainerReferralPage() {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="flex-1">
      <header className="border-b bg-white px-6 py-4">
        <div className="flex items-center space-x-4">
          <SidebarTrigger />
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Gift className="h-6 w-6 text-red-600" /> Referral Program
          </h1>
        </div>
      </header>
      <main className="p-6 max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Gift className="h-5 w-5 text-red-600" />
              <span>Invite Trainers & Earn Commission</span>
            </CardTitle>
            <CardDescription>
              Share your unique referral link. Earn commission when trainers you
              refer join and subscribe!
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
                <div className="font-medium">Referred Trainers</div>
                <div className="text-sm text-gray-500">
                  Coming Soon: See who you've referred and your commission
                  status.
                </div>
              </div>
            </div>
            <div className="bg-yellow-50 p-4 rounded text-yellow-800 text-center font-medium">
              Commission tracking and payout features are coming soon!
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
