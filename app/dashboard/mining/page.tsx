"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Cpu, Zap, TrendingUp, TrendingDown, Wallet, AlertCircle, CheckCircle2, Clock, DollarSign, Server, Calendar } from "lucide-react"
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
  mining_plans: MiningPlan
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
  mining_servers: MiningServer
}

interface UserData {
  balance_deposit: number
  balance_profit: number
  balance_bonus: number
}

export default function MiningPage() {
  const [plans, setPlans] = useState<MiningPlan[]>([])
  const [myMining, setMyMining] = useState<UserMining[]>([])
  const [servers, setServers] = useState<MiningServer[]>([])
  const [myRentals, setMyRentals] = useState<UserServerRental[]>([])
  const [userData, setUserData] = useState<UserData | null>(null)
  
  // Mining plan buy states
  const [selectedPlan, setSelectedPlan] = useState<MiningPlan | null>(null)
  const [investAmount, setInvestAmount] = useState("")
  const [isPlanDialogOpen, setIsPlanDialogOpen] = useState(false)

  // Server rental states
  const [selectedServer, setSelectedServer] = useState<MiningServer | null>(null)
  const [rentalPeriod, setRentalPeriod] = useState<"monthly" | "quarterly">("monthly")
  const [isServerDialogOpen, setIsServerDialogOpen] = useState(false)

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    fetchPlans()
    fetchMyMining()
    fetchServers()
    fetchMyRentals()
    fetchUserData()
  }, [])

  const fetchPlans = async () => {
    const supabase = createClient()
    const { data } = await supabase
      .from("mining_plans")
      .select("*")
      .eq("is_active", true)
      .order("min_amount", { ascending: true })
    if (data) setPlans(data)
  }

  const fetchMyMining = async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data } = await supabase
      .from("user_mining")
      .select("*, mining_plans(*)")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
    if (data) setMyMining(data as UserMining[])
  }

  const fetchServers = async () => {
    const supabase = createClient()
    const { data } = await supabase
      .from("mining_servers")
      .select("*")
      .eq("is_active", true)
      .order("monthly_cost", { ascending: true })
    if (data) setServers(data)
  }

  const fetchMyRentals = async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data } = await supabase
      .from("user_server_rentals")
      .select("*, mining_servers(*)")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
    if (data) setMyRentals(data as any[])
  }

  const fetchUserData = async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data } = await supabase
      .from("users")
      .select("balance_deposit, balance_profit, balance_bonus")
      .eq("id", user.id)
      .single()
    if (data) setUserData(data)
  }

  const totalBalance = userData
    ? (userData.balance_deposit || 0) + (userData.balance_profit || 0) + (userData.balance_bonus || 0)
    : 0

  // Combined stats
  const activeMinersCount = myMining.filter(m => m.status === "active").length
  const activeRentalsCount = myRentals.filter(r => r.status === "active").length
  const totalActiveNodes = activeMinersCount + activeRentalsCount

  const totalMiningEarnings = myMining.filter(m => m.status === "active").reduce((sum, m) => sum + (m.current_earnings || 0), 0)
  const totalRentalEarnings = myRentals.filter(r => r.status === "active").reduce((sum, r) => sum + (r.current_earnings || 0), 0)
  const totalEarnings = totalMiningEarnings + totalRentalEarnings

  const totalMiningLosses = myMining.filter(m => m.status === "active").reduce((sum, m) => sum + (m.current_loss || 0), 0)
  const totalRentalLosses = myRentals.filter(r => r.status === "active").reduce((sum, r) => sum + (r.current_loss || 0), 0)
  const totalLosses = totalMiningLosses + totalRentalLosses

  const totalMiningInvested = myMining.filter(m => m.status === "active").reduce((sum, m) => sum + m.amount, 0)
  const totalRentalInvested = myRentals.filter(r => r.status === "active").reduce((sum, r) => sum + Number(r.cost), 0)
  const totalInvested = totalMiningInvested + totalRentalInvested

  const handleSelectPlan = (plan: MiningPlan) => {
    setSelectedPlan(plan)
    setInvestAmount(plan.min_amount.toString())
    setError(null)
    setSuccess(false)
    setIsPlanDialogOpen(true)
  }

  const handleSelectServer = (server: MiningServer) => {
    setSelectedServer(server)
    setRentalPeriod("monthly")
    setError(null)
    setSuccess(false)
    setIsServerDialogOpen(true)
  }

  const handlePlanSubmit = async () => {
    if (!selectedPlan) return
    setIsSubmitting(true)
    setError(null)

    try {
      const amount = parseFloat(investAmount)
      if (isNaN(amount) || amount < selectedPlan.min_amount) {
        throw new Error(`Minimum investment is $${selectedPlan.min_amount.toLocaleString()}`)
      }
      if (amount > selectedPlan.max_amount) {
        throw new Error(`Maximum investment is $${selectedPlan.max_amount.toLocaleString()}`)
      }
      if (amount > totalBalance) {
        throw new Error("Insufficient balance. Please deposit funds first.")
      }

      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error("Please login to continue")

      const endDate = new Date()
      endDate.setDate(endDate.getDate() + selectedPlan.duration_days)

      const { error: insertError } = await supabase.from("user_mining").insert({
        user_id: user.id,
        plan_id: selectedPlan.id,
        amount,
        current_earnings: 0,
        current_loss: 0,
        status: "active",
        start_date: new Date().toISOString(),
        end_date: endDate.toISOString(),
      })
      if (insertError) throw insertError

      const { error: balanceError } = await supabase
        .from("users")
        .update({ balance_deposit: (userData?.balance_deposit || 0) - amount })
        .eq("id", user.id)
      if (balanceError) throw balanceError

      setSuccess(true)
      setIsPlanDialogOpen(false)
      fetchMyMining()
      fetchUserData()
    } catch (err: any) {
      setError(err.message || "An error occurred")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleServerRentalSubmit = async () => {
    if (!selectedServer) return
    setIsSubmitting(true)
    setError(null)

    try {
      const cost = rentalPeriod === "monthly" 
        ? Number(selectedServer.monthly_cost) 
        : Number(selectedServer.quarterly_cost)

      if (cost > totalBalance) {
        throw new Error("Insufficient balance to rent this supercomputer node.")
      }

      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error("Please login to continue")

      const endDate = new Date()
      endDate.setDate(endDate.getDate() + (rentalPeriod === "monthly" ? 30 : 90))

      const { error: insertError } = await supabase.from("user_server_rentals").insert({
        user_id: user.id,
        server_id: selectedServer.id,
        rental_period: rentalPeriod,
        cost,
        current_earnings: 0,
        current_loss: 0,
        status: "active",
        start_date: new Date().toISOString(),
        end_date: endDate.toISOString(),
      })
      if (insertError) throw insertError

      const { error: balanceError } = await supabase
        .from("users")
        .update({ balance_deposit: (userData?.balance_deposit || 0) - cost })
        .eq("id", user.id)
      if (balanceError) throw balanceError

      setSuccess(true)
      setIsServerDialogOpen(false)
      fetchMyRentals()
      fetchUserData()
    } catch (err: any) {
      setError(err.message || "An error occurred")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
              <Cpu className="h-8 w-8 text-amber-500" />
              Bitcoin Mining & Hardware Rentals
            </h1>
            <p className="mt-1 text-muted-foreground">
              Allocate cloud miners or rent specialized high-performance supercomputing servers
            </p>
          </div>
          <Card className="bg-amber-500/5 border border-amber-500/20">
            <CardContent className="p-4 flex items-center gap-3">
              <Wallet className="h-5 w-5 text-amber-500" />
              <div>
                <p className="text-sm text-muted-foreground">Available Balance</p>
                <p className="text-xl font-bold text-foreground">${totalBalance.toFixed(2)}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {success && (
          <Card className="border-green-500/50 bg-green-500/5">
            <CardContent className="flex items-center gap-3 p-4">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              <p className="text-foreground">Contract activated successfully! Your hardware has been spun up.</p>
            </CardContent>
          </Card>
        )}

        {/* Stats Overview */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card className="bg-amber-500/5 border border-amber-500/20">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-amber-500/10">
                  <Zap className="h-6 w-6 text-amber-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Active Nodes/Rigs</p>
                  <p className="text-2xl font-bold text-foreground">
                    {totalActiveNodes}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-green-500/5 border border-green-500/20">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-green-500/10">
                  <TrendingUp className="h-6 w-6 text-green-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Combined Earnings</p>
                  <p className="text-2xl font-bold text-green-500">${totalEarnings.toFixed(2)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-red-500/5 border border-red-500/20">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-red-500/10">
                  <TrendingDown className="h-6 w-6 text-red-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Losses</p>
                  <p className="text-2xl font-bold text-red-500">${totalLosses.toFixed(2)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card border border-border">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-primary/10">
                  <DollarSign className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Active Allocation</p>
                  <p className="text-2xl font-bold text-foreground">${totalInvested.toFixed(2)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="cloud">
          <TabsList className="bg-card border border-border">
            <TabsTrigger value="cloud">Cloud Mining Contracts</TabsTrigger>
            <TabsTrigger value="servers">Supercomputer Rentals</TabsTrigger>
          </TabsList>

          {/* Cloud Mining Tab */}
          <TabsContent value="cloud" className="space-y-6 pt-4">
            {/* My Active Miners */}
            {myMining.length > 0 && (
              <div className="space-y-4">
                <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
                  <Zap className="h-5 w-5 text-amber-500" />
                  My Cloud Miners
                </h2>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {myMining.map((mining) => (
                    <Card key={mining.id} className={mining.status === "active" ? "border-amber-500/30 bg-amber-500/5" : "opacity-60 border-border"}>
                      <CardContent className="p-5 space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Cpu className="h-5 w-5 text-amber-500" />
                            <span className="font-bold text-foreground">{mining.mining_plans?.name || "Mining Plan"}</span>
                          </div>
                          <Badge className={
                            mining.status === "active" ? "bg-green-500" :
                            mining.status === "completed" ? "bg-blue-500" : "bg-red-500"
                          }>
                            {mining.status}
                          </Badge>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-sm pt-2 border-t border-border/50">
                          <div>
                            <p className="text-muted-foreground text-xs">Allocated</p>
                            <p className="font-bold text-foreground">${mining.amount.toFixed(2)}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground text-xs">Net Yield P/L</p>
                            <p className={`font-bold ${((mining.current_earnings || 0) - (mining.current_loss || 0)) >= 0 ? "text-green-500" : "text-red-500"}`}>
                              ${((mining.current_earnings || 0) - (mining.current_loss || 0)).toFixed(2)}
                            </p>
                          </div>
                          <div>
                            <p className="text-muted-foreground text-xs">Hashrate</p>
                            <p className="font-medium text-foreground">{mining.mining_plans?.hashrate || "—"}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground text-xs">Term Ends</p>
                            <p className="font-medium text-foreground">
                              {mining.end_date ? new Date(mining.end_date).toLocaleDateString() : "—"}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Mining Plans */}
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-foreground">Available Mining Plans</h2>
              {plans.length > 0 ? (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {plans.map((plan) => {
                    const totalROI = plan.daily_return_rate * plan.duration_days
                    return (
                      <Card key={plan.id} className="border-border hover:border-amber-500/50 transition-all duration-300 group bg-card">
                        <CardHeader className="pb-3">
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-lg flex items-center gap-2">
                              <Cpu className="h-5 w-5 text-amber-500" />
                              {plan.name}
                            </CardTitle>
                            <Badge variant="outline" className="text-amber-500 border-amber-500/30">
                              {plan.coin}
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="p-3 rounded-lg bg-amber-500/5 border border-amber-500/10">
                            <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Hashrate</p>
                            <p className="text-2xl font-extrabold text-amber-500">{plan.hashrate}</p>
                          </div>

                          <div className="grid grid-cols-2 gap-3 text-sm">
                            <div>
                              <p className="text-muted-foreground">Daily Return</p>
                              <p className="font-bold text-green-500">{plan.daily_return_rate}%</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Duration</p>
                              <p className="font-bold text-foreground">{plan.duration_days} Days</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Total ROI</p>
                              <p className="font-bold text-green-500">{totalROI.toFixed(1)}%</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Min. Investment</p>
                              <p className="font-bold text-foreground">${plan.min_amount.toLocaleString()}</p>
                            </div>
                          </div>

                          {plan.description && (
                            <p className="text-xs text-muted-foreground line-clamp-2">{plan.description}</p>
                          )}

                          <Button
                            className="w-full bg-amber-500 hover:bg-amber-600 text-white"
                            onClick={() => handleSelectPlan(plan)}
                          >
                            <Cpu className="mr-2 h-4 w-4" />
                            Start Mining
                          </Button>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              ) : (
                <Card>
                  <CardContent className="p-8 text-center">
                    <Cpu className="mx-auto h-12 w-12 text-muted-foreground/50" />
                    <p className="mt-4 text-muted-foreground">No mining plans available at the moment.</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* Server Rentals Tab */}
          <TabsContent value="servers" className="space-y-6 pt-4">
            {/* My Active Rentals */}
            {myRentals.length > 0 && (
              <div className="space-y-4">
                <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
                  <Server className="h-5 w-5 text-primary" />
                  My Rented Servers
                </h2>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {myRentals.map((rental) => {
                    const server = rental.mining_servers
                    const earnings = Number(rental.current_earnings || 0)
                    const loss = Number(rental.current_loss || 0)
                    const netYield = earnings - loss
                    return (
                      <Card key={rental.id} className={rental.status === "active" ? "border-primary/30 bg-primary/5" : "opacity-60 border-border"}>
                        <CardContent className="p-5 space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Server className="h-5 w-5 text-primary" />
                              <span className="font-bold text-foreground">{server?.name || "Server Rental"}</span>
                            </div>
                            <Badge className={rental.status === "active" ? "bg-green-500" : "bg-muted"}>
                              {rental.status}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground truncate">{server?.specs}</p>

                          <div className="grid grid-cols-2 gap-2 text-sm pt-2 border-t border-border/50">
                            <div>
                              <p className="text-muted-foreground text-xs">Rental Cost</p>
                              <p className="font-bold text-foreground">${Number(rental.cost).toLocaleString()}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground text-xs">P/L Yield</p>
                              <p className={`font-bold ${netYield >= 0 ? "text-green-500" : "text-red-500"}`}>
                                ${netYield.toFixed(2)}
                              </p>
                            </div>
                            <div>
                              <p className="text-muted-foreground text-xs">Rental Period</p>
                              <p className="font-medium text-foreground capitalize">{rental.rental_period}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground text-xs">Contract Ends</p>
                              <p className="font-medium text-foreground">
                                {new Date(rental.end_date).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Server Inventory Grid */}
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-foreground">Supercomputer Compute Inventory</h2>
              {servers.length > 0 ? (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {servers.map((server) => (
                    <Card key={server.id} className="border-border hover:border-primary/50 transition-all duration-300 group bg-card overflow-hidden">
                      {server.image_url && (
                        <div className="h-44 w-full overflow-hidden relative bg-black/40 border-b border-border">
                          <img
                            src={server.image_url}
                            alt={server.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                          <div className="absolute top-3 right-3">
                            <Badge className="bg-black/80 text-primary border border-primary/40 font-bold backdrop-blur-md">
                              {server.hashrate}
                            </Badge>
                          </div>
                        </div>
                      )}
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-lg flex items-center gap-2">
                            <Server className="h-5 w-5 text-primary" />
                            {server.name}
                          </CardTitle>
                          {!server.image_url && (
                            <Badge variant="outline" className="text-primary border-primary/30">
                              {server.hashrate}
                            </Badge>
                          )}
                        </div>
                        <CardDescription className="text-xs font-semibold text-muted-foreground mt-1">
                          Specs: <span className="text-foreground">{server.specs}</span>
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-2 bg-primary/5 border border-primary/10 rounded-lg p-3 text-center">
                          <div>
                            <p className="text-[10px] text-muted-foreground uppercase font-bold">Monthly Cost</p>
                            <p className="text-lg font-extrabold text-primary">${Number(server.monthly_cost).toLocaleString()}</p>
                          </div>
                          <div>
                            <p className="text-[10px] text-muted-foreground uppercase font-bold">Quarterly Cost</p>
                            <p className="text-lg font-extrabold text-primary">${Number(server.quarterly_cost).toLocaleString()}</p>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div>
                            <p className="text-muted-foreground text-xs">Daily return rate</p>
                            <p className="font-bold text-green-500">~{server.daily_return_rate}%</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground text-xs">Estimated Monthly Yield</p>
                            <p className="font-bold text-green-500">~{(server.daily_return_rate * 30).toFixed(1)}%</p>
                          </div>
                        </div>

                        {server.description && (
                          <p className="text-xs text-muted-foreground line-clamp-3 leading-relaxed">{server.description}</p>
                        )}

                        <Button
                          className="w-full bg-primary hover:bg-primary/95 text-white"
                          onClick={() => handleSelectServer(server)}
                        >
                          <Server className="mr-2 h-4 w-4" />
                          Rent Compute Server
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card>
                  <CardContent className="p-8 text-center">
                    <Server className="mx-auto h-12 w-12 text-muted-foreground/50" />
                    <p className="mt-4 text-muted-foreground">No servers available for lease at the moment.</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>
        </Tabs>

        {/* Start Mining Plan Dialog */}
        <Dialog open={isPlanDialogOpen} onOpenChange={setIsPlanDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Cpu className="h-5 w-5 text-amber-500" />
                Start Mining — {selectedPlan?.name}
              </DialogTitle>
              <DialogDescription>
                Allocate capital to start your Bitcoin mining contract.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              {error && (
                <div className="flex items-center gap-2 text-destructive text-sm bg-destructive/10 p-3 rounded-lg">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  {error}
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="amountInput">Investment Amount (USD)</Label>
                <Input
                  id="amountInput"
                  type="number"
                  min={selectedPlan?.min_amount || 2000}
                  max={selectedPlan?.max_amount}
                  step="100"
                  value={investAmount}
                  onChange={(e) => setInvestAmount(e.target.value)}
                  placeholder={`Min $${selectedPlan?.min_amount.toLocaleString()}`}
                />
                <p className="text-xs text-muted-foreground">
                  Min: ${selectedPlan?.min_amount.toLocaleString()} — Max: ${selectedPlan?.max_amount.toLocaleString()}
                </p>
              </div>
              <div className="bg-muted/50 p-4 rounded-lg space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Hashrate</span>
                  <span className="font-bold text-amber-500">{selectedPlan?.hashrate}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Daily Return</span>
                  <span className="font-medium text-green-500">{selectedPlan?.daily_return_rate}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Duration</span>
                  <span className="font-medium text-foreground">{selectedPlan?.duration_days} days</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Est. Daily Earnings</span>
                  <span className="font-bold text-green-500">
                    ${((parseFloat(investAmount) || 0) * (selectedPlan?.daily_return_rate || 0) / 100).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between border-t border-border pt-2 mt-2">
                  <span className="text-muted-foreground">Your Balance</span>
                  <span className="font-medium text-foreground">${totalBalance.toFixed(2)}</span>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsPlanDialogOpen(false)}>Cancel</Button>
              <Button
                onClick={handlePlanSubmit}
                disabled={isSubmitting}
                className="bg-amber-500 hover:bg-amber-600 text-white"
              >
                {isSubmitting ? "Processing..." : "Activate Miner"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Rent Server Dialog */}
        <Dialog open={isServerDialogOpen} onOpenChange={setIsServerDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Server className="h-5 w-5 text-primary" />
                Rent Compute Node — {selectedServer?.name}
              </DialogTitle>
              <DialogDescription>
                Select rental duration term. Discounted pricing applied for quarterly allocations.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              {error && (
                <div className="flex items-center gap-2 text-destructive text-sm bg-destructive/10 p-3 rounded-lg">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  {error}
                </div>
              )}
              
              <div className="space-y-2">
                <Label>Rental Period Term</Label>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    type="button"
                    variant={rentalPeriod === "monthly" ? "default" : "outline"}
                    className="w-full flex items-center gap-2"
                    onClick={() => setRentalPeriod("monthly")}
                  >
                    <Calendar className="h-4 w-4" />
                    Monthly (30 Days)
                  </Button>
                  <Button
                    type="button"
                    variant={rentalPeriod === "quarterly" ? "default" : "outline"}
                    className="w-full flex items-center gap-2"
                    onClick={() => setRentalPeriod("quarterly")}
                  >
                    <Calendar className="h-4 w-4" />
                    Quarterly (90 Days)
                  </Button>
                </div>
              </div>

              <div className="bg-muted/50 p-4 rounded-lg space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Rig Specifications</span>
                  <span className="font-semibold text-foreground truncate max-w-xs">{selectedServer?.specs}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Allocated Hashrate</span>
                  <span className="font-bold text-primary">{selectedServer?.hashrate}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Daily Return Rate</span>
                  <span className="font-semibold text-green-500">~{selectedServer?.daily_return_rate}%</span>
                </div>
                <div className="flex justify-between border-t border-border pt-2 mt-2">
                  <span className="text-muted-foreground">Rental Lease Cost</span>
                  <span className="font-extrabold text-primary">
                    ${(rentalPeriod === "monthly" ? Number(selectedServer?.monthly_cost) : Number(selectedServer?.quarterly_cost)).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Your Balance</span>
                  <span className="font-medium text-foreground">${totalBalance.toFixed(2)}</span>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsServerDialogOpen(false)}>Cancel</Button>
              <Button
                onClick={handleServerRentalSubmit}
                disabled={isSubmitting}
              >
                {isSubmitting ? "Provisioning Server Node..." : "Activate Server Lease"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
