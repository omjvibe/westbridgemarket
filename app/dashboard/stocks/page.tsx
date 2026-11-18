"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { LineChart, Wallet, AlertCircle, CheckCircle2, TrendingUp, TrendingDown, Layers, Landmark } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

interface Stock {
  id: string
  name: string
  ticker: string
  logo_url: string
  price_per_share: number
  min_shares: number
  max_shares: number
  category: string
  description: string
  is_active: boolean
}

interface UserStockPurchase {
  id: string
  shares: number
  price_per_share: number
  total_cost: number
  current_value: number
  current_profit: number
  current_loss: number
  status: string
  purchased_at: string
  stocks: Stock
}

interface UserData {
  balance_deposit: number
  balance_profit: number
  balance_bonus: number
}

export default function UserStocksPage() {
  const [stocks, setStocks] = useState<Stock[]>([])
  const [purchases, setPurchases] = useState<UserStockPurchase[]>([])
  const [userData, setUserData] = useState<UserData | null>(null)
  const [selectedStock, setSelectedStock] = useState<Stock | null>(null)
  const [sharesToBuy, setSharesToBuy] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [filterCategory, setFilterCategory] = useState("all")

  useEffect(() => {
    fetchStocks()
    fetchPurchases()
    fetchUserData()
  }, [])

  const fetchStocks = async () => {
    const supabase = createClient()
    const { data } = await supabase
      .from("stocks")
      .select("*")
      .eq("is_active", true)
      .order("ticker", { ascending: true })
    if (data) setStocks(data)
  }

  const fetchPurchases = async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data } = await supabase
      .from("user_stock_purchases")
      .select("*, stocks(*)")
      .eq("user_id", user.id)
      .order("purchased_at", { ascending: false })
    if (data) setPurchases(data as any[])
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

  const totalPortfolioValue = purchases
    .filter(p => p.status === "active")
    .reduce((sum, p) => sum + Number(p.current_value || p.total_cost), 0)

  const totalPortfolioCost = purchases
    .filter(p => p.status === "active")
    .reduce((sum, p) => sum + Number(p.total_cost), 0)

  const totalPortfolioProfit = purchases
    .filter(p => p.status === "active")
    .reduce((sum, p) => sum + Number(p.current_profit || 0), 0)

  const totalPortfolioLoss = purchases
    .filter(p => p.status === "active")
    .reduce((sum, p) => sum + Number(p.current_loss || 0), 0)

  const netPortfolioPL = totalPortfolioProfit - totalPortfolioLoss

  const handleSelectStock = (stock: Stock) => {
    setSelectedStock(stock)
    setSharesToBuy(stock.min_shares.toString())
    setError(null)
    setSuccess(false)
    setIsDialogOpen(true)
  }

  const handleBuyStock = async () => {
    if (!selectedStock) return
    setIsSubmitting(true)
    setError(null)

    try {
      const shares = parseInt(sharesToBuy)
      if (isNaN(shares) || shares < selectedStock.min_shares) {
        throw new Error(`Minimum purchase is ${selectedStock.min_shares.toLocaleString()} shares`)
      }
      if (shares > selectedStock.max_shares) {
        throw new Error(`Maximum purchase is ${selectedStock.max_shares.toLocaleString()} shares`)
      }

      const totalCost = shares * Number(selectedStock.price_per_share)
      if (totalCost > totalBalance) {
        throw new Error("Insufficient balance. Please deposit funds first.")
      }

      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error("Please log in to complete your transaction")

      // Insert purchase
      const { error: insertError } = await supabase.from("user_stock_purchases").insert({
        user_id: user.id,
        stock_id: selectedStock.id,
        shares,
        price_per_share: selectedStock.price_per_share,
        total_cost: totalCost,
        current_value: totalCost,
        status: "active",
      })

      if (insertError) throw insertError

      // Deduct from balance_deposit
      const { error: balanceError } = await supabase
        .from("users")
        .update({ balance_deposit: (userData?.balance_deposit || 0) - totalCost })
        .eq("id", user.id)

      if (balanceError) throw balanceError

      setSuccess(true)
      setIsDialogOpen(false)
      fetchPurchases()
      fetchUserData()
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred")
    } finally {
      setIsSubmitting(false)
    }
  }

  const categories = ["all", "tech", "ai", "social", "finance", "energy"]
  const filteredStocks = filterCategory === "all"
    ? stocks
    : stocks.filter(s => s.category === filterCategory)

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
              <Landmark className="h-8 w-8 text-primary" />
              Stock Market Investments
            </h1>
            <p className="mt-1 text-muted-foreground">Invest in top tech, AI, and enterprise equities in bulk fractions</p>
          </div>
          <Card className="bg-primary/5 border border-primary/20">
            <CardContent className="p-4 flex items-center gap-3">
              <Wallet className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Trading Balance</p>
                <p className="text-xl font-bold text-foreground">${totalBalance.toFixed(2)}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {success && (
          <Card className="border-green-500/50 bg-green-500/5">
            <CardContent className="flex items-center gap-3 p-4">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              <p className="text-foreground">Shares purchased successfully! Your position is now active in your portfolio.</p>
            </CardContent>
          </Card>
        )}

        {/* Portfolio Stats */}
        {purchases.filter(p => p.status === "active").length > 0 && (
          <div className="grid gap-4 md:grid-cols-4">
            <Card className="bg-card border border-border">
              <CardContent className="p-6">
                <p className="text-sm text-muted-foreground">Total Equity Value</p>
                <p className="text-2xl font-bold text-foreground">${totalPortfolioValue.toFixed(2)}</p>
              </CardContent>
            </Card>
            <Card className="bg-card border border-border">
              <CardContent className="p-6">
                <p className="text-sm text-muted-foreground">Net Invested Cost</p>
                <p className="text-2xl font-bold text-foreground">${totalPortfolioCost.toFixed(2)}</p>
              </CardContent>
            </Card>
            <Card className="bg-card border border-border">
              <CardContent className="p-6">
                <p className="text-sm text-muted-foreground">Net profit/loss</p>
                <p className={`text-2xl font-bold flex items-center gap-1 ${netPortfolioPL >= 0 ? "text-green-500" : "text-red-500"}`}>
                  {netPortfolioPL >= 0 ? <TrendingUp className="h-5 w-5" /> : <TrendingDown className="h-5 w-5" />}
                  ${Math.abs(netPortfolioPL).toFixed(2)}
                </p>
              </CardContent>
            </Card>
            <Card className="bg-card border border-border">
              <CardContent className="p-6">
                <p className="text-sm text-muted-foreground">Active Stock Assets</p>
                <p className="text-2xl font-bold text-foreground">
                  {purchases.filter(p => p.status === "active").length}
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* User Portfolios */}
        {purchases.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
              <Layers className="h-5 w-5 text-primary" />
              My Stock Portfolio
            </h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {purchases.map((purchase) => {
                const stock = purchase.stocks
                const profitVal = Number(purchase.current_profit || 0)
                const lossVal = Number(purchase.current_loss || 0)
                const pl = profitVal - lossVal
                return (
                  <Card key={purchase.id} className={purchase.status === "active" ? "border-primary/30 bg-primary/5" : "opacity-60 border-border"}>
                    <CardContent className="p-5 space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {stock?.logo_url ? (
                            <img src={stock.logo_url} alt="" className="h-8 w-8 rounded-full bg-white object-contain border border-border p-1" />
                          ) : (
                            <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center font-bold text-primary text-xs">
                              {stock?.ticker || "ST"}
                            </div>
                          )}
                          <div>
                            <span className="font-bold text-foreground text-base">{stock?.name || "Stock Position"}</span>
                            <p className="text-xs text-muted-foreground">{stock?.ticker}</p>
                          </div>
                        </div>
                        <Badge className={purchase.status === "active" ? "bg-green-500" : "bg-muted"}>
                          {purchase.status}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-sm pt-2 border-t border-border/50">
                        <div>
                          <p className="text-muted-foreground text-xs">Shares</p>
                          <p className="font-bold text-foreground">{purchase.shares}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground text-xs">Buy Price</p>
                          <p className="font-medium text-foreground">${Number(purchase.price_per_share).toFixed(2)}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground text-xs">Current Value</p>
                          <p className="font-bold text-foreground">${Number(purchase.current_value).toFixed(2)}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground text-xs">P/L Yield</p>
                          <p className={`font-extrabold flex items-center gap-1 ${pl >= 0 ? "text-green-500" : "text-red-500"}`}>
                            {pl >= 0 ? "+" : "-"}${Math.abs(pl).toFixed(2)}
                          </p>
                        </div>
                      </div>

                      <div className="text-[10px] text-muted-foreground pt-1 flex justify-between">
                        <span>Purchased on: {new Date(purchase.purchased_at).toLocaleDateString()}</span>
                        <span>Cost: ${Number(purchase.total_cost).toFixed(2)}</span>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </div>
        )}

        {/* Categories Tab and Stocks Grid */}
        <div className="space-y-4">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <h2 className="text-xl font-semibold text-foreground">Available Corporate Stocks</h2>
            <div className="flex flex-wrap gap-2">
              {categories.map((cat) => (
                <Button
                  key={cat}
                  variant={filterCategory === cat ? "default" : "outline"}
                  size="sm"
                  className="capitalize"
                  onClick={() => setFilterCategory(cat)}
                >
                  {cat}
                </Button>
              ))}
            </div>
          </div>

          {filteredStocks.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredStocks.map((stock) => (
                <Card key={stock.id} className="border border-border hover:border-primary/50 transition-all duration-300 group bg-card">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {stock.logo_url ? (
                          <img src={stock.logo_url} alt="" className="h-10 w-10 rounded-full bg-white object-contain border border-border p-1" />
                        ) : (
                          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary text-sm">
                            {stock.ticker.slice(0, 2)}
                          </div>
                        )}
                        <div>
                          <CardTitle className="text-lg group-hover:text-primary transition-colors">{stock.name}</CardTitle>
                          <CardDescription className="text-xs">{stock.ticker}</CardDescription>
                        </div>
                      </div>
                      <Badge variant="secondary" className="capitalize text-[11px]">
                        {stock.category}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="p-3 rounded-lg bg-primary/5 border border-primary/10 flex justify-between items-center">
                      <div>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Share Price</p>
                        <p className="text-2xl font-extrabold text-primary">${Number(stock.price_per_share).toFixed(2)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Min purchase</p>
                        <p className="font-bold text-foreground">{stock.min_shares.toLocaleString()} shares</p>
                      </div>
                    </div>

                    {stock.description && (
                      <p className="text-xs text-muted-foreground line-clamp-3 leading-relaxed">{stock.description}</p>
                    )}

                    <Button
                      className="w-full"
                      onClick={() => handleSelectStock(stock)}
                    >
                      <LineChart className="mr-2 h-4 w-4" />
                      Buy Stock Shares
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <LineChart className="mx-auto h-12 w-12 text-muted-foreground/50" />
                <p className="mt-4 text-muted-foreground">No stock listings available in this category.</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Buy Stock Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                Buy Shares — {selectedStock?.name} ({selectedStock?.ticker})
              </DialogTitle>
              <DialogDescription>
                Acquire shares in bulk. Minimum purchase size: {selectedStock?.min_shares.toLocaleString()} shares.
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
                <Label htmlFor="sharesInput">Shares Quantity</Label>
                <Input
                  id="sharesInput"
                  type="number"
                  min={selectedStock?.min_shares || 1}
                  max={selectedStock?.max_shares}
                  value={sharesToBuy}
                  onChange={(e) => setSharesToBuy(e.target.value)}
                  placeholder={`Min ${selectedStock?.min_shares}`}
                />
                <p className="text-xs text-muted-foreground">
                  Range Allowed: {selectedStock?.min_shares.toLocaleString()} to {selectedStock?.max_shares.toLocaleString()} shares.
                </p>
              </div>

              <div className="bg-muted/50 p-4 rounded-lg space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Price Per Share</span>
                  <span className="font-semibold text-foreground">${Number(selectedStock?.price_per_share).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Transaction Cost</span>
                  <span className="font-bold text-primary">
                    ${((parseInt(sharesToBuy) || 0) * Number(selectedStock?.price_per_share || 0)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex justify-between border-t border-border pt-2 mt-2">
                  <span className="text-muted-foreground">Your Balance</span>
                  <span className="font-medium text-foreground">${totalBalance.toFixed(2)}</span>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
              <Button
                onClick={handleBuyStock}
                disabled={isSubmitting || (parseInt(sharesToBuy) || 0) < (selectedStock?.min_shares || 0)}
              >
                {isSubmitting ? "Executing Order..." : "Confirm Purchase"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
