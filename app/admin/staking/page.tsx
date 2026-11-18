"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Plus, Pencil, Trash2, Coins, Lock, Save } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

interface StakingPool {
  id: string
  token: string
  name: string
  apy_rate: number
  min_stake: number
  max_stake: number
  lock_period_days: number
  description: string
  is_active: boolean
  created_at: string
}

interface UserStake {
  id: string
  user_id: string
  pool_id: string
  amount: number
  current_rewards: number
  current_loss: number
  status: string
  staked_at: string
  unlock_date: string
  users: { full_name: string; email: string }
  staking_pools: { name: string; token: string }
}

export default function AdminStakingPage() {
  const [pools, setPools] = useState<StakingPool[]>([])
  const [stakes, setStakes] = useState<UserStake[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingPool, setEditingPool] = useState<StakingPool | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [editingField, setEditingField] = useState<string | null>(null)
  const [editFieldValue, setEditFieldValue] = useState("")
  const [formData, setFormData] = useState({
    token: "ETH",
    name: "",
    apy_rate: "12.00",
    min_stake: "2000",
    max_stake: "100000",
    lock_period_days: "30",
    description: "",
  })

  useEffect(() => {
    fetchPools()
    fetchStakes()
  }, [])

  const fetchPools = async () => {
    const supabase = createClient()
    const { data } = await supabase.from("staking_pools").select("*").order("created_at", { ascending: false })
    if (data) setPools(data)
  }

  const fetchStakes = async () => {
    const supabase = createClient()
    const { data } = await supabase
      .from("user_stakes")
      .select("*, users(full_name, email), staking_pools(name, token)")
      .order("created_at", { ascending: false })
    if (data) setStakes(data as UserStake[])
  }

  const handleOpenDialog = (pool?: StakingPool) => {
    if (pool) {
      setEditingPool(pool)
      setFormData({
        token: pool.token,
        name: pool.name,
        apy_rate: pool.apy_rate.toString(),
        min_stake: pool.min_stake.toString(),
        max_stake: pool.max_stake.toString(),
        lock_period_days: pool.lock_period_days.toString(),
        description: pool.description || "",
      })
    } else {
      setEditingPool(null)
      setFormData({
        token: "ETH",
        name: "",
        apy_rate: "12.00",
        min_stake: "2000",
        max_stake: "100000",
        lock_period_days: "30",
        description: "",
      })
    }
    setIsDialogOpen(true)
  }

  const handleSubmit = async () => {
    setIsSubmitting(true)
    try {
      const supabase = createClient()
      const poolData = {
        token: formData.token,
        name: formData.name,
        apy_rate: parseFloat(formData.apy_rate),
        min_stake: parseFloat(formData.min_stake),
        max_stake: parseFloat(formData.max_stake),
        lock_period_days: parseInt(formData.lock_period_days),
        description: formData.description,
      }

      if (editingPool) {
        await supabase.from("staking_pools").update(poolData).eq("id", editingPool.id)
      } else {
        await supabase.from("staking_pools").insert({ ...poolData, is_active: true })
      }

      setIsDialogOpen(false)
      fetchPools()
    } catch (error) {
      console.error("Error:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleToggleActive = async (pool: StakingPool) => {
    const supabase = createClient()
    await supabase.from("staking_pools").update({ is_active: !pool.is_active }).eq("id", pool.id)
    fetchPools()
  }

  const handleDeletePool = async (pool: StakingPool) => {
    if (!confirm("Delete this staking pool?")) return
    const supabase = createClient()
    await supabase.from("staking_pools").delete().eq("id", pool.id)
    fetchPools()
  }

  const handleSaveField = async (stakeId: string, field: string) => {
    const supabase = createClient()
    await supabase
      .from("user_stakes")
      .update({ [field]: parseFloat(editFieldValue) })
      .eq("id", stakeId)
    setEditingField(null)
    fetchStakes()
  }

  const handleStakeStatus = async (stake: UserStake, newStatus: string) => {
    const supabase = createClient()
    await supabase.from("user_stakes").update({ status: newStatus }).eq("id", stake.id)
    fetchStakes()
  }

  const tokens = ["ETH", "SOL", "ADA", "DOT", "MATIC", "AVAX", "XRP"]

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
              <Coins className="h-8 w-8 text-indigo-500" />
              Staking Management
            </h1>
            <p className="mt-1 text-muted-foreground">Create staking pools and manage user stakes</p>
          </div>
          <Button onClick={() => handleOpenDialog()}>
            <Plus className="mr-2 h-4 w-4" /> Add Staking Pool
          </Button>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <Coins className="h-8 w-8 text-indigo-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Total Pools</p>
                  <p className="text-2xl font-bold">{pools.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <Lock className="h-8 w-8 text-green-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Active Stakes</p>
                  <p className="text-2xl font-bold">{stakes.filter(s => s.status === "active").length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <Coins className="h-8 w-8 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">Total Staked</p>
                  <p className="text-2xl font-bold">${stakes.reduce((s, st) => s + st.amount, 0).toFixed(2)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="pools">
          <TabsList>
            <TabsTrigger value="pools">Staking Pools</TabsTrigger>
            <TabsTrigger value="stakes">User Stakes ({stakes.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="pools">
            <Card>
              <CardHeader><CardTitle>Staking Pools</CardTitle></CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Token</TableHead>
                      <TableHead>APY</TableHead>
                      <TableHead>Min Stake</TableHead>
                      <TableHead>Lock Period</TableHead>
                      <TableHead>Active</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pools.map((pool) => (
                      <TableRow key={pool.id}>
                        <TableCell className="font-medium">{pool.name}</TableCell>
                        <TableCell><Badge variant="outline">{pool.token}</Badge></TableCell>
                        <TableCell className="text-green-500 font-medium">{pool.apy_rate}%</TableCell>
                        <TableCell>${pool.min_stake.toLocaleString()}</TableCell>
                        <TableCell>{pool.lock_period_days}d</TableCell>
                        <TableCell>
                          <Switch checked={pool.is_active} onCheckedChange={() => handleToggleActive(pool)} />
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline" onClick={() => handleOpenDialog(pool)}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="destructive" onClick={() => handleDeletePool(pool)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                    {pools.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                          No staking pools created yet.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="stakes">
            <Card>
              <CardHeader><CardTitle>User Stakes</CardTitle></CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Pool</TableHead>
                      <TableHead>Token</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Rewards</TableHead>
                      <TableHead>Loss</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Unlock Date</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {stakes.map((stake) => {
                      const renderEditable = (field: string, value: number, colorClass: string) => {
                        const key = `${stake.id}-${field}`
                        if (editingField === key) {
                          return (
                            <div className="flex items-center gap-1">
                              <Input
                                type="number"
                                step="0.01"
                                value={editFieldValue}
                                onChange={(e) => setEditFieldValue(e.target.value)}
                                className="w-24 h-8"
                              />
                              <Button size="sm" variant="ghost" onClick={() => handleSaveField(stake.id, field)}>
                                <Save className="h-3 w-3" />
                              </Button>
                            </div>
                          )
                        }
                        return (
                          <span
                            className={`${colorClass} font-medium cursor-pointer hover:underline`}
                            onClick={() => {
                              setEditingField(key)
                              setEditFieldValue((value || 0).toString())
                            }}
                          >
                            ${(value || 0).toFixed(2)}
                          </span>
                        )
                      }
                      return (
                        <TableRow key={stake.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium">{stake.users?.full_name}</p>
                              <p className="text-xs text-muted-foreground">{stake.users?.email}</p>
                            </div>
                          </TableCell>
                          <TableCell>{stake.staking_pools?.name}</TableCell>
                          <TableCell><Badge variant="outline">{stake.staking_pools?.token}</Badge></TableCell>
                          <TableCell className="font-medium">${stake.amount.toFixed(2)}</TableCell>
                          <TableCell>{renderEditable("current_rewards", stake.current_rewards, "text-green-500")}</TableCell>
                          <TableCell>{renderEditable("current_loss", stake.current_loss, "text-red-500")}</TableCell>
                          <TableCell>
                            <Select value={stake.status} onValueChange={(v) => handleStakeStatus(stake, v)}>
                              <SelectTrigger className="w-28 h-8"><SelectValue /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="active">Active</SelectItem>
                                <SelectItem value="completed">Completed</SelectItem>
                                <SelectItem value="unstaking">Unstaking</SelectItem>
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell className="text-sm">
                            {stake.unlock_date ? new Date(stake.unlock_date).toLocaleDateString() : "—"}
                          </TableCell>
                          <TableCell>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setEditingField(`${stake.id}-current_rewards`)
                                setEditFieldValue(stake.current_rewards.toString())
                              }}
                            >
                              <Pencil className="h-3 w-3" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                    {stakes.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={9} className="text-center text-muted-foreground py-8">
                          No active stakes yet.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Add/Edit Pool Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingPool ? "Edit Staking Pool" : "Create Staking Pool"}</DialogTitle>
              <DialogDescription>
                {editingPool ? "Update the staking pool details." : "Create a new staking pool for users."}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Token</Label>
                  <Select value={formData.token} onValueChange={(v) => setFormData({ ...formData, token: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {tokens.map((t) => (
                        <SelectItem key={t} value={t}>{t}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Pool Name</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. ETH Validator Yield"
                  />
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>APY Rate (%)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.apy_rate}
                    onChange={(e) => setFormData({ ...formData, apy_rate: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Lock Period (Days)</Label>
                  <Input
                    type="number"
                    value={formData.lock_period_days}
                    onChange={(e) => setFormData({ ...formData, lock_period_days: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Min Stake ($)</Label>
                  <Input
                    type="number"
                    value={formData.min_stake}
                    onChange={(e) => setFormData({ ...formData, min_stake: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Max Stake ($)</Label>
                  <Input
                    type="number"
                    value={formData.max_stake}
                    onChange={(e) => setFormData({ ...formData, max_stake: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe this staking pool..."
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleSubmit} disabled={isSubmitting}>
                {isSubmitting ? "Saving..." : editingPool ? "Update Pool" : "Create Pool"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
