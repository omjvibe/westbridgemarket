"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  CheckCircle2,
  XCircle,
  Clock,
  Wallet,
  ArrowUpFromLine,
  Loader2,
  AlertCircle,
  Copy,
  Building2,
  Coins,
  Search,
  Eye,
  RefreshCw,
  ExternalLink,
  ShieldCheck,
  PauseCircle
} from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { parseWithdrawalDestination, ParsedWithdrawalDestination } from "@/lib/withdrawal"

interface Withdrawal {
  id: string
  user_id: string
  amount: number
  crypto_type: string
  wallet_address: string
  withdrawal_method?: string
  bank_name?: string
  account_holder_name?: string
  account_number?: string
  routing_number?: string
  swift_code?: string
  bank_country?: string
  account_type?: string
  status: string
  admin_notes: string | null
  created_at: string
  users: {
    full_name: string
    email: string
    balance_deposit: number
    balance_profit: number
  } | null
}

export default function AdminWithdrawalsPage() {
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  // Dialog states
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false)
  const [selectedWithdrawal, setSelectedWithdrawal] = useState<Withdrawal | null>(null)
  const [selectedDetails, setSelectedDetails] = useState<ParsedWithdrawalDestination | null>(null)

  const [rejectDialogOpen, setRejectDialogOpen] = useState(false)
  const [rejectReason, setRejectReason] = useState("")

  const [pendDialogOpen, setPendDialogOpen] = useState(false)
  const [pendTargetStatus, setPendTargetStatus] = useState<"pending" | "processing">("pending")
  const [pendNote, setPendNote] = useState("")

  // Filters & Search
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "processing" | "approved" | "rejected">("all")
  const [methodFilter, setMethodFilter] = useState<"all" | "bank" | "crypto">("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [copiedKey, setCopiedKey] = useState<string | null>(null)

  useEffect(() => {
    fetchWithdrawals()
  }, [])

  const fetchWithdrawals = async () => {
    try {
      setLoading(true)
      const supabase = createClient()

      const { data, error } = await supabase
        .from("transactions")
        .select("*, users(full_name, email, balance_deposit, balance_profit)")
        .eq("type", "withdrawal")
        .order("created_at", { ascending: false })

      if (error) {
        console.error("Error fetching withdrawals:", error)
        return
      }

      if (data) setWithdrawals(data as Withdrawal[])
    } catch (err) {
      console.error("Failed to fetch withdrawals:", err)
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text)
    setCopiedKey(key)
    setTimeout(() => setCopiedKey(null), 2000)
  }

  // Open details modal
  const openDetailsDialog = (withdrawal: Withdrawal) => {
    setSelectedWithdrawal(withdrawal)
    setSelectedDetails(parseWithdrawalDestination(withdrawal))
    setDetailsDialogOpen(true)
  }

  // Open rejection modal
  const openRejectDialog = (withdrawal: Withdrawal) => {
    setSelectedWithdrawal(withdrawal)
    setSelectedDetails(parseWithdrawalDestination(withdrawal))
    setRejectReason(withdrawal.admin_notes || "")
    setRejectDialogOpen(true)
  }

  // Open pend / hold modal
  const openPendDialog = (withdrawal: Withdrawal, targetStatus: "pending" | "processing") => {
    setSelectedWithdrawal(withdrawal)
    setSelectedDetails(parseWithdrawalDestination(withdrawal))
    setPendTargetStatus(targetStatus)
    setPendNote(withdrawal.admin_notes || "")
    setPendDialogOpen(true)
  }

  // Master handler for updating status (Approve, Pend, Processing, Reject)
  const handleUpdateStatus = async (
    withdrawal: Withdrawal,
    newStatus: "approved" | "pending" | "processing" | "rejected",
    notes?: string
  ) => {
    try {
      setActionLoading(withdrawal.id)
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        alert("You must be logged in as an administrator.")
        return
      }

      const prevStatus = withdrawal.status
      const withdrawAmount = Number(withdrawal.amount)

      // 1. Balance Deduction (When moving TO approved from another status)
      if (prevStatus !== "approved" && newStatus === "approved") {
        const { data: userData, error: uErr } = await supabase
          .from("users")
          .select("balance_profit, balance_deposit")
          .eq("id", withdrawal.user_id)
          .single()

        if (uErr || !userData) {
          throw new Error("Could not retrieve current user balance.")
        }

        const userProfit = Number(userData.balance_profit || 0)
        const userDeposit = Number(userData.balance_deposit || 0)

        let newProfit = userProfit
        let newDeposit = userDeposit
        let remaining = withdrawAmount

        // Deduct from profit balance first
        if (remaining > 0 && newProfit > 0) {
          const deduct = Math.min(remaining, newProfit)
          newProfit -= deduct
          remaining -= deduct
        }

        // Then deduct from deposit balance
        if (remaining > 0 && newDeposit > 0) {
          const deduct = Math.min(remaining, newDeposit)
          newDeposit -= deduct
          remaining -= deduct
        }

        const { error: balErr } = await supabase
          .from("users")
          .update({
            balance_profit: newProfit,
            balance_deposit: newDeposit,
            updated_at: new Date().toISOString(),
          })
          .eq("id", withdrawal.user_id)

        if (balErr) throw balErr
      }

      // 2. Balance Refund (When moving FROM approved TO pending, processing, or rejected)
      if (prevStatus === "approved" && (newStatus === "pending" || newStatus === "processing" || newStatus === "rejected")) {
        const { data: userData } = await supabase
          .from("users")
          .select("balance_deposit")
          .eq("id", withdrawal.user_id)
          .single()

        if (userData) {
          const currentDeposit = Number(userData.balance_deposit || 0)
          await supabase
            .from("users")
            .update({
              balance_deposit: currentDeposit + withdrawAmount,
              updated_at: new Date().toISOString(),
            })
            .eq("id", withdrawal.user_id)
        }
      }

      // 3. Update the transaction row
      const updateData: any = {
        status: newStatus,
        approved_by: newStatus === "approved" || newStatus === "rejected" ? user.id : null,
        approved_at: newStatus === "approved" ? new Date().toISOString() : null,
        admin_notes: notes !== undefined ? notes : withdrawal.admin_notes,
        updated_at: new Date().toISOString(),
      }

      const { error: txError } = await supabase
        .from("transactions")
        .update(updateData)
        .eq("id", withdrawal.id)

      if (txError) throw txError

      // 4. Send notification to user
      const dest = parseWithdrawalDestination(withdrawal)
      const channelLabel = dest.isBank
        ? `Bank Transfer (${dest.bank?.bank_name || "Bank Wire"})`
        : `Cryptocurrency (${dest.cryptoSymbol || "Crypto"})`

      let notifTitle = "Withdrawal Update"
      let notifMsg = `Your withdrawal request of $${withdrawAmount.toLocaleString()} has been updated to ${newStatus}.`
      let notifType: "success" | "error" | "info" = "info"

      if (newStatus === "approved") {
        notifTitle = "Withdrawal Approved"
        notifMsg = `Your withdrawal of $${withdrawAmount.toLocaleString()} via ${channelLabel} has been approved and processed.`
        notifType = "success"
      } else if (newStatus === "rejected") {
        notifTitle = "Withdrawal Rejected"
        notifMsg = `Your withdrawal of $${withdrawAmount.toLocaleString()} has been rejected. ${notes ? `Reason: ${notes}` : ""}`
        notifType = "error"
      } else if (newStatus === "processing") {
        notifTitle = "Withdrawal Processing"
        notifMsg = `Your withdrawal of $${withdrawAmount.toLocaleString()} via ${channelLabel} is currently under compliance review.`
        notifType = "info"
      } else if (newStatus === "pending") {
        notifTitle = "Withdrawal On Hold"
        notifMsg = `Your withdrawal request of $${withdrawAmount.toLocaleString()} has been placed on hold / pending review.`
        notifType = "info"
      }

      await supabase.from("notifications").insert({
        user_id: withdrawal.user_id,
        title: notifTitle,
        message: notifMsg,
        type: notifType,
      })

      // Close open dialogs if applicable
      setRejectDialogOpen(false)
      setPendDialogOpen(false)
      setDetailsDialogOpen(false)

      fetchWithdrawals()
    } catch (err: any) {
      console.error("Action error:", err)
      alert(err.message || "Failed to process withdrawal action.")
    } finally {
      setActionLoading(null)
    }
  }

  // Filter & Search Logic
  const filteredWithdrawals = withdrawals.filter((w) => {
    // Status Filter
    if (statusFilter !== "all" && w.status !== statusFilter) return false

    // Method Filter
    const dest = parseWithdrawalDestination(w)
    if (methodFilter === "bank" && !dest.isBank) return false
    if (methodFilter === "crypto" && dest.isBank) return false

    // Text Search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      const userName = (w.users?.full_name || "").toLowerCase()
      const userEmail = (w.users?.email || "").toLowerCase()
      const bankName = (dest.bank?.bank_name || "").toLowerCase()
      const accNum = (dest.bank?.account_number || "").toLowerCase()
      const wallet = (dest.walletAddress || "").toLowerCase()

      if (
        !userName.includes(q) &&
        !userEmail.includes(q) &&
        !bankName.includes(q) &&
        !accNum.includes(q) &&
        !wallet.includes(q)
      ) {
        return false
      }
    }

    return true
  })

  // KPI Metrics
  const pendingCount = withdrawals.filter((w) => w.status === "pending").length
  const processingCount = withdrawals.filter((w) => w.status === "processing").length
  const approvedCount = withdrawals.filter((w) => w.status === "approved").length
  const rejectedCount = withdrawals.filter((w) => w.status === "rejected").length

  const bankCount = withdrawals.filter((w) => parseWithdrawalDestination(w).isBank).length
  const cryptoCount = withdrawals.length - bankCount

  const pendingSum = withdrawals
    .filter((w) => w.status === "pending" || w.status === "processing")
    .reduce((sum, w) => sum + Number(w.amount), 0)

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">Approved</Badge>
      case "rejected":
        return <Badge className="bg-red-500/20 text-red-400 border-red-500/30">Rejected</Badge>
      case "processing":
        return <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">Processing</Badge>
      default:
        return <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30">Pending</Badge>
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <ArrowUpFromLine className="h-6 w-6 text-[#f04e23]" /> Withdrawal Management
          </h1>
          <p className="text-sm text-muted-foreground">
            Approve, pend (hold), or reject bank wire and crypto withdrawal requests.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchWithdrawals} className="gap-2 shrink-0">
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} /> Refresh
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="border-border/60 bg-card/60 backdrop-blur-md">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Total Requests</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{withdrawals.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {bankCount} Bank • {cryptoCount} Crypto
            </p>
          </CardContent>
        </Card>

        <Card className="border-border/60 bg-card/60 backdrop-blur-md">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Pending Review</CardTitle>
            <Clock className="h-4 w-4 text-amber-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-400">{pendingCount}</div>
            <p className="text-xs text-muted-foreground mt-1">${pendingSum.toLocaleString()} queue</p>
          </CardContent>
        </Card>

        <Card className="border-border/60 bg-card/60 backdrop-blur-md">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">In Processing</CardTitle>
            <PauseCircle className="h-4 w-4 text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-400">{processingCount}</div>
            <p className="text-xs text-muted-foreground mt-1">On hold</p>
          </CardContent>
        </Card>

        <Card className="border-border/60 bg-card/60 backdrop-blur-md">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Approved</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-400">{approvedCount}</div>
            <p className="text-xs text-muted-foreground mt-1">Disbursed</p>
          </CardContent>
        </Card>

        <Card className="border-border/60 bg-card/60 backdrop-blur-md col-span-2 lg:col-span-1">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Rejected</CardTitle>
            <XCircle className="h-4 w-4 text-red-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-400">{rejectedCount}</div>
            <p className="text-xs text-muted-foreground mt-1">Declined</p>
          </CardContent>
        </Card>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between">
        {/* Status Filters */}
        <div className="flex flex-wrap gap-1.5">
          {(["all", "pending", "processing", "approved", "rejected"] as const).map((s) => (
            <Button
              key={s}
              size="sm"
              variant={statusFilter === s ? "default" : "outline"}
              onClick={() => setStatusFilter(s)}
              className="capitalize text-xs h-8"
            >
              {s}
              {s === "pending" && pendingCount > 0 && ` (${pendingCount})`}
              {s === "processing" && processingCount > 0 && ` (${processingCount})`}
            </Button>
          ))}
        </div>

        {/* Method filter & Search input */}
        <div className="flex items-center gap-2">
          {/* Method Tabs */}
          <div className="inline-flex rounded-lg border border-border p-0.5 bg-background text-xs">
            <button
              onClick={() => setMethodFilter("all")}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                methodFilter === "all" ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              All
            </button>
            <button
              onClick={() => setMethodFilter("bank")}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors flex items-center gap-1 ${
                methodFilter === "bank" ? "bg-blue-500/20 text-blue-400" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Building2 className="h-3 w-3" /> Bank
            </button>
            <button
              onClick={() => setMethodFilter("crypto")}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors flex items-center gap-1 ${
                methodFilter === "crypto" ? "bg-amber-500/20 text-amber-400" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Coins className="h-3 w-3" /> Crypto
            </button>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Search user, bank, address..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 h-8 text-xs"
            />
          </div>
        </div>
      </div>

      {/* Withdrawals Table */}
      <Card className="border-border/60 bg-card/60 backdrop-blur-md">
        <CardHeader className="py-4">
          <CardTitle className="text-base flex items-center justify-between">
            <span>
              {statusFilter === "all" ? "All" : statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1)} Withdrawals ({filteredWithdrawals.length})
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center p-12 text-muted-foreground">
              <Loader2 className="h-6 w-6 animate-spin mr-2" /> Loading records...
            </div>
          ) : filteredWithdrawals.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground text-sm">
              No matching withdrawal requests found.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-muted/20 text-left text-xs text-muted-foreground">
                    <th className="py-3 px-4 font-medium">User</th>
                    <th className="py-3 px-4 font-medium">Amount</th>
                    <th className="py-3 px-4 font-medium">Method</th>
                    <th className="py-3 px-4 font-medium">Destination Details</th>
                    <th className="py-3 px-4 font-medium">Status</th>
                    <th className="py-3 px-4 font-medium">Date</th>
                    <th className="py-3 px-4 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40 text-sm">
                  {filteredWithdrawals.map((withdrawal) => {
                    const dest = parseWithdrawalDestination(withdrawal)
                    return (
                      <tr key={withdrawal.id} className="hover:bg-muted/10 transition-colors">
                        {/* User Column */}
                        <td className="py-3.5 px-4">
                          <p className="font-medium text-foreground">{withdrawal.users?.full_name || "Unknown"}</p>
                          <p className="text-xs text-muted-foreground">{withdrawal.users?.email || "—"}</p>
                          <p className="text-[10px] text-muted-foreground/75 mt-0.5">
                            Bal: ${(Number(withdrawal.users?.balance_deposit || 0) + Number(withdrawal.users?.balance_profit || 0)).toFixed(2)}
                          </p>
                        </td>

                        {/* Amount */}
                        <td className="py-3.5 px-4 font-bold text-foreground">
                          ${Number(withdrawal.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>

                        {/* Method */}
                        <td className="py-3.5 px-4">
                          {dest.isBank ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-blue-500/15 text-blue-400 border border-blue-500/30 font-semibold text-xs">
                              <Building2 className="h-3.5 w-3.5" /> Bank Wire
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-amber-500/15 text-amber-400 border border-amber-500/30 font-semibold text-xs">
                              <Coins className="h-3.5 w-3.5" /> {dest.cryptoSymbol || "Crypto"}
                            </span>
                          )}
                        </td>

                        {/* Destination */}
                        <td className="py-3.5 px-4 max-w-[240px]">
                          {dest.isBank ? (
                            <div>
                              <p className="font-semibold text-foreground text-xs truncate">
                                {dest.bank?.bank_name || "Bank Wire"}
                              </p>
                              <div className="flex items-center gap-1 text-xs text-muted-foreground font-mono">
                                <span>{dest.bank?.account_number ? `•••• ${dest.bank.account_number.slice(-4)}` : "Direct Wire"}</span>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-5 px-1.5 text-[10px] text-blue-400 hover:text-blue-300"
                                  onClick={() => openDetailsDialog(withdrawal)}
                                >
                                  View Bank Info
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <div>
                              <p className="text-xs font-mono text-foreground truncate max-w-[180px]">
                                {dest.walletAddress}
                              </p>
                              {dest.walletAddress && (
                                <button
                                  className="inline-flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground mt-0.5"
                                  onClick={() => copyToClipboard(dest.walletAddress || "", withdrawal.id)}
                                >
                                  <Copy className="h-2.5 w-2.5" />
                                  <span>{copiedKey === withdrawal.id ? "Copied" : "Copy Address"}</span>
                                </button>
                              )}
                            </div>
                          )}
                        </td>

                        {/* Status */}
                        <td className="py-3.5 px-4">
                          {getStatusBadge(withdrawal.status)}
                          {withdrawal.admin_notes && (
                            <p className="text-[10px] text-muted-foreground truncate max-w-[130px] mt-0.5" title={withdrawal.admin_notes}>
                              {withdrawal.admin_notes}
                            </p>
                          )}
                        </td>

                        {/* Date */}
                        <td className="py-3.5 px-4 text-xs text-muted-foreground whitespace-nowrap">
                          {new Date(withdrawal.created_at).toLocaleDateString()}
                          <br />
                          <span className="text-[10px]">{new Date(withdrawal.created_at).toLocaleTimeString()}</span>
                        </td>

                        {/* Actions (Approve, Pend, Reject) */}
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Inspect Details Button */}
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
                              onClick={() => openDetailsDialog(withdrawal)}
                              title="Inspect Details"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>

                            {/* PENDING / PROCESSING ACTIONS */}
                            {(withdrawal.status === "pending" || withdrawal.status === "processing") && (
                              <>
                                <Button
                                  size="sm"
                                  className="h-8 bg-emerald-600 hover:bg-emerald-500 text-white gap-1 text-xs px-2.5"
                                  disabled={actionLoading === withdrawal.id}
                                  onClick={() => handleUpdateStatus(withdrawal, "approved")}
                                >
                                  {actionLoading === withdrawal.id ? (
                                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                  ) : (
                                    <CheckCircle2 className="h-3.5 w-3.5" />
                                  )}
                                  Approve
                                </Button>

                                {withdrawal.status === "pending" ? (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-8 border-blue-500/40 text-blue-400 hover:bg-blue-500/10 text-xs px-2"
                                    disabled={actionLoading === withdrawal.id}
                                    onClick={() => handleUpdateStatus(withdrawal, "processing", "Under compliance review")}
                                  >
                                    Processing
                                  </Button>
                                ) : (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-8 border-amber-500/40 text-amber-400 hover:bg-amber-500/10 text-xs px-2"
                                    disabled={actionLoading === withdrawal.id}
                                    onClick={() => handleUpdateStatus(withdrawal, "pending", "Returned to pending")}
                                  >
                                    Pend
                                  </Button>
                                )}

                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-8 border-red-500/40 text-red-400 hover:bg-red-500/10 text-xs px-2.5"
                                  disabled={actionLoading === withdrawal.id}
                                  onClick={() => openRejectDialog(withdrawal)}
                                >
                                  <XCircle className="h-3.5 w-3.5" /> Reject
                                </Button>
                              </>
                            )}

                            {/* APPROVED ACTIONS: Can re-pend or reject (with auto balance refund) */}
                            {withdrawal.status === "approved" && (
                              <div className="flex items-center gap-1.5">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-8 border-amber-500/40 text-amber-400 hover:bg-amber-500/10 text-xs px-2"
                                  disabled={actionLoading === withdrawal.id}
                                  onClick={() => openPendDialog(withdrawal, "pending")}
                                  title="Revert to pending and refund balance"
                                >
                                  Pend
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-8 border-red-500/40 text-red-400 hover:bg-red-500/10 text-xs px-2"
                                  disabled={actionLoading === withdrawal.id}
                                  onClick={() => openRejectDialog(withdrawal)}
                                  title="Reject and refund balance"
                                >
                                  Reject
                                </Button>
                              </div>
                            )}

                            {/* REJECTED ACTIONS: Can re-open to pending or approve */}
                            {withdrawal.status === "rejected" && (
                              <div className="flex items-center gap-1.5">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-8 border-amber-500/40 text-amber-400 hover:bg-amber-500/10 text-xs px-2"
                                  disabled={actionLoading === withdrawal.id}
                                  onClick={() => handleUpdateStatus(withdrawal, "pending", "Re-opened for review")}
                                  title="Re-open to pending"
                                >
                                  Re-Pend
                                </Button>
                                <Button
                                  size="sm"
                                  className="h-8 bg-emerald-600 hover:bg-emerald-500 text-white text-xs px-2"
                                  disabled={actionLoading === withdrawal.id}
                                  onClick={() => handleUpdateStatus(withdrawal, "approved")}
                                >
                                  Approve
                                </Button>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* FULL DETAILS & BANK INFO MODAL */}
      <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-foreground">
              {selectedDetails?.isBank ? (
                <>
                  <Building2 className="h-5 w-5 text-blue-400" /> Bank Wire Withdrawal Details
                </>
              ) : (
                <>
                  <Coins className="h-5 w-5 text-amber-400" /> Crypto Withdrawal Details
                </>
              )}
            </DialogTitle>
            <DialogDescription>
              Review all destination banking and user account credentials before disbursement.
            </DialogDescription>
          </DialogHeader>

          {selectedWithdrawal && selectedDetails && (
            <div className="space-y-4 py-2">
              {/* Summary Banner */}
              <div className="flex items-center justify-between p-3.5 rounded-lg bg-muted/40 border border-border">
                <div>
                  <p className="text-xs text-muted-foreground uppercase font-medium">Disbursement Amount</p>
                  <p className="text-2xl font-bold text-foreground">
                    ${Number(selectedWithdrawal.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground uppercase font-medium">Current Status</p>
                  <div className="mt-0.5">{getStatusBadge(selectedWithdrawal.status)}</div>
                </div>
              </div>

              {/* User Account Info */}
              <div className="p-3.5 rounded-lg border border-border/80 space-y-1.5 text-xs">
                <p className="font-semibold text-foreground text-sm flex items-center gap-1.5">
                  <ShieldCheck className="h-4 w-4 text-emerald-400" /> User Information
                </p>
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <div>
                    <span className="text-muted-foreground">Full Name:</span>
                    <p className="font-medium text-foreground">{selectedWithdrawal.users?.full_name || "—"}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Email:</span>
                    <p className="font-medium text-foreground truncate">{selectedWithdrawal.users?.email || "—"}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Deposit Balance:</span>
                    <p className="font-medium text-foreground">${Number(selectedWithdrawal.users?.balance_deposit || 0).toFixed(2)}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Profit Balance:</span>
                    <p className="font-medium text-foreground">${Number(selectedWithdrawal.users?.balance_profit || 0).toFixed(2)}</p>
                  </div>
                </div>
              </div>

              {/* BANK WIRE CREDENTIALS */}
              {selectedDetails.isBank && selectedDetails.bank && (
                <div className="p-3.5 rounded-lg border border-blue-500/30 bg-blue-500/5 space-y-2.5 text-xs">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-foreground text-sm flex items-center gap-1.5">
                      <Building2 className="h-4 w-4 text-blue-400" /> Bank Wire / ACH Details
                    </p>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 uppercase">
                      {selectedDetails.bank.account_type || "Checking"}
                    </span>
                  </div>

                  <div className="space-y-2 divide-y divide-border/40">
                    <div className="flex items-center justify-between pt-1">
                      <div>
                        <span className="text-muted-foreground">Bank Name:</span>
                        <p className="font-semibold text-foreground">{selectedDetails.bank.bank_name}</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs gap-1"
                        onClick={() => copyToClipboard(selectedDetails.bank?.bank_name || "", "m-bank")}
                      >
                        <Copy className="h-3 w-3" />
                        {copiedKey === "m-bank" ? "Copied" : "Copy"}
                      </Button>
                    </div>

                    <div className="flex items-center justify-between pt-2">
                      <div>
                        <span className="text-muted-foreground">Account Holder:</span>
                        <p className="font-semibold text-foreground">{selectedDetails.bank.account_holder_name || selectedWithdrawal.users?.full_name}</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs gap-1"
                        onClick={() => copyToClipboard(selectedDetails.bank?.account_holder_name || selectedWithdrawal.users?.full_name || "", "m-name")}
                      >
                        <Copy className="h-3 w-3" />
                        {copiedKey === "m-name" ? "Copied" : "Copy"}
                      </Button>
                    </div>

                    <div className="flex items-center justify-between pt-2">
                      <div>
                        <span className="text-muted-foreground">Account Number / IBAN:</span>
                        <p className="font-mono font-bold text-foreground text-sm tracking-wide">
                          {selectedDetails.bank.account_number}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs gap-1"
                        onClick={() => copyToClipboard(selectedDetails.bank?.account_number || "", "m-acc")}
                      >
                        <Copy className="h-3 w-3" />
                        {copiedKey === "m-acc" ? "Copied" : "Copy"}
                      </Button>
                    </div>

                    <div className="flex items-center justify-between pt-2">
                      <div>
                        <span className="text-muted-foreground">Routing Transit (ABA) / Sort Code:</span>
                        <p className="font-mono font-bold text-foreground tracking-wide">
                          {selectedDetails.bank.routing_number || "—"}
                        </p>
                      </div>
                      {selectedDetails.bank.routing_number && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 text-xs gap-1"
                          onClick={() => copyToClipboard(selectedDetails.bank?.routing_number || "", "m-rout")}
                        >
                          <Copy className="h-3 w-3" />
                          {copiedKey === "m-rout" ? "Copied" : "Copy"}
                        </Button>
                      )}
                    </div>

                    {selectedDetails.bank.swift_code && (
                      <div className="flex items-center justify-between pt-2">
                        <div>
                          <span className="text-muted-foreground">SWIFT / BIC Code:</span>
                          <p className="font-mono font-semibold text-foreground uppercase">
                            {selectedDetails.bank.swift_code}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 text-xs gap-1"
                          onClick={() => copyToClipboard(selectedDetails.bank?.swift_code || "", "m-swift")}
                        >
                          <Copy className="h-3 w-3" />
                          {copiedKey === "m-swift" ? "Copied" : "Copy"}
                        </Button>
                      </div>
                    )}

                    {selectedDetails.bank.bank_country && (
                      <div className="pt-2">
                        <span className="text-muted-foreground">Bank Jurisdiction / Country:</span>
                        <p className="font-medium text-foreground">{selectedDetails.bank.bank_country}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* CRYPTO WALLET CREDENTIALS */}
              {!selectedDetails.isBank && (
                <div className="p-3.5 rounded-lg border border-amber-500/30 bg-amber-500/5 space-y-2 text-xs">
                  <p className="font-semibold text-foreground text-sm flex items-center gap-1.5">
                    <Coins className="h-4 w-4 text-amber-400" /> Cryptocurrency Destination
                  </p>
                  <div>
                    <span className="text-muted-foreground">Asset / Network:</span>
                    <p className="font-bold text-foreground text-sm">{selectedWithdrawal.crypto_type}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Destination Wallet Address:</span>
                    <div className="flex items-center justify-between gap-2 mt-1 p-2 rounded bg-background border font-mono text-xs break-all">
                      <span>{selectedDetails.walletAddress}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 px-1.5 shrink-0"
                        onClick={() => copyToClipboard(selectedDetails.walletAddress || "", "m-wal")}
                      >
                        <Copy className="h-3 w-3" />
                        {copiedKey === "m-wal" ? "Copied" : "Copy"}
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* Admin Notes */}
              {selectedWithdrawal.admin_notes && (
                <div className="p-3 rounded bg-muted/40 text-xs">
                  <span className="font-medium text-foreground">Current Note: </span>
                  <span className="text-muted-foreground">{selectedWithdrawal.admin_notes}</span>
                </div>
              )}

              {/* Modal Actions */}
              <div className="pt-2 flex flex-wrap gap-2 justify-end border-t border-border">
                <Button variant="outline" size="sm" onClick={() => setDetailsDialogOpen(false)}>
                  Close
                </Button>

                {selectedWithdrawal.status !== "approved" && (
                  <Button
                    size="sm"
                    className="bg-emerald-600 hover:bg-emerald-500 text-white gap-1.5"
                    disabled={actionLoading === selectedWithdrawal.id}
                    onClick={() => handleUpdateStatus(selectedWithdrawal, "approved")}
                  >
                    <CheckCircle2 className="h-4 w-4" /> Approve Withdrawal
                  </Button>
                )}

                {selectedWithdrawal.status !== "processing" && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-blue-500/40 text-blue-400 hover:bg-blue-500/10"
                    disabled={actionLoading === selectedWithdrawal.id}
                    onClick={() => handleUpdateStatus(selectedWithdrawal, "processing", "Processing transfer")}
                  >
                    Mark Processing
                  </Button>
                )}

                {selectedWithdrawal.status !== "pending" && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-amber-500/40 text-amber-400 hover:bg-amber-500/10"
                    disabled={actionLoading === selectedWithdrawal.id}
                    onClick={() => handleUpdateStatus(selectedWithdrawal, "pending", "Placed on hold")}
                  >
                    Set Pending
                  </Button>
                )}

                {selectedWithdrawal.status !== "rejected" && (
                  <Button
                    size="sm"
                    variant="destructive"
                    disabled={actionLoading === selectedWithdrawal.id}
                    onClick={() => {
                      setDetailsDialogOpen(false)
                      openRejectDialog(selectedWithdrawal)
                    }}
                  >
                    Reject
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* REJECT WITHDRAWAL DIALOG */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-400">
              <AlertCircle className="h-5 w-5" /> Reject Withdrawal Request
            </DialogTitle>
            <DialogDescription>
              Rejecting withdrawal of ${selectedWithdrawal ? Number(selectedWithdrawal.amount).toLocaleString() : "0"} for{" "}
              {selectedWithdrawal?.users?.full_name || "user"}. If this was previously approved, the funds will be automatically refunded to the user's balance.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Rejection Reason / Notes (sent to user)</Label>
              <Textarea
                placeholder="e.g. Account name mismatch with KYC, invalid bank routing code, additional compliance verification required..."
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                rows={3}
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                className="bg-red-600 hover:bg-red-500 text-white gap-2"
                disabled={actionLoading === selectedWithdrawal?.id}
                onClick={() => selectedWithdrawal && handleUpdateStatus(selectedWithdrawal, "rejected", rejectReason)}
              >
                {actionLoading === selectedWithdrawal?.id && <Loader2 className="h-4 w-4 animate-spin" />}
                Confirm Rejection
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* PEND / HOLD DIALOG */}
      <Dialog open={pendDialogOpen} onOpenChange={setPendDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-amber-400">
              <Clock className="h-5 w-5" /> Place Withdrawal on Hold (Pend)
            </DialogTitle>
            <DialogDescription>
              Set status to {pendTargetStatus === "processing" ? "Processing" : "Pending"}. If this withdrawal was previously approved, the deducted balance will be safely restored to the user.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Status Option</Label>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant={pendTargetStatus === "pending" ? "default" : "outline"}
                  onClick={() => setPendTargetStatus("pending")}
                  className="text-xs"
                >
                  Pending Review
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant={pendTargetStatus === "processing" ? "default" : "outline"}
                  onClick={() => setPendTargetStatus("processing")}
                  className="text-xs"
                >
                  In Processing
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Internal Note / Explanation</Label>
              <Textarea
                placeholder="e.g. Awaiting bank intermediary confirmation, identity verification follow-up..."
                value={pendNote}
                onChange={(e) => setPendNote(e.target.value)}
                rows={3}
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button variant="outline" onClick={() => setPendDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                className="bg-amber-600 hover:bg-amber-500 text-white gap-2"
                disabled={actionLoading === selectedWithdrawal?.id}
                onClick={() => selectedWithdrawal && handleUpdateStatus(selectedWithdrawal, pendTargetStatus, pendNote)}
              >
                {actionLoading === selectedWithdrawal?.id && <Loader2 className="h-4 w-4 animate-spin" />}
                Confirm Status Update
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
