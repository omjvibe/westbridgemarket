"use client"

import { use, useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { useRouter } from "next/navigation"
import { Trash2, AlertCircle, Loader2, ArrowLeft, ShieldAlert } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

export default function UserDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  const [userData, setUserData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const fetchUser = async () => {
      const supabase = createClient()
      const { data } = await supabase.from("users").select("*").eq("id", resolvedParams.id).single()
      setUserData(data)
      setLoading(false)
    }
    fetchUser()
  }, [resolvedParams.id])

  const handleUpdate = async () => {
    const supabase = createClient()
    const { error } = await supabase.from("users").update(userData).eq("id", resolvedParams.id)
    if (error) {
      alert(`Update failed: ${error.message}`)
    } else {
      alert("User updated successfully")
    }
  }

  const handleDeleteUser = async () => {
    try {
      setDeleting(true)
      const res = await fetch(`/api/admin/users/${resolvedParams.id}`, {
        method: "DELETE",
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || "Failed to delete user")
      }

      alert("User deleted successfully")
      router.push("/admin/users")
    } catch (err: any) {
      alert(err.message || "Failed to delete user")
      setDeleting(false)
    }
  }

  if (loading) return <div className="p-8">Loading...</div>

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">{userData?.full_name || "User Details"}</h1>
            <p className="mt-1 text-muted-foreground">{userData?.email}</p>
          </div>
          <div className="flex items-center gap-3">
            <Button onClick={() => router.back()} variant="outline" className="gap-2">
              <ArrowLeft className="h-4 w-4" /> Back to Users
            </Button>
            <Button
              variant="outline"
              className="border-red-500/40 text-red-400 hover:bg-red-500/10 gap-2"
              onClick={() => setDeleteDialogOpen(true)}
            >
              <Trash2 className="h-4 w-4" /> Delete User
            </Button>
          </div>
        </div>

        <Tabs defaultValue="details" className="w-full">
          <TabsList>
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="balances">Balances</TabsTrigger>
            <TabsTrigger value="trading">Trading</TabsTrigger>
            <TabsTrigger value="permissions">Permissions</TabsTrigger>
            <TabsTrigger value="danger">Danger Zone</TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>User Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Full Name</Label>
                    <Input
                      value={userData?.full_name || ""}
                      onChange={(e) => setUserData({ ...userData, full_name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Email</Label>
                    <Input value={userData?.email || ""} disabled />
                  </div>
                  <div className="space-y-2">
                    <Label>Phone Number</Label>
                    <Input
                      value={userData?.phone_number || ""}
                      onChange={(e) => setUserData({ ...userData, phone_number: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Country</Label>
                    <Input value={userData?.country || ""} disabled />
                  </div>
                  <div className="space-y-2">
                    <Label>Account Status</Label>
                    <Select
                      value={userData?.account_status}
                      onValueChange={(value) => setUserData({ ...userData, account_status: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="blocked">Blocked</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Current Plan</Label>
                    <Select
                      value={userData?.current_plan}
                      onValueChange={(value) => setUserData({ ...userData, current_plan: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="basic">Basic</SelectItem>
                        <SelectItem value="silver">Silver</SelectItem>
                        <SelectItem value="gold">Gold</SelectItem>
                        <SelectItem value="platinum">Platinum</SelectItem>
                        <SelectItem value="diamond">Diamond</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <Button onClick={handleUpdate}>Save Changes</Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="balances" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Balance Management</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label>Deposit Balance</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={userData?.balance_deposit || 0}
                      onChange={(e) => setUserData({ ...userData, balance_deposit: Number.parseFloat(e.target.value) })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Profit Balance</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={userData?.balance_profit || 0}
                      onChange={(e) => setUserData({ ...userData, balance_profit: Number.parseFloat(e.target.value) })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Bonus Balance</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={userData?.balance_bonus || 0}
                      onChange={(e) => setUserData({ ...userData, balance_bonus: Number.parseFloat(e.target.value) })}
                    />
                  </div>
                </div>
                <div className="border-t border-border pt-4">
                  <p className="text-sm text-muted-foreground">Total Balance</p>
                  <p className="text-3xl font-bold text-foreground">
                    $
                    {(
                      (userData?.balance_deposit || 0) +
                      (userData?.balance_profit || 0) +
                      (userData?.balance_bonus || 0)
                    ).toFixed(2)}
                  </p>
                </div>
                <Button onClick={handleUpdate}>Update Balances</Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="trading" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Trading Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Required Trades</Label>
                    <Input
                      type="number"
                      value={userData?.required_trades || 0}
                      onChange={(e) => setUserData({ ...userData, required_trades: Number.parseInt(e.target.value) })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Completed Trades</Label>
                    <Input
                      type="number"
                      value={userData?.completed_trades || 0}
                      onChange={(e) => setUserData({ ...userData, completed_trades: Number.parseInt(e.target.value) })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Withdrawal Code</Label>
                    <Input
                      value={userData?.withdrawal_code || ""}
                      onChange={(e) => setUserData({ ...userData, withdrawal_code: e.target.value })}
                      placeholder="Optional withdrawal verification code"
                    />
                  </div>
                </div>
                <Button onClick={handleUpdate}>Save Trading Settings</Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="permissions" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>User Permissions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-foreground">Can Trade</p>
                    <p className="text-sm text-muted-foreground">Allow user to execute trades</p>
                  </div>
                  <Switch
                    checked={userData?.can_trade}
                    onCheckedChange={(checked) => setUserData({ ...userData, can_trade: checked })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-foreground">Can Withdraw</p>
                    <p className="text-sm text-muted-foreground">Allow user to withdraw funds</p>
                  </div>
                  <Switch
                    checked={userData?.can_withdraw}
                    onCheckedChange={(checked) => setUserData({ ...userData, can_withdraw: checked })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-foreground">Signal Provider</p>
                    <p className="text-sm text-muted-foreground">User can provide trading signals</p>
                  </div>
                  <Switch
                    checked={userData?.is_signal_provider}
                    onCheckedChange={(checked) => setUserData({ ...userData, is_signal_provider: checked })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-foreground">Copy Expert</p>
                    <p className="text-sm text-muted-foreground">User available for copy trading</p>
                  </div>
                  <Switch
                    checked={userData?.is_copy_expert}
                    onCheckedChange={(checked) => setUserData({ ...userData, is_copy_expert: checked })}
                  />
                </div>
                <Button onClick={handleUpdate}>Update Permissions</Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="danger" className="space-y-6">
            <Card className="border-red-500/30 bg-red-500/5">
              <CardHeader>
                <CardTitle className="text-red-400 flex items-center gap-2">
                  <ShieldAlert className="h-5 w-5" /> Danger Zone: Permanently Delete User
                </CardTitle>
                <CardDescription>
                  Permanently remove {userData?.full_name} ({userData?.email}) and purge all their balance ledgers, transaction records, and portfolio holdings.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  This action is permanent and cannot be reversed. Once deleted, the user will no longer be able to log in or access any services.
                </p>
                <Button
                  className="bg-red-600 hover:bg-red-500 text-white gap-2"
                  onClick={() => setDeleteDialogOpen(true)}
                >
                  <Trash2 className="h-4 w-4" /> Delete User Account
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Delete User Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-400">
              <AlertCircle className="h-5 w-5" /> Confirm Account Deletion
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to permanently delete <strong className="text-foreground">{userData?.full_name}</strong> ({userData?.email})?
            </DialogDescription>
          </DialogHeader>

          <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-3 text-xs text-red-300 space-y-1 my-2">
            <p className="font-semibold">Warning:</p>
            <p>This operation is immediate and irreversible.</p>
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
                  <Loader2 className="h-4 w-4 animate-spin" /> Deleting User...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4" /> Delete User Permanently
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
