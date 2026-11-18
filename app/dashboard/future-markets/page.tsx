"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Sparkles,
  Cpu,
  Zap,
  TrendingUp,
  ArrowRight,
  ShieldAlert,
  Bot,
  Activity,
  Layers,
  CheckCircle2,
  PieChart,
  Compass,
  Loader2,
} from "lucide-react"

export default function ClientFutureMarketsPage() {
  const [products, setProducts] = useState<any[]>([])
  const [themes, setThemes] = useState<any[]>([])
  const [userHoldings, setUserHoldings] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedTheme, setSelectedTheme] = useState<string>("all")

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      // Fetch Live Products
      const { data: prods } = await supabase
        .from("investment_products")
        .select("*, investment_themes(name, slug, icon_name)")
        .eq("status", "LIVE")
        .order("created_at", { ascending: false })

      // Fetch Themes
      const { data: thms } = await supabase
        .from("investment_themes")
        .select("*")
        .order("display_order", { ascending: true })

      if (user) {
        // Fetch User Active Holdings
        const { data: holdings } = await supabase
          .from("client_portfolios")
          .select("*, investment_products(name, slug, risk_level, target_return_rate)")
          .eq("user_id", user.id)
          .eq("status", "active")

        if (holdings) setUserHoldings(holdings)
      }

      if (prods) setProducts(prods)
      if (thms) setThemes(thms)
    } catch (err) {
      console.error("Error loading Future Markets catalog:", err)
    } finally {
      setLoading(false)
    }
  }

  // Calculate user portfolio totals
  const totalInvested = userHoldings.reduce((sum, h) => sum + Number(h.invested_amount || 0), 0)
  const totalCurrentValue = userHoldings.reduce((sum, h) => sum + Number(h.current_value || 0), 0)
  const totalEarnings = userHoldings.reduce((sum, h) => sum + Number(h.current_earnings || 0), 0)

  const filteredProducts = selectedTheme === "all"
    ? products
    : products.filter(p => p.investment_themes?.slug === selectedTheme)

  const getRiskBadge = (risk: string) => {
    switch (risk) {
      case "Conservative":
        return <Badge variant="outline" className="border-emerald-500/40 text-emerald-400">Conservative</Badge>
      case "Moderate":
        return <Badge variant="outline" className="border-blue-500/40 text-blue-400">Moderate</Badge>
      case "Growth":
        return <Badge variant="outline" className="border-purple-500/40 text-purple-400">Growth</Badge>
      case "Aggressive":
        return <Badge variant="outline" className="border-amber-500/40 text-amber-400">Aggressive</Badge>
      default:
        return <Badge variant="outline">{risk}</Badge>
    }
  }

  return (
    <div className="container mx-auto space-y-8 p-4 md:p-8">
      {/* Hero Banner */}
      <div className="relative overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-r from-primary/10 via-background to-secondary/10 p-6 md:p-10 backdrop-blur-xl">
        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
            <Sparkles className="h-3.5 w-3.5" /> First-Class Thematic Product Vertical
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground md:text-5xl">
            Future Markets & AI Investments
          </h1>
          <p className="text-sm text-muted-foreground md:text-base leading-relaxed">
            Gain direct exposure to the next economic cycle. Invest in versioned thematic portfolios covering **AI Leaders, AI Infrastructure, Next-Gen Power Grids, Robotics, and Digital Security**.
          </p>

          <div className="pt-2 flex flex-wrap gap-4">
            <Button asChild className="gap-2 shadow-lg shadow-primary/25">
              <Link href="/dashboard/future-markets/builder">
                <Compass className="h-4 w-4" /> Open Future Portfolio Builder
              </Link>
            </Button>
          </div>
        </div>

        <div className="absolute -right-12 -top-12 h-64 w-64 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
      </div>

      {/* User Portfolio Holdings Summary (If Active Holdings Exist) */}
      {userHoldings.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
            <PieChart className="h-5 w-5 text-primary" /> My Active Future Portfolios
          </h2>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Card className="border-border/60 bg-card/60 backdrop-blur-md">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-medium text-muted-foreground">Total Capital Invested</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">${totalInvested.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
              </CardContent>
            </Card>

            <Card className="border-border/60 bg-card/60 backdrop-blur-md">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-medium text-muted-foreground">Current Portfolio Value</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-primary">${totalCurrentValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
              </CardContent>
            </Card>

            <Card className="border-border/60 bg-card/60 backdrop-blur-md">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-medium text-muted-foreground">Unrealized Earnings</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-emerald-400">+${totalEarnings.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
              </CardContent>
            </Card>
          </div>

          {/* Holdings List */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {userHoldings.map((h) => (
              <Card key={h.id} className="border-border/60 bg-card/60 backdrop-blur-md">
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="font-semibold text-foreground">{h.investment_products?.name}</div>
                    <div className="text-xs text-muted-foreground flex items-center gap-2">
                      <span>Units: {Number(h.units).toFixed(4)}</span>
                      <span>•</span>
                      <span>Target Yield: {h.investment_products?.target_return_rate}% APY</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-foreground">${Number(h.current_value).toLocaleString()}</div>
                    <Badge variant="outline" className="text-[10px] border-emerald-500/40 text-emerald-400">ACTIVE</Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Theme Filter Navigation */}
      <div className="space-y-4">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
            <Layers className="h-5 w-5 text-primary" /> Available Thematic Products
          </h2>
          <span className="text-xs text-muted-foreground">
            Showing {filteredProducts.length} approved product strategies
          </span>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            variant={selectedTheme === "all" ? "default" : "outline"}
            onClick={() => setSelectedTheme("all")}
          >
            All Themes
          </Button>
          {themes.map((t) => (
            <Button
              key={t.id}
              size="sm"
              variant={selectedTheme === t.slug ? "default" : "outline"}
              onClick={() => setSelectedTheme(t.slug)}
            >
              {t.name}
            </Button>
          ))}
        </div>

        {/* Products Grid */}
        {loading ? (
          <div className="flex items-center justify-center p-12 text-muted-foreground">
            <Loader2 className="h-6 w-6 animate-spin mr-2" /> Loading Products...
          </div>
        ) : filteredProducts.length === 0 ? (
          <Card className="p-8 text-center border-dashed">
            <p className="text-muted-foreground text-sm">No live products currently available for this theme.</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {filteredProducts.map((prod) => (
              <Card key={prod.id} className="group relative flex flex-col justify-between overflow-hidden border-border/60 bg-card/60 backdrop-blur-md transition-all hover:border-primary/50 hover:shadow-xl hover:shadow-primary/10">
                <CardHeader>
                  <div className="flex items-center justify-between pb-2">
                    <Badge variant="secondary" className="text-xs font-medium">
                      {prod.investment_themes?.name || "Thematic"}
                    </Badge>
                    {getRiskBadge(prod.risk_level)}
                  </div>
                  <CardTitle className="text-xl font-bold group-hover:text-primary transition-colors">
                    {prod.name}
                  </CardTitle>
                  <CardDescription className="text-xs line-clamp-2">
                    {prod.summary}
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Central Thesis Callout Box */}
                  <div className="rounded-lg bg-muted/40 p-3 border border-border/40 text-xs space-y-1">
                    <div className="font-semibold text-primary">Core Strategy Thesis:</div>
                    <div className="italic text-muted-foreground line-clamp-3">"{prod.thesis}"</div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs border-t border-border/40 pt-3">
                    <div>
                      <span className="text-muted-foreground block">Min Investment</span>
                      <span className="font-bold text-foreground">${Number(prod.min_investment_amount).toLocaleString()}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block">Target Return</span>
                      <span className="font-bold text-emerald-400">{prod.target_return_rate}% APY</span>
                    </div>
                  </div>
                </CardContent>

                <div className="p-6 pt-0">
                  <Button asChild className="w-full gap-2">
                    <Link href={`/dashboard/future-markets/${prod.id}`}>
                      View Thesis & Invest <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Disclaimers & Disclosures */}
      <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 text-xs text-amber-200/80 space-y-1">
        <div className="font-semibold flex items-center gap-2 text-amber-400">
          <ShieldAlert className="h-4 w-4" /> Legal & Regulatory Disclosures
        </div>
        <p>
          Future Markets portfolios represent thematic asset allocations and non-guaranteed financial strategy targets. Past performance does not guarantee future results. All investments involve risk including loss of principal.
        </p>
      </div>
    </div>
  )
}
