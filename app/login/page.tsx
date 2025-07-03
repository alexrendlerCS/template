"use client";

import type React from "react";
import Image from "next/image";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dumbbell, Mail, Lock, User, CheckCircle } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { createClient } from "@/lib/supabaseClient";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Footer } from "@/components/ui/footer";

interface FormData {
  email: string;
  password: string;
  confirmPassword: string;
  full_name: string;
}

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isLogin, setIsLogin] = useState(true);
  const [userType, setUserType] = useState<"trainer" | "client">("client");
  const [formData, setFormData] = useState<FormData>({
    email: "",
    password: "",
    confirmPassword: "",
    full_name: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{
    type: "success" | "error" | null;
    message: string;
  }>({ type: null, message: "" });
  const [loginData, setLoginData] = useState({ email: "", password: "" });
  const supabase = createClient();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Clear error message when user starts typing
    if (statusMessage.type === "error") {
      setStatusMessage({ type: null, message: "" });
    }
  };

  const validateSignupForm = () => {
    if (formData.password !== formData.confirmPassword) {
      setStatusMessage({
        type: "error",
        message: "Passwords do not match",
      });
      return false;
    }
    if (formData.password.length < 6) {
      setStatusMessage({
        type: "error",
        message: "Password must be at least 6 characters long",
      });
      return false;
    }
    return true;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setStatusMessage({ type: null, message: "" });

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: loginData.email,
        password: loginData.password,
      });

      if (error) throw error;

      // Get user's role from the database
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("role")
        .eq("email", loginData.email)
        .single();

      if (userError) {
        throw new Error("Failed to fetch user role");
      }

      // Redirect based on role
      const redirectTo =
        userData?.role === "trainer"
          ? "/trainer/dashboard"
          : "/client/dashboard";
      router.push(redirectTo);
    } catch (error) {
      console.error("Error logging in:", error);
      setStatusMessage({
        type: "error",
        message: error instanceof Error ? error.message : "Failed to log in",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate form before submission
    if (!validateSignupForm()) {
      return;
    }

    setIsLoading(true);
    setStatusMessage({ type: null, message: "" });

    try {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          full_name: formData.full_name,
          role: userType,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create account");
      }

      // Clear form
      setFormData({
        email: "",
        password: "",
        confirmPassword: "",
        full_name: "",
      });

      // Switch to login tab
      setIsLogin(true);

      // Show success message
      setStatusMessage({
        type: "success",
        message: `Please sign in as ${userType === "trainer" ? "Trainer" : "Client"} to continue.`,
      });

      // Pre-fill the login email
      setLoginData((prev) => ({
        ...prev,
        email: formData.email,
      }));
    } catch (error: any) {
      let friendlyMessage = error.message;

      if (error.message.includes("User already registered")) {
        friendlyMessage =
          "An account with this email already exists. Please log in or use a different email.";
      } else if (
        error.message.includes("Password should be at least 6 characters")
      ) {
        friendlyMessage = "Password must be at least 6 characters long.";
      } else if (error.message.includes("Invalid email")) {
        friendlyMessage = "Please enter a valid email address.";
      }

      setStatusMessage({
        type: "error",
        message: friendlyMessage,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-white flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-xl border-0">
        <CardHeader className="text-center space-y-4">
          <div className="flex flex-col items-center">
            <Image
              src="/logo.jpg"
              alt="FitCoach Pro Logo"
              width={180}
              height={180}
              className="rounded-full shadow-lg mb-4"
              priority
            />
            <h1 className="text-3xl font-bold text-gray-900">
              Fitness Training
            </h1>
            <CardDescription className="text-gray-600 text-lg">
              Professional fitness coaching platform
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs
            value={isLogin ? "login" : "signup"}
            onValueChange={(value) => {
              setIsLogin(value === "login");
              // Clear messages when switching tabs
              setStatusMessage({ type: null, message: "" });
            }}
          >
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>

            <div className="mb-6">
              <Label className="text-sm font-medium text-gray-700 mb-3 block">
                I am a:
              </Label>
              <div className="flex space-x-2">
                <Button
                  type="button"
                  variant={userType === "client" ? "default" : "outline"}
                  className={`flex-1 ${
                    userType === "client"
                      ? "bg-red-600 hover:bg-red-700"
                      : "border-gray-300"
                  }`}
                  onClick={() => setUserType("client")}
                >
                  <User className="h-4 w-4 mr-2" />
                  Client
                </Button>
                <Button
                  type="button"
                  variant={userType === "trainer" ? "default" : "outline"}
                  className={`flex-1 ${
                    userType === "trainer"
                      ? "bg-red-600 hover:bg-red-700"
                      : "border-gray-300"
                  }`}
                  onClick={() => setUserType("trainer")}
                >
                  <Dumbbell className="h-4 w-4 mr-2" />
                  Trainer
                </Button>
              </div>
            </div>

            <TabsContent value="login">
              <form onSubmit={handleLogin} className="space-y-4">
                {statusMessage.type === "error" && (
                  <Alert variant="destructive">
                    <AlertDescription>{statusMessage.message}</AlertDescription>
                  </Alert>
                )}
                {statusMessage.type === "success" && (
                  <Alert>
                    <CheckCircle className="h-4 w-4" />
                    <AlertDescription>{statusMessage.message}</AlertDescription>
                  </Alert>
                )}
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="Enter your email"
                      className="pl-10"
                      required
                      value={loginData.email}
                      onChange={(e) =>
                        setLoginData((prev) => ({
                          ...prev,
                          email: e.target.value,
                        }))
                      }
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="password"
                      name="password"
                      type="password"
                      placeholder="Enter your password"
                      className="pl-10"
                      required
                      value={loginData.password}
                      onChange={(e) =>
                        setLoginData((prev) => ({
                          ...prev,
                          password: e.target.value,
                        }))
                      }
                    />
                  </div>
                </div>
                <Button
                  type="submit"
                  className="w-full bg-red-600 hover:bg-red-700"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Signing in...
                    </>
                  ) : (
                    `Sign In as ${
                      userType === "trainer" ? "Trainer" : "Client"
                    }`
                  )}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup">
              <Card>
                <CardHeader>
                  <CardTitle>Create Account</CardTitle>
                  <CardDescription>Sign up for a new account</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSignup}>
                    <div className="grid w-full items-center gap-4">
                      {statusMessage.type === "error" && (
                        <Alert variant="destructive">
                          <AlertDescription>
                            {statusMessage.message}
                          </AlertDescription>
                        </Alert>
                      )}
                      <div className="flex flex-col space-y-1.5">
                        <Label htmlFor="full_name">Full Name</Label>
                        <Input
                          id="full_name"
                          name="full_name"
                          value={formData.full_name}
                          onChange={handleInputChange}
                          placeholder="Enter your full name"
                          required
                        />
                      </div>
                      <div className="flex flex-col space-y-1.5">
                        <Label htmlFor="email">Email</Label>
                        <Input
                          id="email"
                          name="email"
                          type="email"
                          value={formData.email}
                          onChange={handleInputChange}
                          placeholder="Enter your email"
                          required
                        />
                      </div>
                      <div className="flex flex-col space-y-1.5">
                        <Label htmlFor="password">Password</Label>
                        <Input
                          id="password"
                          name="password"
                          type="password"
                          value={formData.password}
                          onChange={handleInputChange}
                          placeholder="Create a password"
                          required
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          Password must be at least 6 characters long.
                        </p>
                      </div>
                      <div className="flex flex-col space-y-1.5">
                        <Label htmlFor="confirmPassword">
                          Confirm Password
                        </Label>
                        <Input
                          id="confirmPassword"
                          name="confirmPassword"
                          type="password"
                          value={formData.confirmPassword}
                          onChange={handleInputChange}
                          placeholder="Confirm your password"
                          required
                        />
                      </div>
                      <Button
                        type="submit"
                        className="w-full bg-red-600 hover:bg-red-700"
                        disabled={isLoading}
                      >
                        {isLoading ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Creating Account...
                          </>
                        ) : (
                          "Create Account"
                        )}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Forgot your password?{" "}
              <Link
                href="#"
                className="text-red-600 hover:text-red-700 font-medium"
              >
                Reset it here
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Status Dialog */}
      <Dialog
        open={statusMessage.type !== null}
        onOpenChange={() => setStatusMessage({ type: null, message: "" })}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {statusMessage.type === "success" && isLogin
                ? "Welcome Back!"
                : statusMessage.type === "success"
                  ? "Account Created!"
                  : "Error"}
            </DialogTitle>
            <DialogDescription>{statusMessage.message}</DialogDescription>
          </DialogHeader>
          {statusMessage.type === "error" && (
            <Button
              onClick={() => setStatusMessage({ type: null, message: "" })}
              className="mt-4"
            >
              Dismiss
            </Button>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
