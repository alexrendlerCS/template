"use client"

import { useState } from "react"
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { TrainerSidebar } from "@/components/trainer-sidebar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DollarSign, Download, Search, Calendar, CreditCard, TrendingUp } from "lucide-react"

const mockPayments = [
  {
    id: 1,
    client: "Sarah Johnson",
    date: "2024-01-10",
    amount: 240,
    method: "Credit Card",
    sessionCount: 4,
    status: "completed",
    transactionId: "txn_1234567890",
  },
  {
    id: 2,
    client: "Mike Chen",
    date: "2024-01-12",
    amount: 180,
    method: "Credit Card",
    sessionCount: 3,
    status: "completed",
    transactionId: "txn_1234567891",
  },
  {
    id: 3,
    client: "Emma Davis",
    date: "2024-01-08",
    amount: 300,
    method: "Bank Transfer",
    sessionCount: 5,
    status: "pending",
    transactionId: "txn_1234567892",
  },
  {
    id: 4,
    client: "James Wilson",
    date: "2024-01-05",
    amount: 360,
    method: "Credit Card",
    sessionCount: 6,
    status: "completed",
    transactionId: "txn_1234567893",
  },
  {
    id: 5,
    client: "Lisa Rodriguez",
    date: "2024-01-03",
    amount: 420,
    method: "Credit Card",
    sessionCount: 7,
    status: "completed",
    transactionId: "txn_1234567894",
  },
  {
    id: 6,
    client: "David Kim",
    date: "2024-01-01",
    amount: 240,
    method: "PayPal",
    sessionCount: 4,
    status: "failed",
    transactionId: "txn_1234567895",
  },
]

export default function TrainerPaymentsPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<"all" | "completed" | "pending" | "failed">("all")
  const [dateRange, setDateRange] = useState("all")

  const filteredPayments = mockPayments.filter((payment) => {
    const matchesSearch = payment.client.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "all" || payment.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const totalRevenue = mockPayments.filter((p) => p.status === "completed").reduce((sum, p) => sum + p.amount, 0)
  const pendingAmount = mockPayments.filter((p) => p.status === "pending").reduce((sum, p) => sum + p.amount, 0)
  const completedPayments = mockPayments.filter((p) => p.status === "completed").length
  const failedPayments = mockPayments.filter((p) => p.status === "failed").length

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800"
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      case "failed":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case "completed":
        return "Completed"
      case "pending":
        return "Pending"
      case "failed":
        return "Failed"
      default:
        return "Unknown"
    }
  }

  const exportToCSV = () => {
    const headers = ["Client", "Date", "Amount", "Method", "Sessions", "Status", "Transaction ID"]
    const csvContent = [
      headers.join(","),
      ...filteredPayments.map((payment) =>
        [
          payment.client,
          payment.date,
          payment.amount,
          payment.method,
          payment.sessionCount,
          payment.status,
          payment.transactionId,
        ].join(","),
      ),
    ].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "payments.csv"
    a.click()
    window.URL.revokeObjectURL(url)
  }

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
              <Button onClick={exportToCSV} className="bg-red-600 hover:bg-red-700">
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
                      <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                      <p className="text-2xl font-bold text-green-600">${totalRevenue.toLocaleString()}</p>
                      <p className="text-xs text-gray-500">This month</p>
                    </div>
                    <DollarSign className="h-8 w-8 text-green-600" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Pending Amount</p>
                      <p className="text-2xl font-bold text-yellow-600">${pendingAmount}</p>
                      <p className="text-xs text-gray-500">Awaiting processing</p>
                    </div>
                    <Calendar className="h-8 w-8 text-yellow-600" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Completed</p>
                      <p className="text-2xl font-bold text-blue-600">{completedPayments}</p>
                      <p className="text-xs text-gray-500">Successful payments</p>
                    </div>
                    <CreditCard className="h-8 w-8 text-blue-600" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Failed</p>
                      <p className="text-2xl font-bold text-red-600">{failedPayments}</p>
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
                <CardDescription>Search and filter payment records</CardDescription>
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
                  <Select value={statusFilter} onValueChange={(value: any) => setStatusFilter(value)}>
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
                <CardTitle>Payment Records ({filteredPayments.length})</CardTitle>
                <CardDescription>Complete history of all payment transactions</CardDescription>
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
                        <TableCell className="font-medium">{payment.client}</TableCell>
                        <TableCell>{new Date(payment.date).toLocaleDateString()}</TableCell>
                        <TableCell className="font-bold">${payment.amount}</TableCell>
                        <TableCell>{payment.method}</TableCell>
                        <TableCell>{payment.sessionCount}</TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(payment.status)}>{getStatusText(payment.status)}</Badge>
                        </TableCell>
                        <TableCell className="font-mono text-sm">{payment.transactionId}</TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button size="sm" variant="outline">
                              View
                            </Button>
                            {payment.status === "failed" && (
                              <Button size="sm" className="bg-red-600 hover:bg-red-700">
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

            {/* Stripe Integration Placeholder */}
            <Card className="mt-6 border-dashed border-2 border-gray-300">
              <CardContent className="p-6 text-center">
                <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="font-medium text-gray-900 mb-2">Stripe Integration</h3>
                <p className="text-gray-600 mb-4">
                  Connect your Stripe account to automatically track payments and generate invoices
                </p>
                <Button variant="outline" disabled>
                  Connect Stripe Account (Coming Soon)
                </Button>
              </CardContent>
            </Card>
          </main>
        </div>
      </div>
    </SidebarProvider>
  )
}
