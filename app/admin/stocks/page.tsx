"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Plus, Pencil, Trash2, TrendingUp, Users, Save, LineChart, DollarSign, ArrowUpRight } from "lucide-react"
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
  created_at: string
}

interface UserStockPurchase {
  id: string
  user_id: string
  stock_id: string
  shares: number
  price_per_share: number
  total_cost: number
  current_value: number
  current_profit: number
  current_loss: number
  status: string
  purchased_at: string
  users: { full_name: string; email: string }
  stocks: { name: string; ticker: string; logo_url: string }
}

export default function AdminStocksPage() {
  const [stocks, setStocks] = useState<Stock[]>([])
  const [purchases, setPurchases] = useState<UserStockPurchase[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingStock, setEditingStock] = useState<Stock | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Inline editing state for purchases
  const [editingField, setEditingField] = useState<string | null>(null)
  const [editFieldValue, setEditFieldValue] = useState("")

  const [formData, setFormData] = useState({
    name: "",
    ticker: "",
    logo_url: "",
    price_per_share: "1.00",
    min_shares: "100",
    max_shares: "100000",
    category: "tech",
    description: "",
  })

  useEffect(() => {
    fetchStocks()
    fetchPurchases()
  }, [])

  const fetchStocks = async () => {
    const supabase = createClient()
    const { data } = await supabase
      .from("stocks")
      .select("*")
      .order("created_at", { ascending: false })
    if (data) setStocks(data)
  }

  const fetchPurchases = async () => {
    const supabase = createClient()
    const { data } = await supabase
      .from("user_stock_purchases")
      .select("*, users(full_name, email), stocks(name, ticker, logo_url)")
      .order("purchased_at", { ascending: false })
    if (data) setPurchases(data as any[])
  }

  const handleOpenDialog = (stock?: Stock) => {
    if (stock) {
      setEditingStock(stock)
      setFormData({
        name: stock.name,
        ticker: stock.ticker,
        logo_url: stock.logo_url || "",
        price_per_share: stock.price_per_share.toString(),
        min_shares: stock.min_shares.toString(),
        max_shares: stock.max_shares.toString(),
        category: stock.category || "tech",
        description: stock.description || "",
      })
    } else {
      setEditingStock(null)
      setFormData({
        name: "",
        ticker: "",
        logo_url: "",
        price_per_share: "1.00",
        min_shares: "100",
        max_shares: "100000",
        category: "tech",
        description: "",
      })
    }
    setIsDialogOpen(true)
  }

  const handleSubmit = async () => {
    setIsSubmitting(true)
    try {
      const supabase = createClient()
      const stockData = {
        name: formData.name,
        ticker: formData.ticker.toUpperCase(),
        logo_url: formData.logo_url,
        price_per_share: parseFloat(formData.price_per_share),
        min_shares: parseInt(formData.min_shares),
        max_shares: parseInt(formData.max_shares),
        category: formData.category,
        description: formData.description,
      }

      if (editingStock) {
        const { error } = await supabase.from("stocks").update(stockData).eq("id", editingStock.id)
        if (error) throw error
      } else {
        const { error } = await supabase.from("stocks").insert({ ...stockData, is_active: true })
        if (error) throw error
      }

      setIsDialogOpen(false)
      fetchStocks()
    } catch (error: any) {
      alert(`Error saving stock: ${error.message}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleToggleActive = async (stock: Stock) => {
    const supabase = createClient()
    await supabase.from("stocks").update({ is_active: !stock.is_active }).eq("id", stock.id)
    fetchStocks()
  }

  const handleDeleteStock = async (stock: Stock) => {
    if (!confirm(`Are you sure you want to delete ${stock.name}?`)) return
    const supabase = createClient()
    const { error } = await supabase.from("stocks").delete().eq("id", stock.id)
    if (error) {
      alert(`Error: ${error.message}`)
    } else {
      fetchStocks()
    }
  }

  const handleSaveField = async (purchaseId: string, field: string) => {
    const supabase = createClient()
    const val = parseFloat(editFieldValue) || 0
    const { error } = await supabase
      .from("user_stock_purchases")
      .update({ [field]: val })
      .eq("id", purchaseId)
    if (error) {
      alert(`Error updating field: ${error.message}`)
    } else {
      setEditingField(null)
      fetchPurchases()
    }
  }

  const handleStatusChange = async (purchaseId: string, newStatus: string) => {
    const supabase = createClient()
    const { error } = await supabase
      .from("user_stock_purchases")
      .update({ status: newStatus })
      .eq("id", purchaseId)
    if (error) {
      alert(`Error updating status: ${error.message}`)
    } else {
      fetchPurchases()
    }
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
              <LineChart className="h-8 w-8 text-primary" />
              Stock Asset Management
            </h1>
            <p className="mt-1 text-muted-foreground">Manage stock offerings and monitor user equity portfolios</p>
          </div>
          <Button onClick={() => handleOpenDialog()}>
            <Plus className="mr-2 h-4 w-4" /> Add Stock Listing
          </Button>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <LineChart className="h-8 w-8 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">Total Listings</p>
                  <p className="text-2xl font-bold">{stocks.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <Users className="h-8 w-8 text-green-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Active Purchases</p>
                  <p className="text-2xl font-bold">{purchases.filter(p => p.status === "active").length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <DollarSign className="h-8 w-8 text-blue-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Total Capital Allocated</p>
                  <p className="text-2xl font-bold">
                    ${purchases.reduce((s, p) => s + Number(p.total_cost), 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="stocks">
          <TabsList className="bg-card border border-border">
            <TabsTrigger value="stocks">Stock Inventory</TabsTrigger>
            <TabsTrigger value="purchases">User Purchases ({purchases.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="stocks">
            <Card className="border border-border bg-card">
              <CardHeader>
                <CardTitle>Available Stocks</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Asset</TableHead>
                      <TableHead>Ticker</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Price/Share</TableHead>
                      <TableHead>Min/Max Shares</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {stocks.map((stock) => (
                      <TableRow key={stock.id}>
                        <TableCell className="font-medium flex items-center gap-3">
                          {stock.logo_url ? (
                            <img src={stock.logo_url} alt="" className="h-8 w-8 rounded-full bg-white object-contain p-1 border border-border" />
                          ) : (
                            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary text-xs">
                              {stock.ticker.slice(0, 2)}
                            </div>
                          )}
                          <span>{stock.name}</span>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{stock.ticker}</Badge>
                        </TableCell>
                        <TableCell className="capitalize">{stock.category}</TableCell>
                        <TableCell className="font-semibold text-primary">
                          ${Number(stock.price_per_share).toFixed(2)}
                        </TableCell>
                        <TableCell className="text-sm">
                          {stock.min_shares.toLocaleString()} / {stock.max_shares.toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <Switch
                            checked={stock.is_active}
                            onCheckedChange={() => handleToggleActive(stock)}
                          />
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline" onClick={() => handleOpenDialog(stock)}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="destructive" onClick={() => handleDeleteStock(stock)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                    {stocks.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                          No stocks found. Click "Add Stock Listing" to create one.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="purchases">
            <Card className="border border-border bg-card">
              <CardHeader>
                <CardTitle>User Stock Portfolios</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Stock</TableHead>
                      <TableHead>Shares</TableHead>
                      <TableHead>Buy Price</TableHead>
                      <TableHead>Total Cost</TableHead>
                      <TableHead>Current Value</TableHead>
                      <TableHead>Profit</TableHead>
                      <TableHead>Loss</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {purchases.map((p) => {
                      const renderEditableVal = (field: string, val: number, colorClass: string) => {
                        const key = `${p.id}-${field}`
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
                              <Button size="sm" variant="ghost" onClick={() => handleSaveField(p.id, field)}>
                                <Save className="h-3 w-3" />
                              </Button>
                            </div>
                          )
                        }
                        return (
                          <span
                            onClick={() => {
                              setEditingField(key)
                              setEditFieldValue((val || 0).toString())
                            }}
                            className={`${colorClass} font-semibold cursor-pointer hover:underline`}
                          >
                            ${(val || 0).toFixed(2)}
                          </span>
                        )
                      }

                      return (
                        <TableRow key={p.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium">{p.users?.full_name}</p>
                              <p className="text-xs text-muted-foreground">{p.users?.email}</p>
                            </div>
                          </TableCell>
                          <TableCell className="font-medium flex items-center gap-2">
                            {p.stocks?.logo_url && (
                              <img src={p.stocks.logo_url} alt="" className="h-6 w-6 rounded-full bg-white object-contain border border-border" />
                            )}
                            <div>
                              <span className="font-bold">{p.stocks?.ticker || "STK"}</span>
                              <p className="text-xs text-muted-foreground">{p.stocks?.name}</p>
                            </div>
                          </TableCell>
                          <TableCell>{p.shares}</TableCell>
                          <TableCell>${Number(p.price_per_share).toFixed(2)}</TableCell>
                          <TableCell className="font-medium">${Number(p.total_cost).toFixed(2)}</TableCell>
                          <TableCell>{renderEditableVal("current_value", p.current_value, "text-foreground")}</TableCell>
                          <TableCell>{renderEditableVal("current_profit", p.current_profit, "text-green-500")}</TableCell>
                          <TableCell>{renderEditableVal("current_loss", p.current_loss, "text-red-500")}</TableCell>
                          <TableCell>
                            <Select value={p.status} onValueChange={(v) => handleStatusChange(p.id, v)}>
                              <SelectTrigger className="w-28 h-8"><SelectValue /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="active">Active</SelectItem>
                                <SelectItem value="sold">Sold</SelectItem>
                                <SelectItem value="cancelled">Cancelled</SelectItem>
                              </SelectContent>
                            </Select>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                    {purchases.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={9} className="text-center text-muted-foreground py-8">
                          No stock purchases found.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Add/Edit Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{editingStock ? "Edit Stock Listing" : "Add Stock Listing"}</DialogTitle>
              <DialogDescription>
                {editingStock ? "Modify corporate settings for this asset listing." : "Register a new bulk stock investment asset."}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="stockName">Stock Name</Label>
                  <Input
                    id="stockName"
                    placeholder="e.g. Apple Inc"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="stockTicker">Ticker Symbol</Label>
                  <Input
                    id="stockTicker"
                    placeholder="e.g. AAPL"
                    value={formData.ticker}
                    onChange={(e) => setFormData({ ...formData, ticker: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="logoUrl">Logo URL (Logo.dev link recommended)</Label>
                <Input
                  id="logoUrl"
                  placeholder="https://img.logo.dev/apple.com?token=live_6a1a28fd-6420-4492-aeb0-b297461d9de2"
                  value={formData.logo_url}
                  onChange={(e) => setFormData({ ...formData, logo_url: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-2 col-span-1">
                  <Label htmlFor="priceShare">Price/Share ($)</Label>
                  <Input
                    id="priceShare"
                    type="number"
                    step="0.01"
                    value={formData.price_per_share}
                    onChange={(e) => setFormData({ ...formData, price_per_share: e.target.value })}
                  />
                </div>
                <div className="space-y-2 col-span-1">
                  <Label htmlFor="minShares">Min Shares</Label>
                  <Input
                    id="minShares"
                    type="number"
                    value={formData.min_shares}
                    onChange={(e) => setFormData({ ...formData, min_shares: e.target.value })}
                  />
                </div>
                <div className="space-y-2 col-span-1">
                  <Label htmlFor="maxShares">Max Shares</Label>
                  <Input
                    id="maxShares"
                    type="number"
                    value={formData.max_shares}
                    onChange={(e) => setFormData({ ...formData, max_shares: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="stockCat">Category</Label>
                <Select value={formData.category} onValueChange={(v) => setFormData({ ...formData, category: v })}>
                  <SelectTrigger id="stockCat">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="tech">Technology</SelectItem>
                    <SelectItem value="ai">Artificial Intelligence</SelectItem>
                    <SelectItem value="social">Social Media</SelectItem>
                    <SelectItem value="finance">Finance</SelectItem>
                    <SelectItem value="energy">Energy</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="stockDesc">Description</Label>
                <Textarea
                  id="stockDesc"
                  placeholder="Brief context on this company's business model..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleSubmit} disabled={isSubmitting}>
                {isSubmitting ? "Saving..." : editingStock ? "Update Stock" : "Create Stock"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
