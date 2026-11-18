"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  CheckCircle2,
  XCircle,
  Clock,
  Wallet,
  ArrowUpFromLine,
  Loader2,
  AlertCircle,
  Copy,
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

interface Withdrawal {
  id: string
  user_id: string
  amount: number
  crypto_type: string
  wallet_address: string
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
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false)
  const [selectedWithdrawal, setSelectedWithdrawal] = useState<Withdrawal | null>(null)
  const [rejectReason, setRejectReason] = useState("")
  const [filter, setFilter] = useState<"all" | "pending" | "approved" | "rejected">("all")
  const [copiedId, setCopiedId] = useState<string | null>(null)

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

  const handleApprove = async (withdrawal: Withdrawal) => {
    try {
      setActionLoading(withdrawal.id)
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // 1. Update transaction status to approved
      const { error: txError } = await supabase
        .from("transactions")
        .update({
          status: "approved",
          approved_by: user.id,
          approved_at: new Date().toISOString(),
          admin_notes: "Withdrawal approved by admin",
          updated_at: new Date().toISOString(),
        })
        .eq("id", withdrawal.id)

      if (txError) {
        console.error("Transaction update error:", txError)
        alert(`Failed to approve: ${txError.message}`)
        return
      }

      // 2. Deduct from user's balance (profit first, then deposit)
      const withdrawAmount = Number(withdrawal.amount)
      const userProfit = Number(withdrawal.users?.balance_profit || 0)
      const userDeposit = Number(withdrawal.users?.balance_deposit || 0)

      let newProfit = userProfit
      let newDeposit = userDeposit
      let remaining = withdrawAmount

      // Deduct from profit balance first
      if (remaining > 0 && newProfit > 0) {
        const deductFromProfit = Math.min(remaining, newProfit)
        newProfit -= deductFromProfit
        remaining -= deductFromProfit
      }

      // Then deduct from deposit balance
      if (remaining > 0 && newDeposit > 0) {
        const deductFromDeposit = Math.min(remaining, newDeposit)
        newDeposit -= deductFromDeposit
        remaining -= deductFromDeposit
      }

      const { error: balanceError } = await supabase
        .from("users")
        .update({
          balance_profit: newProfit,
          balance_deposit: newDeposit,
          updated_at: new Date().toISOString(),
        })
        .eq("id", withdrawal.user_id)

      if (balanceError) {
        console.error("Balance deduction error:", balanceError)
        alert(`Withdrawal approved but balance deduction failed: ${balanceError.message}`)
      }

      // 3. Send notification to user
      await supabase.from("notifications").insert({
        user_id: withdrawal.user_id,
        title: "Withdrawal Approved",
        message: `Your withdrawal of $${withdrawAmount.toLocaleString()} via ${withdrawal.crypto_type} has been approved and is being processed.`,
        type: "success",
      })

      fetchWithdrawals()
    } catch (err: any) {
      console.error("Approve error:", err)
      alert(err.message || "Failed to approve withdrawal")
    } finally {
      setActionLoading(null)
    }
  }

  const handleReject = async () => {
    if (!selectedWithdrawal) return

    try {
      setActionLoading(selectedWithdrawal.id)
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { error: txError } = await supabase
        .from("transactions")
        .update({
          status: "rejected",
          approved_by: user.id,
          approved_at: new Date().toISOString(),
          admin_notes: rejectReason || "Withdrawal rejected by admin",
          updated_at: new Date().toISOString(),
        })
        .eq("id", selectedWithdrawal.id)

      if (txError) {
        console.error("Transaction reject error:", txError)
        alert(`Failed to reject: ${txError.message}`)
        return
      }

      // Notify user
      await supabase.from("notifications").insert({
        user_id: selectedWithdrawal.user_id,
        title: "Withdrawal Rejected",
        message: `Your withdrawal of $${Number(selectedWithdrawal.amount).toLocaleString()} has been rejected. ${rejectReason ? `Reason: ${rejectReason}` : "Please contact support for details."}`,
        type: "error",
      })

      setRejectDialogOpen(false)
      setSelectedWithdrawal(null)
      setRejectReason("")
      fetchWithdrawals()
    } catch (err: any) {
      console.error("Reject error:", err)
      alert(err.message || "Failed to reject withdrawal")
    } finally {
      setActionLoading(null)
    }
  }

  const openRejectDialog = (withdrawal: Withdrawal) => {
    setSelectedWithdrawal(withdrawal)
    setRejectReason("")
    setRejectDialogOpen(true)
  }

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  // Filtered data
  const filteredWithdrawals = filter === "all"
    ? withdrawals
    : withdrawals.filter(w => w.status === filter)

  const pendingCount = withdrawals.filter(w => w.status === "pending").length
  const approvedCount = withdrawals.filter(w => w.status === "approved").length
  const rejectedCount = withdrawals.filter(w => w.status === "rejected").length
  const totalPendingAmount = withdrawals
    .filter(w => w.status === "pending")
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
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
          <ArrowUpFromLine className="h-6 w-6 text-primary" /> Withdrawal Management
        </h1>
        <p className="text-sm text-muted-foreground">
          Review, approve, or reject user withdrawal requests. Balance is deducted upon approval.
        </p>
      </div>

      {/* KPI Summary */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-border/60 bg-card/60 backdrop-blur-md">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Requests</CardTitle>
            <Wallet className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{withdrawals.length}</div>
          </CardContent>
        </Card>

        <Card className="border-border/60 bg-card/60 backdrop-blur-md">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pending Review</CardTitle>
            <Clock className="h-4 w-4 text-amber-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-400">{pendingCount}</div>
            <p className="text-xs text-muted-foreground mt-1">${totalPendingAmount.toLocaleString()} total</p>
          </CardContent>
        </Card>

        <Card className="border-border/60 bg-card/60 backdrop-blur-md">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Approved</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-400">{approvedCount}</div>
          </CardContent>
        </Card>

        <Card className="border-border/60 bg-card/60 backdrop-blur-md">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Rejected</CardTitle>
            <XCircle className="h-4 w-4 text-red-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-400">{rejectedCount}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filter Buttons */}
      <div className="flex gap-2">
        {(["all", "pending", "approved", "rejected"] as const).map((f) => (
          <Button
            key={f}
            size="sm"
            variant={filter === f ? "default" : "outline"}
            onClick={() => setFilter(f)}
            className="capitalize"
          >
            {f} {f === "pending" && pendingCount > 0 && `(${pendingCount})`}
          </Button>
        ))}
      </div>

      {/* Withdrawals Table */}
      <Card className="border-border/60 bg-card/60 backdrop-blur-md">
        <CardHeader>
          <CardTitle className="text-base">
            {filter === "all" ? "All" : filter.charAt(0).toUpperCase() + filter.slice(1)} Withdrawals ({filteredWithdrawals.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center p-12 text-muted-foreground">
              <Loader2 className="h-6 w-6 animate-spin mr-2" /> Loading withdrawals...
            </div>
          ) : filteredWithdrawals.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">
              No {filter === "all" ? "" : filter} withdrawal requests found.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border text-left text-xs text-muted-foreground">
                    <th className="pb-3 font-medium">User</th>
                    <th className="pb-3 font-medium">Amount</th>
                    <th className="pb-3 font-medium">Method</th>
                    <th className="pb-3 font-medium">Wallet Address</th>
                    <th className="pb-3 font-medium">Status</th>
                    <th className="pb-3 font-medium">Date</th>
                    <th className="pb-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredWithdrawals.map((withdrawal) => (
                    <tr key={withdrawal.id} className="border-b border-border/40 text-sm">
                      <td className="py-4">
                        <p className="font-medium text-foreground">{withdrawal.users?.full_name || "Unknown"}</p>
                        <p className="text-xs text-muted-foreground">{withdrawal.users?.email || "—"}</p>
                      </td>
                      <td className="py-4 font-bold text-foreground">
                        ${Number(withdrawal.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-4">
                        <Badge variant="outline" className="font-mono text-xs">{withdrawal.crypto_type || "N/A"}</Badge>
                      </td>
                      <td className="py-4 max-w-[200px]">
                        {withdrawal.wallet_address ? (
                          <button
                            className="flex items-center gap-1 text-xs font-mono text-muted-foreground hover:text-foreground transition-colors truncate max-w-full"
                            onClick={() => copyToClipboard(withdrawal.wallet_address, withdrawal.id)}
                            title="Click to copy"
                          >
                            <span className="truncate">{withdrawal.wallet_address}</span>
                            <Copy className="h-3 w-3 flex-shrink-0" />
                            {copiedId === withdrawal.id && <span className="text-emerald-400 text-[10px]">Copied!</span>}
                          </button>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="py-4">{getStatusBadge(withdrawal.status)}</td>
                      <td className="py-4 text-xs text-muted-foreground whitespace-nowrap">
                        {new Date(withdrawal.created_at).toLocaleDateString()}
                        <br />
                        <span className="text-[10px]">{new Date(withdrawal.created_at).toLocaleTimeString()}</span>
                      </td>
                      <td className="py-4">
                        {withdrawal.status === "pending" ? (
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              className="h-8 bg-emerald-600 hover:bg-emerald-500 text-white gap-1"
                              disabled={actionLoading === withdrawal.id}
                              onClick={() => handleApprove(withdrawal)}
                            >
                              {actionLoading === withdrawal.id ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <CheckCircle2 className="h-3.5 w-3.5" />
                              )}
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-8 border-red-500/40 text-red-400 hover:bg-red-500/10 gap-1"
                              disabled={actionLoading === withdrawal.id}
                              onClick={() => openRejectDialog(withdrawal)}
                            >
                              <XCircle className="h-3.5 w-3.5" />
                              Reject
                            </Button>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground italic">
                            {withdrawal.admin_notes || "Processed"}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Reject Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-400">
              <AlertCircle className="h-5 w-5" /> Reject Withdrawal
            </DialogTitle>
            <DialogDescription>
              Rejecting ${selectedWithdrawal ? Number(selectedWithdrawal.amount).toLocaleString() : "0"} withdrawal from{" "}
              {selectedWithdrawal?.users?.full_name || "user"}. The user will be notified.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Rejection Reason (optional)</Label>
              <Textarea
                placeholder="e.g. Insufficient verification, suspicious activity, incorrect wallet address..."
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                rows={3}
              />
            </div>

            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                className="bg-red-600 hover:bg-red-500 text-white gap-2"
                disabled={actionLoading === selectedWithdrawal?.id}
                onClick={handleReject}
              >
                {actionLoading === selectedWithdrawal?.id && <Loader2 className="h-4 w-4 animate-spin" />}
                Confirm Rejection
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
