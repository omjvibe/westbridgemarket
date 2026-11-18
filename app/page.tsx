"use client"

import { useState } from "react"
import { Navbar } from "@/components/navbar"
import { Ticker } from "@/components/ticker"
import { Footer } from "@/components/footer"
import { FloatingNotification } from "@/components/floating-notification"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import {
  TrendingUp, Shield, Users, BarChart3, Clock, Award, ArrowRight,
  Globe, Zap, Wallet, LineChart, Lock, Smartphone, Headphones,
  Target, Calculator, Gift, Play, FileText, CheckCircle2,
  ExternalLink, Phone, MessageCircle, Send, Check, Server, Cpu, Landmark, Sparkles
} from "lucide-react"
import { ScrollReveal } from "@/components/scroll-reveal"

export default function HomePage() {
  const partners = [
    "Binance", "Coinbase", "TradingView", "MetaTrader 5", "Bloomberg",
    "Reuters", "CoinMarketCap", "Kraken", "Gemini", "Bitfinex",
    "CME Group", "NASDAQ", "Bybit", "OKX", "KuCoin", "Crypto.com"
  ]

  // Investment Calculator State
  const plans = [
    { name: "Starter Plan", dailyReturn: 2.5, durationDays: 7, min: 1000, max: 9999, assetCategory: "crypto", specificAsset: "Bitcoin (BTC)" },
    { name: "Gold Elite Plan", dailyReturn: 4.5, durationDays: 14, min: 10000, max: 49999, assetCategory: "physical", specificAsset: "Gold (Physical/Digital)" },
    { name: "Platinum VIP Plan", dailyReturn: 8.0, durationDays: 45, min: 50000, max: 199999, assetCategory: "stocks", specificAsset: "Apple Inc. (AAPL)" }, // 360% ROI
    { name: "Institutional Plan", dailyReturn: 12.5, durationDays: 60, min: 200000, max: 2500000, assetCategory: "forex", specificAsset: "EUR/USD Currency" } // 750% ROI
  ]

  const [calcPlanIndex, setCalcPlanIndex] = useState(0)
  const [calcAmount, setCalcAmount] = useState(1000)

  const activePlan = plans[calcPlanIndex]
  const totalReturnPercent = activePlan.dailyReturn * activePlan.durationDays
  const dailyProfit = (calcAmount * (activePlan.dailyReturn / 100)).toFixed(2)
  const totalProfit = (calcAmount * (totalReturnPercent / 100)).toFixed(2)
  const totalPayout = (calcAmount + parseFloat(totalProfit)).toFixed(2)

  // Video modal / overlay state
  const [isPlaying, setIsPlaying] = useState(false)

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary selection:text-primary-foreground overflow-x-hidden">
      <Navbar />
      <div className="absolute top-16 left-0 right-0 z-40">
        <Ticker />
      </div>
      <FloatingNotification />

      {/* Modern High-End Hero Section with Background Image */}
      <section className="relative min-h-screen flex items-center justify-start pt-24 pb-20 overflow-hidden">
        {/* Full Viewport Background Image with Premium Left Vignette Overlay */}
        <div className="absolute inset-0 z-0">
          <img
            src="/image/hero.jpg"
            alt="Trading Background"
            className="w-full h-full object-cover object-center scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/95 via-black/70 to-transparent z-10" />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background z-10" />
        </div>

        {/* Decorative Glowing Gradients */}
        <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px] pointer-events-none z-10" />
        <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-[600px] h-[600px] bg-yellow-500/5 rounded-full blur-[150px] pointer-events-none z-10" />

        <div className="container relative z-20 mx-auto px-4 text-left">
          <ScrollReveal animation="slide-up" delay={100} duration={800}>
            <h1 className="text-balance text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold leading-tight tracking-tight text-white mb-6 max-w-3xl">
              Trade Smarter, <span className="bg-gradient-to-r from-primary via-yellow-400 to-yellow-600 bg-clip-text text-transparent">Invest Better</span>
            </h1>
          </ScrollReveal>

          <ScrollReveal animation="slide-up" delay={300} duration={850}>
            <p className="max-w-2xl text-pretty text-base md:text-lg leading-relaxed text-gray-200 mb-10 font-medium">
              Access institutional-grade copy trading, elite signals, and high-yield investment packages. Claim your $10 registration bonus and start growing your wealth today.
            </p>
          </ScrollReveal>

          <ScrollReveal animation="slide-up" delay={500} duration={900}>
            <div className="flex flex-wrap justify-start gap-4 mb-16">
              <Button size="lg" className="h-14 px-8 text-base font-semibold shadow-lg shadow-primary/20 hover:scale-105 transition-transform" asChild>
                <Link href="/auth/signup">
                  Claim $10 Bonus & Signup <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="h-14 px-8 text-base font-semibold border-white/20 text-white hover:bg-white/10 hover:scale-105 transition-transform" asChild>
                <a href="#tutorial">
                  <Play className="mr-2 h-4 w-4 fill-white" /> Watch Tutorial
                </a>
              </Button>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* Stats Section - Placed directly after Hero for premium authority */}
      <section className="relative z-20 -mt-16 container mx-auto px-4">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[
            { value: "$3.8B+", label: "Total Trading Volume", icon: TrendingUp },
            { value: "85,000+", label: "Active Investors", icon: Users },
            { value: "160+", label: "Countries Supported", icon: Globe },
            { value: "99.99%", label: "Platform Uptime", icon: Zap },
          ].map((stat, index) => (
            <ScrollReveal key={index} animation="scale-up" delay={index * 150} duration={600}>
              <Card className="backdrop-blur-md bg-card/60 border-border/80 shadow-xl hover:border-primary transition-all duration-300 hover:-translate-y-1">
                <CardContent className="p-8 text-center flex flex-col items-center">
                  <div className="mb-4 p-3 rounded-full bg-primary/10 text-primary">
                    <stat.icon className="h-6 w-6" />
                  </div>
                  <p className="text-4xl font-extrabold text-foreground tracking-tight">{stat.value}</p>
                  <p className="mt-2 text-sm text-muted-foreground font-medium">{stat.label}</p>
                </CardContent>
              </Card>
            </ScrollReveal>
          ))}
        </div>
      </section>

      {/* Partners Section - Infinite Scroll Carousel */}
      <section className="border-b border-border py-16 overflow-hidden">
        <div className="container mx-auto px-4 mb-8">
          <p className="text-center text-xs font-semibold text-muted-foreground uppercase tracking-widest">
            Liquidity & Market Data Providers
          </p>
        </div>
        <div className="relative w-full">
          <div className="flex animate-scroll whitespace-nowrap">
            {[...partners, ...partners].map((partner, i) => (
              <div
                key={i}
                className="inline-flex mx-8 flex-shrink-0 h-14 w-40 items-center justify-center rounded-xl bg-card/40 border border-border/60 text-sm font-bold text-muted-foreground hover:text-foreground hover:border-primary transition-all cursor-pointer"
              >
                {partner}
              </div>
            ))}
          </div>
        </div>
        <style jsx>{`
          @keyframes scroll {
            0% {
              transform: translateX(0);
            }
            100% {
              transform: translateX(-50%);
            }
          }
          .animate-scroll {
            display: flex;
            width: max-content;
            animation: scroll 35s linear infinite;
          }
          .animate-scroll:hover {
            animation-play-state: paused;
          }
        `}</style>
      </section>

      {/* Investment Plans & Interactive ROI Calculator */}
      <section id="plans" className="container mx-auto px-4 py-24">
        <ScrollReveal animation="slide-up">
          <div className="mx-auto max-w-3xl text-center mb-16">
            <h2 className="text-4xl font-extrabold text-foreground tracking-tight mb-4">
              Maximize Your Yields
            </h2>
            <p className="text-lg text-muted-foreground leading-relaxed">
              Choose a professional portfolio option that aligns with your capital requirements. Simulate potential earnings using our real-time yield calculator.
            </p>
          </div>
        </ScrollReveal>

        {/* Plan Cards Grid */}
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4 mb-16">
          {plans.map((plan, index) => {
            const planROI = plan.dailyReturn * plan.durationDays;
            return (
              <ScrollReveal key={index} animation="slide-up" delay={index * 100}>
                <Card className={`relative flex flex-col justify-between border-border overflow-visible group hover:border-primary transition-all duration-300 ${index === 2 ? 'ring-2 ring-primary bg-primary/5' : ''}`}>
                  {index === 2 && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-[10px] font-bold uppercase tracking-wider py-1 px-4 rounded-full shadow-lg z-10">
                      Most Popular
                    </div>
                  )}
                  <CardContent className="p-6 flex flex-col h-full justify-between">
                    <div>
                      <h3 className="text-xl font-bold text-foreground mb-1">{plan.name}</h3>
                      <div className="mb-4">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                          plan.assetCategory === "physical"
                            ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                            : plan.assetCategory === "forex"
                            ? "bg-teal-500/20 text-teal-300 border border-teal-500/30"
                            : plan.assetCategory === "stocks"
                            ? "bg-purple-500/20 text-purple-300 border border-purple-500/30"
                            : "bg-blue-500/20 text-blue-300 border border-blue-500/30"
                        }`}>
                          {plan.assetCategory} Asset
                        </span>
                        <p className="text-xs text-muted-foreground mt-1 font-semibold">
                          Asset: <span className="text-foreground">{plan.specificAsset}</span>
                        </p>
                      </div>
                      <div className="flex items-baseline gap-1 mb-4">
                        <span className="text-3xl font-extrabold text-foreground">{plan.dailyReturn}%</span>
                        <span className="text-sm text-muted-foreground">/ daily</span>
                      </div>
                      <ul className="space-y-3 mb-6 text-sm text-muted-foreground">
                        <li className="flex items-center gap-2 text-foreground">
                          <Check className="h-4 w-4 text-green-500" />
                          <strong>{plan.durationDays} Days</strong> Duration
                        </li>
                        <li className="flex items-center gap-2">
                          <Check className="h-4 w-4 text-green-500" />
                          <strong>{planROI}%</strong> Total Return (ROI)
                        </li>
                        <li className="flex items-center gap-2">
                          <Check className="h-4 w-4 text-green-500" />
                          Min. Deposit: <strong>${plan.min}</strong>
                        </li>
                        <li className="flex items-center gap-2">
                          <Check className="h-4 w-4 text-green-500" />
                          Max. Deposit: <strong>${plan.max}</strong>
                        </li>
                      </ul>
                    </div>

                    <Button
                      className="w-full mt-4"
                      variant={index === 2 ? 'default' : 'outline'}
                      onClick={() => {
                        setCalcPlanIndex(index);
                        setCalcAmount(plan.min);
                        const element = document.getElementById("calculator");
                        element?.scrollIntoView({ behavior: "smooth" });
                      }}
                    >
                      Select Plan & Calculate
                  </Button>
                  </CardContent>
                </Card>
              </ScrollReveal>
            );
          })}
        </div>

        {/* Premium Interactive ROI Calculator */}
        <ScrollReveal animation="zoom-in" delay={150}>
          <div id="calculator" className="mx-auto max-w-4xl backdrop-blur-md bg-card/40 border border-border/80 rounded-2xl p-6 md:p-8 shadow-2xl">
          <div className="flex items-center gap-3 mb-6">
            <Calculator className="h-6 w-6 text-primary" />
            <h3 className="text-2xl font-bold text-foreground">Investment Returns Calculator</h3>
          </div>

          <div className="grid gap-8 md:grid-cols-2">
            <div className="space-y-6">
              <div>
                <Label className="text-sm font-semibold mb-2 block">1. Select Target Portfolio</Label>
                <div className="grid grid-cols-2 gap-2">
                  {plans.map((p, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setCalcPlanIndex(idx);
                        if (calcAmount < p.min || calcAmount > p.max) {
                          setCalcAmount(p.min);
                        }
                      }}
                      className={`p-3 rounded-lg border text-xs font-bold transition-all text-left ${calcPlanIndex === idx
                        ? "bg-primary border-primary text-primary-foreground"
                        : "bg-background/50 border-border hover:border-primary/50 text-foreground"
                        }`}
                    >
                      {p.name}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <Label htmlFor="amount" className="text-sm font-semibold mb-2 block">
                  2. Enter Investment Principal ($)
                </Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                  <Input
                    id="amount"
                    type="number"
                    value={calcAmount}
                    min={activePlan.min}
                    max={activePlan.max}
                    onChange={(e) => setCalcAmount(parseFloat(e.target.value) || 0)}
                    className="pl-7 h-12 text-lg"
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Range limit for {activePlan.name}: ${activePlan.min} - ${activePlan.max}
                </p>
              </div>
            </div>

            {/* Calculations Dashboard View */}
            <div className="bg-background/60 border border-border/60 rounded-xl p-6 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex justify-between items-center pb-2 border-b border-border/50">
                  <span className="text-sm text-muted-foreground">Portfolio Type</span>
                  <span className="text-sm font-bold text-foreground">{activePlan.name}</span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b border-border/50">
                  <span className="text-sm text-muted-foreground">Interest Rate</span>
                  <span className="text-sm font-bold text-green-500">{activePlan.dailyReturn}% Daily</span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b border-border/50">
                  <span className="text-sm text-muted-foreground">Daily Earnings</span>
                  <span className="text-base font-extrabold text-foreground">${dailyProfit}</span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b border-border/50">
                  <span className="text-sm text-muted-foreground">Total Returns (ROI)</span>
                  <span className="text-base font-extrabold text-green-500">{totalReturnPercent}%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground font-semibold">Net Profit</span>
                  <span className="text-2xl font-extrabold text-primary">${totalProfit}</span>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-border/50 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                  <span className="text-xs text-muted-foreground uppercase block tracking-wider font-semibold">Total Payout</span>
                  <span className="text-2xl font-extrabold text-foreground">${totalPayout}</span>
                </div>
                <Button size="lg" className="w-full sm:w-auto" asChild>
                  <Link href={`/auth/signup?plan=${calcPlanIndex}&amount=${calcAmount}`}>
                    Invest Now <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
        </ScrollReveal>
      </section>

      {/* NEW: Stock Investments Marketing Section */}
      <section className="border-t border-border bg-card/20 py-24 overflow-hidden relative">
        <div className="container mx-auto px-4">
          <div className="grid gap-12 lg:grid-cols-2 items-center">
            <div className="space-y-6">
              <ScrollReveal animation="slide-right" duration={800}>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider border border-primary/20">
                  <Landmark className="h-4 w-4" /> Global Corporate Equities
                </div>
                <h2 className="text-4xl font-extrabold text-foreground tracking-tight leading-tight">
                  Invest in World-Leading Tech & <span className="text-primary">Pre-IPO Companies</span>
                </h2>
                <p className="text-lg leading-relaxed text-muted-foreground">
                  Access direct bulk fraction allocations in Fortune 500 tech leaders and frontier artificial intelligence creators. Build equity portfolios with customizable share entry thresholds.
                </p>

                {/* Stock Logo Badges */}
                <div className="flex flex-wrap items-center gap-3 pt-2">
                  {[
                    { name: "Microsoft", domain: "microsoft.com" },
                    { name: "NVIDIA", domain: "nvidia.com" },
                    { name: "OpenAI", domain: "openai.com" },
                    { name: "Tesla", domain: "tesla.com" },
                    { name: "Apple", domain: "apple.com" },
                    { name: "X Corp", domain: "x.com" },
                  ].map((item, idx) => (
                    <div key={idx} className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-background border border-border/80 text-xs font-semibold text-foreground shadow-sm">
                      <img
                        src={`https://img.logo.dev/${item.domain}?token=live_6a1a28fd-6420-4492-aeb0-b297461d9de2`}
                        alt={item.name}
                        className="h-4 w-4 rounded-full object-contain"
                      />
                      <span>{item.name}</span>
                    </div>
                  ))}
                </div>

                <div className="grid gap-4 sm:grid-cols-2 pt-2">
                  {[
                    { title: "Bulk Fractional Shares", desc: "Buy customized share blocks starting at accessible entry limits." },
                    { title: "Real-Time Value Tracking", desc: "Monitor daily portfolio performance and total ROI yields." },
                    { title: "Pre-IPO Allocations", desc: "Exclusive access to private high-growth AI ventures." },
                    { title: "Instant Execution", desc: "Instant order processing directly backed by your trading balance." },
                  ].map((feat, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded bg-primary/10 text-primary mt-0.5">
                        <Check className="h-4 w-4" />
                      </div>
                      <div>
                        <h4 className="font-bold text-foreground text-sm">{feat.title}</h4>
                        <p className="text-xs text-muted-foreground">{feat.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="pt-4">
                  <Button size="lg" className="h-12 px-6 font-semibold" asChild>
                    <Link href="/auth/signup">
                      Explore Stock Portfolios <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </ScrollReveal>
            </div>

            <div className="relative">
              <ScrollReveal animation="slide-left" duration={800}>
                <div className="relative rounded-2xl overflow-hidden border border-primary/30 shadow-2xl bg-card group">
                  <img
                    src="/image/stocks_marketing.png"
                    alt="Corporate Stock Investment Platform Interface"
                    className="w-full h-auto object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-transparent to-transparent flex items-end p-6">
                    <div className="backdrop-blur-md bg-background/80 border border-border p-4 rounded-xl w-full flex justify-between items-center">
                      <div>
                        <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Active Tech Stocks</p>
                        <p className="text-base font-bold text-foreground">10+ Premium Global Assets</p>
                      </div>
                      <Badge className="bg-green-500 text-white font-bold">Live Trading</Badge>
                    </div>
                  </div>
                </div>
              </ScrollReveal>
            </div>
          </div>
        </div>
      </section>

      {/* NEW: Supercomputer Server Rentals Marketing Section */}
      <section className="border-t border-border bg-slate-950 py-24 overflow-hidden relative text-white">
        <div className="container mx-auto px-4">
          <div className="grid gap-12 lg:grid-cols-2 items-center">
            <div className="relative order-2 lg:order-1">
              <ScrollReveal animation="slide-right" duration={800}>
                <div className="relative rounded-2xl overflow-hidden border border-purple-500/30 shadow-2xl bg-black group">
                  <img
                    src="/image/servers_marketing.png"
                    alt="Supercomputer Compute Cluster Data Center"
                    className="w-full h-auto object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                  <div className="absolute top-4 left-4 backdrop-blur-md bg-black/70 border border-purple-500/40 px-3 py-1.5 rounded-full text-xs font-bold text-purple-300 flex items-center gap-2">
                    <Sparkles className="h-3.5 w-3.5 text-purple-400" /> Up to 22 PH/s Compute Output
                  </div>
                </div>
              </ScrollReveal>
            </div>

            <div className="space-y-6 order-1 lg:order-2">
              <ScrollReveal animation="slide-left" duration={800}>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/20 text-purple-400 text-xs font-bold uppercase tracking-wider border border-purple-500/30">
                  <Server className="h-4 w-4" /> Next-Gen Enterprise Compute
                </div>
                <h2 className="text-4xl font-extrabold text-white tracking-tight leading-tight">
                  Lease High-Performance <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-amber-400 bg-clip-text text-transparent">Supercomputer Rigs</span>
                </h2>
                <p className="text-lg leading-relaxed text-gray-300">
                  Power your crypto operations with dedicated GPU/CPU mining servers. Rent specialized rigs equipped with up to 32x NVIDIA H200 chips on flexible monthly or discounted quarterly leases.
                </p>

                <div className="grid gap-4 sm:grid-cols-2 pt-2">
                  {[
                    { title: "Monthly & Quarterly Terms", desc: "Choose 30-day or 90-day leases with built-in discount pricing." },
                    { title: "Enterprise Hardware Specs", desc: "NVIDIA H100/H200 SXM clusters with high-speed NVMe arrays." },
                    { title: "Automated Daily Returns", desc: "Receive automated return rate payouts directly to your wallet." },
                    { title: "99.99% Hardware Uptime", desc: "Hosted in liquid-cooled institutional data centers worldwide." },
                  ].map((feat, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded bg-purple-500/20 text-purple-400 mt-0.5 border border-purple-500/30">
                        <Check className="h-4 w-4" />
                      </div>
                      <div>
                        <h4 className="font-bold text-white text-sm">{feat.title}</h4>
                        <p className="text-xs text-gray-400">{feat.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="pt-4">
                  <Button size="lg" className="h-12 px-6 font-semibold bg-purple-600 hover:bg-purple-700 text-white shadow-lg shadow-purple-600/20" asChild>
                    <Link href="/auth/signup">
                      Rent Compute Server Node <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </ScrollReveal>
            </div>
          </div>
        </div>
      </section>

      {/* Future Markets & AI Investments Marketing Section */}
      <section className="relative border-t border-border bg-slate-900/60 py-24 backdrop-blur-md overflow-hidden">
        <div className="container mx-auto px-4 relative z-10">
          <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
            <div className="space-y-6">
              <ScrollReveal animation="slide-right" duration={800}>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/20 text-cyan-400 text-xs font-bold uppercase tracking-wider border border-cyan-500/30">
                  <Sparkles className="h-4 w-4" /> Next-Gen Product Vertical
                </div>
                <h2 className="text-4xl font-extrabold text-white tracking-tight leading-tight">
                  Invest in <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-indigo-400 bg-clip-text text-transparent">Future Markets & AI Infrastructure</span>
                </h2>
                <p className="text-lg leading-relaxed text-gray-300">
                  AI is not a single asset class—it is an economic infrastructure stack. Gain exposure to category-defining leaders across 9 versioned thematic portfolios including AI Leaders, Liquid Cooling, Hyperscale Data Centers, and Next-Gen Power Grids.
                </p>

                <div className="grid gap-4 sm:grid-cols-2 pt-2">
                  {[
                    { title: "Versioned Allocation Engine", desc: "Target allocations across semiconductors, compute, energy, and robotics." },
                    { title: "Deterministic Recommendation", desc: "Use the Future Portfolio Builder to align risk and time horizon." },
                    { title: "Institutional Disclosures", desc: "Transparent risk profiles, target yield expectations, and disclosures." },
                    { title: "9 Core Innovation Themes", desc: "From AI Leaders and Nuclear Energy to Physical Robotics and Digital Security." },
                  ].map((feat, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded bg-cyan-500/20 text-cyan-400 mt-0.5 border border-cyan-500/30">
                        <Check className="h-4 w-4" />
                      </div>
                      <div>
                        <h4 className="font-bold text-white text-sm">{feat.title}</h4>
                        <p className="text-xs text-gray-400">{feat.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="pt-4">
                  <Button size="lg" className="h-12 px-6 font-semibold bg-cyan-600 hover:bg-cyan-500 text-white shadow-lg shadow-cyan-600/25" asChild>
                    <Link href="/auth/signup">
                      Explore Future Markets Portfolios <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </ScrollReveal>
            </div>

            <div className="relative">
              <ScrollReveal animation="slide-left" duration={800}>
                <div className="relative mx-auto rounded-2xl border border-cyan-500/30 bg-slate-950/80 p-6 backdrop-blur-xl shadow-2xl space-y-4">
                  <div className="flex items-center justify-between border-b border-gray-800 pb-4">
                    <div>
                      <div className="text-xs text-cyan-400 font-mono">SPOTLIGHT PORTFOLIO</div>
                      <div className="text-lg font-bold text-white">AI Infrastructure Stack</div>
                    </div>
                    <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">22.5% Target APY</Badge>
                  </div>

                  <div className="space-y-3">
                    {[
                      { name: "NVIDIA Corp (GPUs)", weight: "30%" },
                      { name: "Vertiv Liquid Cooling", weight: "20%" },
                      { name: "Equinix Data Centers", weight: "20%" },
                      { name: "Arista 800G Switches", weight: "15%" },
                      { name: "Constellation Nuclear", weight: "15%" },
                    ].map((asset, i) => (
                      <div key={i} className="flex justify-between items-center text-xs p-2 rounded bg-slate-900/80 border border-gray-800">
                        <span className="text-gray-300 font-medium">{asset.name}</span>
                        <span className="font-mono text-cyan-400 font-bold">{asset.weight}</span>
                      </div>
                    ))}
                  </div>

                  <div className="rounded bg-cyan-950/40 p-3 text-[11px] text-cyan-200/80 border border-cyan-500/20 italic">
                    "AI compute demand requires unprecedented physical energy, optical networking, and liquid cooling hardware."
                  </div>
                </div>
              </ScrollReveal>
            </div>
          </div>
        </div>
      </section>

      {/* Video Instructions Section */}
      <section id="tutorial" className="relative border-t border-b border-border bg-slate-950 py-24 overflow-hidden bg-cover bg-center" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=872&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D')" }}>
        <div className="absolute inset-0 bg-slate-950/90 z-0" />

        <div className="container relative z-10 mx-auto px-4">
          <ScrollReveal animation="slide-up">
            <div className="max-w-3xl mx-auto text-center mb-12">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/20 text-primary text-xs font-semibold uppercase tracking-wider mb-4 border border-primary/20">
                Onboarding Tutorial
              </div>
              <h2 className="text-4xl font-extrabold text-white tracking-tight mb-4">
                How to Start Your Journey in 3 Minutes
              </h2>
              <p className="text-lg leading-relaxed text-gray-300">
                Watch our detailed step-by-step video instructions showing how to complete registration, claim your $10 free trading balance, set up your wallet, and run your first investment.
              </p>
            </div>
          </ScrollReveal>

          <ScrollReveal animation="scale-up" delay={200} duration={800}>
            <div className="max-w-5xl mx-auto">
              <div className="aspect-video w-full rounded-2xl border border-white/10 bg-black overflow-hidden shadow-2xl relative group">
                {isPlaying ? (
                  <iframe
                    src="https://www.youtube.com/embed/dbDijzEgo7E?autoplay=1"
                    className="w-full h-full border-0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    title="Introduction Video Tutorial"
                  />
                ) : (
                  <>
                    <img
                      src="https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=872&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
                      alt="Tutorial Cover"
                      className="w-full h-full object-cover filter brightness-70 group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center transition-opacity group-hover:bg-black/50">
                      <button
                        onClick={() => setIsPlaying(true)}
                        className="h-24 w-24 rounded-full bg-primary hover:bg-primary/95 text-white flex items-center justify-center shadow-2xl hover:scale-110 transition-all duration-300 border-4 border-white/20"
                      >
                        <Play className="h-10 w-10 fill-white ml-1" />
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* License and Registration Section */}
      <section className="container mx-auto px-4 py-24 overflow-hidden">
        <div className="grid gap-12 lg:grid-cols-2 items-center">
          <div className="relative order-2 lg:order-1">
            <ScrollReveal animation="slide-right" duration={800}>
              {/* Official Registered Certificate Image Display */}
              <div className="relative group rounded-2xl border border-yellow-500/20 overflow-hidden bg-card shadow-2xl max-w-lg mx-auto bg-gradient-to-br from-yellow-500/5 via-card to-card p-4">
                <div className="absolute top-6 right-6 bg-green-500/20 text-green-400 text-[10px] font-bold px-2 py-1 rounded border border-green-500/30 uppercase tracking-widest z-10">
                  Active & Regulated
                </div>
                <div className="aspect-[4/3] w-full rounded-lg overflow-hidden border border-border bg-black relative">
                  <img
                    src="/license.jpg"
                    alt="Westbridge Market Official License Certificate"
                    className="w-full h-full object-cover object-top filter brightness-95 group-hover:scale-[1.03] transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity duration-300">
                    <Button variant="secondary" asChild className="font-semibold shadow-lg">
                      <a href="/license.jpg" target="_blank" rel="noreferrer">
                        View Document <ExternalLink className="ml-2 h-4 w-4" />
                      </a>
                    </Button>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-border/50 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div>
                    <h4 className="text-sm font-bold text-white tracking-wide">UK Incorporation Certificate</h4>
                    <p className="text-xs text-muted-foreground">Certified Financial Authority License</p>
                  </div>
                  <Button variant="outline" size="sm" asChild>
                    <a href="/license.jpg" download className="flex items-center gap-1 font-semibold">
                      <FileText className="h-4 w-4" /> Download Certificate
                    </a>
                  </Button>
                </div>
              </div>
            </ScrollReveal>
          </div>

          <div className="space-y-6 order-1 lg:order-2">
            <ScrollReveal animation="slide-left" duration={800}>
              <h2 className="text-4xl font-extrabold text-foreground tracking-tight">
                Regulated, Secure & Compliance-Driven
              </h2>
              <p className="text-lg leading-relaxed text-muted-foreground">
                Westbridge Market operates under global corporate standards. We maintain full registration under official jurisdictions to secure your funds with high-grade integrity.
              </p>
              <div className="grid gap-4 sm:grid-cols-2 mt-6">
                {[
                  { title: "Segregated Accounts", desc: "Capital is kept completely separate from operating assets" },
                  { title: "Anti-Money Laundering", desc: "Strict compliance to international financial rules" },
                  { title: "FCA Regulated Framework", desc: "Monitored compliance on margin & capital ratios" },
                  { title: "Quarterly Audits", desc: "Third-party auditing firms verify client safety" }
                ].map((item, index) => (
                  <div key={index} className="flex gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded bg-primary/10 text-primary">
                    <Check className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground text-sm">{item.title}</h4>
                    <p className="text-xs text-muted-foreground">{item.desc}</p>
                  </div>
                </div>
              ))}
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* Security & Compliance Section */}
      <section className="border-t border-border bg-card/10 py-24 overflow-hidden">
        <div className="container mx-auto px-4">
          <div className="grid gap-12 lg:grid-cols-2 items-center">
            <div className="space-y-6">
              <ScrollReveal animation="slide-right" duration={800}>
                <h2 className="text-3xl font-bold text-foreground">
                  Bank-Level Security for Your Assets
                </h2>
                <p className="text-pretty leading-relaxed text-muted-foreground mb-6">
                  Your security is our top priority. We employ multiple layers of protection to ensure your funds and data remain safe at all times.
                </p>
                <div className="grid gap-4 sm:grid-cols-2">
                  {[
                    { icon: Lock, title: "256-bit Encryption", description: "Military-grade encryption for all data" },
                    { icon: Shield, title: "Cold Storage", description: "95% of assets stored offline" },
                    { icon: Smartphone, title: "2FA Protection", description: "Multi-factor authentication" },
                    { icon: Headphones, title: "24/7 Monitoring", description: "Real-time threat detection" },
                  ].map((item, index) => (
                    <div key={index} className="flex gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                        <item.icon className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-foreground">{item.title}</h4>
                        <p className="text-sm text-muted-foreground">{item.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollReveal>
            </div>
            <div className="relative">
              <ScrollReveal animation="slide-left" duration={800} delay={100}>
                <div className="aspect-square w-full overflow-hidden rounded-xl border border-border">
                  <img
                    src="/image/pexels-n-voitkevich-6120214.jpg"
                    alt="Security"
                    className="h-full w-full object-cover"
                  />
                </div>
              </ScrollReveal>
            </div>
          </div>
        </div>
      </section>

      {/* Global Market Access */}
      <section className="border-t border-b border-border bg-card/20 py-24">
        <div className="container mx-auto px-4">
          <ScrollReveal animation="slide-up">
            <div className="mx-auto max-w-3xl text-center mb-12">
              <Globe className="mx-auto h-12 w-12 text-primary" />
              <h2 className="mt-4 text-balance text-3xl font-bold text-foreground">Global Market Access</h2>
              <p className="mt-4 text-pretty leading-relaxed text-muted-foreground">
                Trade across 160+ countries with real-time economic data and market insights.
              </p>
            </div>
          </ScrollReveal>
          
          <ScrollReveal animation="scale-up" delay={200}>
            <Card className="overflow-hidden border-border/80">
              <CardContent className="p-0">
                <div className="aspect-[16/9] w-full">
                  <iframe
                    src="https://s.tradingview.com/embed-widget/market-overview/?locale=en#%7B%22colorTheme%22%3A%22dark%22%2C%22dateRange%22%3A%2212M%22%2C%22showChart%22%3Atrue%2C%22width%22%3A%22100%25%22%2C%22height%22%3A%22100%25%22%2C%22largeChartUrl%22%3A%22%22%2C%22isTransparent%22%3Afalse%2C%22showSymbolLogo%22%3Atrue%2C%22showFloatingTooltip%22%3Afalse%2C%22plotLineColorGrowing%22%3A%22rgba(41%2C%20191%2C%2099%2C%201)%22%2C%22plotLineColorFalling%22%3A%22rgba(241%2C%2096%2C%2082%2C%201)%22%2C%22gridLineColor%22%3A%22rgba(240%2C%20243%2C%20250%2C%200)%22%2C%22scaleFontColor%22%3A%22rgba(120%2C%20123%2C%20134%2C%201)%22%2C%22belowLineFillColorGrowing%22%3A%22rgba(41%2C%20191%2C%2099%2C%200.12)%22%2C%22belowLineFillColorFalling%22%3A%22rgba(241%2C%2096%2C%2082%2C%200.12)%22%2C%22belowLineFillColorGrowingBottom%22%3A%22rgba(41%2C%20191%2C%2099%2C%200)%22%2C%22belowLineFillColorFallingBottom%22%3A%22rgba(241%2C%2096%2C%2082%2C%200)%22%2C%22symbolActiveColor%22%3A%22rgba(41%2C%2098%2C%20255%2C%200.12)%22%2C%22tabs%22%3A%5B%7B%22title%22%3A%22Forex%22%2C%22symbols%22%3A%5B%7B%22s%22%3A%22FX%3AEURUSD%22%7D%2C%7B%22s%22%3A%22FX%3AGBPUSD%22%7D%2C%7B%22s%22%3A%22FX%3AUSDJPY%22%7D%2C%7B%22s%22%3A%22FX%3AAUDUSD%22%7D%5D%7D%2C%7B%22title%22%3A%22Crypto%22%2C%22symbols%22%3A%5B%7B%22s%22%3A%22BINANCE%3ABTCUSDT%22%7D%2C%7B%22s%22%3A%22BINANCE%3AETHUSDT%22%7D%2C%7B%22s%22%3A%22BINANCE%3ASOLUSDT%22%7D%5D%7D%5D%7D"
                    className="h-full w-full border-0"
                    title="Market Overview"
                  />
                </div>
              </CardContent>
            </Card>
          </ScrollReveal>
        </div>
      </section>

      {/* Live & Social Support Section */}
      <section className="container mx-auto px-4 py-24">
        <ScrollReveal animation="slide-up">
          <div className="mx-auto max-w-3xl text-center mb-16">
            <h2 className="text-4xl font-extrabold text-foreground tracking-tight mb-4">
              Dedicated 24/7 Live Support
            </h2>
            <p className="text-lg text-muted-foreground leading-relaxed">
              Have questions? Get immediate answers from our team. We provide round-the-clock support via multiple direct channels.
            </p>
          </div>
        </ScrollReveal>

        <div className="grid gap-6 md:grid-cols-4">
          {[
            {
              title: "Phone Support",
              desc: "Talk directly to our brokers",
              contact: "+1 (256) 286-7576",
              icon: Phone,
              color: "text-blue-500",
              bgColor: "bg-blue-500/10",
              action: "tel:+12562867576"
            },
            {
              title: "WhatsApp Support",
              desc: "Instant text and audio chat",
              contact: "+1 (256) 286-7576",
              icon: MessageCircle,
              color: "text-green-500",
              bgColor: "bg-green-500/10",
              action: "https://wa.me/12562867576"
            },
            {
              title: "Telegram Channel",
              desc: "Join community & daily signals",
              contact: "@WestbridgeMarket",
              icon: Send,
              color: "text-sky-500",
              bgColor: "bg-sky-500/10",
              action: "https://t.me/WestbridgeMarket"
            },
            {
              title: "Email Assistance",
              desc: "Corporate ticketing desk",
              contact: "support@westbridgemarket.app",
              icon: Headphones,
              color: "text-primary",
              bgColor: "bg-primary/10",
              action: "mailto:support@westbridgemarket.app"
            }
          ].map((item, idx) => (
            <ScrollReveal key={idx} animation="slide-up" delay={idx * 150} duration={600}>
              <Card className="border-border/80 hover:border-primary transition-all duration-300 hover:-translate-y-1">
                <CardContent className="p-6 flex flex-col justify-between h-full items-center text-center">
                  <div className={`p-4 rounded-xl ${item.bgColor} ${item.color} mb-4`}>
                    <item.icon className="h-6 w-6" />
                  </div>
                  <h4 className="font-bold text-foreground text-lg mb-1">{item.title}</h4>
                  <p className="text-xs text-muted-foreground mb-4">{item.desc}</p>
                  <a
                    href={item.action}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline mt-auto"
                  >
                    {item.contact} <ExternalLink className="h-3 w-3" />
                  </a>
                </CardContent>
              </Card>
            </ScrollReveal>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-24">
        <ScrollReveal animation="zoom-in" duration={800}>
          <Card className="border-primary relative overflow-hidden bg-cover bg-center" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=872&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D')" }}>
            <div className="absolute inset-0 bg-slate-950/85 z-0" />
            <CardContent className="p-16 text-center relative z-10">
              <Award className="mx-auto h-12 w-12 text-primary" />
              <h2 className="mt-4 text-balance text-4xl font-extrabold text-white tracking-tight">
                Ready to Start Your Investment Journey?
              </h2>
              <p className="mx-auto mt-4 max-w-2xl text-pretty leading-relaxed text-gray-200">
                Sign up today, secure your $10 free account registration bonus instantly, and start building high-yield portfolios with Westbridge Market.
              </p>
              <Button size="lg" className="mt-8 h-12 px-8 font-semibold shadow-lg shadow-primary/20 hover:scale-105 transition-transform" asChild>
                <Link href="/auth/signup">
                  Claim $10 Bonus & Create Account <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        </ScrollReveal>
      </section>

      <Footer />
    </div>
  )
}
