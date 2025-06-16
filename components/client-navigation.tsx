"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Menu, MessageSquare, Calendar, CreditCard, Home, LogOut } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"

export function ClientNavigation() {
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)

  const navigationItems = [
    {
      name: "Dashboard",
      href: "/client/dashboard",
      icon: Home,
    },
    {
      name: "Contact Trainer",
      href: "/client/messages",
      icon: MessageSquare,
    },
    {
      name: "View Full Calendar",
      href: "/client/calendar",
      icon: Calendar,
    },
    {
      name: "Payment Methods",
      href: "/client/payment-methods",
      icon: CreditCard,
    },
  ]

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="h-9 w-9 p-0">
          <Menu className="h-5 w-5" />
          <span className="sr-only">Open navigation menu</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        {navigationItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href

          return (
            <DropdownMenuItem key={item.name} asChild>
              <Link
                href={item.href}
                className={`flex items-center space-x-2 w-full ${isActive ? "bg-red-50 text-red-600" : ""}`}
                onClick={() => setIsOpen(false)}
              >
                <Icon className="h-4 w-4" />
                <span>{item.name}</span>
              </Link>
            </DropdownMenuItem>
          )
        })}
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/login" className="flex items-center space-x-2 w-full text-red-600">
            <LogOut className="h-4 w-4" />
            <span>Sign Out</span>
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
