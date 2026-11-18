"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { Search, UserPlus, Trash2, AlertCircle, Loader2, RefreshCw } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface UserRecord {
  id: string
  full_name: string
  email: string
  country: string
  account_status: string
  balance_deposit: number
  balance_profit: number
  balance_bonus: number
  created_at: string
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")

  // Delete modal state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [userToDelete, setUserToDelete] = useState<UserRecord | null>(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const supabase = createClient()
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .order("created_at", { ascending: false })

      if (error) {
        console.error("Error fetching users:", error)
        return
      }

      if (data) setUsers(data as UserRecord[])
    } catch (err) {
      console.error("Failed to load users:", err)
    } finally {
      setLoading(false)
    }
  }

  const promptDeleteUser = (user: UserRecord) => {
    setUserToDelete(user)
    setDeleteDialogOpen(true)
  }

  const handleDeleteUser = async () => {
    if (!userToDelete) return

    try {
      setDeleting(true)
      const res = await fetch(`/api/admin/users/${userToDelete.id}`, {
        method: "DELETE",
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || "Failed to delete user")
      }

      // Remove deleted user from state
      setUsers((prev) => prev.filter((u) => u.id !== userToDelete.id))
      setDeleteDialogOpen(false)
      setUserToDelete(null)
    } catch (err: any) {
      alert(err.message || "Failed to delete user")
    } finally {
      setDeleting(false)
    }
  }

  // Filter users by search query and status
  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      (u.full_name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.email || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.country || "").toLowerCase().includes(searchQuery.toLowerCase())

    const matchesStatus =
      statusFilter === "all" ? true : u.account_status === statusFilter

    return matchesSearch && matchesStatus
  })

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">User Management</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Manage client accounts, view balances, configure permissions, and manage access.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={fetchUsers} disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>
        </div>

        {/* Search & Filters */}
        <Card className="border-border/60 bg-card/60 backdrop-blur-md">
          <CardContent className="p-4 flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by name, email, or country..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              {(["all", "active", "blocked", "pending"] as const).map((st) => (
                <Button
                  key={st}
                  variant={statusFilter === st ? "default" : "outline"}
                  size="sm"
                  onClick={() => setStatusFilter(st)}
                  className="capitalize text-xs"
                >
                  {st}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Users Table */}
        <Card className="border-border/60 bg-card/60 backdrop-blur-md">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-base font-bold">
              All Users ({filteredUsers.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center p-12 text-muted-foreground">
                <Loader2 className="h-6 w-6 animate-spin mr-2" /> Loading users...
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground text-sm">
                No users found matching your criteria.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border text-left text-xs font-medium text-muted-foreground">
                      <th className="pb-3 font-medium">Name</th>
                      <th className="pb-3 font-medium">Email</th>
                      <th className="pb-3 font-medium">Country</th>
                      <th className="pb-3 font-medium">Total Balance</th>
                      <th className="pb-3 font-medium">Status</th>
                      <th className="pb-3 font-medium text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((u) => {
                      const totalBalance =
                        (Number(u.balance_deposit) || 0) +
                        (Number(u.balance_profit) || 0) +
                        (Number(u.balance_bonus) || 0)

                      return (
                        <tr key={u.id} className="border-b border-border/40 text-sm hover:bg-muted/20 transition-colors">
                          <td className="py-4 font-medium text-foreground">
                            {u.full_name || "Unnamed User"}
                          </td>
                          <td className="py-4 text-muted-foreground">{u.email}</td>
                          <td className="py-4 text-muted-foreground">{u.country || "N/A"}</td>
                          <td className="py-4 font-bold text-foreground">
                            ${totalBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </td>
                          <td className="py-4">
                            <Badge
                              variant="outline"
                              className={
                                u.account_status === "active"
                                  ? "border-emerald-500/40 text-emerald-400 bg-emerald-500/10"
                                  : u.account_status === "blocked"
                                    ? "border-red-500/40 text-red-400 bg-red-500/10"
                                    : "border-amber-500/40 text-amber-400 bg-amber-500/10"
                              }
                            >
                              {u.account_status}
                            </Badge>
                          </td>
                          <td className="py-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button variant="ghost" size="sm" asChild>
                                <Link href={`/admin/users/${u.id}`}>Manage</Link>
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-8 border-red-500/30 text-red-400 hover:bg-red-500/10 hover:text-red-300"
                                onClick={() => promptDeleteUser(u)}
                                title="Delete user"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
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
      </div>

      {/* Delete User Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-400">
              <AlertCircle className="h-5 w-5" /> Delete User Account
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete <strong className="text-foreground">{userToDelete?.full_name}</strong> ({userToDelete?.email})?
              This action is permanent and will remove all associated user data, balances, trades, and portfolio history.
            </DialogDescription>
          </DialogHeader>

          <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-3 text-xs text-red-300 space-y-1 my-2">
            <p className="font-semibold">Warning:</p>
            <p>This operation cannot be undone. Make sure you intend to remove this user from the system.</p>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)} disabled={deleting}>
              Cancel
            </Button>
            <Button
              className="bg-red-600 hover:bg-red-500 text-white gap-2"
              onClick={handleDeleteUser}
              disabled={deleting}
            >
              {deleting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4" /> Permanently Delete User
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
