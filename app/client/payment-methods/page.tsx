"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { SidebarTrigger } from "@/components/ui/sidebar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  CreditCard,
  Plus,
  ArrowLeft,
  Calendar,
  DollarSign,
  Settings,
  Trash2,
  Shield,
  Menu,
} from "lucide-react";
import Link from "next/link";

const mockPaymentMethods = [
  {
    id: 1,
    type: "visa",
    last4: "4242",
    expiryMonth: 12,
    expiryYear: 2025,
    isDefault: true,
  },
  {
    id: 2,
    type: "mastercard",
    last4: "8888",
    expiryMonth: 8,
    expiryYear: 2026,
    isDefault: false,
  },
];

const mockPurchaseHistory = [
  {
    id: 1,
    date: "2024-01-10",
    description: "4 Training Sessions Package",
    amount: 240,
    method: "•••• 4242",
    status: "completed",
  },
  {
    id: 2,
    date: "2023-12-15",
    description: "3 Training Sessions Package",
    amount: 180,
    method: "•••• 4242",
    status: "completed",
  },
  {
    id: 3,
    date: "2023-11-20",
    description: "5 Training Sessions Package",
    amount: 300,
    method: "•••• 8888",
    status: "completed",
  },
];

export default function PaymentMethodsPage() {
  const [autopayEnabled, setAutopayEnabled] = useState(true);
  const [isAddCardOpen, setIsAddCardOpen] = useState(false);

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
            <h1 className="text-xl font-bold text-gray-900">Payment Methods</h1>
          </div>
        </div>
      </div>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {/* Current Package Status */}
          <Card className="border-red-200 bg-red-50">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-red-800">
                <Calendar className="h-5 w-5" />
                <span>Current Package</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">8</div>
                  <p className="text-sm text-red-700">Sessions Remaining</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">45</div>
                  <p className="text-sm text-red-700">Days Until Expiry</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">$60</div>
                  <p className="text-sm text-red-700">Per Session Value</p>
                </div>
              </div>
              <div className="mt-6 pt-4 border-t border-red-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-red-800">Auto-renewal</p>
                    <p className="text-sm text-red-700">
                      Automatically purchase new sessions when package expires
                    </p>
                  </div>
                  <Switch
                    checked={autopayEnabled}
                    onCheckedChange={setAutopayEnabled}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payment Methods */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center space-x-2">
                    <CreditCard className="h-5 w-5 text-red-600" />
                    <span>Saved Payment Methods</span>
                  </CardTitle>
                  <CardDescription>
                    Manage your payment methods for session purchases
                  </CardDescription>
                </div>
                <Dialog open={isAddCardOpen} onOpenChange={setIsAddCardOpen}>
                  <DialogTrigger asChild>
                    <Button className="bg-red-600 hover:bg-red-700">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Card
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add New Payment Method</DialogTitle>
                      <DialogDescription>
                        Add a new credit or debit card to your account
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="card-number">Card Number</Label>
                        <Input
                          id="card-number"
                          placeholder="1234 5678 9012 3456"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="expiry">Expiry Date</Label>
                          <Input id="expiry" placeholder="MM/YY" />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="cvc">CVC</Label>
                          <Input id="cvc" placeholder="123" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="name">Cardholder Name</Label>
                        <Input id="name" placeholder="John Doe" />
                      </div>
                      <Button className="w-full bg-red-600 hover:bg-red-700">
                        Add Payment Method
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockPaymentMethods.map((method) => (
                  <div
                    key={method.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="bg-gray-100 p-3 rounded-lg">
                        <CreditCard className="h-6 w-6 text-gray-600" />
                      </div>
                      <div>
                        <p className="font-medium">
                          {method.type.charAt(0).toUpperCase() +
                            method.type.slice(1)}{" "}
                          •••• {method.last4}
                        </p>
                        <p className="text-sm text-gray-500">
                          Expires {method.expiryMonth}/{method.expiryYear}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      {method.isDefault && (
                        <Badge
                          variant="default"
                          className="bg-green-100 text-green-800"
                        >
                          Default
                        </Badge>
                      )}
                      <Button variant="outline" size="sm">
                        <Settings className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Stripe Integration Placeholder */}
              <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center space-x-2 mb-2">
                  <Shield className="h-5 w-5 text-blue-600" />
                  <span className="font-medium text-blue-800">
                    Secure Payments by Stripe
                  </span>
                </div>
                <p className="text-sm text-blue-700">
                  Your payment information is encrypted and securely processed
                  by Stripe. We never store your full card details.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Purchase History */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <DollarSign className="h-5 w-5 text-red-600" />
                <span>Purchase History</span>
              </CardTitle>
              <CardDescription>
                Your recent session package purchases
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockPurchaseHistory.map((purchase) => (
                  <div
                    key={purchase.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div>
                      <p className="font-medium">{purchase.description}</p>
                      <p className="text-sm text-gray-500">{purchase.date}</p>
                      <p className="text-sm text-gray-500">
                        Paid with {purchase.method}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-lg">${purchase.amount}</p>
                      <Badge
                        variant="default"
                        className="bg-green-100 text-green-800"
                      >
                        {purchase.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-6 pt-4 border-t">
                <Button variant="outline" className="w-full">
                  View All Transactions
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button className="bg-red-600 hover:bg-red-700 h-12">
                  <CreditCard className="h-5 w-5 mr-2" />
                  Buy More Sessions
                </Button>
                <Button variant="outline" className="h-12">
                  <Calendar className="h-5 w-5 mr-2" />
                  View Pricing Plans
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
