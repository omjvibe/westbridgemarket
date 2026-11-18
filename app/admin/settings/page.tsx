"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { createClient } from "@/lib/supabase/client"

interface PageToggle {
  key: string
  label: string
  description: string
}

const PAGE_TOGGLES: PageToggle[] = [
  { key: "investments_page_enabled", label: "Investments Page", description: "Show or hide the Investments page from the user dashboard." },
  { key: "trade_page_enabled", label: "Trade Page", description: "Show or hide the Trade page from the user dashboard." },
  { key: "portfolio_page_enabled", label: "Portfolio Page", description: "Show or hide the Portfolio page from the user dashboard." },
  { key: "copy_trading_page_enabled", label: "Copy Trading Page", description: "Show or hide the Copy Trading page from the user dashboard." },
  { key: "signals_page_enabled", label: "Signals Page", description: "Show or hide the Signals page from the user dashboard." },
  { key: "mining_page_enabled", label: "Mining Page", description: "Show or hide the Mining page from the user dashboard." },
  { key: "staking_page_enabled", label: "Staking Page", description: "Show or hide the Staking page from the user dashboard." },
  { key: "stocks_page_enabled", label: "Stocks Page", description: "Show or hide the Stocks page from the user dashboard." },
  { key: "server_rental_page_enabled", label: "Server Rentals Page", description: "Show or hide the Server Rentals page from the user dashboard." },
]

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState({
    siteName: "Westbridge Market",
    maintenanceMode: false,
    minDeposit: 100,
    maxWithdrawal: 10000,
    referralBonus: 5,
    defaultTrades: 10,
  })

  // Data-driven page visibility state
  const [pageStates, setPageStates] = useState<Record<string, boolean>>({})
  const [pageSaving, setPageSaving] = useState<Record<string, boolean>>({})

  useEffect(() => {
    const fetchToggles = async () => {
      try {
        const supabase = createClient()
        const { data } = await supabase
          .from("site_settings")
          .select("key, value")
          .in("key", PAGE_TOGGLES.map(t => t.key))

        if (data) {
          const states: Record<string, boolean> = {}
          for (const toggle of PAGE_TOGGLES) {
            const found = data.find(item => item.key === toggle.key)
            states[toggle.key] = found ? found.value === "true" : true // default visible
          }
          setPageStates(states)
        }
      } catch {
        // table may not exist yet — default all to true
        const defaults: Record<string, boolean> = {}
        for (const t of PAGE_TOGGLES) defaults[t.key] = true
        setPageStates(defaults)
      }
    }
    fetchToggles()
  }, [])

  const handlePageToggle = async (key: string, checked: boolean) => {
    setPageSaving(prev => ({ ...prev, [key]: true }))
    try {
      const supabase = createClient()
      await supabase
        .from("site_settings")
        .upsert({ key, value: checked ? "true" : "false", updated_at: new Date().toISOString() })
      setPageStates(prev => ({ ...prev, [key]: checked }))
    } catch (err) {
      console.error(`Failed to update ${key}:`, err)
    } finally {
      setPageSaving(prev => ({ ...prev, [key]: false }))
    }
  }

  const handleSave = () => {
    console.log("Settings saved:", settings)
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">System Settings</h1>
          <p className="mt-1 text-muted-foreground">Configure global platform settings</p>
        </div>

        <Tabs defaultValue="general" className="w-full">
          <TabsList>
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="pages">Page Visibility</TabsTrigger>
            <TabsTrigger value="trading">Trading</TabsTrigger>
            <TabsTrigger value="financial">Financial</TabsTrigger>
            <TabsTrigger value="referral">Referral</TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>General Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label>Site Name</Label>
                  <Input
                    value={settings.siteName}
                    onChange={(e) => setSettings({ ...settings, siteName: e.target.value })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-foreground">Maintenance Mode</p>
                    <p className="text-sm text-muted-foreground">Temporarily disable platform access</p>
                  </div>
                  <Switch
                    checked={settings.maintenanceMode}
                    onCheckedChange={(checked) => setSettings({ ...settings, maintenanceMode: checked })}
                  />
                </div>
                <Button onClick={handleSave}>Save Changes</Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="pages" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Page Visibility</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {PAGE_TOGGLES.map((toggle, index) => (
                  <div
                    key={toggle.key}
                    className={`flex items-center justify-between py-4 ${index < PAGE_TOGGLES.length - 1 ? "border-b border-border/50" : ""}`}
                  >
                    <div>
                      <p className="font-medium text-foreground">{toggle.label}</p>
                      <p className="text-sm text-muted-foreground">{toggle.description}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`text-xs font-medium ${pageStates[toggle.key] ? "text-green-500" : "text-destructive"}`}>
                        {pageStates[toggle.key] ? "Visible" : "Hidden"}
                      </span>
                      <Switch
                        checked={pageStates[toggle.key] || false}
                        onCheckedChange={(checked) => handlePageToggle(toggle.key, checked)}
                        disabled={pageSaving[toggle.key]}
                      />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="trading" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Trading Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label>Default Required Trades</Label>
                  <Input
                    type="number"
                    value={settings.defaultTrades}
                    onChange={(e) => setSettings({ ...settings, defaultTrades: Number.parseInt(e.target.value) })}
                  />
                  <p className="text-sm text-muted-foreground">Number of trades required before users can withdraw</p>
                </div>
                <Button onClick={handleSave}>Save Changes</Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="financial" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Financial Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Minimum Deposit ($)</Label>
                    <Input
                      type="number"
                      value={settings.minDeposit}
                      onChange={(e) => setSettings({ ...settings, minDeposit: Number.parseInt(e.target.value) })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Maximum Withdrawal ($)</Label>
                    <Input
                      type="number"
                      value={settings.maxWithdrawal}
                      onChange={(e) => setSettings({ ...settings, maxWithdrawal: Number.parseInt(e.target.value) })}
                    />
                  </div>
                </div>
                <Button onClick={handleSave}>Save Changes</Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="referral" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Referral Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label>Referral Bonus (%)</Label>
                  <Input
                    type="number"
                    value={settings.referralBonus}
                    onChange={(e) => setSettings({ ...settings, referralBonus: Number.parseInt(e.target.value) })}
                  />
                  <p className="text-sm text-muted-foreground">Percentage bonus awarded for successful referrals</p>
                </div>
                <Button onClick={handleSave}>Save Changes</Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
