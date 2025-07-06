"use client";

import { useState, useEffect } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { TrainerSidebar } from "@/components/trainer-sidebar";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DollarSign,
  Download,
  Search,
  Calendar,
  CreditCard,
  TrendingUp,
} from "lucide-react";
import { createClient } from "@/lib/supabaseClient";
import { startOfMonth, subMonths, endOfMonth } from "date-fns";

interface Payment {
  id: string;
  client_id: string;
  amount: number;
  method: string;
  session_count: number;
  status: string;
  transaction_id: string;
  paid_at: string;
}

interface ClientMap {
  [clientId: string]: string;
}

export default function TrainerPaymentsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "completed" | "pending" | "failed"
  >("all");
  const [dateRange, setDateRange] = useState("all");
  const [payments, setPayments] = useState<Payment[]>([]);
  const [clientMap, setClientMap] = useState<ClientMap>({});
  const [loading, setLoading] = useState(true);

  const supabase = createClient();

  // Handle client search from URL query parameter
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const clientParam = urlParams.get("client");
    if (clientParam) {
      const decodedClient = decodeURIComponent(clientParam);
      setSearchTerm(decodedClient);
    }
  }, []);

  useEffect(() => {
    async function fetchPayments() {
      setLoading(true);
      // Fetch all payments
      const { data: paymentsData, error: paymentsError } = await supabase
        .from("payments")
        .select(
          "id, client_id, amount, method, session_count, status, transaction_id, paid_at"
        );
      if (paymentsError) {
        setPayments([]);
        setLoading(false);
        return;
      }
      setPayments(paymentsData || []);
      // Fetch all clients referenced in payments
      const clientIds = Array.from(
        new Set((paymentsData || []).map((p) => p.client_id))
      );
      if (clientIds.length > 0) {
        const { data: usersData } = await supabase
          .from("users")
          .select("id, full_name")
          .in("id", clientIds);
        const map: ClientMap = {};
        (usersData || []).forEach((u) => {
          map[u.id] = u.full_name;
        });
        setClientMap(map);
      }
      setLoading(false);
    }
    fetchPayments();
  }, [supabase]);

  const filteredPayments = payments.filter((payment) => {
    const clientName = clientMap[payment.client_id] || "Unknown Client";
    const matchesSearch = clientName
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesStatus =
      statusFilter === "all" || payment.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Calculate revenue for this month and last month
  const now = new Date();
  const monthStart = startOfMonth(now);
  const lastMonthStart = startOfMonth(subMonths(now, 1));
  const lastMonthEnd = endOfMonth(subMonths(now, 1));

  const revenueThisMonth = payments
    .filter(
      (p) =>
        p.status === "completed" &&
        p.paid_at &&
        new Date(p.paid_at) >= monthStart
    )
    .reduce((sum, p) => sum + (p.amount || 0), 0);
  const revenueLastMonth = payments
    .filter(
      (p) =>
        p.status === "completed" &&
        p.paid_at &&
        new Date(p.paid_at) >= lastMonthStart &&
        new Date(p.paid_at) <= lastMonthEnd
    )
    .reduce((sum, p) => sum + (p.amount || 0), 0);
  const revenueDiff = revenueThisMonth - revenueLastMonth;

  const totalRevenue = payments
    .filter((p) => p.status === "completed")
    .reduce((sum, p) => sum + (p.amount || 0), 0);
  const pendingAmount = payments
    .filter((p) => p.status === "pending")
    .reduce((sum, p) => sum + (p.amount || 0), 0);
  const completedPayments = payments.filter(
    (p) => p.status === "completed"
  ).length;
  const failedPayments = payments.filter((p) => p.status === "failed").length;

  // Calculate post-tax revenue for Colorado-based trainer
  const calculatePostTaxRevenue = (grossRevenue: number) => {
    // Stripe fees: 2.9% + 30 cents per transaction
    // For simplicity, we'll use an average fee rate of 3.2% (including the 30 cent flat fee)
    const stripeFeeRate = 0.032;
    const revenueAfterStripe = grossRevenue * (1 - stripeFeeRate);

    // Federal taxes for Colorado middle-income self-employed person (2024 rates)
    // Self-employment tax: 15.3% (12.4% Social Security + 2.9% Medicare)
    const selfEmploymentTaxRate = 0.153;

    // Income tax: Assuming 22% bracket for middle income ($47,151 - $100,525)
    // Note: This is simplified - actual rate depends on total annual income
    const federalIncomeTaxRate = 0.22;

    // Combined federal tax rate
    const federalTaxRate = selfEmploymentTaxRate + federalIncomeTaxRate; // 37.3%
    const revenueAfterFederalTax = revenueAfterStripe * (1 - federalTaxRate);

    // Colorado state tax: 4.4% flat rate (2024)
    const coloradoStateTaxRate = 0.044;
    const postTaxRevenue = revenueAfterFederalTax * (1 - coloradoStateTaxRate);

    return postTaxRevenue;
  };

  const postTaxRevenueThisMonth = calculatePostTaxRevenue(revenueThisMonth);
  const postTaxRevenueLastMonth = calculatePostTaxRevenue(revenueLastMonth);
  const postTaxRevenueDiff = postTaxRevenueThisMonth - postTaxRevenueLastMonth;

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "failed":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "completed":
        return "Completed";
      case "pending":
        return "Pending";
      case "failed":
        return "Failed";
      default:
        return "Unknown";
    }
  };

  const exportToCSV = () => {
    const headers = [
      "Client",
      "Date",
      "Amount",
      "Method",
      "Sessions",
      "Status",
      "Transaction ID",
    ];
    const csvContent = [
      headers.join(","),
      ...filteredPayments.map((payment) =>
        [
          clientMap[payment.client_id] || "Unknown Client",
          payment.paid_at,
          payment.amount,
          payment.method,
          payment.session_count,
          payment.status,
          payment.transaction_id,
        ].join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "payments.csv";
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <TrainerSidebar />
        <div className="flex-1">
          <header className="border-b bg-white px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <SidebarTrigger />
                <h1 className="text-2xl font-bold text-gray-900">Payments</h1>
              </div>
              <Button
                onClick={exportToCSV}
                className="bg-red-600 hover:bg-red-700"
              >
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
            </div>
          </header>

          <main className="p-6">
            {/* Revenue Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">
                        Total Revenue
                      </p>
                      <p className="text-2xl font-bold text-green-600">
                        ${revenueThisMonth.toLocaleString()}
                      </p>
                      <p className="text-xs text-gray-500">
                        {revenueLastMonth === 0
                          ? "No revenue last month"
                          : revenueDiff >= 0
                            ? `+$${revenueDiff.toLocaleString()} from last month`
                            : `-$${Math.abs(revenueDiff).toLocaleString()} from last month`}
                      </p>
                    </div>
                    <DollarSign className="h-8 w-8 text-green-600" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">
                        Post-Tax Revenue
                      </p>
                      <p className="text-2xl font-bold text-purple-600">
                        $
                        {postTaxRevenueThisMonth.toLocaleString(undefined, {
                          minimumFractionDigits: 0,
                          maximumFractionDigits: 0,
                        })}
                      </p>
                      <p className="text-xs text-gray-500">
                        {postTaxRevenueLastMonth === 0
                          ? "No revenue last month"
                          : postTaxRevenueDiff >= 0
                            ? `+$${postTaxRevenueDiff.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })} from last month`
                            : `-$${Math.abs(postTaxRevenueDiff).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })} from last month`}
                      </p>
                    </div>
                    <TrendingUp className="h-8 w-8 text-purple-600" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">
                        Completed
                      </p>
                      <p className="text-2xl font-bold text-blue-600">
                        {completedPayments}
                      </p>
                      <p className="text-xs text-gray-500">
                        Successful payments
                      </p>
                    </div>
                    <CreditCard className="h-8 w-8 text-blue-600" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">
                        Failed
                      </p>
                      <p className="text-2xl font-bold text-red-600">
                        {failedPayments}
                      </p>
                      <p className="text-xs text-gray-500">Need attention</p>
                    </div>
                    <TrendingUp className="h-8 w-8 text-red-600" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Filters */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Payment Filters</CardTitle>
                <CardDescription>
                  Search and filter payment records
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search by client name..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <Select
                    value={statusFilter}
                    onValueChange={(value: any) => setStatusFilter(value)}
                  >
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="failed">Failed</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={dateRange} onValueChange={setDateRange}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Date range" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Time</SelectItem>
                      <SelectItem value="today">Today</SelectItem>
                      <SelectItem value="week">This Week</SelectItem>
                      <SelectItem value="month">This Month</SelectItem>
                      <SelectItem value="quarter">This Quarter</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Payments Table */}
            <Card>
              <CardHeader>
                <CardTitle>
                  Payment Records ({filteredPayments.length})
                </CardTitle>
                <CardDescription>
                  Complete history of all payment transactions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Client</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Method</TableHead>
                      <TableHead>Sessions</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Transaction ID</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPayments.map((payment) => (
                      <TableRow key={payment.id}>
                        <TableCell className="font-medium">
                          {clientMap[payment.client_id] || "Unknown Client"}
                        </TableCell>
                        <TableCell>
                          {new Date(payment.paid_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="font-bold">
                          ${payment.amount}
                        </TableCell>
                        <TableCell>{payment.method}</TableCell>
                        <TableCell>{payment.session_count}</TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(payment.status)}>
                            {getStatusText(payment.status)}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-mono text-sm">
                          {payment.transaction_id}
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button size="sm" variant="outline">
                              View
                            </Button>
                            {payment.status === "failed" && (
                              <Button
                                size="sm"
                                className="bg-red-600 hover:bg-red-700"
                              >
                                Retry
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
