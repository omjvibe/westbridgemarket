"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Users, TrendingUp, CheckCircle2, AlertCircle, Wallet, Clock, Copy } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

interface CopyExpert {
  id: string
  user_id: string
  display_name: string
  bio: string
  total_followers: number
  success_rate: number
  total_profit: number
  is_active: boolean
  image_url?: string
  years_experience?: number
  total_trades?: number
  min_investment?: number
}

interface CopySubscription {
  id: string
  expert_id: string
  is_active: boolean
  amount_invested: number
  current_profit: number
  copy_experts: CopyExpert
}

interface UserData {
  balance_deposit: number
  balance_profit: number
  balance_bonus: number
}

export default function CopyTradingPage() {
  const [experts, setExperts] = useState<CopyExpert[]>([])
  const [subscriptions, setSubscriptions] = useState<CopySubscription[]>([])
  const [userData, setUserData] = useState<UserData | null>(null)
  const [selectedExpert, setSelectedExpert] = useState<CopyExpert | null>(null)
  const [investAmount, setInvestAmount] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    fetchExperts()
    fetchSubscriptions()
    fetchUserData()
  }, [])

  const fetchExperts = async () => {
    const supabase = createClient()
    const { data } = await supabase
      .from("copy_experts")
      .select("*")
      .eq("is_active", true)
      .order("success_rate", { ascending: false })

    if (data) setExperts(data)
  }

  const fetchSubscriptions = async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data } = await supabase
      .from("copy_subscriptions")
      .select("*, copy_experts(*)")
      .eq("user_id", user.id)
      .eq("is_active", true)

    if (data) setSubscriptions(data as CopySubscription[])
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

  const handleCopyTrader = (expert: CopyExpert) => {
    setSelectedExpert(expert)
    setInvestAmount("")
    setError(null)
    setSuccess(false)
    setIsDialogOpen(true)
  }

  const handleSubmit = async () => {
    if (!selectedExpert) return
    setIsSubmitting(true)
    setError(null)

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error("Please login to continue")

      const amount = parseFloat(investAmount)
      const minRequired = selectedExpert.min_investment || 100
      if (!amount || amount < minRequired) {
        throw new Error(`Minimum investment amount for this trader is $${minRequired.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`)
      }

      if (amount > totalBalance) {
        throw new Error("Insufficient balance")
      }

      // Check if already subscribed
      const existingSub = subscriptions.find(s => s.expert_id === selectedExpert.id)
      if (existingSub) {
        throw new Error("You are already copying this trader")
      }

      // Create subscription
      const { error: subError } = await supabase.from("copy_subscriptions").insert({
        user_id: user.id,
        expert_id: selectedExpert.id,
        is_active: true,
      })

      if (subError) throw subError

      // Deduct from balance
      const { error: updateError } = await supabase
        .from("users")
        .update({ balance_deposit: (userData?.balance_deposit || 0) - amount })
        .eq("id", user.id)

      if (updateError) throw updateError

      // Update expert followers
      await supabase
        .from("copy_experts")
        .update({ total_followers: selectedExpert.total_followers + 1 })
        .eq("id", selectedExpert.id)

      setSuccess(true)
      setIsDialogOpen(false)
      fetchExperts()
      fetchSubscriptions()
      fetchUserData()

    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Copy Trading</h1>
            <p className="mt-1 text-muted-foreground">Follow expert traders and copy their strategies automatically</p>
          </div>
          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="p-4 flex items-center gap-3">
              <Wallet className="h-5 w-5 text-primary" />
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
              <p className="text-foreground">Successfully started copying trader!</p>
            </CardContent>
          </Card>
        )}

        {/* Active Subscriptions */}
        {subscriptions.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">Your Active Copies</h2>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {subscriptions.map((sub) => (
                <Card key={sub.id} className="border-primary/20 bg-primary/5">
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground overflow-hidden">
                        {sub.copy_experts?.image_url ? (
                          <img src={sub.copy_experts.image_url} alt={sub.copy_experts.display_name} className="h-full w-full object-cover" />
                        ) : (
                          sub.copy_experts?.display_name?.substring(0, 2).toUpperCase() || 'CT'
                        )}
                      </div>
                      <div>
                        <CardTitle className="text-lg">{sub.copy_experts?.display_name}</CardTitle>
                        <p className="text-sm text-green-500">Active</p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Success Rate</span>
                      <span className="font-medium text-green-500">{sub.copy_experts?.success_rate}%</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Your Profit</span>
                      <span className="font-medium text-green-500">+${(sub.current_profit || 0).toFixed(2)}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Available Experts */}
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-white tracking-tight">Top Traders</h2>
          {experts.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {experts.map((expert) => {
                const isSubscribed = subscriptions.some(s => s.expert_id === expert.id)
                return (
                  <Card
                    key={expert.id}
                    className={`relative overflow-visible border-white/5 bg-slate-900/60 backdrop-blur-md hover:border-primary/50 transition-all duration-300 shadow-xl ${isSubscribed ? "opacity-75" : ""
                      }`}
                  >
                    <CardHeader className="pb-2">
                      <div className="flex items-center gap-4">
                        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 text-xl font-bold text-white overflow-hidden shadow-lg border border-white/10 flex-shrink-0">
                          {expert.image_url ? (
                            <img src={expert.image_url} alt={expert.display_name} className="h-full w-full object-cover" />
                          ) : (
                            expert.display_name.substring(0, 1).toUpperCase()
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <CardTitle className="text-lg font-bold text-white truncate">{expert.display_name}</CardTitle>
                          <p className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                            <Clock className="h-3.5 w-3.5 text-muted-foreground/80" />
                            {expert.years_experience || 5} Years Experience
                          </p>
                        </div>
                      </div>
                    </CardHeader>

                    <CardContent className="pt-2 pb-6 space-y-4">
                      {/* Success Rate Progress Bar */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground font-medium">Success Rate</span>
                          <span className="font-bold text-green-400">{Number(expert.success_rate || 90.00).toFixed(2)}%</span>
                        </div>
                        <div className="h-2 w-full bg-slate-950/60 rounded-full overflow-hidden border border-white/5">
                          <div
                            className="h-full bg-green-500 rounded-full transition-all duration-500"
                            style={{ width: `${expert.success_rate || 90}%` }}
                          />
                        </div>
                      </div>

                      {/* Stats Grid */}
                      <div className="grid grid-cols-2 gap-4 border-t border-b border-white/5 py-3 my-2">
                        <div>
                          <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Total Trades</p>
                          <p className="text-base font-extrabold text-white mt-0.5">
                            {(expert.total_trades || 1200).toLocaleString()}
                          </p>
                        </div>
                        <div>
                          <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Followers</p>
                          <p className="text-base font-extrabold text-white mt-0.5">
                            {expert.total_followers.toLocaleString()}
                          </p>
                        </div>
                      </div>

                      {/* Bio Description */}
                      {expert.bio && (
                        <p className="text-xs text-muted-foreground line-clamp-3 leading-relaxed min-h-[48px]">
                          {expert.bio}
                        </p>
                      )}

                      {/* Minimum Investment block */}
                      <div className="bg-slate-950/40 border border-white/5 rounded-lg p-3.5">
                        <p className="text-[9px] uppercase tracking-wider text-muted-foreground font-semibold">Minimum Investment</p>
                        <p className="text-lg font-black text-white mt-0.5">
                          ${(expert.min_investment || 1000).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </p>
                      </div>

                      {/* Action Button */}
                      <Button
                        className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-semibold flex items-center justify-center gap-2 h-11 border-0 shadow-lg shadow-purple-500/10 hover:shadow-purple-500/20 active:scale-[0.98] transition-all"
                        onClick={() => handleCopyTrader(expert)}
                        disabled={isSubscribed}
                      >
                        <Copy className="h-4 w-4" />
                        {isSubscribed ? "Already Copying" : "Copy Trader"}
                      </Button>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          ) : (
            <Card className="border-white/5 bg-slate-900/60 backdrop-blur-md">
              <CardContent className="p-8 text-center">
                <Users className="mx-auto h-12 w-12 text-muted-foreground" />
                <p className="mt-4 text-muted-foreground">No expert traders available at the moment.</p>
                <p className="text-sm text-muted-foreground">Check back soon for new opportunities.</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Investment Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="border-white/10 bg-slate-900 text-white">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold">Copy {selectedExpert?.display_name}</DialogTitle>
              <DialogDescription className="text-slate-400">
                Enter the amount you want to invest with this trader. Minimum ${(selectedExpert?.min_investment || 1000).toLocaleString(undefined, { minimumFractionDigits: 2 })}.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              {error && (
                <div className="flex items-center gap-2 text-destructive text-sm bg-destructive/10 p-3 rounded-lg border border-destructive/20">
                  <AlertCircle className="h-4 w-4" />
                  {error}
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="amount" className="text-slate-300 font-medium">Investment Amount (USD)</Label>
                <Input
                  id="amount"
                  type="number"
                  placeholder={`Enter amount (min $${(selectedExpert?.min_investment || 1000).toLocaleString()})`}
                  value={investAmount}
                  onChange={(e) => setInvestAmount(e.target.value)}
                  min={selectedExpert?.min_investment || 1000}
                  max={totalBalance}
                  className="bg-slate-950 border-white/10 text-white h-11 text-lg font-bold"
                />
                <p className="text-xs text-slate-400">
                  Available balance: <span className="font-semibold text-white">${totalBalance.toFixed(2)}</span>
                </p>
              </div>
              <div className="bg-slate-950/60 border border-white/5 p-4 rounded-lg text-sm space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-400">Success Rate:</span>
                  <span className="font-bold text-green-400">{selectedExpert?.success_rate}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Total Followers:</span>
                  <span className="font-bold text-white">{selectedExpert?.total_followers}</span>
                </div>
                <div className="flex justify-between border-t border-white/5 pt-2 mt-2">
                  <span className="text-slate-400">Minimum Required:</span>
                  <span className="font-extrabold text-white">${(selectedExpert?.min_investment || 1000).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
              </div>
            </div>
            <DialogFooter className="gap-2">
              <Button variant="ghost" onClick={() => setIsDialogOpen(false)} className="text-slate-300 hover:text-white hover:bg-white/5">
                Cancel
              </Button>
              <Button onClick={handleSubmit} disabled={isSubmitting} className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white border-0 shadow-lg shadow-purple-500/10 h-11 px-6">
                {isSubmitting ? "Processing..." : "Start Copying"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
