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
    { name: "Platinum VIP Plan", dailyReturn: 8.0, durationDays: 45, min: 50000, max: 199999, assetCategory: "stocks", specificAsset: "Apple Inc. (AAPL)" },
    { name: "Institutional Plan", dailyReturn: 12.5, durationDays: 60, min: 200000, max: 2500000, assetCategory: "forex", specificAsset: "EUR/USD Currency" }
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
    <div className="min-h-screen bg-[#090d14] text-gray-100 selection:bg-[#f04e23] selection:text-white overflow-x-hidden">
      <Navbar />
      <div className="border-b border-white/10 bg-[#080b11]">
        <Ticker />
      </div>
      <FloatingNotification />

      {/* ========================================================= */}
      {/* 01 / HERO SECTION (Architectural, High-Contrast Editorial)  */}
      {/* ========================================================= */}
      <section className="relative min-h-[92vh] flex items-center justify-start overflow-hidden border-b border-white/10">
        {/* Full Viewport Architectural Cityscape Background */}
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.unsplash.com/photo-1453284441168-8780c9f52097?q=80&w=2000&auto=format&fit=crop"
            alt="Westbridge Market Skyscraper Financial Architecture"
            className="w-full h-full object-cover object-center filter brightness-[0.6] contrast-[1.15]"
          />
          {/* Deep slate-navy moody architectural overlays matching reference */}
          <div className="absolute inset-0 bg-[#090d14]/75 mix-blend-multiply" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#090d14]/90 via-[#090d14]/50 to-[#090d14]/85" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#090d14] via-transparent to-[#090d14]/40" />
        </div>

        {/* Left Vertical Architectural Rail */}
        <div className="hidden lg:flex absolute left-8 top-1/2 -translate-y-1/2 flex-col items-center gap-6 z-20 pointer-events-none select-none">
          <span className="text-[10px] font-mono tracking-[0.3em] uppercase text-gray-400 rotate-[-90deg] origin-center whitespace-nowrap">
            INVEST WISELY
          </span>
          <div className="w-[1px] h-20 bg-white/20 mt-8" />
        </div>

        {/* Top-Right Micro-Copy (Editorial / Data annotation from reference) */}
        <div className="hidden md:flex absolute top-12 right-8 lg:right-16 max-w-xs flex-col items-start text-left z-20">
          <p className="text-xs text-gray-300 leading-relaxed font-normal">
            We manage institutional-grade crypto, equities, and physical assets for more than{" "}
            <span className="text-white font-semibold underline decoration-[#f04e23] underline-offset-4">
              85,000 clients
            </span>{" "}
            worldwide.
          </p>
          <Link
            href="/about"
            className="mt-2 inline-flex items-center text-xs font-semibold text-white hover:text-[#f04e23] transition-colors gap-1.5 group"
          >
            <span>Platform Overview</span>
            <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>

        {/* Hero Main Content */}
        <div className="container relative z-20 mx-auto px-6 sm:px-12 lg:px-24 py-20 text-left">
          {/* Section 01 Crosshair Marker */}
          <ScrollReveal animation="slide-up" delay={50} duration={600}>
            <div className="relative inline-flex items-center mb-6">
              <span className="font-mono text-3xl sm:text-4xl md:text-5xl font-light text-white tracking-widest">
                01
              </span>
              <div className="absolute inset-y-1/2 -left-4 -right-4 h-[1px] bg-white/40" />
            </div>
          </ScrollReveal>

          {/* Headline in High-Contrast Editorial Serif */}
          <ScrollReveal animation="slide-up" delay={150} duration={700}>
            <h1 className="font-editorial text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-normal leading-[1.05] tracking-tight text-white mb-8 max-w-3xl">
              Trade Smarter,
              <br />
              Invest Better.
            </h1>
          </ScrollReveal>

          {/* Coral Line & Original Subtitle Copy */}
          <ScrollReveal animation="slide-up" delay={250} duration={750}>
            <div className="max-w-xl">
              <div className="w-12 h-[2px] bg-[#f04e23] mb-5" />
              <p className="text-sm sm:text-base leading-relaxed text-gray-300 font-normal mb-8">
                Access institutional-grade copy trading, elite signals, and high-yield investment packages. Claim your $10 registration bonus and start growing your wealth today.
              </p>

              {/* Minimalist Action Links */}
              <div className="flex flex-wrap items-center gap-6 pt-2">
                <Link
                  href="/auth/signup"
                  className="inline-flex items-center gap-2 text-sm font-semibold tracking-wide text-white hover:text-[#f04e23] transition-colors group"
                >
                  <span className="border-b border-transparent group-hover:border-[#f04e23] pb-0.5">
                    Claim $10 Bonus & Signup
                  </span>
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>

                <span className="text-white/20">|</span>

                <a
                  href="#tutorial"
                  className="inline-flex items-center gap-2 text-sm font-semibold tracking-wide text-gray-400 hover:text-white transition-colors group"
                >
                  <span className="border-b border-transparent group-hover:border-white pb-0.5">
                    Watch Tutorial
                  </span>
                  <Play className="h-3.5 w-3.5 fill-current transition-transform group-hover:scale-110" />
                </a>
              </div>
            </div>
          </ScrollReveal>
        </div>

        {/* Bottom-Right Floating Service Card (Solid Deep Slate-Navy Box from reference) */}
        <div className="hidden lg:block absolute bottom-12 right-8 lg:right-16 z-20 w-80 bg-[#131a27] border border-white/10 p-6 text-left">
          <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-[#f04e23] mb-4 font-bold flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-[#f04e23] inline-block" />
            Core Capabilities
          </div>
          <ul className="space-y-3 text-xs text-gray-300 font-medium">
            <li className="flex items-center gap-2.5">
              <span className="h-1.5 w-1.5 rounded-full bg-gray-400 shrink-0" />
              <span>Institutional copy trading</span>
            </li>
            <li className="flex items-center gap-2.5">
              <span className="h-1.5 w-1.5 rounded-full bg-gray-400 shrink-0" />
              <span>Currency & crypto exchange</span>
            </li>
            <li className="flex items-center gap-2.5">
              <span className="h-1.5 w-1.5 rounded-full bg-gray-400 shrink-0" />
              <span>Multi-network instant settlement</span>
            </li>
            <li className="flex items-center gap-2.5">
              <span className="h-1.5 w-1.5 rounded-full bg-gray-400 shrink-0" />
              <span>Automated high-yield portfolios</span>
            </li>
            <li className="flex items-center gap-2.5">
              <span className="h-1.5 w-1.5 rounded-full bg-gray-400 shrink-0" />
              <span>Enterprise supercomputer clusters</span>
            </li>
            <li className="flex items-center gap-2.5">
              <span className="h-1.5 w-1.5 rounded-full bg-gray-400 shrink-0" />
              <span>Regulated custody & cold storage</span>
            </li>
          </ul>
        </div>

        {/* Blueprint Hairline Framing across the bottom */}
        <div className="absolute bottom-6 left-8 right-8 lg:left-16 lg:right-16 h-[1px] bg-white/10 hidden md:block z-10" />
      </section>

      {/* ========================================================= */}
      {/* 02 / STATS SECTION (Architectural Grid, Crisp Metrics)    */}
      {/* ========================================================= */}
      <section className="border-b border-white/10 bg-[#0b0f17]">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-white/10">
            {[
              { value: "$3.8B+", label: "Total Trading Volume", icon: TrendingUp },
              { value: "85,000+", label: "Active Investors", icon: Users },
              { value: "160+", label: "Countries Supported", icon: Globe },
              { value: "99.99%", label: "Platform Uptime", icon: Zap },
            ].map((stat, index) => (
              <ScrollReveal key={index} animation="slide-up" delay={index * 100} duration={500}>
                <div className="p-8 text-left group hover:bg-white/[0.02] transition-colors">
                  <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-[#f04e23] mb-3 font-semibold">
                    0{index + 1} / METRIC
                  </div>
                  <p className="font-editorial text-3xl sm:text-4xl lg:text-5xl font-normal text-white tracking-tight">
                    {stat.value}
                  </p>
                  <p className="mt-2 text-xs font-mono uppercase tracking-wider text-gray-400">
                    {stat.label}
                  </p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* 03 / PARTNERS & LIQUIDITY (Minimalist Badges)             */}
      {/* ========================================================= */}
      <section className="border-b border-white/10 py-12 bg-[#090d14] overflow-hidden">
        <div className="container mx-auto px-4 mb-6">
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-mono uppercase tracking-[0.25em] text-[#f04e23] font-bold">
              03
            </span>
            <div className="w-6 h-[1px] bg-white/20" />
            <p className="text-[11px] font-mono text-gray-400 uppercase tracking-widest">
              Liquidity & Market Data Providers
            </p>
          </div>
        </div>
        <div className="relative w-full">
          <div className="flex animate-scroll whitespace-nowrap">
            {[...partners, ...partners].map((partner, i) => (
              <div
                key={i}
                className="inline-flex mx-4 flex-shrink-0 h-11 px-6 items-center justify-center border border-white/10 bg-[#0e131d] text-xs font-mono tracking-wider text-gray-400 hover:text-white hover:border-[#f04e23] transition-colors"
              >
                {partner}
              </div>
            ))}
          </div>
        </div>
        <style jsx>{`
          @keyframes scroll {
            0% { transform: translateX(0); }
            100% { transform: translateX(-50%); }
          }
          .animate-scroll {
            display: flex;
            width: max-content;
            animation: scroll 40s linear infinite;
          }
          .animate-scroll:hover {
            animation-play-state: paused;
          }
        `}</style>
      </section>

      {/* ========================================================= */}
      {/* 04 / INVESTMENT PLANS & INTERACTIVE CALCULATOR            */}
      {/* ========================================================= */}
      <section id="plans" className="border-b border-white/10 py-24 bg-[#0a0e17]">
        <div className="container mx-auto px-4">
          <ScrollReveal animation="slide-up">
            <div className="max-w-3xl mb-16 text-left">
              <div className="flex items-center gap-3 mb-3">
                <span className="text-[10px] font-mono uppercase tracking-[0.25em] text-[#f04e23] font-bold">
                  04
                </span>
                <div className="w-8 h-[1px] bg-white/20" />
                <span className="text-[11px] font-mono uppercase tracking-widest text-gray-400">
                  Yield Portfolios
                </span>
              </div>
              <h2 className="font-editorial text-3xl sm:text-4xl md:text-5xl font-normal text-white tracking-tight mb-4">
                Maximize Your Yields.
              </h2>
              <div className="w-12 h-[2px] bg-[#f04e23] mb-4" />
              <p className="text-sm sm:text-base text-gray-400 leading-relaxed max-w-2xl">
                Choose a professional portfolio option that aligns with your capital requirements. Simulate potential earnings using our real-time yield calculator.
              </p>
            </div>
          </ScrollReveal>

          {/* Plan Cards Grid (Flat Matte Cards, No Shadows, Clean Lines) */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-16">
            {plans.map((plan, index) => {
              const planROI = plan.dailyReturn * plan.durationDays;
              const isFeatured = index === 2;
              return (
                <ScrollReveal key={index} animation="slide-up" delay={index * 100}>
                  <div
                    className={`relative flex flex-col justify-between p-6 border transition-all ${
                      isFeatured
                        ? "border-[#f04e23] bg-[#121825]"
                        : "border-white/10 bg-[#0e131d] hover:border-white/30"
                    }`}
                  >
                    {isFeatured && (
                      <div className="absolute top-0 right-0 bg-[#f04e23] text-white text-[9px] font-mono font-bold uppercase tracking-widest py-1 px-3">
                        Most Popular
                      </div>
                    )}

                    <div>
                      <div className="text-[10px] font-mono uppercase tracking-wider text-gray-400 mb-1">
                        Tier 0{index + 1}
                      </div>
                      <h3 className="font-editorial text-2xl font-normal text-white mb-3">
                        {plan.name}
                      </h3>

                      <div className="mb-6 pb-4 border-b border-white/10">
                        <span className="inline-block border border-white/20 px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider text-gray-300 mb-2">
                          {plan.assetCategory} Asset
                        </span>
                        <p className="text-xs text-gray-400 font-mono">
                          Target: <span className="text-white">{plan.specificAsset}</span>
                        </p>
                      </div>

                      <div className="flex items-baseline gap-1 mb-6">
                        <span className="font-editorial text-4xl font-normal text-white">
                          {plan.dailyReturn}%
                        </span>
                        <span className="text-xs font-mono text-gray-400 uppercase tracking-wider">
                          / daily
                        </span>
                      </div>

                      <ul className="space-y-3 mb-8 text-xs font-mono text-gray-300">
                        <li className="flex items-center justify-between py-1 border-b border-white/5">
                          <span className="text-gray-400">Duration</span>
                          <span className="text-white font-semibold">{plan.durationDays} Days</span>
                        </li>
                        <li className="flex items-center justify-between py-1 border-b border-white/5">
                          <span className="text-gray-400">Total ROI</span>
                          <span className="text-[#f04e23] font-bold">+{planROI}%</span>
                        </li>
                        <li className="flex items-center justify-between py-1 border-b border-white/5">
                          <span className="text-gray-400">Min. Deposit</span>
                          <span className="text-white">${plan.min.toLocaleString()}</span>
                        </li>
                        <li className="flex items-center justify-between py-1">
                          <span className="text-gray-400">Max. Deposit</span>
                          <span className="text-white">${plan.max.toLocaleString()}</span>
                        </li>
                      </ul>
                    </div>

                    <button
                      type="button"
                      className={`w-full py-3 text-xs font-mono uppercase tracking-wider transition-colors ${
                        isFeatured
                          ? "bg-[#f04e23] hover:bg-[#d84018] text-white font-bold"
                          : "border border-white/20 hover:border-white text-white hover:bg-white/5"
                      }`}
                      onClick={() => {
                        setCalcPlanIndex(index);
                        setCalcAmount(plan.min);
                        const element = document.getElementById("calculator");
                        element?.scrollIntoView({ behavior: "smooth" });
                      }}
                    >
                      Select Plan & Calculate
                    </button>
                  </div>
                </ScrollReveal>
              );
            })}
          </div>

          {/* Flat Matte ROI Calculator (No Blur, No Heavy Shadow) */}
          <ScrollReveal animation="slide-up" delay={150}>
            <div id="calculator" className="border border-white/10 bg-[#0e131d] p-8 md:p-10">
              <div className="flex items-center gap-3 mb-8 pb-4 border-b border-white/10">
                <span className="text-[10px] font-mono uppercase tracking-[0.25em] text-[#f04e23] font-bold">
                  CALCULATOR
                </span>
                <div className="w-6 h-[1px] bg-white/20" />
                <h3 className="font-editorial text-2xl text-white font-normal">
                  Investment Returns Calculator
                </h3>
              </div>

              <div className="grid gap-10 md:grid-cols-2">
                <div className="space-y-6">
                  <div>
                    <Label className="text-xs font-mono uppercase tracking-wider text-gray-400 mb-3 block">
                      1. Select Target Portfolio
                    </Label>
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
                          className={`p-3 text-xs font-mono uppercase tracking-wider text-left border transition-colors ${
                            calcPlanIndex === idx
                              ? "bg-[#f04e23] border-[#f04e23] text-white font-bold"
                              : "bg-[#121825] border-white/10 hover:border-white/30 text-gray-300"
                          }`}
                        >
                          {p.name}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="amount" className="text-xs font-mono uppercase tracking-wider text-gray-400 mb-3 block">
                      2. Enter Investment Principal ($)
                    </Label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-mono text-base">$</span>
                      <Input
                        id="amount"
                        type="number"
                        value={calcAmount}
                        min={activePlan.min}
                        max={activePlan.max}
                        onChange={(e) => setCalcAmount(parseFloat(e.target.value) || 0)}
                        className="pl-8 h-12 text-base font-mono bg-[#121825] border-white/10 rounded-none text-white focus:border-[#f04e23]"
                      />
                    </div>
                    <p className="text-[11px] font-mono text-gray-400 mt-2">
                      Allowed limit: ${activePlan.min.toLocaleString()} - ${activePlan.max.toLocaleString()} USD
                    </p>
                  </div>
                </div>

                {/* Calculations Dashboard View */}
                <div className="border border-white/10 bg-[#121825] p-6 flex flex-col justify-between">
                  <div className="space-y-4">
                    <div className="flex justify-between items-center pb-3 border-b border-white/10 text-xs font-mono">
                      <span className="text-gray-400 uppercase tracking-wider">Portfolio</span>
                      <span className="font-bold text-white">{activePlan.name}</span>
                    </div>
                    <div className="flex justify-between items-center pb-3 border-b border-white/10 text-xs font-mono">
                      <span className="text-gray-400 uppercase tracking-wider">Interest Rate</span>
                      <span className="font-bold text-emerald-400">{activePlan.dailyReturn}% Daily</span>
                    </div>
                    <div className="flex justify-between items-center pb-3 border-b border-white/10 text-xs font-mono">
                      <span className="text-gray-400 uppercase tracking-wider">Daily Profit</span>
                      <span className="font-bold text-white">${dailyProfit}</span>
                    </div>
                    <div className="flex justify-between items-center pb-3 border-b border-white/10 text-xs font-mono">
                      <span className="text-gray-400 uppercase tracking-wider">Total Return (ROI)</span>
                      <span className="font-bold text-emerald-400">+{totalReturnPercent}%</span>
                    </div>
                    <div className="flex justify-between items-center pt-2">
                      <span className="text-xs font-mono uppercase tracking-wider text-gray-400">Net Profit</span>
                      <span className="font-editorial text-3xl font-normal text-white">${totalProfit}</span>
                    </div>
                  </div>

                  <div className="mt-8 pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-6">
                    <div>
                      <span className="text-[10px] font-mono text-gray-400 uppercase tracking-widest block">Total Payout</span>
                      <span className="font-editorial text-3xl font-normal text-[#f04e23]">${totalPayout}</span>
                    </div>
                    <Button
                      size="lg"
                      className="w-full sm:w-auto h-12 px-8 text-xs font-mono uppercase tracking-wider font-bold bg-[#f04e23] hover:bg-[#d84018] text-white rounded-none shadow-none"
                      asChild
                    >
                      <Link href={`/auth/signup?plan=${calcPlanIndex}&amount=${calcAmount}`}>
                        Invest Now <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* ========================================================= */}
      {/* 05 / STOCKS & PRE-IPO EQUITIES (Architectural Minimal)   */}
      {/* ========================================================= */}
      <section className="border-b border-white/10 py-24 bg-[#080b11]">
        <div className="container mx-auto px-4">
          <div className="grid gap-12 lg:grid-cols-2 items-center">
            <div className="space-y-6">
              <ScrollReveal animation="slide-right" duration={700}>
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-[10px] font-mono uppercase tracking-[0.25em] text-[#f04e23] font-bold">
                    05
                  </span>
                  <div className="w-8 h-[1px] bg-white/20" />
                  <span className="text-[11px] font-mono uppercase tracking-widest text-gray-400">
                    Corporate Equities
                  </span>
                </div>

                <h2 className="font-editorial text-3xl sm:text-4xl md:text-5xl font-normal text-white tracking-tight leading-tight">
                  Invest in World-Leading Tech & Pre-IPO Companies.
                </h2>
                <div className="w-12 h-[2px] bg-[#f04e23] mb-4" />

                <p className="text-sm sm:text-base leading-relaxed text-gray-400">
                  Access direct bulk fraction allocations in Fortune 500 tech leaders and frontier artificial intelligence creators. Build equity portfolios with customizable share entry thresholds.
                </p>

                {/* Stock Logo Badges (Flat, Clean) */}
                <div className="flex flex-wrap items-center gap-2 pt-2">
                  {[
                    { name: "Microsoft", domain: "microsoft.com" },
                    { name: "NVIDIA", domain: "nvidia.com" },
                    { name: "OpenAI", domain: "openai.com" },
                    { name: "Tesla", domain: "tesla.com" },
                    { name: "Apple", domain: "apple.com" },
                    { name: "X Corp", domain: "x.com" },
                  ].map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-2 px-3 py-1.5 border border-white/10 bg-[#0e131d] text-xs font-mono text-gray-300"
                    >
                      <img
                        src={`https://img.logo.dev/${item.domain}?token=live_6a1a28fd-6420-4492-aeb0-b297461d9de2`}
                        alt={item.name}
                        className="h-3.5 w-3.5 rounded-full object-contain"
                      />
                      <span>{item.name}</span>
                    </div>
                  ))}
                </div>

                <div className="grid gap-4 sm:grid-cols-2 pt-4">
                  {[
                    { title: "Bulk Fractional Shares", desc: "Buy customized share blocks starting at accessible entry limits." },
                    { title: "Real-Time Value Tracking", desc: "Monitor daily portfolio performance and total ROI yields." },
                    { title: "Pre-IPO Allocations", desc: "Exclusive access to private high-growth AI ventures." },
                    { title: "Instant Execution", desc: "Instant order processing directly backed by your trading balance." },
                  ].map((feat, i) => (
                    <div key={i} className="border-l border-white/10 pl-3">
                      <h4 className="font-mono text-xs uppercase tracking-wider text-white font-bold">{feat.title}</h4>
                      <p className="text-xs text-gray-400 mt-1">{feat.desc}</p>
                    </div>
                  ))}
                </div>

                <div className="pt-4">
                  <Button
                    size="lg"
                    className="h-12 px-8 text-xs font-mono uppercase tracking-wider font-bold bg-[#f04e23] hover:bg-[#d84018] text-white rounded-none shadow-none"
                    asChild
                  >
                    <Link href="/auth/signup">
                      Explore Stock Portfolios <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </ScrollReveal>
            </div>

            <div className="relative">
              <ScrollReveal animation="slide-left" duration={700}>
                <div className="border border-white/10 bg-[#0e131d] overflow-hidden">
                  <img
                    src="/image/stocks_marketing.png"
                    alt="Corporate Stock Investment Platform Interface"
                    className="w-full h-auto object-cover filter contrast-[1.05]"
                  />
                  <div className="p-4 border-t border-white/10 bg-[#121825] flex justify-between items-center text-xs font-mono">
                    <div>
                      <p className="text-gray-400 uppercase tracking-wider text-[10px]">Active Tech Stocks</p>
                      <p className="text-white font-bold">10+ Premium Global Assets</p>
                    </div>
                    <span className="text-[10px] font-mono uppercase tracking-widest text-[#f04e23] border border-[#f04e23]/30 px-2 py-1">
                      Live Trading
                    </span>
                  </div>
                </div>
              </ScrollReveal>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* 06 / ENTERPRISE COMPUTE SERVER RENTALS (No Neon Glows)   */}
      {/* ========================================================= */}
      <section className="border-b border-white/10 py-24 bg-[#0a0e17]">
        <div className="container mx-auto px-4">
          <div className="grid gap-12 lg:grid-cols-2 items-center">
            <div className="relative order-2 lg:order-1">
              <ScrollReveal animation="slide-right" duration={700}>
                <div className="border border-white/10 bg-[#0e131d] overflow-hidden">
                  <img
                    src="/image/servers_marketing.png"
                    alt="Supercomputer Compute Cluster Data Center"
                    className="w-full h-auto object-cover"
                  />
                  <div className="p-4 border-t border-white/10 bg-[#121825] flex items-center justify-between text-xs font-mono">
                    <span className="text-gray-400">Compute Density</span>
                    <span className="text-white font-bold">Up to 22 PH/s Output</span>
                  </div>
                </div>
              </ScrollReveal>
            </div>

            <div className="space-y-6 order-1 lg:order-2">
              <ScrollReveal animation="slide-left" duration={700}>
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-[10px] font-mono uppercase tracking-[0.25em] text-[#f04e23] font-bold">
                    06
                  </span>
                  <div className="w-8 h-[1px] bg-white/20" />
                  <span className="text-[11px] font-mono uppercase tracking-widest text-gray-400">
                    Enterprise Compute
                  </span>
                </div>

                <h2 className="font-editorial text-3xl sm:text-4xl md:text-5xl font-normal text-white tracking-tight leading-tight">
                  Lease High-Performance Supercomputer Rigs.
                </h2>
                <div className="w-12 h-[2px] bg-[#f04e23] mb-4" />

                <p className="text-sm sm:text-base leading-relaxed text-gray-400">
                  Power your crypto operations with dedicated GPU/CPU mining servers. Rent specialized rigs equipped with up to 32x NVIDIA H200 chips on flexible monthly or discounted quarterly leases.
                </p>

                <div className="grid gap-4 sm:grid-cols-2 pt-4">
                  {[
                    { title: "Monthly & Quarterly Terms", desc: "Choose 30-day or 90-day leases with built-in discount pricing." },
                    { title: "Enterprise Hardware Specs", desc: "NVIDIA H100/H200 SXM clusters with high-speed NVMe arrays." },
                    { title: "Automated Daily Returns", desc: "Receive automated return rate payouts directly to your wallet." },
                    { title: "99.99% Hardware Uptime", desc: "Hosted in liquid-cooled institutional data centers worldwide." },
                  ].map((feat, i) => (
                    <div key={i} className="border-l border-white/10 pl-3">
                      <h4 className="font-mono text-xs uppercase tracking-wider text-white font-bold">{feat.title}</h4>
                      <p className="text-xs text-gray-400 mt-1">{feat.desc}</p>
                    </div>
                  ))}
                </div>

                <div className="pt-4">
                  <Button
                    size="lg"
                    className="h-12 px-8 text-xs font-mono uppercase tracking-wider font-bold bg-[#f04e23] hover:bg-[#d84018] text-white rounded-none shadow-none"
                    asChild
                  >
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

      {/* ========================================================= */}
      {/* 07 / FUTURE MARKETS & AI INFRASTRUCTURE                   */}
      {/* ========================================================= */}
      <section className="border-b border-white/10 py-24 bg-[#080b11]">
        <div className="container mx-auto px-4">
          <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
            <div className="space-y-6">
              <ScrollReveal animation="slide-right" duration={700}>
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-[10px] font-mono uppercase tracking-[0.25em] text-[#f04e23] font-bold">
                    07
                  </span>
                  <div className="w-8 h-[1px] bg-white/20" />
                  <span className="text-[11px] font-mono uppercase tracking-widest text-gray-400">
                    Next-Gen Asset Vertical
                  </span>
                </div>

                <h2 className="font-editorial text-3xl sm:text-4xl md:text-5xl font-normal text-white tracking-tight leading-tight">
                  Invest in Future Markets & AI Infrastructure.
                </h2>
                <div className="w-12 h-[2px] bg-[#f04e23] mb-4" />

                <p className="text-sm sm:text-base leading-relaxed text-gray-400">
                  AI is not a single asset class—it is an economic infrastructure stack. Gain exposure to category-defining leaders across 9 versioned thematic portfolios including AI Leaders, Liquid Cooling, Hyperscale Data Centers, and Next-Gen Power Grids.
                </p>

                <div className="grid gap-4 sm:grid-cols-2 pt-4">
                  {[
                    { title: "Versioned Allocation Engine", desc: "Target allocations across semiconductors, compute, energy, and robotics." },
                    { title: "Deterministic Recommendation", desc: "Use the Future Portfolio Builder to align risk and time horizon." },
                    { title: "Institutional Disclosures", desc: "Transparent risk profiles, target yield expectations, and disclosures." },
                    { title: "9 Core Innovation Themes", desc: "From AI Leaders and Nuclear Energy to Physical Robotics and Digital Security." },
                  ].map((feat, i) => (
                    <div key={i} className="border-l border-white/10 pl-3">
                      <h4 className="font-mono text-xs uppercase tracking-wider text-white font-bold">{feat.title}</h4>
                      <p className="text-xs text-gray-400 mt-1">{feat.desc}</p>
                    </div>
                  ))}
                </div>

                <div className="pt-4">
                  <Button
                    size="lg"
                    className="h-12 px-8 text-xs font-mono uppercase tracking-wider font-bold bg-[#f04e23] hover:bg-[#d84018] text-white rounded-none shadow-none"
                    asChild
                  >
                    <Link href="/auth/signup">
                      Explore Future Markets Portfolios <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </ScrollReveal>
            </div>

            <div className="relative">
              <ScrollReveal animation="slide-left" duration={700}>
                <div className="border border-white/10 bg-[#0e131d] p-6 space-y-4">
                  <div className="flex items-center justify-between border-b border-white/10 pb-4">
                    <div>
                      <div className="text-[10px] font-mono text-[#f04e23] uppercase tracking-wider">Spotlight Portfolio</div>
                      <div className="font-editorial text-xl font-normal text-white">AI Infrastructure Stack</div>
                    </div>
                    <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-400 border border-emerald-500/30 px-2 py-1">
                      22.5% Target APY
                    </span>
                  </div>

                  <div className="space-y-2 font-mono text-xs">
                    {[
                      { name: "NVIDIA Corp (GPUs)", weight: "30%" },
                      { name: "Vertiv Liquid Cooling", weight: "20%" },
                      { name: "Equinix Data Centers", weight: "20%" },
                      { name: "Arista 800G Switches", weight: "15%" },
                      { name: "Constellation Nuclear", weight: "15%" },
                    ].map((asset, i) => (
                      <div key={i} className="flex justify-between items-center p-2.5 bg-[#121825] border border-white/5">
                        <span className="text-gray-300">{asset.name}</span>
                        <span className="text-[#f04e23] font-bold">{asset.weight}</span>
                      </div>
                    ))}
                  </div>

                  <div className="p-3 bg-[#121825] border-l-2 border-[#f04e23] text-xs text-gray-400 italic">
                    "AI compute demand requires unprecedented physical energy, optical networking, and liquid cooling hardware."
                  </div>
                </div>
              </ScrollReveal>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* 08 / VIDEO INSTRUCTIONS & TUTORIAL                        */}
      {/* ========================================================= */}
      <section id="tutorial" className="border-b border-white/10 py-24 bg-[#0a0e17]">
        <div className="container mx-auto px-4">
          <ScrollReveal animation="slide-up">
            <div className="max-w-3xl mx-auto text-center mb-12">
              <div className="flex items-center justify-center gap-3 mb-3">
                <span className="text-[10px] font-mono uppercase tracking-[0.25em] text-[#f04e23] font-bold">
                  08
                </span>
                <div className="w-8 h-[1px] bg-white/20" />
                <span className="text-[11px] font-mono uppercase tracking-widest text-gray-400">
                  Onboarding Tutorial
                </span>
              </div>
              <h2 className="font-editorial text-3xl sm:text-4xl md:text-5xl font-normal text-white tracking-tight mb-4">
                How to Start Your Journey in 3 Minutes.
              </h2>
              <div className="w-12 h-[2px] bg-[#f04e23] mx-auto mb-4" />
              <p className="text-sm sm:text-base leading-relaxed text-gray-400 max-w-2xl mx-auto">
                Watch our detailed step-by-step video instructions showing how to complete registration, claim your $10 free trading balance, set up your wallet, and run your first investment.
              </p>
            </div>
          </ScrollReveal>

          <ScrollReveal animation="slide-up" delay={200} duration={700}>
            <div className="max-w-4xl mx-auto border border-white/10 bg-[#0e131d] overflow-hidden">
              <div className="aspect-video w-full bg-black relative group">
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
                      src="/image/pexels-pixabay-534216.jpg"
                      alt="Tutorial Cover"
                      className="w-full h-full object-cover filter brightness-[0.5] contrast-[1.1]"
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <button
                        onClick={() => setIsPlaying(true)}
                        className="h-20 w-20 bg-[#f04e23] hover:bg-[#d84018] text-white flex items-center justify-center transition-transform hover:scale-105"
                        aria-label="Play Tutorial Video"
                      >
                        <Play className="h-8 w-8 fill-white ml-1" />
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* ========================================================= */}
      {/* 09 / REGULATION & COMPLIANCE                              */}
      {/* ========================================================= */}
      <section className="border-b border-white/10 py-24 bg-[#080b11]">
        <div className="container mx-auto px-4">
          <div className="grid gap-12 lg:grid-cols-2 items-center">
            <div className="relative order-2 lg:order-1">
              <ScrollReveal animation="slide-right" duration={700}>
                <div className="border border-white/10 bg-[#0e131d] p-6 max-w-lg mx-auto">
                  <div className="flex justify-between items-center mb-4 pb-3 border-b border-white/10">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-gray-400">Official Certificate</span>
                    <span className="text-[10px] font-mono uppercase tracking-widest text-emerald-400 border border-emerald-500/30 px-2 py-0.5">
                      Active & Regulated
                    </span>
                  </div>

                  <div className="aspect-[4/3] w-full border border-white/10 bg-black relative group overflow-hidden">
                    <img
                      src="/license.jpg"
                      alt="Westbridge Market Official License Certificate"
                      className="w-full h-full object-cover object-top filter brightness-95"
                    />
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                      <Button variant="secondary" asChild className="rounded-none text-xs font-mono uppercase tracking-wider">
                        <a href="/license.jpg" target="_blank" rel="noreferrer">
                          View Document <ExternalLink className="ml-2 h-3.5 w-3.5" />
                        </a>
                      </Button>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div>
                      <h4 className="text-xs font-mono uppercase tracking-wider text-white font-bold">UK Incorporation Certificate</h4>
                      <p className="text-[11px] font-mono text-gray-400">Certified Financial Authority License</p>
                    </div>
                    <Button variant="outline" size="sm" asChild className="rounded-none text-xs font-mono border-white/20">
                      <a href="/license.jpg" download className="flex items-center gap-1.5">
                        <FileText className="h-3.5 w-3.5" /> Download
                      </a>
                    </Button>
                  </div>
                </div>
              </ScrollReveal>
            </div>

            <div className="space-y-6 order-1 lg:order-2">
              <ScrollReveal animation="slide-left" duration={700}>
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-[10px] font-mono uppercase tracking-[0.25em] text-[#f04e23] font-bold">
                    09
                  </span>
                  <div className="w-8 h-[1px] bg-white/20" />
                  <span className="text-[11px] font-mono uppercase tracking-widest text-gray-400">
                    Compliance Framework
                  </span>
                </div>

                <h2 className="font-editorial text-3xl sm:text-4xl md:text-5xl font-normal text-white tracking-tight leading-tight">
                  Regulated, Secure & Compliance-Driven.
                </h2>
                <div className="w-12 h-[2px] bg-[#f04e23] mb-4" />

                <p className="text-sm sm:text-base leading-relaxed text-gray-400">
                  Westbridge Market operates under global corporate standards. We maintain full registration under official jurisdictions to secure your funds with high-grade integrity.
                </p>

                <div className="grid gap-4 sm:grid-cols-2 pt-2">
                  {[
                    { title: "Segregated Accounts", desc: "Capital is kept completely separate from operating assets." },
                    { title: "Anti-Money Laundering", desc: "Strict compliance to international financial rules." },
                    { title: "FCA Regulated Framework", desc: "Monitored compliance on margin & capital ratios." },
                    { title: "Quarterly Audits", desc: "Third-party auditing firms verify client safety." },
                  ].map((item, index) => (
                    <div key={index} className="border-l border-white/10 pl-3">
                      <h4 className="font-mono text-xs uppercase tracking-wider text-white font-bold">{item.title}</h4>
                      <p className="text-xs text-gray-400 mt-1">{item.desc}</p>
                    </div>
                  ))}
                </div>
              </ScrollReveal>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* 10 / ASSET SECURITY (Flat Architectural Pillars)          */}
      {/* ========================================================= */}
      <section className="border-b border-white/10 py-24 bg-[#0a0e17]">
        <div className="container mx-auto px-4">
          <div className="grid gap-12 lg:grid-cols-2 items-center">
            <div className="space-y-6">
              <ScrollReveal animation="slide-right" duration={700}>
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-[10px] font-mono uppercase tracking-[0.25em] text-[#f04e23] font-bold">
                    10
                  </span>
                  <div className="w-8 h-[1px] bg-white/20" />
                  <span className="text-[11px] font-mono uppercase tracking-widest text-gray-400">
                    Asset Security
                  </span>
                </div>

                <h2 className="font-editorial text-3xl sm:text-4xl md:text-5xl font-normal text-white tracking-tight leading-tight">
                  Bank-Level Security for Your Assets.
                </h2>
                <div className="w-12 h-[2px] bg-[#f04e23] mb-4" />

                <p className="text-sm sm:text-base leading-relaxed text-gray-400 mb-6">
                  Your security is our top priority. We employ multiple layers of protection to ensure your funds and data remain safe at all times.
                </p>

                <div className="grid gap-4 sm:grid-cols-2">
                  {[
                    { title: "256-bit Encryption", description: "Military-grade encryption for all data transit." },
                    { title: "Cold Storage", description: "95% of digital assets kept strictly offline." },
                    { title: "2FA Protection", description: "Multi-factor authentication on all withdrawals." },
                    { title: "24/7 Monitoring", description: "Automated real-time anomaly detection." },
                  ].map((item, index) => (
                    <div key={index} className="p-4 border border-white/10 bg-[#0e131d]">
                      <h4 className="font-mono text-xs uppercase tracking-wider text-white font-bold">{item.title}</h4>
                      <p className="text-xs text-gray-400 mt-1">{item.description}</p>
                    </div>
                  ))}
                </div>
              </ScrollReveal>
            </div>

            <div className="relative">
              <ScrollReveal animation="slide-left" duration={700}>
                <div className="border border-white/10 bg-[#0e131d] overflow-hidden">
                  <img
                    src="/image/pexels-n-voitkevich-6120214.jpg"
                    alt="Security Vault Integrity"
                    className="w-full h-auto object-cover filter contrast-[1.05]"
                  />
                </div>
              </ScrollReveal>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* 11 / GLOBAL MARKET ACCESS (TradingView Widget)            */}
      {/* ========================================================= */}
      <section className="border-b border-white/10 py-24 bg-[#080b11]">
        <div className="container mx-auto px-4">
          <ScrollReveal animation="slide-up">
            <div className="max-w-3xl mb-12 text-left">
              <div className="flex items-center gap-3 mb-2">
                <span className="text-[10px] font-mono uppercase tracking-[0.25em] text-[#f04e23] font-bold">
                  11
                </span>
                <div className="w-8 h-[1px] bg-white/20" />
                <span className="text-[11px] font-mono uppercase tracking-widest text-gray-400">
                  Global Feed
                </span>
              </div>
              <h2 className="font-editorial text-3xl sm:text-4xl md:text-5xl font-normal text-white tracking-tight">
                Global Market Access.
              </h2>
              <div className="w-12 h-[2px] bg-[#f04e23] mb-4" />
              <p className="text-sm sm:text-base leading-relaxed text-gray-400">
                Trade across 160+ countries with real-time economic data and institutional market insights.
              </p>
            </div>
          </ScrollReveal>

          <ScrollReveal animation="slide-up" delay={150}>
            <div className="border border-white/10 bg-[#0e131d] overflow-hidden">
              <div className="aspect-[16/9] w-full">
                <iframe
                  src="https://s.tradingview.com/embed-widget/market-overview/?locale=en#%7B%22colorTheme%22%3A%22dark%22%2C%22dateRange%22%3A%2212M%22%2C%22showChart%22%3Atrue%2C%22width%22%3A%22100%25%22%2C%22height%22%3A%22100%25%22%2C%22largeChartUrl%22%3A%22%22%2C%22isTransparent%22%3Afalse%2C%22showSymbolLogo%22%3Atrue%2C%22showFloatingTooltip%22%3Afalse%2C%22plotLineColorGrowing%22%3A%22rgba(41%2C%20191%2C%2099%2C%201)%22%2C%22plotLineColorFalling%22%3A%22rgba(241%2C%2096%2C%2082%2C%201)%22%2C%22gridLineColor%22%3A%22rgba(240%2C%20243%2C%20250%2C%200)%22%2C%22scaleFontColor%22%3A%22rgba(120%2C%20123%2C%20134%2C%201)%22%2C%22belowLineFillColorGrowing%22%3A%22rgba(41%2C%20191%2C%2099%2C%200.12)%22%2C%22belowLineFillColorFalling%22%3A%22rgba(241%2C%2096%2C%2082%2C%200.12)%22%2C%22belowLineFillColorGrowingBottom%22%3A%22rgba(41%2C%20191%2C%2099%2C%200)%22%2C%22belowLineFillColorFallingBottom%22%3A%22rgba(241%2C%2096%2C%2082%2C%200)%22%2C%22symbolActiveColor%22%3A%22rgba(41%2C%2098%2C%20255%2C%200.12)%22%2C%22tabs%22%3A%5B%7B%22title%22%3A%22Forex%22%2C%22symbols%22%3A%5B%7B%22s%22%3A%22FX%3AEURUSD%22%7D%2C%7B%22s%22%3A%22FX%3AGBPUSD%22%7D%2C%7B%22s%22%3A%22FX%3AUSDJPY%22%7D%2C%7B%22s%22%3A%22FX%3AAUDUSD%22%7D%5D%7D%2C%7B%22title%22%3A%22Crypto%22%2C%22symbols%22%3A%5B%7B%22s%22%3A%22BINANCE%3ABTCUSDT%22%7D%2C%7B%22s%22%3A%22BINANCE%3AETHUSDT%22%7D%2C%7B%22s%22%3A%22BINANCE%3ASOLUSDT%22%7D%5D%7D%5D%7D"
                  className="h-full w-full border-0"
                  title="Market Overview"
                />
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* ========================================================= */}
      {/* 12 / DEDICATED 24/7 SUPPORT                               */}
      {/* ========================================================= */}
      <section className="border-b border-white/10 py-24 bg-[#0a0e17]">
        <div className="container mx-auto px-4">
          <ScrollReveal animation="slide-up">
            <div className="max-w-3xl mb-16 text-left">
              <div className="flex items-center gap-3 mb-2">
                <span className="text-[10px] font-mono uppercase tracking-[0.25em] text-[#f04e23] font-bold">
                  12
                </span>
                <div className="w-8 h-[1px] bg-white/20" />
                <span className="text-[11px] font-mono uppercase tracking-widest text-gray-400">
                  Direct Channels
                </span>
              </div>
              <h2 className="font-editorial text-3xl sm:text-4xl md:text-5xl font-normal text-white tracking-tight">
                Dedicated 24/7 Live Support.
              </h2>
              <div className="w-12 h-[2px] bg-[#f04e23] mb-4" />
              <p className="text-sm sm:text-base leading-relaxed text-gray-400">
                Have questions? Get immediate answers from our team. We provide round-the-clock support via multiple direct channels.
              </p>
            </div>
          </ScrollReveal>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-white/10 border border-white/10 bg-[#0e131d]">
            {[
              {
                title: "Phone Support",
                desc: "Talk directly to our brokers",
                contact: "+1 (256) 286-7576",
                icon: Phone,
                action: "tel:+12562867576"
              },
              {
                title: "WhatsApp Support",
                desc: "Instant text and audio chat",
                contact: "+1 (256) 286-7576",
                icon: MessageCircle,
                action: "https://wa.me/12562867576"
              },
              {
                title: "Telegram Channel",
                desc: "Join community & daily signals",
                contact: "@WestbridgeMarket",
                icon: Send,
                action: "https://t.me/WestbridgeMarket"
              },
              {
                title: "Email Assistance",
                desc: "Corporate ticketing desk",
                contact: "support@westbridgemarket.app",
                icon: Headphones,
                action: "mailto:support@westbridgemarket.app"
              }
            ].map((item, idx) => (
              <ScrollReveal key={idx} animation="slide-up" delay={idx * 100} duration={500}>
                <div className="p-8 text-left flex flex-col justify-between h-full group hover:bg-white/[0.02] transition-colors">
                  <div>
                    <div className="text-[10px] font-mono uppercase tracking-wider text-[#f04e23] mb-4">
                      Channel 0{idx + 1}
                    </div>
                    <h4 className="font-mono text-xs uppercase tracking-wider text-white font-bold mb-1">
                      {item.title}
                    </h4>
                    <p className="text-xs text-gray-400 mb-6">{item.desc}</p>
                  </div>
                  <a
                    href={item.action}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-mono text-gray-300 hover:text-[#f04e23] transition-colors border-t border-white/10 pt-4"
                  >
                    <span>{item.contact}</span>
                    <ArrowRight className="h-3 w-3" />
                  </a>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* 13 / FINAL CALL TO ACTION (Architectural Banner)          */}
      {/* ========================================================= */}
      <section className="py-24 bg-[#080b11]">
        <div className="container mx-auto px-4">
          <ScrollReveal animation="slide-up" duration={700}>
            <div className="border border-white/10 bg-[#0e131d] p-10 md:p-16 text-left relative overflow-hidden">
              <div className="max-w-2xl relative z-10">
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-[10px] font-mono uppercase tracking-[0.25em] text-[#f04e23] font-bold">
                    13
                  </span>
                  <div className="w-8 h-[1px] bg-white/20" />
                  <span className="text-[11px] font-mono uppercase tracking-widest text-gray-400">
                    Get Started
                  </span>
                </div>

                <h2 className="font-editorial text-3xl sm:text-5xl md:text-6xl font-normal text-white tracking-tight leading-tight mb-4">
                  Ready to Start Your Investment Journey?
                </h2>
                <div className="w-14 h-[2px] bg-[#f04e23] mb-6" />

                <p className="text-sm sm:text-base leading-relaxed text-gray-300 mb-8 max-w-xl">
                  Sign up today, secure your $10 free account registration bonus instantly, and start building high-yield portfolios with Westbridge Market.
                </p>

                <Button
                  size="lg"
                  className="h-14 px-8 text-xs font-mono uppercase tracking-wider font-bold bg-[#f04e23] hover:bg-[#d84018] text-white rounded-none shadow-none"
                  asChild
                >
                  <Link href="/auth/signup">
                    Claim $10 Bonus & Create Account <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>

              {/* Decorative Blueprint Corner Accent */}
              <div className="absolute right-0 bottom-0 w-32 h-32 border-l border-t border-white/5 pointer-events-none hidden sm:block" />
            </div>
          </ScrollReveal>
        </div>
      </section>

      <Footer />
    </div>
  )
}
