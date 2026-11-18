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
import { Plus, Pencil, Trash2, Cpu, Zap, Save, Server, ShieldAlert } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

interface MiningPlan {
  id: string
  name: string
  coin: string
  hashrate: string
  min_amount: number
  max_amount: number
  daily_return_rate: number
  duration_days: number
  description: string
  is_active: boolean
  created_at: string
}

interface UserMining {
  id: string
  user_id: string
  plan_id: string
  amount: number
  current_earnings: number
  current_loss: number
  status: string
  start_date: string
  end_date: string
  users: { full_name: string; email: string }
  mining_plans: { name: string; hashrate: string }
}

interface MiningServer {
  id: string
  name: string
  specs: string
  hashrate: string
  monthly_cost: number
  quarterly_cost: number
  daily_return_rate: number
  description: string
  image_url: string
  is_active: boolean
  created_at: string
}

interface UserServerRental {
  id: string
  user_id: string
  server_id: string
  rental_period: string
  cost: number
  current_earnings: number
  current_loss: number
  status: string
  start_date: string
  end_date: string
  created_at: string
  users: { full_name: string; email: string }
  mining_servers: { name: string; specs: string; hashrate: string }
}

export default function AdminMiningPage() {
  const [plans, setPlans] = useState<MiningPlan[]>([])
  const [miners, setMiners] = useState<UserMining[]>([])
  const [servers, setServers] = useState<MiningServer[]>([])
  const [rentals, setRentals] = useState<UserServerRental[]>([])

  // Modal and dialog toggles
  const [isPlanDialogOpen, setIsPlanDialogOpen] = useState(false)
  const [editingPlan, setEditingPlan] = useState<MiningPlan | null>(null)
  
  const [isServerDialogOpen, setIsServerDialogOpen] = useState(false)
  const [editingServer, setEditingServer] = useState<MiningServer | null>(null)

  const [isSubmitting, setIsSubmitting] = useState(false)

  // Inline editing state
  const [editingField, setEditingField] = useState<string | null>(null)
  const [editFieldValue, setEditFieldValue] = useState("")

  // Form states
  const [planFormData, setPlanFormData] = useState({
    name: "",
    coin: "BTC",
    hashrate: "50 TH/s",
    min_amount: "2000",
    max_amount: "50000",
    daily_return_rate: "0.50",
    duration_days: "30",
    description: "",
  })

  const [serverFormData, setServerFormData] = useState({
    name: "",
    specs: "",
    hashrate: "",
    monthly_cost: "3500",
    quarterly_cost: "9000",
    daily_return_rate: "0.65",
    description: "",
    image_url: "",
  })

  useEffect(() => {
    fetchPlans()
    fetchMiners()
    fetchServers()
    fetchRentals()
  }, [])

  const fetchPlans = async () => {
    const supabase = createClient()
    const { data } = await supabase.from("mining_plans").select("*").order("created_at", { ascending: false })
    if (data) setPlans(data)
  }

  const fetchMiners = async () => {
    const supabase = createClient()
    const { data } = await supabase
      .from("user_mining")
      .select("*, users(full_name, email), mining_plans(name, hashrate)")
      .order("created_at", { ascending: false })
    if (data) setMiners(data as UserMining[])
  }

  const fetchServers = async () => {
    const supabase = createClient()
    const { data } = await supabase.from("mining_servers").select("*").order("created_at", { ascending: false })
    if (data) setServers(data)
  }

  const fetchRentals = async () => {
    const supabase = createClient()
    const { data } = await supabase
      .from("user_server_rentals")
      .select("*, users(full_name, email), mining_servers(name, specs, hashrate)")
      .order("created_at", { ascending: false })
    if (data) setRentals(data as any[])
  }

  const handleOpenPlanDialog = (plan?: MiningPlan) => {
    if (plan) {
      setEditingPlan(plan)
      setPlanFormData({
        name: plan.name,
        coin: plan.coin,
        hashrate: plan.hashrate,
        min_amount: plan.min_amount.toString(),
        max_amount: plan.max_amount.toString(),
        daily_return_rate: plan.daily_return_rate.toString(),
        duration_days: plan.duration_days.toString(),
        description: plan.description || "",
      })
    } else {
      setEditingPlan(null)
      setPlanFormData({
        name: "",
        coin: "BTC",
        hashrate: "50 TH/s",
        min_amount: "2000",
        max_amount: "50000",
        daily_return_rate: "0.50",
        duration_days: "30",
        description: "",
      })
    }
    setIsPlanDialogOpen(true)
  }

  const handlePlanSubmit = async () => {
    setIsSubmitting(true)
    try {
      const supabase = createClient()
      const planData = {
        name: planFormData.name,
        coin: planFormData.coin,
        hashrate: planFormData.hashrate,
        min_amount: parseFloat(planFormData.min_amount),
        max_amount: parseFloat(planFormData.max_amount),
        daily_return_rate: parseFloat(planFormData.daily_return_rate),
        duration_days: parseInt(planFormData.duration_days),
        description: planFormData.description,
      }

      if (editingPlan) {
        await supabase.from("mining_plans").update(planData).eq("id", editingPlan.id)
      } else {
        await supabase.from("mining_plans").insert({ ...planData, is_active: true })
      }

      setIsPlanDialogOpen(false)
      fetchPlans()
    } catch (error) {
      console.error("Error saving plan:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleOpenServerDialog = (server?: MiningServer) => {
    if (server) {
      setEditingServer(server)
      setServerFormData({
        name: server.name,
        specs: server.specs,
        hashrate: server.hashrate,
        monthly_cost: server.monthly_cost.toString(),
        quarterly_cost: server.quarterly_cost.toString(),
        daily_return_rate: server.daily_return_rate.toString(),
        description: server.description || "",
        image_url: server.image_url || "",
      })
    } else {
      setEditingServer(null)
      setServerFormData({
        name: "",
        specs: "",
        hashrate: "",
        monthly_cost: "3500",
        quarterly_cost: "9000",
        daily_return_rate: "0.65",
        description: "",
        image_url: "",
      })
    }
    setIsServerDialogOpen(true)
  }

  const handleServerSubmit = async () => {
    setIsSubmitting(true)
    try {
      const supabase = createClient()
      const serverData = {
        name: serverFormData.name,
        specs: serverFormData.specs,
        hashrate: serverFormData.hashrate,
        monthly_cost: parseFloat(serverFormData.monthly_cost),
        quarterly_cost: parseFloat(serverFormData.quarterly_cost),
        daily_return_rate: parseFloat(serverFormData.daily_return_rate),
        description: serverFormData.description,
        image_url: serverFormData.image_url,
      }

      if (editingServer) {
        await supabase.from("mining_servers").update(serverData).eq("id", editingServer.id)
      } else {
        await supabase.from("mining_servers").insert({ ...serverData, is_active: true })
      }

      setIsServerDialogOpen(false)
      fetchServers()
    } catch (error) {
      console.error("Error saving server:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleTogglePlanActive = async (plan: MiningPlan) => {
    const supabase = createClient()
    await supabase.from("mining_plans").update({ is_active: !plan.is_active }).eq("id", plan.id)
    fetchPlans()
  }

  const handleToggleServerActive = async (server: MiningServer) => {
    const supabase = createClient()
    await supabase.from("mining_servers").update({ is_active: !server.is_active }).eq("id", server.id)
    fetchServers()
  }

  const handleDeletePlan = async (plan: MiningPlan) => {
    if (!confirm("Delete this mining plan?")) return
    const supabase = createClient()
    await supabase.from("mining_plans").delete().eq("id", plan.id)
    fetchPlans()
  }

  const handleDeleteServer = async (server: MiningServer) => {
    if (!confirm(`Are you sure you want to delete ${server.name}?`)) return
    const supabase = createClient()
    await supabase.from("mining_servers").delete().eq("id", server.id)
    fetchServers()
  }

  const handleSaveMinerField = async (minerId: string, field: string) => {
    const supabase = createClient()
    await supabase
      .from("user_mining")
      .update({ [field]: parseFloat(editFieldValue) })
      .eq("id", minerId)
    setEditingField(null)
    fetchMiners()
  }

  const handleSaveRentalField = async (rentalId: string, field: string) => {
    const supabase = createClient()
    await supabase
      .from("user_server_rentals")
      .update({ [field]: parseFloat(editFieldValue) })
      .eq("id", rentalId)
    setEditingField(null)
    fetchRentals()
  }

  const handleMinerStatus = async (miner: UserMining, newStatus: string) => {
    const supabase = createClient()
    await supabase.from("user_mining").update({ status: newStatus }).eq("id", miner.id)
    fetchMiners()
  }

  const handleRentalStatus = async (rentalId: string, newStatus: string) => {
    const supabase = createClient()
    await supabase.from("user_server_rentals").update({ status: newStatus }).eq("id", rentalId)
    fetchRentals()
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
              <Cpu className="h-8 w-8 text-amber-500" />
              Mining & Compute Management
            </h1>
            <p className="mt-1 text-muted-foreground">Manage cloud miners, physical server inventory, and user rental nodes</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => handleOpenServerDialog()}>
              <Plus className="mr-2 h-4 w-4" /> Add Server Rig
            </Button>
            <Button onClick={() => handleOpenPlanDialog()}>
              <Plus className="mr-2 h-4 w-4" /> Add Mining Plan
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <Cpu className="h-8 w-8 text-amber-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Mining Plans</p>
                  <p className="text-2xl font-bold">{plans.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <Server className="h-8 w-8 text-blue-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Server Tiers</p>
                  <p className="text-2xl font-bold">{servers.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <Zap className="h-8 w-8 text-green-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Active Miners</p>
                  <p className="text-2xl font-bold">{miners.filter(m => m.status === "active").length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <Server className="h-8 w-8 text-purple-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Active Server Rentals</p>
                  <p className="text-2xl font-bold">{rentals.filter(r => r.status === "active").length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="plans">
          <TabsList className="bg-card border border-border">
            <TabsTrigger value="plans">Mining Plans</TabsTrigger>
            <TabsTrigger value="miners">User Miners ({miners.length})</TabsTrigger>
            <TabsTrigger value="servers">Server Inventory</TabsTrigger>
            <TabsTrigger value="rentals">Server Rentals ({rentals.length})</TabsTrigger>
          </TabsList>

          {/* Mining Plans Tab */}
          <TabsContent value="plans">
            <Card className="border border-border bg-card">
              <CardHeader><CardTitle>Mining Plans</CardTitle></CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Coin</TableHead>
                      <TableHead>Hashrate</TableHead>
                      <TableHead>Min Amount</TableHead>
                      <TableHead>Daily Rate</TableHead>
                      <TableHead>Duration</TableHead>
                      <TableHead>Active</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {plans.map((plan) => (
                      <TableRow key={plan.id}>
                        <TableCell className="font-medium">{plan.name}</TableCell>
                        <TableCell><Badge variant="outline">{plan.coin}</Badge></TableCell>
                        <TableCell className="text-amber-500 font-medium">{plan.hashrate}</TableCell>
                        <TableCell>${plan.min_amount.toLocaleString()}</TableCell>
                        <TableCell className="text-green-500">{plan.daily_return_rate}%</TableCell>
                        <TableCell>{plan.duration_days}d</TableCell>
                        <TableCell>
                          <Switch checked={plan.is_active} onCheckedChange={() => handleTogglePlanActive(plan)} />
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline" onClick={() => handleOpenPlanDialog(plan)}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="destructive" onClick={() => handleDeletePlan(plan)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                    {plans.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                          No mining plans created yet.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* User Miners Tab */}
          <TabsContent value="miners">
            <Card className="border border-border bg-card">
              <CardHeader><CardTitle>User Miners Portfolio</CardTitle></CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Plan</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Earnings</TableHead>
                      <TableHead>Loss</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Start Date</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {miners.map((miner) => {
                      const renderEditable = (field: string, value: number, colorClass: string) => {
                        const key = `miner-${miner.id}-${field}`
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
                              <Button size="sm" variant="ghost" onClick={() => handleSaveMinerField(miner.id, field)}>
                                <Save className="h-3 w-3" />
                              </Button>
                            </div>
                          )
                        }
                        return (
                          <span
                            className={`${colorClass} font-semibold cursor-pointer hover:underline`}
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
                        <TableRow key={miner.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium">{miner.users?.full_name}</p>
                              <p className="text-xs text-muted-foreground">{miner.users?.email}</p>
                            </div>
                          </TableCell>
                          <TableCell>{miner.mining_plans?.name}</TableCell>
                          <TableCell className="font-medium">${miner.amount.toFixed(2)}</TableCell>
                          <TableCell>{renderEditable("current_earnings", miner.current_earnings, "text-green-500")}</TableCell>
                          <TableCell>{renderEditable("current_loss", miner.current_loss, "text-red-500")}</TableCell>
                          <TableCell>
                            <Select value={miner.status} onValueChange={(v) => handleMinerStatus(miner, v)}>
                              <SelectTrigger className="w-28 h-8"><SelectValue /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="active">Active</SelectItem>
                                <SelectItem value="completed">Completed</SelectItem>
                                <SelectItem value="cancelled">Cancelled</SelectItem>
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell className="text-sm">
                            {new Date(miner.start_date).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setEditingField(`miner-${miner.id}-current_earnings`)
                                setEditFieldValue(miner.current_earnings.toString())
                              }}
                            >
                              <Pencil className="h-3 w-3" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                    {miners.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                          No active miners yet.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Server Inventory Tab */}
          <TabsContent value="servers">
            <Card className="border border-border bg-card">
              <CardHeader><CardTitle>Mining Servers Inventory</CardTitle></CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Server Name</TableHead>
                      <TableHead>Specifications</TableHead>
                      <TableHead>Hashrate Output</TableHead>
                      <TableHead>Monthly/Quarterly Cost</TableHead>
                      <TableHead>Daily Yield Rate</TableHead>
                      <TableHead>Active</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {servers.map((server) => (
                      <TableRow key={server.id}>
                        <TableCell className="font-bold flex items-center gap-3">
                          {server.image_url ? (
                            <img src={server.image_url} alt="" className="h-9 w-9 rounded-lg object-cover border border-border bg-black" />
                          ) : (
                            <Server className="h-4 w-4 text-primary" />
                          )}
                          <span>{server.name}</span>
                        </TableCell>
                        <TableCell className="text-sm max-w-xs truncate">{server.specs}</TableCell>
                        <TableCell className="text-purple-500 font-semibold">{server.hashrate}</TableCell>
                        <TableCell className="font-semibold text-foreground">
                          ${Number(server.monthly_cost).toLocaleString()} / ${Number(server.quarterly_cost).toLocaleString()}
                        </TableCell>
                        <TableCell className="text-green-500">{server.daily_return_rate}%</TableCell>
                        <TableCell>
                          <Switch checked={server.is_active} onCheckedChange={() => handleToggleServerActive(server)} />
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline" onClick={() => handleOpenServerDialog(server)}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="destructive" onClick={() => handleDeleteServer(server)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                    {servers.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                          No servers configured. Click "Add Server Rig" to register hardware.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Server Rentals Tab */}
          <TabsContent value="rentals">
            <Card className="border border-border bg-card">
              <CardHeader><CardTitle>User Compute Rentals</CardTitle></CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Rig/Server Node</TableHead>
                      <TableHead>Term</TableHead>
                      <TableHead>Cost</TableHead>
                      <TableHead>Earnings</TableHead>
                      <TableHead>Loss</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Expiry</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rentals.map((r) => {
                      const renderEditable = (field: string, value: number, colorClass: string) => {
                        const key = `rental-${r.id}-${field}`
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
                              <Button size="sm" variant="ghost" onClick={() => handleSaveRentalField(r.id, field)}>
                                <Save className="h-3 w-3" />
                              </Button>
                            </div>
                          )
                        }
                        return (
                          <span
                            className={`${colorClass} font-semibold cursor-pointer hover:underline`}
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
                        <TableRow key={r.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium">{r.users?.full_name}</p>
                              <p className="text-xs text-muted-foreground">{r.users?.email}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="font-semibold text-primary">{r.mining_servers?.name}</span>
                            <p className="text-xs text-muted-foreground truncate max-w-xs">{r.mining_servers?.specs}</p>
                          </TableCell>
                          <TableCell className="capitalize font-medium">{r.rental_period}</TableCell>
                          <TableCell className="font-semibold">${Number(r.cost).toLocaleString()}</TableCell>
                          <TableCell>{renderEditable("current_earnings", r.current_earnings, "text-green-500")}</TableCell>
                          <TableCell>{renderEditable("current_loss", r.current_loss, "text-red-500")}</TableCell>
                          <TableCell>
                            <Select value={r.status} onValueChange={(v) => handleRentalStatus(r.id, v)}>
                              <SelectTrigger className="w-28 h-8"><SelectValue /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="active">Active</SelectItem>
                                <SelectItem value="expired">Expired</SelectItem>
                                <SelectItem value="cancelled">Cancelled</SelectItem>
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell className="text-xs font-semibold text-muted-foreground">
                            {new Date(r.end_date).toLocaleDateString()}
                          </TableCell>
                        </TableRow>
                      )
                    })}
                    {rentals.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                          No servers are rented out at the moment.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Add/Edit Plan Dialog */}
        <Dialog open={isPlanDialogOpen} onOpenChange={setIsPlanDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingPlan ? "Edit Mining Plan" : "Create Mining Plan"}</DialogTitle>
              <DialogDescription>
                Configure yields and entry barriers for cloud mining plans.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Plan Name</Label>
                  <Input
                    value={planFormData.name}
                    onChange={(e) => setPlanFormData({ ...planFormData, name: e.target.value })}
                    placeholder="e.g. Starter BTC Miner"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Coin</Label>
                  <Select value={planFormData.coin} onValueChange={(v) => setPlanFormData({ ...planFormData, coin: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="BTC">Bitcoin (BTC)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Hashrate</Label>
                  <Input
                    value={planFormData.hashrate}
                    onChange={(e) => setPlanFormData({ ...planFormData, hashrate: e.target.value })}
                    placeholder="e.g. 50 TH/s"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Daily Return Rate (%)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={planFormData.daily_return_rate}
                    onChange={(e) => setPlanFormData({ ...planFormData, daily_return_rate: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label>Min Amount ($)</Label>
                  <Input
                    type="number"
                    value={planFormData.min_amount}
                    onChange={(e) => setPlanFormData({ ...planFormData, min_amount: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Max Amount ($)</Label>
                  <Input
                    type="number"
                    value={planFormData.max_amount}
                    onChange={(e) => setPlanFormData({ ...planFormData, max_amount: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Duration (Days)</Label>
                  <Input
                    type="number"
                    value={planFormData.duration_days}
                    onChange={(e) => setPlanFormData({ ...planFormData, duration_days: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  value={planFormData.description}
                  onChange={(e) => setPlanFormData({ ...planFormData, description: e.target.value })}
                  placeholder="Describe this mining plan..."
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsPlanDialogOpen(false)}>Cancel</Button>
              <Button onClick={handlePlanSubmit} disabled={isSubmitting}>
                {isSubmitting ? "Saving..." : editingPlan ? "Update Plan" : "Create Plan"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Add/Edit Server Dialog */}
        <Dialog open={isServerDialogOpen} onOpenChange={setIsServerDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingServer ? "Edit Mining Server Node" : "Register Mining Server Node"}</DialogTitle>
              <DialogDescription>
                Set specifications, pricing structure, and target return rate for rental computers.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Server/Rig Name</Label>
                  <Input
                    value={serverFormData.name}
                    onChange={(e) => setServerFormData({ ...serverFormData, name: e.target.value })}
                    placeholder="e.g. Elite Supercomputer"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Hashrate Power Allocation</Label>
                  <Input
                    value={serverFormData.hashrate}
                    onChange={(e) => setServerFormData({ ...serverFormData, hashrate: e.target.value })}
                    placeholder="e.g. 8.5 PH/s"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Specifications (GPU/CPU/RAM/Storage)</Label>
                <Input
                  value={serverFormData.specs}
                  onChange={(e) => setServerFormData({ ...serverFormData, specs: e.target.value })}
                  placeholder="e.g. 16x NVIDIA H100 SXM, 512GB RAM, 8TB NVMe"
                />
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label>Monthly Cost ($)</Label>
                  <Input
                    type="number"
                    value={serverFormData.monthly_cost}
                    onChange={(e) => setServerFormData({ ...serverFormData, monthly_cost: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Quarterly Cost ($)</Label>
                  <Input
                    type="number"
                    value={serverFormData.quarterly_cost}
                    onChange={(e) => setServerFormData({ ...serverFormData, quarterly_cost: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Daily return (%)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={serverFormData.daily_return_rate}
                    onChange={(e) => setServerFormData({ ...serverFormData, daily_return_rate: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Mock Server Image URL (optional)</Label>
                <Input
                  value={serverFormData.image_url}
                  onChange={(e) => setServerFormData({ ...serverFormData, image_url: e.target.value })}
                  placeholder="https://..."
                />
              </div>

              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  value={serverFormData.description}
                  onChange={(e) => setServerFormData({ ...serverFormData, description: e.target.value })}
                  placeholder="Rig description details..."
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsServerDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleServerSubmit} disabled={isSubmitting}>
                {isSubmitting ? "Saving Server..." : editingServer ? "Update Server" : "Register Server"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
