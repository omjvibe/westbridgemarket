"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Sparkles,
  Cpu,
  Plus,
  Play,
  Pause,
  FileCheck,
  History,
  CheckCircle2,
  AlertCircle,
  BarChart3,
  Layers,
  ShieldAlert,
  Loader2,
} from "lucide-react"

export default function AdminFutureMarketsPage() {
  const [products, setProducts] = useState<any[]>([])
  const [themes, setThemes] = useState<any[]>([])
  const [auditLogs, setAuditLogs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [createOpen, setCreateOpen] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<any>(null)

  // Form state
  const [formData, setFormData] = useState({
    theme_id: "",
    name: "",
    slug: "",
    thesis: "",
    summary: "",
    risk_level: "Growth",
    min_investment_amount: "1000",
    max_investment_amount: "500000",
    fee_percentage: "1.5",
    target_return_rate: "18.0",
    rebalancing_frequency: "Quarterly",
    educational_content: "",
    risk_disclosures: ""
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      const supabase = createClient()

      // Fetch products with themes
      const { data: prods } = await supabase
        .from("investment_products")
        .select("*, investment_themes(name, slug), portfolio_allocations(*, portfolio_assets(*))")
        .order("created_at", { ascending: false })

      // Fetch themes
      const { data: thms } = await supabase
        .from("investment_themes")
        .select("*")
        .order("display_order", { ascending: true })

      // Fetch audit logs
      const { data: logs } = await supabase
        .from("audit_logs")
        .select("*")
        .eq("entity_type", "investment_products")
        .order("created_at", { ascending: false })
        .limit(20)

      if (prods) setProducts(prods)
      if (thms) setThemes(thms)
      if (logs) setAuditLogs(logs)
    } catch (err) {
      console.error("Failed to load Future Markets admin data:", err)
    } finally {
      setLoading(false)
    }
  }

  const handleStatusChange = async (productId: string, newStatus: string) => {
    try {
      setActionLoading(productId)
      const res = await fetch("/api/admin/future-markets/products", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: productId,
          status: newStatus,
          reason: `Lifecycle state updated to ${newStatus} by admin`
        })
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Status update failed")

      fetchData()
    } catch (err: any) {
      alert(err.message)
    } finally {
      setActionLoading(null)
    }
  }

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setActionLoading("create")
      const res = await fetch("/api/admin/future-markets/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Product creation failed")

      setCreateOpen(false)
      fetchData()
    } catch (err: any) {
      alert(err.message)
    } finally {
      setActionLoading(null)
    }
  }

  const statusBadge = (status: string) => {
    switch (status) {
      case "LIVE":
        return <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">LIVE</Badge>
      case "APPROVED":
        return <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">APPROVED</Badge>
      case "UNDER_REVIEW":
        return <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30">UNDER REVIEW</Badge>
      case "PAUSED":
        return <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30">PAUSED</Badge>
      case "DRAFT":
      default:
        return <Badge variant="outline" className="text-muted-foreground">DRAFT</Badge>
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-primary" /> Future Markets & AI Investment Admin
          </h1>
          <p className="text-sm text-muted-foreground">
            Configure thematic investment products, manage asset allocation weights, review approval lifecycles, and audit platform changes.
          </p>
        </div>

        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" /> Create Thematic Product
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Cpu className="h-5 w-5 text-primary" /> Launch New Investment Product
              </DialogTitle>
              <DialogDescription>
                Define a new thematic portfolio product. New products start in DRAFT mode and require explicit approval before going live to clients.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleCreateProduct} className="space-y-4 py-2">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Investment Theme</Label>
                  <select
                    className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={formData.theme_id}
                    onChange={(e) => setFormData({ ...formData, theme_id: e.target.value })}
                    required
                  >
                    <option value="">Select Theme...</option>
                    {themes.map((t) => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <Label>Product Name</Label>
                  <Input
                    placeholder="e.g. Quantum AI Hardware Portfolio"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Investment Thesis</Label>
                <Textarea
                  placeholder="e.g. AI is an economic infrastructure stack..."
                  value={formData.thesis}
                  onChange={(e) => setFormData({ ...formData, thesis: e.target.value })}
                  rows={3}
                  required
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Risk Level</Label>
                  <select
                    className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={formData.risk_level}
                    onChange={(e) => setFormData({ ...formData, risk_level: e.target.value })}
                  >
                    <option value="Conservative">Conservative</option>
                    <option value="Moderate">Moderate</option>
                    <option value="Growth">Growth</option>
                    <option value="Aggressive">Aggressive</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label>Min Amount ($)</Label>
                  <Input
                    type="number"
                    value={formData.min_investment_amount}
                    onChange={(e) => setFormData({ ...formData, min_investment_amount: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>Target Return (%)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={formData.target_return_rate}
                    onChange={(e) => setFormData({ ...formData, target_return_rate: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Summary Description</Label>
                <Textarea
                  placeholder="Short description shown on product discovery cards..."
                  value={formData.summary}
                  onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
                  rows={2}
                  required
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={actionLoading === "create"}>
                  {actionLoading === "create" && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Create Draft Product
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary KPI Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-border/60 bg-card/60 backdrop-blur-md">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Products</CardTitle>
            <Layers className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{products.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Across 9 Investment Themes</p>
          </CardContent>
        </Card>

        <Card className="border-border/60 bg-card/60 backdrop-blur-md">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Live & Investable</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-400">
              {products.filter(p => p.status === "LIVE").length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Active for Client Purchases</p>
          </CardContent>
        </Card>

        <Card className="border-border/60 bg-card/60 backdrop-blur-md">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Draft & Review</CardTitle>
            <AlertCircle className="h-4 w-4 text-amber-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-400">
              {products.filter(p => p.status !== "LIVE").length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Pending Admin Launch</p>
          </CardContent>
        </Card>

        <Card className="border-border/60 bg-card/60 backdrop-blur-md">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Execution Engine</CardTitle>
            <BarChart3 className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">DIRECT</div>
            <p className="text-xs text-muted-foreground mt-1">Versioned Allocation System</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="products" className="space-y-4">
        <TabsList className="bg-muted/50 p-1">
          <TabsTrigger value="products" className="gap-2">
            <Cpu className="h-4 w-4" /> Products & Approval Pipeline
          </TabsTrigger>
          <TabsTrigger value="themes" className="gap-2">
            <Layers className="h-4 w-4" /> Theme Catalog ({themes.length})
          </TabsTrigger>
          <TabsTrigger value="audits" className="gap-2">
            <History className="h-4 w-4" /> Immutable Audit Logs
          </TabsTrigger>
        </TabsList>

        <TabsContent value="products" className="space-y-4">
          {loading ? (
            <div className="flex items-center justify-center p-12 text-muted-foreground">
              <Loader2 className="h-6 w-6 animate-spin mr-2" /> Loading Products...
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {products.map((prod) => (
                <Card key={prod.id} className="border-border/60 bg-card/60 backdrop-blur-md overflow-hidden">
                  <div className="p-6 flex flex-col md:flex-row md:items-start justify-between gap-4">
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-3">
                        <h3 className="text-lg font-semibold text-foreground">{prod.name}</h3>
                        {statusBadge(prod.status)}
                        <Badge variant="outline" className="text-xs">v{prod.version}</Badge>
                      </div>

                      <p className="text-sm text-muted-foreground">{prod.summary}</p>

                      <div className="rounded-lg bg-muted/40 p-3 border border-border/40 text-xs text-foreground/90 space-y-1">
                        <div className="font-semibold text-primary">Central Thesis:</div>
                        <div>"{prod.thesis}"</div>
                      </div>

                      <div className="flex flex-wrap gap-4 text-xs text-muted-foreground pt-2">
                        <div>Theme: <span className="font-medium text-foreground">{prod.investment_themes?.name || "AI"}</span></div>
                        <div>Risk: <span className="font-medium text-foreground">{prod.risk_level}</span></div>
                        <div>Min Invest: <span className="font-medium text-foreground">${Number(prod.min_investment_amount).toLocaleString()}</span></div>
                        <div>Target Yield: <span className="font-medium text-emerald-400">{prod.target_return_rate}% APY</span></div>
                        <div>Management Fee: <span className="font-medium text-foreground">{prod.fee_percentage}%</span></div>
                      </div>

                      {/* Portfolio Asset Allocations */}
                      {prod.portfolio_allocations && prod.portfolio_allocations.length > 0 && (
                        <div className="pt-3">
                          <div className="text-xs font-semibold text-muted-foreground mb-2">Target Asset Weights:</div>
                          <div className="flex flex-wrap gap-2">
                            {prod.portfolio_allocations.map((alloc: any) => (
                              <Badge key={alloc.id} variant="secondary" className="text-xs font-mono">
                                {alloc.portfolio_assets?.symbol || "ASSET"}: {alloc.weight_percentage}%
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-2 min-w-[140px]">
                      {prod.status !== "LIVE" && (
                        <Button
                          size="sm"
                          className="bg-emerald-600 hover:bg-emerald-500 text-white gap-2"
                          disabled={actionLoading === prod.id}
                          onClick={() => handleStatusChange(prod.id, "LIVE")}
                        >
                          {actionLoading === prod.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Play className="h-3 w-3" />}
                          Publish LIVE
                        </Button>
                      )}

                      {prod.status === "LIVE" && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-purple-500/40 text-purple-400 hover:bg-purple-500/10 gap-2"
                          disabled={actionLoading === prod.id}
                          onClick={() => handleStatusChange(prod.id, "PAUSED")}
                        >
                          {actionLoading === prod.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Pause className="h-3 w-3" />}
                          Pause Product
                        </Button>
                      )}

                      {prod.status !== "DRAFT" && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-xs text-muted-foreground gap-2"
                          disabled={actionLoading === prod.id}
                          onClick={() => handleStatusChange(prod.id, "DRAFT")}
                        >
                          Revert to Draft
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="themes" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {themes.map((theme) => (
              <Card key={theme.id} className="border-border/60 bg-card/60 backdrop-blur-md">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base font-bold flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-primary" /> {theme.name}
                    </CardTitle>
                    <Badge variant="outline">Active</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground line-clamp-3">{theme.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="audits" className="space-y-4">
          <Card className="border-border/60 bg-card/60 backdrop-blur-md">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <History className="h-4 w-4 text-primary" /> Product Audit Trail
              </CardTitle>
              <CardDescription>
                Immutable record of administrative state changes, lifecycle publish events, and portfolio modifications.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {auditLogs.length === 0 ? (
                <div className="text-sm text-muted-foreground py-6 text-center">No audit logs recorded yet.</div>
              ) : (
                <div className="space-y-3">
                  {auditLogs.map((log) => (
                    <div key={log.id} className="p-3 rounded-lg bg-muted/40 border border-border/40 flex flex-col md:flex-row md:items-center justify-between gap-2 text-xs">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="font-mono text-[10px]">{log.action}</Badge>
                          <span className="font-semibold text-foreground">{log.reason || "Admin state change"}</span>
                        </div>
                        <div className="text-muted-foreground font-mono">Entity ID: {log.entity_id}</div>
                      </div>
                      <div className="text-muted-foreground">
                        {new Date(log.created_at).toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
