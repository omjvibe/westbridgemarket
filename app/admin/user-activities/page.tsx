"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Activity, TrendingUp, Users, Radio, Cpu, Coins, BarChart3, Save, Search } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

/* eslint-disable @typescript-eslint/no-explicit-any */

export default function AdminUserActivitiesPage() {
  const [investments, setInvestments] = useState<any[]>([])
  const [copyTrades, setCopyTrades] = useState<any[]>([])
  const [signalSubs, setSignalSubs] = useState<any[]>([])
  const [miners, setMiners] = useState<any[]>([])
  const [stakes, setStakes] = useState<any[]>([])
  const [trades, setTrades] = useState<any[]>([])
  const [search, setSearch] = useState("")

  // Inline editing states
  const [editId, setEditId] = useState<string | null>(null)
  const [editValue, setEditValue] = useState("")

  useEffect(() => {
    fetchAll()
  }, [])

  const fetchAll = async () => {
    const supabase = createClient()

    const [invRes, copyRes, sigRes, mineRes, stakeRes, tradeRes] = await Promise.all([
      supabase.from("investments").select("*, users(full_name, email), investment_plans(name)").order("created_at", { ascending: false }),
      supabase.from("copy_subscriptions").select("*, users(full_name, email), copy_experts(display_name)").order("created_at", { ascending: false }),
      supabase.from("signal_subscriptions").select("*, users(full_name, email), signal_providers(display_name)").order("subscribed_at", { ascending: false }),
      supabase.from("user_mining").select("*, users(full_name, email), mining_plans(name)").order("created_at", { ascending: false }),
      supabase.from("user_stakes").select("*, users(full_name, email), staking_pools(name, token)").order("created_at", { ascending: false }),
      supabase.from("trades").select("*, users(full_name, email)").order("created_at", { ascending: false }).limit(100),
    ])

    if (invRes.data) setInvestments(invRes.data)
    if (copyRes.data) setCopyTrades(copyRes.data)
    if (sigRes.data) setSignalSubs(sigRes.data)
    if (mineRes.data) setMiners(mineRes.data)
    if (stakeRes.data) setStakes(stakeRes.data)
    if (tradeRes.data) setTrades(tradeRes.data)
  }

  const filterBySearch = (items: any[]) => {
    if (!search.trim()) return items
    const q = search.toLowerCase()
    return items.filter(item =>
      item.users?.full_name?.toLowerCase().includes(q) ||
      item.users?.email?.toLowerCase().includes(q)
    )
  }

  const saveField = async (table: string, id: string, field: string, value: any) => {
    const supabase = createClient()
    await supabase.from(table).update({ [field]: value }).eq("id", id)
    setEditId(null)
    fetchAll()
  }

  const EditableCell = ({ id, field, value, table, isGreen, isRed }: { id: string; field: string; value: number; table: string; isGreen?: boolean; isRed?: boolean }) => {
    if (editId === `${table}-${id}-${field}`) {
      return (
        <div className="flex items-center gap-1">
          <Input
            type="number"
            step="0.01"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            className="w-24 h-8"
          />
          <Button size="sm" variant="ghost" onClick={() => saveField(table, id, field, parseFloat(editValue))}>
            <Save className="h-3 w-3" />
          </Button>
        </div>
      )
    }
    const colorClass = isRed ? "text-red-500" : isGreen ? "text-green-500" : ""
    return (
      <span
        className={`${colorClass} font-medium cursor-pointer hover:underline`}
        onClick={() => {
          setEditId(`${table}-${id}-${field}`)
          setEditValue(value?.toString() || "0")
        }}
      >
        ${(value || 0).toFixed(2)}
      </span>
    )
  }

  const StatusSelect = ({ id, currentStatus, table, options }: { id: string; currentStatus: string; table: string; options: string[] }) => (
    <Select value={currentStatus} onValueChange={(v) => saveField(table, id, "status", v)}>
      <SelectTrigger className="w-28 h-8"><SelectValue /></SelectTrigger>
      <SelectContent>
        {options.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
      </SelectContent>
    </Select>
  )

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
            <Activity className="h-8 w-8 text-primary" />
            User Activities & P/L
          </h1>
          <p className="mt-1 text-muted-foreground">
            Central hub to view and control all user profits, losses, and rewards across the platform
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid gap-3 grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
          <Card><CardContent className="p-4 text-center">
            <TrendingUp className="h-5 w-5 mx-auto text-primary mb-1" />
            <p className="text-xs text-muted-foreground">Investments</p>
            <p className="text-xl font-bold">{investments.length}</p>
          </CardContent></Card>
          <Card><CardContent className="p-4 text-center">
            <Users className="h-5 w-5 mx-auto text-blue-500 mb-1" />
            <p className="text-xs text-muted-foreground">Copy Trades</p>
            <p className="text-xl font-bold">{copyTrades.length}</p>
          </CardContent></Card>
          <Card><CardContent className="p-4 text-center">
            <Radio className="h-5 w-5 mx-auto text-green-500 mb-1" />
            <p className="text-xs text-muted-foreground">Signal Subs</p>
            <p className="text-xl font-bold">{signalSubs.length}</p>
          </CardContent></Card>
          <Card><CardContent className="p-4 text-center">
            <Cpu className="h-5 w-5 mx-auto text-amber-500 mb-1" />
            <p className="text-xs text-muted-foreground">Miners</p>
            <p className="text-xl font-bold">{miners.length}</p>
          </CardContent></Card>
          <Card><CardContent className="p-4 text-center">
            <Coins className="h-5 w-5 mx-auto text-indigo-500 mb-1" />
            <p className="text-xs text-muted-foreground">Stakes</p>
            <p className="text-xl font-bold">{stakes.length}</p>
          </CardContent></Card>
          <Card><CardContent className="p-4 text-center">
            <BarChart3 className="h-5 w-5 mx-auto text-purple-500 mb-1" />
            <p className="text-xs text-muted-foreground">Trades</p>
            <p className="text-xl font-bold">{trades.length}</p>
          </CardContent></Card>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by user name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        <Tabs defaultValue="investments">
          <TabsList className="flex-wrap">
            <TabsTrigger value="investments">Investments</TabsTrigger>
            <TabsTrigger value="copy">Copy Trading</TabsTrigger>
            <TabsTrigger value="signals">Signals</TabsTrigger>
            <TabsTrigger value="mining">Mining</TabsTrigger>
            <TabsTrigger value="staking">Staking</TabsTrigger>
            <TabsTrigger value="trading">Trading</TabsTrigger>
          </TabsList>

          {/* Investments Tab */}
          <TabsContent value="investments">
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><TrendingUp className="h-5 w-5" /> Investments</CardTitle></CardHeader>
              <CardContent>
                <Table>
                  <TableHeader><TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Plan</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Profit</TableHead>
                    <TableHead>Loss</TableHead>
                    <TableHead>Expected</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow></TableHeader>
                  <TableBody>
                    {filterBySearch(investments).map((inv) => (
                      <TableRow key={inv.id}>
                        <TableCell>
                          <p className="font-medium">{inv.users?.full_name}</p>
                          <p className="text-xs text-muted-foreground">{inv.users?.email}</p>
                        </TableCell>
                        <TableCell>{inv.investment_plans?.name}</TableCell>
                        <TableCell className="font-medium">${inv.amount?.toFixed(2)}</TableCell>
                        <TableCell>
                          <EditableCell id={inv.id} field="current_return" value={inv.current_return} table="investments" isGreen />
                        </TableCell>
                        <TableCell>
                          <EditableCell id={inv.id} field="current_loss" value={inv.current_loss} table="investments" isRed />
                        </TableCell>
                        <TableCell>${inv.expected_return?.toFixed(2)}</TableCell>
                        <TableCell>
                          <StatusSelect id={inv.id} currentStatus={inv.status} table="investments" options={["active", "completed", "cancelled"]} />
                        </TableCell>
                      </TableRow>
                    ))}
                    {filterBySearch(investments).length === 0 && (
                      <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">No investments found.</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Copy Trading Tab */}
          <TabsContent value="copy">
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><Users className="h-5 w-5" /> Copy Trading</CardTitle></CardHeader>
              <CardContent>
                <Table>
                  <TableHeader><TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Expert</TableHead>
                    <TableHead>Invested</TableHead>
                    <TableHead>Profit</TableHead>
                    <TableHead>Loss</TableHead>
                    <TableHead>Active</TableHead>
                  </TableRow></TableHeader>
                  <TableBody>
                    {filterBySearch(copyTrades).map((ct) => (
                      <TableRow key={ct.id}>
                        <TableCell>
                          <p className="font-medium">{ct.users?.full_name}</p>
                          <p className="text-xs text-muted-foreground">{ct.users?.email}</p>
                        </TableCell>
                        <TableCell>{ct.copy_experts?.display_name}</TableCell>
                        <TableCell className="font-medium">${(ct.amount_invested || 0).toFixed(2)}</TableCell>
                        <TableCell>
                          <EditableCell id={ct.id} field="current_profit" value={ct.current_profit} table="copy_subscriptions" isGreen />
                        </TableCell>
                        <TableCell>
                          <EditableCell id={ct.id} field="current_loss" value={ct.current_loss} table="copy_subscriptions" isRed />
                        </TableCell>
                        <TableCell>
                          <Select value={ct.is_active ? "true" : "false"} onValueChange={(v) => saveField("copy_subscriptions", ct.id, "is_active", v === "true")}>
                            <SelectTrigger className="w-24 h-8"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="true">Active</SelectItem>
                              <SelectItem value="false">Inactive</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                      </TableRow>
                    ))}
                    {filterBySearch(copyTrades).length === 0 && (
                      <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">No copy trades found.</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Signals Tab */}
          <TabsContent value="signals">
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><Radio className="h-5 w-5" /> Signal Subscriptions</CardTitle></CardHeader>
              <CardContent>
                <Table>
                  <TableHeader><TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Provider</TableHead>
                    <TableHead>Profit</TableHead>
                    <TableHead>Loss</TableHead>
                    <TableHead>Subscribed</TableHead>
                    <TableHead>Active</TableHead>
                  </TableRow></TableHeader>
                  <TableBody>
                    {filterBySearch(signalSubs).map((sub) => (
                      <TableRow key={sub.id}>
                        <TableCell>
                          <p className="font-medium">{sub.users?.full_name}</p>
                          <p className="text-xs text-muted-foreground">{sub.users?.email}</p>
                        </TableCell>
                        <TableCell>{sub.signal_providers?.display_name}</TableCell>
                        <TableCell>
                          <EditableCell id={sub.id} field="current_profit" value={sub.current_profit} table="signal_subscriptions" isGreen />
                        </TableCell>
                        <TableCell>
                          <EditableCell id={sub.id} field="current_loss" value={sub.current_loss} table="signal_subscriptions" isRed />
                        </TableCell>
                        <TableCell className="text-sm">{new Date(sub.subscribed_at).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <Select value={sub.is_active ? "true" : "false"} onValueChange={(v) => saveField("signal_subscriptions", sub.id, "is_active", v === "true")}>
                            <SelectTrigger className="w-24 h-8"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="true">Active</SelectItem>
                              <SelectItem value="false">Inactive</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                      </TableRow>
                    ))}
                    {filterBySearch(signalSubs).length === 0 && (
                      <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">No signal subscriptions found.</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Mining Tab */}
          <TabsContent value="mining">
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><Cpu className="h-5 w-5" /> Mining</CardTitle></CardHeader>
              <CardContent>
                <Table>
                  <TableHeader><TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Plan</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Earnings</TableHead>
                    <TableHead>Loss</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow></TableHeader>
                  <TableBody>
                    {filterBySearch(miners).map((m) => (
                      <TableRow key={m.id}>
                        <TableCell>
                          <p className="font-medium">{m.users?.full_name}</p>
                          <p className="text-xs text-muted-foreground">{m.users?.email}</p>
                        </TableCell>
                        <TableCell>{m.mining_plans?.name}</TableCell>
                        <TableCell className="font-medium">${m.amount?.toFixed(2)}</TableCell>
                        <TableCell>
                          <EditableCell id={m.id} field="current_earnings" value={m.current_earnings} table="user_mining" isGreen />
                        </TableCell>
                        <TableCell>
                          <EditableCell id={m.id} field="current_loss" value={m.current_loss} table="user_mining" isRed />
                        </TableCell>
                        <TableCell>
                          <StatusSelect id={m.id} currentStatus={m.status} table="user_mining" options={["active", "completed", "cancelled"]} />
                        </TableCell>
                      </TableRow>
                    ))}
                    {filterBySearch(miners).length === 0 && (
                      <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">No miners found.</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Staking Tab */}
          <TabsContent value="staking">
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><Coins className="h-5 w-5" /> Staking</CardTitle></CardHeader>
              <CardContent>
                <Table>
                  <TableHeader><TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Pool</TableHead>
                    <TableHead>Token</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Rewards</TableHead>
                    <TableHead>Loss</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow></TableHeader>
                  <TableBody>
                    {filterBySearch(stakes).map((s) => (
                      <TableRow key={s.id}>
                        <TableCell>
                          <p className="font-medium">{s.users?.full_name}</p>
                          <p className="text-xs text-muted-foreground">{s.users?.email}</p>
                        </TableCell>
                        <TableCell>{s.staking_pools?.name}</TableCell>
                        <TableCell><Badge variant="outline">{s.staking_pools?.token}</Badge></TableCell>
                        <TableCell className="font-medium">${s.amount?.toFixed(2)}</TableCell>
                        <TableCell>
                          <EditableCell id={s.id} field="current_rewards" value={s.current_rewards} table="user_stakes" isGreen />
                        </TableCell>
                        <TableCell>
                          <EditableCell id={s.id} field="current_loss" value={s.current_loss} table="user_stakes" isRed />
                        </TableCell>
                        <TableCell>
                          <StatusSelect id={s.id} currentStatus={s.status} table="user_stakes" options={["active", "completed", "unstaking"]} />
                        </TableCell>
                      </TableRow>
                    ))}
                    {filterBySearch(stakes).length === 0 && (
                      <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">No stakes found.</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Trading Tab */}
          <TabsContent value="trading">
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><BarChart3 className="h-5 w-5" /> Trades</CardTitle></CardHeader>
              <CardContent>
                <Table>
                  <TableHeader><TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Symbol</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>P/L</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow></TableHeader>
                  <TableBody>
                    {filterBySearch(trades).map((t) => (
                      <TableRow key={t.id}>
                        <TableCell>
                          <p className="font-medium">{t.users?.full_name}</p>
                          <p className="text-xs text-muted-foreground">{t.users?.email}</p>
                        </TableCell>
                        <TableCell className="font-medium">{t.symbol}</TableCell>
                        <TableCell>
                          <Badge className={t.trade_type === "buy" ? "bg-green-500" : "bg-red-500"}>{t.trade_type?.toUpperCase()}</Badge>
                        </TableCell>
                        <TableCell>${t.amount?.toFixed(2)}</TableCell>
                        <TableCell>
                          <EditableCell id={t.id} field="profit_loss" value={t.profit_loss} table="trades" isGreen />
                        </TableCell>
                        <TableCell>
                          <StatusSelect id={t.id} currentStatus={t.status} table="trades" options={["open", "closed", "pending"]} />
                        </TableCell>
                      </TableRow>
                    ))}
                    {filterBySearch(trades).length === 0 && (
                      <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">No trades found.</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
