"use client";

import { useEffect, useState } from "react";
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
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import Image from "next/image";
import { createClient } from "@/lib/supabaseClient";

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
    title: "Payment Methods",
    url: "/client/payment-methods",
    icon: DollarSign,
  },
  {
    title: "Messages",
    url: "/client/messages",
    icon: MessageSquare,
  },
];

interface UserData {
  full_name: string;
  avatar_url: string | null;
}

export function ClientSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const [userData, setUserData] = useState<UserData>({
    full_name: "Client",
    avatar_url: null,
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
          .select("full_name, avatar_url")
          .eq("id", session.user.id)
          .single();

        if (error) {
          console.error("Error fetching user data:", error);
          return;
        }

        if (data) {
          setUserData({
            full_name: data.full_name || "Client",
            avatar_url: data.avatar_url,
          });
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      }
    };

    fetchUserData();
  }, []);

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      router.push("/login");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  // Get initials from full name
  const initials = userData.full_name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase();

  return (
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
            <p className="text-xs text-sidebar-foreground/70">Client Portal</p>
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
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <div className="flex items-center space-x-3 px-2 py-2">
              <Avatar className="h-8 w-8">
                <AvatarImage
                  src={userData.avatar_url || "/placeholder-user.jpg"}
                  alt={userData.full_name}
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
  );
}
