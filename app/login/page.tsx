"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dumbbell, Mail, Lock, User } from "lucide-react"
import Link from "next/link"

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(true)
  const [userType, setUserType] = useState<"trainer" | "client">("client")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Mock login - redirect based on user type
    if (userType === "trainer") {
      window.location.href = "/trainer/dashboard"
    } else {
      window.location.href = "/client/dashboard"
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-white flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-xl border-0">
        <CardHeader className="text-center space-y-4">
          <div className="flex items-center justify-center space-x-2">
            <div className="bg-red-600 p-2 rounded-full">
              <Dumbbell className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">FitCoach Pro</h1>
          </div>
          <CardDescription className="text-gray-600">Professional fitness coaching platform</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={isLogin ? "login" : "signup"} onValueChange={(value) => setIsLogin(value === "login")}>
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>

            <div className="mb-6">
              <Label className="text-sm font-medium text-gray-700 mb-3 block">I am a:</Label>
              <div className="flex space-x-2">
                <Button
                  type="button"
                  variant={userType === "client" ? "default" : "outline"}
                  className={`flex-1 ${userType === "client" ? "bg-red-600 hover:bg-red-700" : "border-gray-300"}`}
                  onClick={() => setUserType("client")}
                >
                  <User className="h-4 w-4 mr-2" />
                  Client
                </Button>
                <Button
                  type="button"
                  variant={userType === "trainer" ? "default" : "outline"}
                  className={`flex-1 ${userType === "trainer" ? "bg-red-600 hover:bg-red-700" : "border-gray-300"}`}
                  onClick={() => setUserType("trainer")}
                >
                  <Dumbbell className="h-4 w-4 mr-2" />
                  Trainer
                </Button>
              </div>
            </div>

            <TabsContent value="login">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input id="email" type="email" placeholder="Enter your email" className="pl-10" required />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input id="password" type="password" placeholder="Enter your password" className="pl-10" required />
                  </div>
                </div>
                <Button type="submit" className="w-full bg-red-600 hover:bg-red-700">
                  Sign In as {userType === "trainer" ? "Trainer" : "Client"}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input id="name" type="text" placeholder="Enter your full name" className="pl-10" required />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input id="signup-email" type="email" placeholder="Enter your email" className="pl-10" required />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="signup-password"
                      type="password"
                      placeholder="Create a password"
                      className="pl-10"
                      required
                    />
                  </div>
                </div>
                <Button type="submit" className="w-full bg-red-600 hover:bg-red-700">
                  Create {userType === "trainer" ? "Trainer" : "Client"} Account
                </Button>
              </form>
            </TabsContent>
          </Tabs>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Forgot your password?{" "}
              <Link href="#" className="text-red-600 hover:text-red-700 font-medium">
                Reset it here
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
