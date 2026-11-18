"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard,
  TrendingUp,
  Wallet,
  Users,
  Radio,
  BarChart3,
  Settings,
  LogOut,
  Home,
  Menu,
  X,
  Sun,
  Moon,
  ArrowDownToLine,
  PieChart,
  Shield,
  Cpu,
  Coins,
  Sparkles,
  ChevronDown,
  type LucideIcon,
} from "lucide-react"
import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

interface NavItem {
  href: string
  label: string
  icon: LucideIcon
}

interface NavGroup {
  label: string
  icon: LucideIcon
  items: NavItem[]
}

type NavEntry = NavItem | NavGroup

function isGroup(entry: NavEntry): entry is NavGroup {
  return "items" in entry
}

export function DashboardNav() {
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [pageVisibility, setPageVisibility] = useState<Record<string, boolean>>({
    investments_page_enabled: true,
    trade_page_enabled: true,
    portfolio_page_enabled: true,
    copy_trading_page_enabled: true,
    signals_page_enabled: true,
    mining_page_enabled: true,
    staking_page_enabled: true,
    stocks_page_enabled: true,
    future_markets_page_enabled: true,
  })
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({})
  const router = useRouter()
  const { theme, setTheme } = useTheme()

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const supabase = createClient()
        const keys = Object.keys(pageVisibility)
        const { data } = await supabase
          .from("site_settings")
          .select("key, value")
          .in("key", keys)
        if (data) {
          const newState = { ...pageVisibility }
          for (const item of data) {
            newState[item.key] = item.value === "true"
          }
          setPageVisibility(newState)
        }
      } catch {
        // If table/setting doesn't exist, default to true
      }
    }
    fetchSettings()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const v = pageVisibility

  // Build earn group items based on visibility
  const earnItems: NavItem[] = [
    ...(v.investments_page_enabled ? [{ href: "/dashboard/investments", label: "Investments", icon: PieChart }] : []),
    ...(v.future_markets_page_enabled ? [{ href: "/dashboard/future-markets", label: "Future Markets", icon: Sparkles }] : []),
    ...(v.stocks_page_enabled ? [{ href: "/dashboard/stocks", label: "Stocks", icon: BarChart3 }] : []),
    ...(v.mining_page_enabled ? [{ href: "/dashboard/mining", label: "Mining", icon: Cpu }] : []),
    ...(v.staking_page_enabled ? [{ href: "/dashboard/staking", label: "Staking", icon: Coins }] : []),
    ...(v.copy_trading_page_enabled ? [{ href: "/dashboard/copy-trading", label: "Copy Trading", icon: Users }] : []),
    ...(v.signals_page_enabled ? [{ href: "/dashboard/signals", label: "Signals", icon: Radio }] : []),
  ]

  // Build trade group items
  const tradeItems: NavItem[] = [
    ...(v.trade_page_enabled ? [{ href: "/dashboard/trade", label: "Trade", icon: TrendingUp }] : []),
    ...(v.portfolio_page_enabled ? [{ href: "/dashboard/portfolio", label: "Portfolio", icon: BarChart3 }] : []),
  ]

  const navEntries: NavEntry[] = [
    { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
    { label: "Earn", icon: Coins, items: earnItems },
    ...(tradeItems.length > 0 ? [{ label: "Trade", icon: TrendingUp, items: tradeItems } as NavGroup] : []),
    { label: "Wallet", icon: Wallet, items: [
      { href: "/dashboard/deposits", label: "Deposits", icon: Wallet },
      { href: "/dashboard/withdrawals", label: "Withdrawals", icon: ArrowDownToLine },
    ]},
    { href: "/dashboard/kyc", label: "Verification", icon: Shield },
    { href: "/dashboard/settings", label: "Settings", icon: Settings },
  ]

  // Auto-expand group if current path is inside it
  useEffect(() => {
    const autoOpen: Record<string, boolean> = {}
    navEntries.forEach(entry => {
      if (isGroup(entry)) {
        if (entry.items.some(item => pathname === item.href || pathname.startsWith(item.href + "/"))) {
          autoOpen[entry.label] = true
        }
      }
    })
    setOpenGroups(prev => ({ ...prev, ...autoOpen }))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname])

  const toggleGroup = (label: string) => {
    setOpenGroups(prev => ({ ...prev, [label]: !prev[label] }))
  }

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/")
  }

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark")
  }

  const renderNavEntry = (entry: NavEntry, onClickMobile?: () => void) => {
    if (isGroup(entry)) {
      if (entry.items.length === 0) return null
      const isOpen = openGroups[entry.label] || false
      const hasActiveChild = entry.items.some(item => pathname === item.href || pathname.startsWith(item.href + "/"))
      return (
        <div key={entry.label}>
          <Button
            variant="ghost"
            className={cn(
              "w-full justify-between gap-3",
              hasActiveChild && "text-primary"
            )}
            onClick={() => toggleGroup(entry.label)}
          >
            <span className="flex items-center gap-3">
              <entry.icon className="h-5 w-5" />
              {entry.label}
            </span>
            <ChevronDown className={cn("h-4 w-4 transition-transform duration-200", isOpen && "rotate-180")} />
          </Button>
          {isOpen && (
            <div className="ml-4 mt-1 space-y-1 border-l border-border/50 pl-3">
              {entry.items.map(item => {
                const isActive = pathname === item.href
                return (
                  <Link key={item.href} href={item.href} onClick={onClickMobile}>
                    <Button
                      variant="ghost"
                      className={cn(
                        "w-full justify-start gap-3 h-9 text-sm",
                        isActive && "bg-primary/10 text-primary hover:bg-primary/20 hover:text-primary"
                      )}
                    >
                      <item.icon className="h-4 w-4" />
                      {item.label}
                    </Button>
                  </Link>
                )
              })}
            </div>
          )}
        </div>
      )
    }

    const isActive = pathname === entry.href
    return (
      <Link key={entry.href} href={entry.href} onClick={onClickMobile}>
        <Button
          variant="ghost"
          className={cn(
            "w-full justify-start gap-3",
            isActive && "bg-primary/10 text-primary hover:bg-primary/20 hover:text-primary"
          )}
        >
          <entry.icon className="h-5 w-5" />
          {entry.label}
        </Button>
      </Link>
    )
  }

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="fixed left-0 top-0 z-40 hidden h-screen w-64 border-r border-border bg-card md:block">
        <div className="flex h-full flex-col">
          <div className="flex h-16 items-center justify-between border-b border-border px-6">
            <Link href="/dashboard" className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center bg-primary rounded">
                <span className="font-mono text-sm font-bold text-primary-foreground">WM</span>
              </div>
              <span className="font-bold text-foreground">Westbridge</span>
            </Link>
            <Button variant="ghost" size="icon" onClick={toggleTheme} className="h-8 w-8">
              {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
          </div>
          <nav className="flex-1 space-y-1 overflow-y-auto p-4">
            {navEntries.map(entry => renderNavEntry(entry))}
          </nav>
          <div className="border-t border-border p-4">
            <Button variant="ghost" className="w-full justify-start gap-3 text-destructive" onClick={handleLogout}>
              <LogOut className="h-5 w-5" />
              Logout
            </Button>
          </div>
        </div>
      </aside>

      {/* Mobile Header */}
      <header className="fixed left-0 right-0 top-0 z-50 flex h-16 items-center justify-between border-b border-border bg-card px-4 md:hidden">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center bg-primary rounded">
            <span className="font-mono text-sm font-bold text-primary-foreground">WM</span>
          </div>
          <span className="font-bold text-foreground">Westbridge</span>
        </Link>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={toggleTheme}>
            {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </Button>
          <Button variant="ghost" size="icon" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </header>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 overflow-y-auto bg-background md:hidden" style={{ top: "64px" }}>
          <nav className="flex flex-col gap-1 p-4">
            {navEntries.map(entry => renderNavEntry(entry, () => setMobileMenuOpen(false)))}
            <Button
              variant="ghost"
              className="w-full justify-start gap-3 text-destructive"
              onClick={() => {
                setMobileMenuOpen(false)
                handleLogout()
              }}
            >
              <LogOut className="h-5 w-5" />
              Logout
            </Button>
          </nav>
        </div>
      )}

      {/* Mobile Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-around border-t border-border bg-card py-2 md:hidden">
        {[
          { href: "/dashboard", icon: Home },
          ...(v.trade_page_enabled ? [{ href: "/dashboard/trade", icon: TrendingUp }] : []),
          ...(v.portfolio_page_enabled ? [{ href: "/dashboard/portfolio", icon: BarChart3 }] : []),
          { href: "/dashboard/deposits", icon: Wallet },
          { href: "/dashboard/withdrawals", icon: ArrowDownToLine },
        ].map((item) => {
          const isActive = pathname === item.href
          return (
            <Link key={item.href} href={item.href}>
              <Button
                variant="ghost"
                size="icon"
                className={cn("h-12 w-12", isActive && "bg-primary/10 text-primary hover:bg-primary/20")}
              >
                <item.icon className="h-5 w-5" />
              </Button>
            </Link>
          )
        })}
      </nav>
    </>
  )
}
