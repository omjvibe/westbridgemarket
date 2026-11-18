"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard,
  Users,
  TrendingUp,
  ArrowDownToLine,
  ArrowUpFromLine,
  Settings,
  LogOut,
  Shield,
  Menu,
  X,
  MessageSquare,
  FileText,
  Radio,
  UserCog,
  Wallet,
  Cpu,
  Coins,
  Activity,
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

export function AdminNav() {
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({})
  const router = useRouter()

  const navEntries: NavEntry[] = [
    { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
    { href: "/admin/users", label: "Users", icon: Users },
    {
      label: "Earn & Trade",
      icon: TrendingUp,
      items: [
        { href: "/admin/investments", label: "Investments", icon: TrendingUp },
        { href: "/admin/future-markets", label: "Future Markets", icon: Sparkles },
        { href: "/admin/stocks", label: "Stocks", icon: Coins },
        { href: "/admin/trades", label: "Trades", icon: UserCog },
        { href: "/admin/copy-experts", label: "Copy Experts", icon: Users },
        { href: "/admin/signal-providers", label: "Signal Providers", icon: Radio },
        { href: "/admin/signals", label: "Signals", icon: Radio },
        { href: "/admin/mining", label: "Mining", icon: Cpu },
        { href: "/admin/staking", label: "Staking", icon: Coins },
      ],
    },
    {
      label: "Finance",
      icon: Wallet,
      items: [
        { href: "/admin/deposits", label: "Deposits", icon: ArrowDownToLine },
        { href: "/admin/withdrawals", label: "Withdrawals", icon: ArrowUpFromLine },
        { href: "/admin/crypto-addresses", label: "Crypto Addresses", icon: Wallet },
      ],
    },
    { href: "/admin/user-activities", label: "User Activities", icon: Activity },
    { href: "/admin/kyc", label: "KYC", icon: Shield },
    { href: "/admin/support", label: "Support", icon: MessageSquare },
    { href: "/admin/blog", label: "Blog", icon: FileText },
    { href: "/admin/settings", label: "Settings", icon: Settings },
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

  const renderNavEntry = (entry: NavEntry, onClickMobile?: () => void) => {
    if (isGroup(entry)) {
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
            isActive && "bg-primary/10 text-primary hover:bg-primary/20 hover:text-primary",
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
          <div className="flex h-16 items-center gap-2 border-b border-border px-6">
            <Shield className="h-6 w-6 text-primary" />
            <span className="font-bold text-foreground">Admin Panel</span>
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
        <div className="flex items-center gap-2">
          <Shield className="h-6 w-6 text-primary" />
          <span className="font-bold text-foreground">Admin</span>
        </div>
        <Button variant="ghost" size="icon" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
          {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
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
          { href: "/admin", icon: LayoutDashboard },
          { href: "/admin/users", icon: Users },
          { href: "/admin/deposits", icon: ArrowDownToLine },
          { href: "/admin/withdrawals", icon: ArrowUpFromLine },
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
