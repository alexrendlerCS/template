"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  LayoutDashboard,
  Calendar,
  DollarSign,
  MessageSquare,
  LogOut,
  CalendarPlus,
  Camera,
  Loader2,
  Home,
  X,
  Eye,
  EyeOff,
  CreditCard,
  Menu,
  Settings,
  Gift,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import Image from "next/image";
import { createClient } from "@/lib/supabaseClient";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Toaster } from "@/components/ui/toaster";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const menuItems = [
  {
    title: "Dashboard",
    url: "/client/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Calendar",
    url: "/client/calendar",
    icon: Calendar,
  },
  {
    title: "Book Session",
    url: "/client/booking",
    icon: CalendarPlus,
  },
  {
    title: "Packages",
    url: "/client/packages",
    icon: DollarSign,
  },
  {
    title: "Messages",
    url: "/client/messages",
    icon: MessageSquare,
    badge: "(Coming Soon)",
  },
];

interface UserData {
  full_name: string;
  avatar_url: string | null;
  email: string;
}

interface FeedbackDialogProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description: string;
  variant: "success" | "error";
}

const FeedbackDialog: React.FC<FeedbackDialogProps> = ({
  isOpen,
  onClose,
  title,
  description,
  variant,
}) => {
  console.log("Rendering FeedbackDialog:", {
    isOpen,
    title,
    description,
    variant,
  });

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50"
      onClick={onClose}
    >
      <div
        className={`
          relative bg-white p-6 rounded-lg shadow-lg max-w-sm w-full mx-4 animate-in fade-in-0 zoom-in-95
          ${variant === "success" ? "border-green-500" : "border-red-500"} border-2
        `}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          className="absolute right-4 top-4 opacity-70 hover:opacity-100"
          onClick={onClose}
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </button>
        <h2
          className={`text-lg font-semibold mb-2 pr-6 ${
            variant === "success" ? "text-green-600" : "text-red-600"
          }`}
        >
          {title}
        </h2>
        <p className="text-gray-600">{description}</p>
      </div>
    </div>
  );
};

export function ClientSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const { toast } = useToast();
  const [userData, setUserData] = useState<UserData>({
    full_name: "Client",
    avatar_url: null,
    email: "",
  });
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [newName, setNewName] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [errors, setErrors] = useState({
    name: "",
    password: "",
    image: "",
  });
  const [alert, setAlert] = useState<{
    show: boolean;
    message: string;
  }>({
    show: false,
    message: "",
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });
  const [passwordErrors, setPasswordErrors] = useState<{
    current: string;
    new: string;
    confirm: string;
  }>({
    current: "",
    new: "",
    confirm: "",
  });

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (!session?.user) return;

        const { data, error } = await supabase
          .from("users")
          .select("full_name, avatar_url, email")
          .eq("id", session.user.id)
          .single();

        if (error) {
          console.error("Error fetching user data:", error);
          return;
        }

        if (data) {
          // Get the avatar URL using getPublicUrl
          let avatarUrl = data.avatar_url;
          console.log("Original avatar_url from database:", avatarUrl);

          if (avatarUrl) {
            const { data: publicUrl } = supabase.storage
              .from("avatars")
              .getPublicUrl(avatarUrl);
            avatarUrl = publicUrl.publicUrl;
            console.log("Constructed public URL:", avatarUrl);
          }

          setUserData({
            full_name: data.full_name || "Client",
            avatar_url: avatarUrl,
            email: data.email || "",
          });
          setNewName(data.full_name || "");
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      }
    };

    fetchUserData();
  }, []);

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset previous error
    setErrors((prev) => ({ ...prev, image: "" }));

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      setErrors((prev) => ({ ...prev, image: "Image must be less than 5MB" }));
      return;
    }

    // Validate file type
    const validTypes = ["image/jpeg", "image/png", "image/gif"];
    if (!validTypes.includes(file.type)) {
      setErrors((prev) => ({
        ...prev,
        image: "Please upload a valid image file (JPG, PNG, or GIF)",
      }));
      return;
    }

    // Create preview
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    setSelectedImage(file);
  };

  const validateForm = () => {
    const errors = {
      current: "",
      new: "",
      confirm: "",
    };
    let isValid = true;

    if (newPassword || confirmPassword || currentPassword) {
      if (!currentPassword) {
        errors.current = "Current password is required";
        isValid = false;
      }
      if (!newPassword) {
        errors.new = "New password is required";
        isValid = false;
      }
      if (!confirmPassword) {
        errors.confirm = "Please confirm your new password";
        isValid = false;
      }
      if (newPassword && confirmPassword && newPassword !== confirmPassword) {
        errors.confirm = "Passwords do not match";
        isValid = false;
      }
      if (newPassword && newPassword.length < 6) {
        errors.new = "Password must be at least 6 characters";
        isValid = false;
      }
    }

    setPasswordErrors(errors);
    return isValid;
  };

  const showSuccess = useCallback((message: string) => {
    console.log("Showing success:", message);
    setAlert({
      show: true,
      message,
    });

    setTimeout(() => {
      setAlert((prev) => ({ ...prev, show: false }));
    }, 3000);
  }, []);

  const handleUpdateProfile = async () => {
    try {
      // Only validate if there are actual changes
      if (
        !selectedImage &&
        newName.trim() === userData.full_name.trim() &&
        !newPassword &&
        !confirmPassword
      ) {
        console.log("No changes detected");
        setPasswordErrors((prev) => ({
          ...prev,
          new: "Make some changes first",
        }));
        return;
      }

      if (!validateForm()) {
        return;
      }

      setIsUpdating(true);

      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.user) {
        setPasswordErrors((prev) => ({
          ...prev,
          new: "No authenticated user found",
        }));
        return;
      }

      // Get the current relative path from the full URL if it exists
      let currentAvatarPath = userData.avatar_url;
      if (currentAvatarPath?.includes("/avatars/")) {
        currentAvatarPath = currentAvatarPath.split("/avatars/")[1];
      }

      let newAvatarPath = currentAvatarPath;
      let displayAvatarUrl = userData.avatar_url;

      // Update avatar if a new image is selected
      if (selectedImage) {
        // Generate a unique filename using timestamp and random string
        const fileExt = selectedImage.name.split(".").pop()?.toLowerCase();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
        const filePath = `${session.user.id}/${fileName}`;

        // Upload the new image
        const { error: uploadError } = await supabase.storage
          .from("avatars")
          .upload(filePath, selectedImage);

        if (uploadError) {
          setErrors((prev) => ({
            ...prev,
            image: "Failed to upload image. Please try again.",
          }));
          return;
        }

        // Store just the relative path
        newAvatarPath = filePath;
        // Get the public URL for display
        const { data: publicUrl } = supabase.storage
          .from("avatars")
          .getPublicUrl(filePath);
        displayAvatarUrl = publicUrl.publicUrl;

        // Delete the old avatar if it exists
        if (currentAvatarPath) {
          try {
            await supabase.storage.from("avatars").remove([currentAvatarPath]);
          } catch (error) {
            console.error("Error deleting old avatar:", error);
          }
        }

        showSuccess("Profile picture updated successfully");
      }

      // Update profile if name or avatar has changed
      if (
        newName.trim() !== userData.full_name.trim() ||
        newAvatarPath !== currentAvatarPath
      ) {
        const updates = {
          full_name: newName.trim(),
          avatar_url: newAvatarPath,
        };

        const { error: updateError } = await supabase
          .from("users")
          .update(updates)
          .eq("id", session.user.id);

        if (updateError) {
          setErrors((prev) => ({
            ...prev,
            name: `Failed to update profile: ${updateError.message}`,
          }));
          return;
        }

        // Update local state with the full URL for display
        setUserData((prev) => ({
          ...prev,
          full_name: newName.trim(),
          avatar_url: displayAvatarUrl,
        }));

        // Also update the user metadata in auth
        const { error: metadataError } = await supabase.auth.updateUser({
          data: {
            full_name: newName.trim(),
            avatar_url: newAvatarPath,
          },
        });

        if (metadataError) {
          console.warn(
            "Profile updated but there was an issue updating auth metadata"
          );
        } else if (newName.trim() !== userData.full_name.trim()) {
          showSuccess("Name updated successfully");
        }
      }

      // Password update logic
      if (newPassword && confirmPassword && currentPassword) {
        console.log("Starting password update process");

        // First verify current password
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: userData.email,
          password: currentPassword,
        });

        if (signInError) {
          console.log("Password verification failed:", signInError);
          setPasswordErrors((prev) => ({
            ...prev,
            current: "Current password is incorrect",
          }));
          setIsUpdating(false);
          return;
        }

        // Then update to new password
        const { error: passwordError } = await supabase.auth.updateUser({
          password: newPassword,
        });

        if (passwordError) {
          console.log("Password update failed:", passwordError);
          let errorMessage =
            "Cannot use your current password as the new password. Please choose a different password.";
          if (passwordError.message.includes("auth_weak_password")) {
            errorMessage =
              "Password is too weak. Please use a stronger password.";
          }

          setPasswordErrors((prev) => ({
            ...prev,
            new: errorMessage,
          }));
          setIsUpdating(false);
          return;
        }

        console.log("Password updated successfully");
        showSuccess("Password updated successfully");

        // Clear password fields and errors
        setNewPassword("");
        setConfirmPassword("");
        setCurrentPassword("");
        setPasswordErrors({
          current: "",
          new: "",
          confirm: "",
        });

        // Close dialog after success message
        setTimeout(() => {
          setIsSettingsOpen(false);
          resetForm();
        }, 3000);
      }

      // Only close the dialog if we're not updating the password
      // (password updates handle their own dialog closing)
      if (!newPassword && !confirmPassword && !currentPassword) {
        setIsSettingsOpen(false);
        resetForm();
      }

      setIsUpdating(false);
    } catch (error) {
      console.error("Error in handleUpdateProfile:", error);
      setPasswordErrors((prev) => ({
        ...prev,
        new: "An unexpected error occurred. Please try again.",
      }));
      setIsUpdating(false);
    }
  };

  const resetForm = () => {
    setNewPassword("");
    setConfirmPassword("");
    setCurrentPassword("");
    setSelectedImage(null);
    setPreviewUrl(null);
    setErrors({
      name: "",
      password: "",
      image: "",
    });
  };

  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        toast({
          title: "Error",
          description: "Failed to sign out. Please try again.",
          variant: "destructive",
        });
        return;
      }
      router.push("/login");
    } catch (error) {
      console.error("Error signing out:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred while signing out.",
        variant: "destructive",
      });
    }
  };

  // Get initials from full name
  const initials = userData.full_name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase();

  return (
    <>
      <Toaster />
      {alert.show && (
        <div
          className="fixed inset-0 flex items-center justify-center z-[100]"
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
            setAlert((prev) => ({ ...prev, show: false }));
          }}
        >
          <div className="absolute inset-0 bg-black/50" />
          <div
            className={`
              relative p-4 rounded-lg shadow-lg max-w-sm w-full mx-4
              bg-green-100 border-green-500
              border-2 animate-in zoom-in-95 duration-300
              cursor-pointer hover:opacity-90 transition-opacity
            `}
          >
            <p className="text-green-700 font-medium text-center">
              {alert.message}
            </p>
          </div>
        </div>
      )}

      <Dialog
        open={isSettingsOpen}
        onOpenChange={(open) => {
          setIsSettingsOpen(open);
          if (!open) resetForm();
        }}
      >
        <DialogContent className="sm:max-w-[425px] p-0 overflow-hidden">
          <div className="relative h-24 bg-gradient-to-r from-red-600 to-red-700">
            <DialogHeader className="p-6">
              <DialogTitle className="text-2xl font-bold text-white">
                Account Settings
              </DialogTitle>
              <DialogDescription className="text-red-100">
                Update your profile information and account settings
              </DialogDescription>
            </DialogHeader>
          </div>

          <div className="relative px-6 pb-6">
            <div className="flex flex-col items-center mt-8">
              <Avatar className="h-24 w-24 border-4 border-white shadow-lg">
                <AvatarImage
                  src={
                    previewUrl || userData.avatar_url || "/placeholder-user.jpg"
                  }
                  alt={userData.full_name}
                  onError={(e) => {
                    console.error("Avatar image failed to load:", e);
                    e.currentTarget.style.display = "none";
                  }}
                />
                <AvatarFallback className="bg-red-600 text-white text-xl">
                  {initials}
                </AvatarFallback>
              </Avatar>

              <div className="mt-4 flex flex-col items-center gap-2">
                <Label
                  htmlFor="picture"
                  className="cursor-pointer inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring bg-red-600 text-white shadow hover:bg-red-700 h-9 px-4 py-2"
                >
                  <Camera className="h-4 w-4 mr-2" />
                  Change Picture
                </Label>
                <Input
                  id="picture"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageChange}
                />
                {errors.image && (
                  <p className="text-sm text-red-500">{errors.image}</p>
                )}
              </div>
            </div>

            <div className="space-y-6 mt-8">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Enter your name"
                />
                {errors.name && (
                  <p className="text-sm text-red-500">{errors.name}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  value={userData.email}
                  disabled
                  className="bg-gray-50"
                />
                <p className="text-xs text-gray-500">Email cannot be changed</p>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-medium">Change Password</h3>

                {/* Current Password */}
                <div className="space-y-2">
                  <div className="relative">
                    <Input
                      type={showPasswords.current ? "text" : "password"}
                      placeholder="Current Password"
                      value={currentPassword}
                      onChange={(e) => {
                        setCurrentPassword(e.target.value);
                        if (passwordErrors.current) {
                          setPasswordErrors((prev) => ({
                            ...prev,
                            current: "",
                          }));
                        }
                      }}
                      className={`pr-10 ${passwordErrors.current ? "border-red-500" : ""}`}
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setShowPasswords((prev) => ({
                          ...prev,
                          current: !prev.current,
                        }))
                      }
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    >
                      {showPasswords.current ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                      <span className="sr-only">
                        {showPasswords.current
                          ? "Hide password"
                          : "Show password"}
                      </span>
                    </button>
                  </div>
                  {passwordErrors.current && (
                    <p className="text-sm text-red-500">
                      {passwordErrors.current}
                    </p>
                  )}
                </div>

                {/* New Password */}
                <div className="space-y-2">
                  <div className="relative">
                    <Input
                      type={showPasswords.new ? "text" : "password"}
                      placeholder="New Password"
                      value={newPassword}
                      onChange={(e) => {
                        setNewPassword(e.target.value);
                        if (passwordErrors.new) {
                          setPasswordErrors((prev) => ({ ...prev, new: "" }));
                        }
                      }}
                      className={`pr-10 ${passwordErrors.new ? "border-red-500" : ""}`}
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setShowPasswords((prev) => ({
                          ...prev,
                          new: !prev.new,
                        }))
                      }
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    >
                      {showPasswords.new ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                      <span className="sr-only">
                        {showPasswords.new ? "Hide password" : "Show password"}
                      </span>
                    </button>
                  </div>
                  {passwordErrors.new && (
                    <p className="text-sm text-red-500">{passwordErrors.new}</p>
                  )}
                </div>

                {/* Confirm Password */}
                <div className="space-y-2">
                  <div className="relative">
                    <Input
                      type={showPasswords.confirm ? "text" : "password"}
                      placeholder="Confirm New Password"
                      value={confirmPassword}
                      onChange={(e) => {
                        setConfirmPassword(e.target.value);
                        if (passwordErrors.confirm) {
                          setPasswordErrors((prev) => ({
                            ...prev,
                            confirm: "",
                          }));
                        }
                      }}
                      className={`pr-10 ${passwordErrors.confirm ? "border-red-500" : ""}`}
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setShowPasswords((prev) => ({
                          ...prev,
                          confirm: !prev.confirm,
                        }))
                      }
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    >
                      {showPasswords.confirm ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                      <span className="sr-only">
                        {showPasswords.confirm
                          ? "Hide password"
                          : "Show password"}
                      </span>
                    </button>
                  </div>
                  {passwordErrors.confirm && (
                    <p className="text-sm text-red-500">
                      {passwordErrors.confirm}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="px-6 py-4 bg-gray-50">
            <Button
              variant="outline"
              onClick={() => {
                setIsSettingsOpen(false);
                resetForm();
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpdateProfile}
              disabled={
                isUpdating ||
                (!selectedImage &&
                  !newPassword &&
                  !confirmPassword &&
                  newName.trim() === userData.full_name.trim())
              }
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {isUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Sidebar>
        <SidebarHeader className="border-b border-sidebar-border">
          <div className="flex items-center space-x-3 px-2 py-2">
            <Image
              src="/logo.jpg"
              alt="Fitness Trainer Logo"
              width={36}
              height={36}
              className="rounded-full shadow"
              priority
            />
            <div>
              <h2 className="font-bold text-sidebar-foreground">
                Fitness Trainer
              </h2>
              <p className="text-xs text-sidebar-foreground/70">
                Client Portal
              </p>
            </div>
          </div>
        </SidebarHeader>

        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Navigation</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {menuItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={pathname === item.url}
                      className="w-full"
                    >
                      <Link href={item.url}>
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                        {item.badge && (
                          <span className="ml-2 text-xs text-muted-foreground">
                            {item.badge}
                          </span>
                        )}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          <SidebarGroup>
            <SidebarGroupLabel>General</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === "/client/referral"}
                  >
                    <Link href="/client/referral">
                      <Gift className="h-4 w-4" />
                      <span>Referral Program</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === "/client/settings"}
                  >
                    <Link href="/client/settings">
                      <Settings className="h-4 w-4" />
                      <span>Settings</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>

        <SidebarFooter>
          <SidebarMenu>
            <SidebarMenuItem>
              <div
                className="flex items-center space-x-3 px-2 py-2 cursor-pointer hover:bg-accent rounded-md transition-colors"
                onClick={() => setIsSettingsOpen(true)}
              >
                <Avatar className="h-8 w-8">
                  <AvatarImage
                    src={userData.avatar_url || "/placeholder-user.jpg"}
                    alt={userData.full_name}
                    onError={(e) => {
                      console.error("Avatar image failed to load:", e);
                      // Force fallback to initials
                      e.currentTarget.style.display = "none";
                    }}
                  />
                  <AvatarFallback className="bg-red-600 text-white text-sm">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-sidebar-foreground truncate">
                    {userData.full_name}
                  </p>
                  <p className="text-xs text-sidebar-foreground/70 truncate">
                    Member
                  </p>
                </div>
              </div>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton onClick={handleSignOut}>
                <LogOut className="h-4 w-4" />
                <span>Sign Out</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>

        <SidebarRail />
      </Sidebar>
    </>
  );
}
