"use client";

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
  Users,
  Calendar,
  DollarSign,
  Settings,
  BarChart3,
  MessageSquare,
  LogOut,
  Clock,
  Camera,
  Eye,
  EyeOff,
  Gift,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import Image from "next/image";
import { createClient } from "@/lib/supabaseClient";
import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/use-toast";

// Interface for user data
interface UserData {
  full_name: string;
  avatar_url: string | null;
  email: string;
}

// Interface for feedback dialog props
interface FeedbackDialogProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description: string;
  variant: "success" | "error";
}

// Feedback dialog component
const FeedbackDialog: React.FC<FeedbackDialogProps> = ({
  isOpen,
  onClose,
  title,
  description,
  variant,
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle
            className={
              variant === "success" ? "text-green-600" : "text-red-600"
            }
          >
            {title}
          </DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <div className="flex justify-end">
          <Button onClick={onClose} variant="outline">
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

const menuItems = [
  {
    title: "Dashboard",
    url: "/trainer/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Clients",
    url: "/trainer/clients",
    icon: Users,
  },
  {
    title: "Schedule",
    url: "/trainer/schedule",
    icon: Calendar,
  },
  {
    title: "Availability",
    url: "/trainer/availability",
    icon: Clock,
  },
  {
    title: "Payments",
    url: "/trainer/payments",
    icon: DollarSign,
  },
  {
    title: "Analytics",
    url: "/trainer/analytics",
    icon: BarChart3,
  },
  {
    title: "Messages",
    url: "/trainer/messages",
    icon: MessageSquare,
    badge: "(Coming Soon)",
  },
];

export function TrainerSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  // State for account settings modal
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [userData, setUserData] = useState<UserData>({
    full_name: "",
    avatar_url: null,
    email: "",
  });
  const [newName, setNewName] = useState("");
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  // Password change state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });
  const [passwordErrors, setPasswordErrors] = useState({
    current: "",
    new: "",
    confirm: "",
  });

  // Feedback dialog state
  const [feedbackDialog, setFeedbackDialog] = useState({
    isOpen: false,
    title: "",
    description: "",
    variant: "success" as "success" | "error",
  });

  // Fetch user data on component mount
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();
        if (userError || !user) {
          console.error("Failed to get user:", userError);
          return;
        }

        const { data: userData, error: dbError } = await supabase
          .from("users")
          .select("full_name, avatar_url, email")
          .eq("id", user.id)
          .single();

        if (dbError) {
          console.error("Failed to fetch user data:", dbError);
          return;
        }

        // Get the avatar URL using getPublicUrl
        let avatarUrl = userData.avatar_url;
        if (avatarUrl) {
          const { data: publicUrl } = supabase.storage
            .from("avatars")
            .getPublicUrl(avatarUrl);
          avatarUrl = publicUrl.publicUrl;
        }

        setUserData({
          ...userData,
          avatar_url: avatarUrl,
        });
        setNewName(userData.full_name || "");
      } catch (error) {
        console.error("Error fetching user data:", error);
      }
    };

    fetchUserData();
  }, [supabase]);

  // Handle image change
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

  // Validate form
  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!newName.trim()) {
      newErrors.name = "Name is required";
    }

    if (newName.trim().length < 2) {
      newErrors.name = "Name must be at least 2 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle profile update
  const handleUpdateProfile = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();
      if (userError || !user) throw userError;

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
        const filePath = `${user.id}/${fileName}`;

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
          .eq("id", user.id);

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
          console.error("Error updating auth metadata:", metadataError);
        }
      }

      // Show success feedback
      setFeedbackDialog({
        isOpen: true,
        title: "Profile Updated",
        description: selectedImage
          ? "Your profile and picture have been updated successfully."
          : "Your profile has been updated successfully.",
        variant: "success",
      });

      // Close modal after a delay
      setTimeout(() => {
        setIsSettingsOpen(false);
        resetForm();
      }, 2000);
    } catch (error) {
      console.error("Error updating profile:", error);
      setFeedbackDialog({
        isOpen: true,
        title: "Update Failed",
        description: "Failed to update your profile. Please try again.",
        variant: "error",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle password change
  const handlePasswordChange = async () => {
    // Reset password errors
    setPasswordErrors({ current: "", new: "", confirm: "" });

    // Validate passwords
    if (!currentPassword) {
      setPasswordErrors((prev) => ({
        ...prev,
        current: "Current password is required",
      }));
      return;
    }

    if (!newPassword) {
      setPasswordErrors((prev) => ({
        ...prev,
        new: "New password is required",
      }));
      return;
    }

    if (newPassword.length < 6) {
      setPasswordErrors((prev) => ({
        ...prev,
        new: "Password must be at least 6 characters",
      }));
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordErrors((prev) => ({
        ...prev,
        confirm: "Passwords do not match",
      }));
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;

      // Clear password fields
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");

      // Show success feedback
      setFeedbackDialog({
        isOpen: true,
        title: "Password Updated",
        description: "Your password has been updated successfully.",
        variant: "success",
      });
    } catch (error) {
      console.error("Error updating password:", error);
      setPasswordErrors((prev) => ({
        ...prev,
        current: "Invalid current password",
      }));
    } finally {
      setIsLoading(false);
    }
  };

  // Reset form
  const resetForm = () => {
    setNewName(userData.full_name || "");
    setSelectedImage(null);
    setPreviewUrl(null);
    setErrors({});
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setPasswordErrors({ current: "", new: "", confirm: "" });
  };

  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      // Force a hard refresh to clear all client state
      window.location.href = "/login";
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  // Generate initials from name
  const initials = userData.full_name
    ? userData.full_name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "TR";

  return (
    <>
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
                Trainer Portal
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
                          <span className="ml-2 text-xs text-gray-500">
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
                    isActive={pathname === "/trainer/referral"}
                  >
                    <Link href="/trainer/referral">
                      <Gift className="h-4 w-4" />
                      <span>Referral Program</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={pathname === "/trainer/settings"}
                >
                  <Link href="/trainer/settings">
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
              <SidebarMenuButton
                onClick={() => setIsSettingsOpen(true)}
                className="w-full"
              >
            <div className="flex items-center space-x-3 px-2 py-2">
              <Avatar className="h-8 w-8">
                    <AvatarImage
                      src={
                        previewUrl ||
                        userData.avatar_url ||
                        "/placeholder-user.jpg"
                      }
                      alt={userData.full_name}
                    />
                <AvatarFallback className="bg-red-600 text-white text-sm">
                      {initials}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-sidebar-foreground truncate">
                      {userData.full_name || "Trainer"}
                </p>
                <p className="text-xs text-sidebar-foreground/70 truncate">
                      {userData.email || "trainer@example.com"}
                </p>
              </div>
            </div>
              </SidebarMenuButton>
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

      {/* Account Settings Modal */}
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

                <Button
                  onClick={handlePasswordChange}
                  disabled={isLoading}
                  className="w-full"
                >
                  {isLoading ? "Updating..." : "Update Password"}
                </Button>
              </div>

              <div className="flex space-x-3 pt-4">
                <Button
                  onClick={handleUpdateProfile}
                  disabled={isLoading}
                  className="flex-1"
                >
                  {isLoading ? "Saving..." : "Save Changes"}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setIsSettingsOpen(false)}
                  disabled={isLoading}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Feedback Dialog */}
      <FeedbackDialog
        isOpen={feedbackDialog.isOpen}
        onClose={() =>
          setFeedbackDialog((prev) => ({ ...prev, isOpen: false }))
        }
        title={feedbackDialog.title}
        description={feedbackDialog.description}
        variant={feedbackDialog.variant}
      />
    </>
  );
}
