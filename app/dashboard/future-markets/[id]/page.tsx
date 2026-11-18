"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  ArrowLeft,
  Sparkles,
  Cpu,
  Zap,
  TrendingUp,
  ShieldAlert,
  CheckCircle2,
  PieChart,
  Lock,
  Wallet,
  Loader2,
} from "lucide-react"

export default function ProductDetailPage() {
  const params = useParams()
  const router = useRouter()
  const productId = params?.id as string

  const [product, setProduct] = useState<any>(null)
  const [userBalance, setUserBalance] = useState<number>(0)
  const [loading, setLoading] = useState(true)
  const [investOpen, setInvestOpen] = useState(false)
  const [investAmount, setInvestAmount] = useState<string>("")
  const [investing, setInvesting] = useState(false)

  useEffect(() => {
    if (productId) fetchData()
  }, [productId])

  const fetchData = async () => {
    try {
      setLoading(true)
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      // Fetch Product with allocations & assets
      const { data: prod, error } = await supabase
        .from("investment_products")
        .select("*, investment_themes(name, slug), portfolio_allocations(*, portfolio_assets(*))")
        .eq("id", productId)
        .single()

      if (error || !prod) {
        console.error("Product fetch error:", error)
        return
      }

      setProduct(prod)
      setInvestAmount(String(prod.min_investment_amount || 1000))

      if (user) {
        const { data: uData } = await supabase
          .from("users")
          .select("balance_deposit")
          .eq("id", user.id)
          .single()

        if (uData) setUserBalance(Number(uData.balance_deposit || 0))
      }
    } catch (err) {
      console.error("Error loading product detail:", err)
    } finally {
      setLoading(false)
    }
  }

  const handleInvest = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setInvesting(true)
      const numericAmount = Number(investAmount)

      if (numericAmount < Number(product.min_investment_amount)) {
        alert(`Minimum investment amount is $${Number(product.min_investment_amount).toLocaleString()}`)
        return
      }

      if (numericAmount > userBalance) {
        alert("Insufficient deposit balance. Please top up your deposit wallet first.")
        return
      }

      const res = await fetch("/api/future-markets/invest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: product.id,
          amount: numericAmount,
          idempotencyKey: `inv_${Date.now()}_${Math.random().toString(36).substring(7)}`
        })
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Investment execution failed")

      alert(`Success! ${data.message}`)
      setInvestOpen(false)
      router.push("/dashboard/future-markets")
    } catch (err: any) {
      alert(err.message)
    } finally {
      setInvesting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!product) {
    return (
      <div className="container mx-auto p-8 text-center space-y-4">
        <h1 className="text-2xl font-bold">Product Not Found</h1>
        <Button asChild variant="outline">
          <Link href="/dashboard/future-markets"><ArrowLeft className="mr-2 h-4 w-4" /> Return to Catalog</Link>
        </Button>
      </div>
    )
  }

  const feePercentage = Number(product.fee_percentage || 1.5)
  const currentInvestAmount = Number(investAmount) || 0
  const feeAmount = (currentInvestAmount * feePercentage) / 100
  const netInvested = currentInvestAmount - feeAmount

  return (
    <div className="container mx-auto space-y-8 p-4 md:p-8 max-w-6xl">
      {/* Top Back Navigation */}
      <div>
        <Button asChild variant="ghost" size="sm" className="gap-2">
          <Link href="/dashboard/future-markets">
            <ArrowLeft className="h-4 w-4" /> Back to Future Markets Catalog
          </Link>
        </Button>
      </div>

      {/* Header Info Banner */}
      <div className="space-y-4 border-b border-border pb-6">
        <div className="flex flex-wrap items-center gap-3">
          <Badge className="bg-primary/20 text-primary border-primary/30">
            {product.investment_themes?.name || "Thematic Product"}
          </Badge>
          <Badge variant="outline">{product.risk_level} Risk</Badge>
          <Badge variant="secondary" className="font-mono text-xs">Version {product.version}.0</Badge>
        </div>

        <h1 className="text-3xl font-extrabold tracking-tight text-foreground md:text-4xl">
          {product.name}
        </h1>
        <p className="text-base text-muted-foreground">{product.summary}</p>
      </div>

      {/* Main Grid: Central Thesis & Asset Allocations */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Left Column: Core Thesis & Educational Content */}
        <div className="md:col-span-2 space-y-6">
          {/* Central Thesis Card */}
          <Card className="border-primary/30 bg-primary/5 backdrop-blur-md">
            <CardHeader>
              <CardTitle className="text-lg font-bold flex items-center gap-2 text-primary">
                <Sparkles className="h-5 w-5" /> Investment Thesis
              </CardTitle>
            </CardHeader>
            <CardContent>
              <blockquote className="text-base font-medium italic leading-relaxed text-foreground border-l-4 border-primary pl-4 py-1">
                "{product.thesis}"
              </blockquote>
            </CardContent>
          </Card>

          {/* Target Asset Allocation Weights */}
          <Card className="border-border/60 bg-card/60 backdrop-blur-md">
            <CardHeader>
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <PieChart className="h-5 w-5 text-primary" /> Target Portfolio Asset Weights
              </CardTitle>
              <CardDescription>
                Allocations across the underlying physical infrastructure, software components, and power systems.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {product.portfolio_allocations && product.portfolio_allocations.length > 0 ? (
                <div className="space-y-3">
                  {product.portfolio_allocations.map((alloc: any) => (
                    <div key={alloc.id} className="space-y-1">
                      <div className="flex justify-between text-xs font-semibold">
                        <span className="text-foreground">
                          {alloc.portfolio_assets?.name} ({alloc.portfolio_assets?.symbol})
                        </span>
                        <span className="text-primary font-mono">{alloc.weight_percentage}%</span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full bg-primary rounded-full transition-all duration-500"
                          style={{ width: `${alloc.weight_percentage}%` }}
                        />
                      </div>
                      <div className="text-[10px] text-muted-foreground flex justify-between">
                        <span>Category: {alloc.portfolio_assets?.category}</span>
                        <span>Limits: {alloc.min_weight_limit}% - {alloc.max_weight_limit}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-sm text-muted-foreground">Standard theme weighting rules apply.</div>
              )}
            </CardContent>
          </Card>

          {/* Educational Content / Strategy Details */}
          {product.educational_content && (
            <Card className="border-border/60 bg-card/60 backdrop-blur-md">
              <CardHeader>
                <CardTitle className="text-lg font-bold">Strategy Overview & Deep Dive</CardTitle>
              </CardHeader>
              <CardContent className="prose prose-invert max-w-none text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                {product.educational_content}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column: Key Parameters & Investment Box */}
        <div className="space-y-6">
          <Card className="border-border/60 bg-card/60 backdrop-blur-md sticky top-24">
            <CardHeader>
              <CardTitle className="text-lg font-bold">Product Parameters</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3 text-sm border-b border-border/40 pb-4">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Target Return</span>
                  <span className="font-bold text-emerald-400">{product.target_return_rate}% APY</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Min Investment</span>
                  <span className="font-bold text-foreground">${Number(product.min_investment_amount).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Management Fee</span>
                  <span className="font-medium text-foreground">{product.fee_percentage}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Rebalancing</span>
                  <span className="font-medium text-foreground">{product.rebalancing_frequency}</span>
                </div>
              </div>

              {/* Deposit Balance Callout */}
              <div className="rounded-lg bg-muted/40 p-3 flex items-center justify-between text-xs">
                <span className="text-muted-foreground flex items-center gap-1">
                  <Wallet className="h-3.5 w-3.5 text-primary" /> Wallet Deposit Balance:
                </span>
                <span className="font-bold text-foreground">${userBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>

              {/* Investment CTA Button / Modal */}
              <Dialog open={investOpen} onOpenChange={setInvestOpen}>
                <DialogTrigger asChild>
                  <Button className="w-full gap-2 text-base font-bold h-12 shadow-lg shadow-primary/25">
                    Invest in Portfolio
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                      <Sparkles className="h-5 w-5 text-primary" /> Invest in {product.name}
                    </DialogTitle>
                    <DialogDescription>
                      Confirm your investment parameters. Capital will be allocated according to the target portfolio weights.
                    </DialogDescription>
                  </DialogHeader>

                  <form onSubmit={handleInvest} className="space-y-4 py-2">
                    <div className="space-y-2">
                      <Label>Investment Amount ($)</Label>
                      <Input
                        type="number"
                        min={Number(product.min_investment_amount)}
                        max={userBalance}
                        value={investAmount}
                        onChange={(e) => setInvestAmount(e.target.value)}
                        required
                      />
                      <div className="text-xs text-muted-foreground flex justify-between">
                        <span>Min: ${Number(product.min_investment_amount).toLocaleString()}</span>
                        <span>Available: ${userBalance.toLocaleString()}</span>
                      </div>
                    </div>

                    <div className="rounded-lg bg-muted/40 p-3 space-y-2 text-xs border border-border/40">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Gross Investment:</span>
                        <span className="font-medium">${currentInvestAmount.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Management Fee ({feePercentage}%):</span>
                        <span className="font-medium text-amber-400">-${feeAmount.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between border-t border-border/40 pt-2 font-bold text-foreground">
                        <span>Net Allocated Capital:</span>
                        <span className="text-emerald-400">${netInvested.toFixed(2)}</span>
                      </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-2">
                      <Button type="button" variant="outline" onClick={() => setInvestOpen(false)}>Cancel</Button>
                      <Button type="submit" disabled={investing} className="gap-2">
                        {investing && <Loader2 className="h-4 w-4 animate-spin" />}
                        Confirm & Allocate Capital
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
