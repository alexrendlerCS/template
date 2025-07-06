"use client";

import { useState } from "react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MessageSquare, Search, Send, Reply } from "lucide-react";

const mockMessages = [
  {
    id: 1,
    clientName: "Sarah Johnson",
    clientAvatar: "/placeholder.svg?height=40&width=40",
    subject: "Question about tomorrow's session",
    preview: "Hi John, I wanted to ask about the workout plan for tomorrow...",
    date: "2024-01-14",
    time: "2:30 PM",
    unread: true,
    replies: 2,
    lastReply: "2024-01-14 3:45 PM",
    priority: "normal",
  },
  {
    id: 2,
    clientName: "Mike Chen",
    clientAvatar: "/placeholder.svg?height=40&width=40",
    subject: "Nutrition advice needed",
    preview:
      "Could you recommend some post-workout meals that would help with...",
    date: "2024-01-12",
    time: "10:15 AM",
    unread: false,
    replies: 4,
    lastReply: "2024-01-13 9:20 AM",
    priority: "normal",
  },
  {
    id: 3,
    clientName: "Emma Davis",
    clientAvatar: "/placeholder.svg?height=40&width=40",
    subject: "Schedule change request",
    preview: "I need to reschedule my Friday session due to a work conflict...",
    date: "2024-01-10",
    time: "4:20 PM",
    unread: false,
    replies: 1,
    lastReply: "2024-01-10 5:15 PM",
    priority: "high",
  },
  {
    id: 4,
    clientName: "James Wilson",
    clientAvatar: "/placeholder.svg?height=40&width=40",
    subject: "Payment confirmation",
    preview:
      "Just wanted to confirm that my payment went through for the new package...",
    date: "2024-01-09",
    time: "1:45 PM",
    unread: true,
    replies: 0,
    lastReply: null,
    priority: "normal",
  },
];

const mockConversation = [
  {
    id: 1,
    sender: "client",
    message:
      "Hi John, I wanted to ask about the workout plan for tomorrow. Should I focus more on cardio or strength training?",
    timestamp: "2024-01-14 2:30 PM",
  },
  {
    id: 2,
    sender: "trainer",
    message:
      "Hi Sarah! Great question. Based on your current progress, I'd recommend focusing on strength training tomorrow. We'll work on your upper body routine.",
    timestamp: "2024-01-14 3:15 PM",
  },
  {
    id: 3,
    sender: "client",
    message: "Perfect! Should I do any warm-up exercises before our session?",
    timestamp: "2024-01-14 3:45 PM",
  },
];

export default function TrainerMessagesPage() {
  return (
    <div className="flex-1 flex items-center justify-center">
      <div className="text-center">
        <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h1 className="text-2xl font-bold mb-2">Messages Coming Soon</h1>
        <p className="text-gray-600">
          The trainer messaging feature is under development. Stay tuned!
        </p>
      </div>
    </div>
  );
}
