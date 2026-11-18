"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Coins, TrendingUp, TrendingDown, Wallet, AlertCircle, CheckCircle2, Lock, Clock, DollarSign, Percent } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

const TOKEN_COLORS: Record<string, { text: string; bg: string; border: string }> = {
  ETH: { text: "text-indigo-400", bg: "bg-indigo-500/10", border: "border-indigo-500/30" },
  SOL: { text: "text-purple-400", bg: "bg-purple-500/10", border: "border-purple-500/30" },
  ADA: { text: "text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/30" },
  DOT: { text: "text-pink-400", bg: "bg-pink-500/10", border: "border-pink-500/30" },
  MATIC: { text: "text-violet-400", bg: "bg-violet-500/10", border: "border-violet-500/30" },
  AVAX: { text: "text-red-400", bg: "bg-red-500/10", border: "border-red-500/30" },
  XRP: { text: "text-gray-300", bg: "bg-gray-500/10", border: "border-gray-500/30" },
}

const DEFAULT_COLOR = { text: "text-primary", bg: "bg-primary/10", border: "border-primary/30" }

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
  staking_pools: StakingPool
}

interface UserData {
  balance_deposit: number
  balance_profit: number
  balance_bonus: number
}

export default function StakingPage() {
  const [pools, setPools] = useState<StakingPool[]>([])
  const [myStakes, setMyStakes] = useState<UserStake[]>([])
  const [userData, setUserData] = useState<UserData | null>(null)
  const [selectedPool, setSelectedPool] = useState<StakingPool | null>(null)
  const [stakeAmount, setStakeAmount] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    fetchPools()
    fetchMyStakes()
    fetchUserData()
  }, [])

  const fetchPools = async () => {
    const supabase = createClient()
    const { data } = await supabase
      .from("staking_pools")
      .select("*")
      .eq("is_active", true)
      .order("apy_rate", { ascending: false })
    if (data) setPools(data)
  }

  const fetchMyStakes = async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data } = await supabase
      .from("user_stakes")
      .select("*, staking_pools(*)")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
    if (data) setMyStakes(data as UserStake[])
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

  const totalRewards = myStakes
    .filter(s => s.status === "active")
    .reduce((sum, s) => sum + (s.current_rewards || 0), 0)

  const totalStaked = myStakes
    .filter(s => s.status === "active")
    .reduce((sum, s) => sum + s.amount, 0)

  const totalLosses = myStakes
    .filter(s => s.status === "active")
    .reduce((sum, s) => sum + (s.current_loss || 0), 0)

  const handleSelectPool = (pool: StakingPool) => {
    setSelectedPool(pool)
    setStakeAmount(pool.min_stake.toString())
    setError(null)
    setSuccess(false)
    setIsDialogOpen(true)
  }

  const handleSubmit = async () => {
    if (!selectedPool) return
    setIsSubmitting(true)
    setError(null)

    try {
      const amount = parseFloat(stakeAmount)
      if (isNaN(amount) || amount < selectedPool.min_stake) {
        throw new Error(`Minimum stake is $${selectedPool.min_stake.toLocaleString()}`)
      }
      if (amount > selectedPool.max_stake) {
        throw new Error(`Maximum stake is $${selectedPool.max_stake.toLocaleString()}`)
      }
      if (amount > totalBalance) {
        throw new Error("Insufficient balance. Please deposit funds first.")
      }

      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error("Please login to continue")

      const unlockDate = new Date()
      unlockDate.setDate(unlockDate.getDate() + selectedPool.lock_period_days)

      const { error: insertError } = await supabase.from("user_stakes").insert({
        user_id: user.id,
        pool_id: selectedPool.id,
        amount,
        current_rewards: 0,
        status: "active",
        staked_at: new Date().toISOString(),
        unlock_date: unlockDate.toISOString(),
      })
      if (insertError) throw insertError

      const { error: balanceError } = await supabase
        .from("users")
        .update({ balance_deposit: (userData?.balance_deposit || 0) - amount })
        .eq("id", user.id)
      if (balanceError) throw balanceError

      setSuccess(true)
      setIsDialogOpen(false)
      fetchPools()
      fetchMyStakes()
      fetchUserData()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setIsSubmitting(false)
    }
  }

  const getTokenColor = (token: string) => TOKEN_COLORS[token] || DEFAULT_COLOR

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
              <Coins className="h-8 w-8 text-indigo-500" />
              Token Staking
            </h1>
            <p className="mt-1 text-muted-foreground">
              Stake ETH, SOL, ADA and more to earn high-yield rewards
            </p>
          </div>
          <Card className="bg-indigo-500/5 border-indigo-500/20">
            <CardContent className="p-4 flex items-center gap-3">
              <Wallet className="h-5 w-5 text-indigo-500" />
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
              <p className="text-foreground">Staking position activated! Your tokens are now earning rewards.</p>
            </CardContent>
          </Card>
        )}

        {/* Stats Overview */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card className="bg-indigo-500/5 border-indigo-500/20">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-indigo-500/10">
                  <Lock className="h-6 w-6 text-indigo-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Active Stakes</p>
                  <p className="text-2xl font-bold text-foreground">
                    {myStakes.filter(s => s.status === "active").length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-green-500/5 border-green-500/20">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-green-500/10">
                  <TrendingUp className="h-6 w-6 text-green-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Rewards</p>
                  <p className="text-2xl font-bold text-green-500">${totalRewards.toFixed(2)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-red-500/5 border-red-500/20">
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
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-primary/10">
                  <DollarSign className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Staked</p>
                  <p className="text-2xl font-bold text-foreground">${totalStaked.toFixed(2)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* My Active Stakes */}
        {myStakes.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
              <Lock className="h-5 w-5 text-indigo-500" />
              My Staking Positions
            </h2>
            <div className="grid gap-4 md:grid-cols-2">
              {myStakes.map((stake) => {
                const color = getTokenColor(stake.staking_pools?.token)
                return (
                  <Card key={stake.id} className={`${stake.status === "active" ? `${color.border} ${color.bg}` : "opacity-60"}`}>
                    <CardContent className="p-5 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Coins className={`h-5 w-5 ${color.text}`} />
                          <span className="font-bold text-foreground">
                            {stake.staking_pools?.name || stake.staking_pools?.token || "Staking Pool"}
                          </span>
                        </div>
                        <Badge className={
                          stake.status === "active" ? "bg-green-500" :
                          stake.status === "completed" ? "bg-blue-500" : "bg-yellow-500"
                        }>
                          {stake.status}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-3 gap-3 text-sm">
                        <div>
                          <p className="text-muted-foreground">Staked</p>
                          <p className="font-bold text-foreground">${stake.amount.toFixed(2)}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Rewards</p>
                          <p className="font-bold text-green-500">${(stake.current_rewards || 0).toFixed(2)}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Loss</p>
                          <p className="font-bold text-red-500">${(stake.current_loss || 0).toFixed(2)}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">APY</p>
                          <p className={`font-medium ${color.text}`}>{stake.staking_pools?.apy_rate || 0}%</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Net P/L</p>
                          <p className={`font-bold ${((stake.current_rewards || 0) - (stake.current_loss || 0)) >= 0 ? "text-green-500" : "text-red-500"}`}>
                            ${((stake.current_rewards || 0) - (stake.current_loss || 0)).toFixed(2)}
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Unlocks</p>
                          <p className="font-medium text-foreground">
                            {stake.unlock_date ? new Date(stake.unlock_date).toLocaleDateString() : "—"}
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

        {/* Staking Pools */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-foreground">Available Staking Pools</h2>
          {pools.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {pools.map((pool) => {
                const color = getTokenColor(pool.token)
                return (
                  <Card key={pool.id} className={`border-border hover:${color.border} transition-all duration-300`}>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg flex items-center gap-2">
                          <Coins className={`h-5 w-5 ${color.text}`} />
                          {pool.name}
                        </CardTitle>
                        <Badge variant="outline" className={`${color.text} ${color.border}`}>
                          {pool.token}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className={`p-3 rounded-lg ${color.bg} border ${color.border}`}>
                        <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Annual Yield</p>
                        <p className={`text-2xl font-extrabold ${color.text}`}>{pool.apy_rate}% APY</p>
                      </div>

                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <p className="text-muted-foreground">Lock Period</p>
                          <p className="font-bold text-foreground flex items-center gap-1">
                            <Clock className="h-3 w-3" /> {pool.lock_period_days} Days
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Min. Stake</p>
                          <p className="font-bold text-foreground">${pool.min_stake.toLocaleString()}</p>
                        </div>
                      </div>

                      {pool.description && (
                        <p className="text-xs text-muted-foreground line-clamp-2">{pool.description}</p>
                      )}

                      <Button
                        className="w-full"
                        onClick={() => handleSelectPool(pool)}
                      >
                        <Coins className="mr-2 h-4 w-4" />
                        Stake {pool.token}
                      </Button>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <Coins className="mx-auto h-12 w-12 text-muted-foreground" />
                <p className="mt-4 text-muted-foreground">No staking pools available at the moment.</p>
                <p className="text-sm text-muted-foreground">Check back soon for new opportunities.</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Stake Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Coins className={`h-5 w-5 ${getTokenColor(selectedPool?.token || "").text}`} />
                Stake {selectedPool?.token} — {selectedPool?.name}
              </DialogTitle>
              <DialogDescription>
                Lock your capital to earn {selectedPool?.apy_rate}% APY rewards.
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
                <Label>Stake Amount (USD)</Label>
                <Input
                  type="number"
                  min={selectedPool?.min_stake || 2000}
                  max={selectedPool?.max_stake}
                  step="100"
                  value={stakeAmount}
                  onChange={(e) => setStakeAmount(e.target.value)}
                  placeholder={`Min $${selectedPool?.min_stake.toLocaleString()}`}
                />
                <p className="text-xs text-muted-foreground">
                  Min: ${selectedPool?.min_stake.toLocaleString()} — Max: ${selectedPool?.max_stake.toLocaleString()}
                </p>
              </div>
              <div className="bg-muted/50 p-4 rounded-lg space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Token</span>
                  <span className={`font-bold ${getTokenColor(selectedPool?.token || "").text}`}>{selectedPool?.token}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">APY Rate</span>
                  <span className="font-medium text-green-500">{selectedPool?.apy_rate}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Lock Period</span>
                  <span className="font-medium text-foreground">{selectedPool?.lock_period_days} days</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Est. Monthly Yield</span>
                  <span className="font-bold text-green-500">
                    ${((parseFloat(stakeAmount) || 0) * (selectedPool?.apy_rate || 0) / 100 / 12).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between border-t pt-2 mt-2">
                  <span className="text-muted-foreground">Your Balance</span>
                  <span className="font-medium text-foreground">${totalBalance.toFixed(2)}</span>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleSubmit} disabled={isSubmitting}>
                {isSubmitting ? "Processing..." : `Stake ${selectedPool?.token}`}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
