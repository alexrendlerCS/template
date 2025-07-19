"use client";

import { SidebarTrigger } from "@/components/ui/sidebar";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { LineChart, BarChart, PieChart } from "lucide-react";
import {
  LineChart as RechartsLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart as RechartsBarChart,
  Bar,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { createClient } from "@/lib/supabaseClient";
import { useEffect, useState, useRef } from "react";
import { format, subMonths, startOfMonth, endOfMonth } from "date-fns";
import { useSearchParams } from "next/navigation";
import { 
  getCurrentTier, 
  isAnalyticsFeatureEnabled, 
  isFeatureEnabled,
  getCurrentTierConfig 
} from "@/lib/config/features";
import { UpgradeOverlay } from "@/components/ui/upgrade-overlay";

interface RevenueData {
  day: string;
  revenue: number;
}

export default function AnalyticsClientPage() {
  console.debug("TrainerAnalyticsPage mounted");
  const [revenueData, setRevenueData] = useState<RevenueData[]>([]);
  const [loading, setLoading] = useState(true);
  const [newClientsData, setNewClientsData] = useState<
    { month: string; count: number }[]
  >([]);
  const [weekdaySessionsData, setWeekdaySessionsData] = useState<
    { weekday: string; count: number }[]
  >([]);
  const [packageSessionsData, setPackageSessionsData] = useState<
    { package_type: string; sessions: number }[]
  >([]);
  const [topRevenueClients, setTopRevenueClients] = useState<
    { client_id: string; total: number; name: string }[]
  >([]);
  const [topSessionTimes, setTopSessionTimes] = useState<
    { time: string; count: number }[]
  >([]);
  const [recentPayments, setRecentPayments] = useState<
    {
      id: string;
      client: string;
      amount: number;
      status: string;
      date: string;
    }[]
  >([]);
  const [showAllPayments, setShowAllPayments] = useState(false);
  const [recentSessions, setRecentSessions] = useState<
    { id: string; client: string; clientId: string; type: string; date: string; status: string }[]
  >([]);
  const [showAllSessions, setShowAllSessions] = useState(false);
  const supabase = createClient();
  const [selectedClient, setSelectedClient] = useState<string | null>(null);
  const [currentSessionPage, setCurrentSessionPage] = useState(1);
  const sessionsPerPage = 5;
  const [clientOptions, setClientOptions] = useState<{ id: string; name: string }[]>([]);
  const searchParams = useSearchParams();
  const recentSessionsRef = useRef<HTMLDivElement>(null);

  // Feature flag state
  const currentTier = getCurrentTier();
  const tierConfig = getCurrentTierConfig();
  const analyticsEnabled = isFeatureEnabled('analyticsEnabled');

  useEffect(() => {
    console.debug("useEffect running in analytics page");
    // Only fetch data if analytics is enabled for current tier
    if (analyticsEnabled) {
      fetchRevenueData();
      fetchNewClientsData();
      fetchWeekdaySessionsData();
      fetchPackageSessionsData();
      fetchTopRevenueClients();
      fetchTopSessionTimes();
      fetchRecentPayments();
      fetchRecentSessions();
    } else {
      setLoading(false);
    }
  }, [analyticsEnabled]);

  useEffect(() => {
    const clientIdFromUrl = searchParams.get("client");
    if (clientIdFromUrl) {
      setSelectedClient(clientIdFromUrl);
      setCurrentSessionPage(1);
      // Scroll to Recent Sessions after a short delay to ensure rendering
      setTimeout(() => {
        if (recentSessionsRef.current) {
          recentSessionsRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }, 300);
    }
  }, [searchParams]);

  const handleUpgrade = () => {
    // This would typically redirect to a pricing/upgrade page
    console.log("Upgrade requested");
    // You can implement your upgrade flow here
  };

  // If analytics is completely disabled for this tier, show upgrade overlay
  if (!analyticsEnabled) {
    return (
      <div className="flex-1">
        <header className="border-b bg-white px-6 py-4">
          <div className="flex items-center space-x-4">
            <SidebarTrigger />
            <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
          </div>
        </header>
        <main className="p-6">
          <UpgradeOverlay
            feature="Analytics"
            currentTier={currentTier}
            onUpgrade={handleUpgrade}
            className="min-h-[600px]"
            variant="overlay"
          />
        </main>
      </div>
    );
  }

  const fetchRevenueData = async () => {
    console.debug("fetchRevenueData called");
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      console.debug("Result of supabase.auth.getSession():", session);
      if (!session) {
        console.debug("No session found, aborting revenue fetch");
        return;
      }
      // Generate last 30 days
      const days = [];
      for (let i = 29; i >= 0; i--) {
        const date = subMonths(new Date(), 0);
        const day = new Date(date);
        day.setDate(date.getDate() - i);
        days.push({
          day: format(day, "MMM dd"),
          startDate:
            startOfMonth(day).toISOString().slice(0, 10) + "T00:00:00.000Z",
          endDate:
            startOfMonth(day).toISOString().slice(0, 10) + "T23:59:59.999Z",
          iso: day.toISOString().slice(0, 10),
        });
      }
      console.debug("Days for revenue trend:", days);
      // Fetch revenue data for each day
      const revenuePromises = days.map(async ({ day, iso }) => {
        const { data, error } = await supabase
          .from("payments")
          .select("amount, paid_at, status")
          .eq("status", "completed")
          .gte("paid_at", iso + "T00:00:00.000Z")
          .lte("paid_at", iso + "T23:59:59.999Z");
        if (error) {
          console.error("Error fetching revenue data:", error);
          return { day, revenue: 0 };
        }
        const totalRevenue =
          data?.reduce(
            (sum, payment) => sum + (parseFloat(payment.amount) || 0),
            0
          ) || 0;
        return { day, revenue: totalRevenue };
      });
      const revenueResults = await Promise.all(revenuePromises);
      setRevenueData(revenueResults);
    } catch (error) {
      console.error("Error fetching revenue data:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchNewClientsData = async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) return;
      // Generate last 12 months
      const months = [];
      for (let i = 11; i >= 0; i--) {
        const date = subMonths(new Date(), i);
        months.push({
          month: format(date, "MMM yyyy"),
          startDate: startOfMonth(date).toISOString(),
          endDate: endOfMonth(date).toISOString(),
        });
      }
      // Fetch all clients
      const { data: users, error } = await supabase
        .from("users")
        .select("id, created_at, role")
        .eq("role", "client");
      if (error) {
        console.error("Error fetching users:", error);
        setNewClientsData([]);
        return;
      }
      // Count new clients per month
      const counts = months.map(({ month, startDate, endDate }) => {
        const count = users.filter((u) => {
          if (!u.created_at) return false;
          const created = new Date(u.created_at);
          return created >= new Date(startDate) && created <= new Date(endDate);
        }).length;
        return { month, count };
      });
      setNewClientsData(counts);
    } catch (error) {
      console.error("Error fetching new clients data:", error);
      setNewClientsData([]);
    }
  };

  const fetchWeekdaySessionsData = async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) return;
      // Fetch all sessions
      const { data: sessions, error } = await supabase
        .from("sessions")
        .select("id, date");
      if (error) {
        setWeekdaySessionsData([]);
        return;
      }
      // Count sessions per weekday
      const weekdays = [
        "Sunday",
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
      ];
      const counts = Array(7).fill(0);
      sessions.forEach((s) => {
        if (!s.date) return;
        const weekday = new Date(s.date).getDay();
        counts[weekday]++;
      });
      const data = weekdays.map((weekday, i) => ({
        weekday,
        count: counts[i],
      }));
      setWeekdaySessionsData(data);
    } catch (error) {
      setWeekdaySessionsData([]);
    }
  };

  const fetchPackageSessionsData = async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) return;
      // Fetch all packages
      const { data: packages, error } = await supabase
        .from("packages")
        .select("package_type, sessions_included");
      if (error) {
        setPackageSessionsData([]);
        return;
      }
      // Group by package_type and sum sessions_included
      const map = new Map();
      packages.forEach((pkg) => {
        if (!pkg.package_type || !pkg.sessions_included) return;
        if (!map.has(pkg.package_type)) {
          map.set(pkg.package_type, 0);
        }
        map.set(
          pkg.package_type,
          map.get(pkg.package_type) + Number(pkg.sessions_included)
        );
      });
      const data = Array.from(map.entries()).map(
        ([package_type, sessions]) => ({ package_type, sessions })
      );
      setPackageSessionsData(data);
    } catch (error) {
      setPackageSessionsData([]);
    }
  };

  const fetchTopRevenueClients = async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) return;
      // Fetch all completed payments
      const { data: payments, error: paymentsError } = await supabase
        .from("payments")
        .select("client_id, amount, status")
        .eq("status", "completed");
      if (paymentsError) {
        setTopRevenueClients([]);
        return;
      }
      // Group by client_id and sum amount
      const clientTotals = new Map();
      payments.forEach((p) => {
        if (!p.client_id || !p.amount) return;
        const amt = parseFloat(p.amount);
        if (!clientTotals.has(p.client_id)) {
          clientTotals.set(p.client_id, 0);
        }
        clientTotals.set(p.client_id, clientTotals.get(p.client_id) + amt);
      });
      // Fetch client names
      const clientIds = Array.from(clientTotals.keys());
      let clientNames: Record<string, string> = {};
      if (clientIds.length > 0) {
        const { data: users, error: usersError } = await supabase
          .from("users")
          .select("id, full_name")
          .in("id", clientIds);
        if (!usersError && users) {
          users.forEach((u) => {
            clientNames[u.id] = u.full_name || "Unknown";
          });
        }
      }
      // Prepare sorted array
      const sorted = Array.from(clientTotals.entries())
        .map(([client_id, total]) => ({
          client_id,
          total,
          name: clientNames[client_id] || "Unknown",
        }))
        .sort((a, b) => b.total - a.total)
        .slice(0, 3);
      setTopRevenueClients(sorted);
    } catch (error) {
      setTopRevenueClients([]);
    }
  };

  const fetchTopSessionTimes = async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) return;
      // Fetch all sessions
      const { data: sessions, error } = await supabase
        .from("sessions")
        .select("start_time");
      if (error) {
        setTopSessionTimes([]);
        return;
      }
      // Group by start_time and count
      const timeCounts = new Map();
      sessions.forEach((s) => {
        if (!s.start_time) return;
        // Only use hour:minute
        const time = s.start_time.slice(0, 5);
        if (!timeCounts.has(time)) {
          timeCounts.set(time, 0);
        }
        timeCounts.set(time, timeCounts.get(time) + 1);
      });
      // Sort by count descending, then by time ascending
      const sorted = Array.from(timeCounts.entries())
        .map(([time, count]) => ({ time, count }))
        .sort((a, b) => b.count - a.count || a.time.localeCompare(b.time));
      setTopSessionTimes(sorted);
    } catch (error) {
      setTopSessionTimes([]);
    }
  };

  const fetchRecentPayments = async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) return;
      // Fetch latest payments (limit 10)
      const { data: payments, error: paymentsError } = await supabase
        .from("payments")
        .select("id, client_id, amount, status, paid_at")
        .order("paid_at", { ascending: false })
        .limit(10);
      if (paymentsError) {
        setRecentPayments([]);
        return;
      }
      // Fetch client names
      const clientIds = Array.from(
        new Set(payments.map((p) => p.client_id).filter(Boolean))
      );
      let clientNames: Record<string, string> = {};
      if (clientIds.length > 0) {
        const { data: users, error: usersError } = await supabase
          .from("users")
          .select("id, full_name")
          .in("id", clientIds);
        if (!usersError && users) {
          users.forEach((u) => {
            clientNames[u.id] = u.full_name || "Unknown";
          });
        }
      }
      // Prepare data
      const data = payments.map((p) => ({
        id: p.id,
        client: clientNames[p.client_id] || "Unknown",
        amount: parseFloat(p.amount),
        status: p.status,
        date: p.paid_at ? new Date(p.paid_at).toLocaleDateString() : "",
      }));
      setRecentPayments(data);
    } catch (error) {
      setRecentPayments([]);
    }
  };

  const fetchRecentSessions = async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) return;
      // Fetch ALL sessions for debugging
      const now = new Date();
      console.log('[DEBUG] Current date/time for filtering:', now.toISOString());
      const { data: sessions, error: sessionsError } = await supabase
        .from("sessions")
        .select("id, client_id, type, date, start_time, end_time, duration_minutes, status, timezone")
        .order("date", { ascending: false })
        .order("start_time", { ascending: false }); // no limit
      if (sessionsError) {
        setRecentSessions([]);
        console.log('[DEBUG] Error fetching sessions:', sessionsError);
        return;
      }
      console.log('[DEBUG] Raw sessions from Supabase (count):', sessions?.length, sessions);
      // Filter for sessions before now (existing logic)
      const filtered = sessions.filter((s) => {
        if (!s.date || !s.start_time) return false;
        const sessionDate = new Date(`${s.date}T${s.start_time}`);
        return sessionDate < now;
      });
      console.log('[DEBUG] Filtered sessions (past, count):', filtered.length, filtered);
      // Fetch client names
      const clientIds = Array.from(
        new Set(filtered.map((s) => s.client_id).filter(Boolean))
      );
      let clientNames: Record<string, string> = {};
      if (clientIds.length > 0) {
        const { data: users, error: usersError } = await supabase
          .from("users")
          .select("id, full_name")
          .in("id", clientIds);
        if (!usersError && users) {
          users.forEach((u) => {
            clientNames[u.id] = u.full_name || "Unknown";
          });
        }
      }
      // Prepare client options for dropdown
      let options = Object.entries(clientNames).map(([id, name]) => ({ id, name }));
      // --- Ensure selected client from URL is present in dropdown ---
      const clientIdFromUrl = searchParams.get("client");
      if (clientIdFromUrl && !options.some(opt => opt.id === clientIdFromUrl)) {
        // Fetch client name from DB
        const { data: user, error: userError } = await supabase
          .from("users")
          .select("id, full_name")
          .eq("id", clientIdFromUrl)
          .single();
        if (!userError && user) {
          options = [{ id: user.id, name: user.full_name || "Unknown" }, ...options];
        }
      }
      setClientOptions(options);
      // Prepare data (keep all, don't slice here)
      const data = filtered.map((s) => ({
        id: s.id,
        client: clientNames[s.client_id] || "Unknown",
        clientId: s.client_id,
        type: s.type,
        date:
          s.date && s.start_time
            ? new Date(`${s.date}T${s.start_time}`).toLocaleString()
            : "",
        status: s.status,
      }));
      console.log('[DEBUG] Final mapped session data:', data);
      setRecentSessions(data);
      setCurrentSessionPage(1); // Reset to first page on fetch
    } catch (error) {
      setRecentSessions([]);
      console.log('[DEBUG] Exception in fetchRecentSessions:', error);
    }
  };

  const pieColors = [
    "#2563eb",
    "#22c55e",
    "#a21caf",
    "#f59e42",
    "#e11d48",
    "#fbbf24",
    "#6366f1",
  ];

  // Filter and paginate sessions for display
  const filteredSessions = selectedClient
    ? recentSessions.filter((s) => s.clientId === selectedClient)
    : recentSessions;
  const totalSessionPages = Math.ceil(filteredSessions.length / sessionsPerPage);
  const paginatedSessions = filteredSessions.slice(
    (currentSessionPage - 1) * sessionsPerPage,
    currentSessionPage * sessionsPerPage
  );

  return (
    <div className="flex-1">
      <header className="border-b bg-white px-6 py-4">
        <div className="flex items-center space-x-4">
          <SidebarTrigger />
          <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
          <div className="ml-auto">
            <span className="text-sm text-gray-500">
              Current Plan: {tierConfig.name}
            </span>
          </div>
        </div>
      </header>
      <main className="p-6 space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Revenue Trend */}
          {isAnalyticsFeatureEnabled('revenueTrend') ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <LineChart className="h-5 w-5 text-blue-600" /> Revenue Trend
                </CardTitle>
                <CardDescription>
                  Revenue trends over the past month
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="h-40 flex items-center justify-center text-gray-400">
                    Loading...
                  </div>
                ) : (
                  <div className="h-40">
                    <ResponsiveContainer width="100%" height="100%">
                      <RechartsLineChart data={revenueData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis
                          dataKey="day"
                          fontSize={12}
                          tick={{ fontSize: 10 }}
                        />
                        <YAxis
                          fontSize={12}
                          tick={{ fontSize: 10 }}
                          tickFormatter={(value) => `$${value}`}
                        />
                        <Tooltip
                          formatter={(value: number) => [`$${value}`, "Revenue"]}
                          labelFormatter={(label) => `Month: ${label}`}
                        />
                        <Line
                          type="monotone"
                          dataKey="revenue"
                          stroke="#2563eb"
                          strokeWidth={2}
                          dot={{ fill: "#2563eb", strokeWidth: 2, r: 4 }}
                          activeDot={{
                            r: 6,
                            stroke: "#2563eb",
                            strokeWidth: 2,
                          }}
                        />
                      </RechartsLineChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <UpgradeOverlay
              feature="Revenue Analytics"
              currentTier={currentTier}
              onUpgrade={handleUpgrade}
              variant="blur"
            />
          )}

          {/* New Clients Per Month */}
          {isAnalyticsFeatureEnabled('newClientsPerMonth') ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart className="h-5 w-5 text-green-600" /> New Clients Per Month
                </CardTitle>
                <CardDescription>
                  How many new clients joined each month
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-40">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsBarChart data={newClientsData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis
                        dataKey="month"
                        fontSize={12}
                        tick={{ fontSize: 10 }}
                      />
                      <YAxis
                        allowDecimals={false}
                        fontSize={12}
                        tick={{ fontSize: 10 }}
                      />
                      <Tooltip
                        formatter={(value: number) => [value, "New Clients"]}
                        labelFormatter={(label) => `Month: ${label}`}
                      />
                      <Bar dataKey="count" fill="#22c55e" radius={[4, 4, 0, 0]} />
                    </RechartsBarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          ) : (
            <UpgradeOverlay
              feature="Client Growth Analytics"
              currentTier={currentTier}
              onUpgrade={handleUpgrade}
              variant="blur"
            />
          )}

          {/* Sessions by Weekday */}
          {isAnalyticsFeatureEnabled('sessionsByWeekday') ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart className="h-5 w-5 text-purple-600" /> Sessions by Weekday
                </CardTitle>
                <CardDescription>
                  Frequency of sessions on each weekday
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-40">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsBarChart data={weekdaySessionsData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis
                        dataKey="weekday"
                        fontSize={12}
                        tick={{ fontSize: 10 }}
                      />
                      <YAxis
                        allowDecimals={false}
                        fontSize={12}
                        tick={{ fontSize: 10 }}
                      />
                      <Tooltip
                        formatter={(value: number) => [value, "Sessions"]}
                        labelFormatter={(label) => `Weekday: ${label}`}
                      />
                      <Bar dataKey="count" fill="#a21caf" radius={[4, 4, 0, 0]} />
                    </RechartsBarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          ) : (
            <UpgradeOverlay
              feature="Session Analytics"
              currentTier={currentTier}
              onUpgrade={handleUpgrade}
              variant="blur"
            />
          )}

          {/* Package Sales by Type */}
          {isAnalyticsFeatureEnabled('packageSalesByType') ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart className="h-5 w-5 text-pink-600" /> Package Sales by Type
                </CardTitle>
                <CardDescription>Which packages are most popular</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-40">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsPieChart>
                      <Pie
                        data={packageSessionsData}
                        dataKey="sessions"
                        nameKey="package_type"
                        cx="50%"
                        cy="50%"
                        outerRadius={70}
                        label
                      >
                        {packageSessionsData.map((entry, idx) => (
                          <Cell
                            key={`cell-${idx}`}
                            fill={pieColors[idx % pieColors.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value: number) => [value, "Sessions"]}
                      />
                      <Legend
                        layout="vertical"
                        align="right"
                        verticalAlign="middle"
                      />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          ) : (
            <UpgradeOverlay
              feature="Package Analytics"
              currentTier={currentTier}
              onUpgrade={handleUpgrade}
              variant="blur"
            />
          )}

          {/* Top Revenue Clients */}
          {isAnalyticsFeatureEnabled('topRevenueClients') ? (
            <Card className="col-span-1 md:col-span-2 lg:col-span-1">
              <CardHeader>
                <CardTitle>Top Revenue Clients</CardTitle>
                <CardDescription>Clients who have spent the most</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Client</TableHead>
                      <TableHead>Total Spent</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {topRevenueClients.map((client) => (
                      <TableRow key={client.client_id}>
                        <TableCell>{client.name}</TableCell>
                        <TableCell>
                          $
                          {client.total.toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          ) : (
            <UpgradeOverlay
              feature="Client Revenue Analytics"
              currentTier={currentTier}
              onUpgrade={handleUpgrade}
              variant="blur"
            />
          )}

          {/* Top Session Times */}
          {isAnalyticsFeatureEnabled('topSessionTimes') ? (
            <Card>
              <CardHeader>
                <CardTitle>Top Session Times</CardTitle>
                <CardDescription>
                  Most frequently booked session start times
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-40">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsBarChart data={topSessionTimes}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis
                        dataKey="time"
                        fontSize={12}
                        tick={{ fontSize: 10 }}
                      />
                      <YAxis
                        allowDecimals={false}
                        fontSize={12}
                        tick={{ fontSize: 10 }}
                      />
                      <Tooltip
                        formatter={(value: number) => [value, "Sessions"]}
                        labelFormatter={(label) => `Time: ${label}`}
                      />
                      <Bar dataKey="count" fill="#f59e42" radius={[4, 4, 0, 0]} />
                    </RechartsBarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          ) : (
            <UpgradeOverlay
              feature="Session Time Analytics"
              currentTier={currentTier}
              onUpgrade={handleUpgrade}
              variant="blur"
            />
          )}
        </div>

        {/* Recent Payments & Sessions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Recent Payments */}
          {isAnalyticsFeatureEnabled('recentPayments') ? (
            <Card>
              <CardHeader>
                <CardTitle>Recent Payments</CardTitle>
                <CardDescription>Latest payment activity</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Client</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(showAllPayments
                      ? recentPayments
                      : recentPayments.slice(0, 5)
                    ).map((p) => (
                      <TableRow key={p.id}>
                        <TableCell>{p.client}</TableCell>
                        <TableCell>
                          $
                          {p.amount.toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </TableCell>
                        <TableCell>
                          {p.status.charAt(0).toUpperCase() + p.status.slice(1)}
                        </TableCell>
                        <TableCell>{p.date}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {recentPayments.length > 5 && (
                  <div className="flex justify-center mt-2">
                    <button
                      className="text-blue-600 hover:underline text-sm font-medium"
                      onClick={() => setShowAllPayments((v) => !v)}
                    >
                      {showAllPayments ? "Show Less" : "Show More"}
                    </button>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <UpgradeOverlay
              feature="Payment History"
              currentTier={currentTier}
              onUpgrade={handleUpgrade}
              variant="blur"
            />
          )}

          {/* Recent Sessions */}
          {isAnalyticsFeatureEnabled('recentSessions') ? (
            <Card ref={recentSessionsRef}>
              <CardHeader>
                <CardTitle>Recent Sessions</CardTitle>
                <CardDescription>Latest session activity</CardDescription>
                {/* Client filter dropdown */}
                <div className="mt-2">
                  <select
                    value={selectedClient || ""}
                    onChange={e => {
                      setSelectedClient(e.target.value || null);
                      setCurrentSessionPage(1);
                    }}
                    className="border rounded px-2 py-1"
                  >
                    <option value="">All Clients</option>
                    {clientOptions.map(opt => (
                      <option key={opt.id} value={opt.id}>{opt.name}</option>
                    ))}
                  </select>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Client</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedSessions.map((s) => (
                      <TableRow key={s.id}>
                        <TableCell>{s.client}</TableCell>
                        <TableCell>{s.type}</TableCell>
                        <TableCell>{s.date}</TableCell>
                        <TableCell>
                          {s.status.charAt(0).toUpperCase() + s.status.slice(1)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {/* Pagination controls */}
                <div className="flex justify-between items-center mt-2">
                  <button
                    className="text-blue-600 hover:underline text-sm font-medium disabled:text-gray-400"
                    onClick={() => setCurrentSessionPage((p) => Math.max(1, p - 1))}
                    disabled={currentSessionPage === 1}
                  >
                    Previous
                  </button>
                  <span className="text-sm">
                    Page {currentSessionPage} of {totalSessionPages || 1}
                  </span>
                  <button
                    className="text-blue-600 hover:underline text-sm font-medium disabled:text-gray-400"
                    onClick={() => setCurrentSessionPage((p) => Math.min(totalSessionPages, p + 1))}
                    disabled={currentSessionPage === totalSessionPages || totalSessionPages === 0}
                  >
                    Next
                  </button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <UpgradeOverlay
              feature="Session History"
              currentTier={currentTier}
              onUpgrade={handleUpgrade}
              variant="blur"
            />
          )}
        </div>

        {/* Custom Analytics Dashboard - Only for highest tier */}
        {isFeatureEnabled('customAnalyticsDashboard') && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart className="h-5 w-5 text-indigo-600" /> Custom Analytics Dashboard
              </CardTitle>
              <CardDescription>
                Request custom analytics and insights tailored to your business needs
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <p className="text-gray-600 mb-4">
                  As an Enterprise customer, you can request custom analytics dashboards and reports.
                </p>
                <button className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700">
                  Request Custom Analytics
                </button>
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
} 