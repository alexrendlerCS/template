"use client"

import { useState } from "react"
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { TrainerSidebar } from "@/components/trainer-sidebar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Upload, Palette, CreditCard, Calendar, Bell, Shield, Save } from "lucide-react"

export default function TrainerSettings() {
  const [notifications, setNotifications] = useState({
    email: true,
    sms: false,
    push: true,
  })

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <TrainerSidebar />
        <div className="flex-1">
          <header className="border-b bg-white px-6 py-4">
            <div className="flex items-center space-x-4">
              <SidebarTrigger />
              <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
            </div>
          </header>

          <main className="p-6 max-w-4xl">
            <div className="space-y-8">
              {/* Business Profile */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Upload className="h-5 w-5 text-red-600" />
                    <span>Business Profile</span>
                  </CardTitle>
                  <CardDescription>Customize your business information and branding</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="business-name">Business Name</Label>
                      <Input id="business-name" defaultValue="FitCoach Pro" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="trainer-name">Your Name</Label>
                      <Input id="trainer-name" defaultValue="John Doe" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="bio">Bio</Label>
                    <Textarea
                      id="bio"
                      placeholder="Tell your clients about your experience and specialties..."
                      defaultValue="Certified personal trainer with 8+ years of experience helping clients achieve their fitness goals."
                    />
                  </div>

                  <div className="space-y-4">
                    <Label>Logo Upload</Label>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                      <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600 mb-2">Upload your business logo</p>
                      <Button variant="outline">Choose File</Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Branding & Colors */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Palette className="h-5 w-5 text-red-600" />
                    <span>Branding & Colors</span>
                  </CardTitle>
                  <CardDescription>Customize the appearance of your client portal</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>Primary Color</Label>
                      <div className="flex items-center space-x-2">
                        <div className="w-10 h-10 bg-red-600 rounded border"></div>
                        <Input defaultValue="#DC2626" className="flex-1" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Secondary Color</Label>
                      <div className="flex items-center space-x-2">
                        <div className="w-10 h-10 bg-gray-900 rounded border"></div>
                        <Input defaultValue="#111827" className="flex-1" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Accent Color</Label>
                      <div className="flex items-center space-x-2">
                        <div className="w-10 h-10 bg-white rounded border-2"></div>
                        <Input defaultValue="#FFFFFF" className="flex-1" />
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600 mb-2">Preview:</p>
                    <div className="bg-white p-4 rounded border">
                      <div className="flex items-center space-x-2 mb-3">
                        <div className="bg-red-600 p-1 rounded">
                          <div className="w-4 h-4 bg-white rounded"></div>
                        </div>
                        <span className="font-medium">Your Brand Name</span>
                      </div>
                      <Button size="sm" className="bg-red-600 hover:bg-red-700">
                        Sample Button
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Payment Integration */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <CreditCard className="h-5 w-5 text-red-600" />
                    <span>Payment Integration</span>
                  </CardTitle>
                  <CardDescription>Connect your payment processor to accept payments</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="bg-purple-600 p-2 rounded">
                        <CreditCard className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <p className="font-medium">Stripe</p>
                        <p className="text-sm text-gray-500">Accept credit cards and online payments</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline" className="text-orange-600 border-orange-600">
                        Not Connected
                      </Badge>
                      <Button variant="outline">Connect</Button>
                    </div>
                  </div>

                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h4 className="font-medium text-blue-900 mb-2">Payment Features (Coming Soon)</h4>
                    <ul className="text-sm text-blue-800 space-y-1">
                      <li>• Automated payment links and QR codes</li>
                      <li>• Session package pricing</li>
                      <li>• Recurring payment plans</li>
                      <li>• Payment tracking and reporting</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>

              {/* Calendar Integration */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Calendar className="h-5 w-5 text-red-600" />
                    <span>Calendar Integration</span>
                  </CardTitle>
                  <CardDescription>Sync with your calendar for seamless scheduling</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="bg-blue-600 p-2 rounded">
                        <Calendar className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <p className="font-medium">Google Calendar</p>
                        <p className="text-sm text-gray-500">Sync your availability and bookings</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline" className="text-orange-600 border-orange-600">
                        Not Connected
                      </Badge>
                      <Button variant="outline">Connect</Button>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="auto-block">Auto-block booked sessions</Label>
                        <p className="text-sm text-gray-500">Automatically block time slots when sessions are booked</p>
                      </div>
                      <Switch id="auto-block" />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="buffer-time">Add buffer time</Label>
                        <p className="text-sm text-gray-500">Add 15 minutes before and after each session</p>
                      </div>
                      <Switch id="buffer-time" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Notifications */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Bell className="h-5 w-5 text-red-600" />
                    <span>Notifications</span>
                  </CardTitle>
                  <CardDescription>Manage how you receive notifications</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="email-notifications">Email Notifications</Label>
                        <p className="text-sm text-gray-500">Receive booking confirmations and updates via email</p>
                      </div>
                      <Switch
                        id="email-notifications"
                        checked={notifications.email}
                        onCheckedChange={(checked) => setNotifications((prev) => ({ ...prev, email: checked }))}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="sms-notifications">SMS Notifications</Label>
                        <p className="text-sm text-gray-500">Get text messages for urgent updates</p>
                      </div>
                      <Switch
                        id="sms-notifications"
                        checked={notifications.sms}
                        onCheckedChange={(checked) => setNotifications((prev) => ({ ...prev, sms: checked }))}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="push-notifications">Push Notifications</Label>
                        <p className="text-sm text-gray-500">Browser notifications for real-time updates</p>
                      </div>
                      <Switch
                        id="push-notifications"
                        checked={notifications.push}
                        onCheckedChange={(checked) => setNotifications((prev) => ({ ...prev, push: checked }))}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Security */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Shield className="h-5 w-5 text-red-600" />
                    <span>Security</span>
                  </CardTitle>
                  <CardDescription>Manage your account security settings</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="current-password">Current Password</Label>
                      <Input id="current-password" type="password" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="new-password">New Password</Label>
                      <Input id="new-password" type="password" />
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="two-factor">Two-Factor Authentication</Label>
                      <p className="text-sm text-gray-500">Add an extra layer of security to your account</p>
                    </div>
                    <Button variant="outline">Enable 2FA</Button>
                  </div>
                </CardContent>
              </Card>

              {/* Save Button */}
              <div className="flex justify-end">
                <Button className="bg-red-600 hover:bg-red-700">
                  <Save className="h-4 w-4 mr-2" />
                  Save All Changes
                </Button>
              </div>
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  )
}
