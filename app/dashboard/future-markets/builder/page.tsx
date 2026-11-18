"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Compass,
  ArrowLeft,
  Sparkles,
  CheckCircle2,
  PieChart,
  Shield,
  ArrowRight,
  Loader2,
} from "lucide-react"

export default function FuturePortfolioBuilderPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [riskProfile, setRiskProfile] = useState("GROWTH")
  const [horizon, setHorizon] = useState("3 to 5 Years")
  const [targetAmount, setTargetAmount] = useState("5000")
  const [loading, setLoading] = useState(false)
  const [recommendation, setRecommendation] = useState<any>(null)

  const handleGenerateProposal = async () => {
    try {
      setLoading(true)
      const res = await fetch("/api/future-markets/builder/recommend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          riskProfile,
          horizon,
          targetAmount: Number(targetAmount)
        })
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Recommendation generation failed")

      setRecommendation(data.recommendation)
      setStep(3)
    } catch (err: any) {
      alert(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto space-y-8 p-4 md:p-8 max-w-4xl">
      {/* Back Button */}
      <div>
        <Button asChild variant="ghost" size="sm" className="gap-2">
          <Link href="/dashboard/future-markets">
            <ArrowLeft className="h-4 w-4" /> Return to Future Markets
          </Link>
        </Button>
      </div>

      {/* Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
          <Compass className="h-3.5 w-3.5" /> Deterministic Portfolio Generator
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight text-foreground md:text-4xl">
          Future Portfolio Builder
        </h1>
        <p className="text-sm text-muted-foreground max-w-xl mx-auto">
          Answer a few questions about your investment horizon and risk tolerance to construct a tailored multi-theme portfolio across approved AI & Future Tech products.
        </p>
      </div>

      {/* Step Indicator */}
      <div className="flex items-center justify-center gap-4 text-xs font-semibold">
        <div className={`flex items-center gap-2 ${step >= 1 ? "text-primary" : "text-muted-foreground"}`}>
          <span className="flex h-6 w-6 items-center justify-center rounded-full border border-current">1</span>
          Profile & Capital
        </div>
        <div className="h-px w-8 bg-border" />
        <div className={`flex items-center gap-2 ${step >= 2 ? "text-primary" : "text-muted-foreground"}`}>
          <span className="flex h-6 w-6 items-center justify-center rounded-full border border-current">2</span>
          Review Rules
        </div>
        <div className="h-px w-8 bg-border" />
        <div className={`flex items-center gap-2 ${step >= 3 ? "text-primary" : "text-muted-foreground"}`}>
          <span className="flex h-6 w-6 items-center justify-center rounded-full border border-current">3</span>
          Proposed Portfolio
        </div>
      </div>

      {/* Step 1: Input Form */}
      {step === 1 && (
        <Card className="border-border/60 bg-card/60 backdrop-blur-md">
          <CardHeader>
            <CardTitle>Define Your Strategy Parameters</CardTitle>
            <CardDescription>Select your risk tolerance, time horizon, and target investment amount.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label>Risk Tolerance Profile</Label>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                {[
                  { code: "CONSERVATIVE", label: "Conservative", desc: "Low volatility, utility & power focus" },
                  { code: "MODERATE", label: "Moderate", desc: "Balanced AI Leaders & Grid" },
                  { code: "GROWTH", label: "Growth", desc: "AI Infrastructure & Tech Giants" },
                  { code: "AGGRESSIVE", label: "Aggressive", desc: "Maximum frontier tech exposure" },
                ].map((item) => (
                  <button
                    key={item.code}
                    type="button"
                    onClick={() => setRiskProfile(item.code)}
                    className={`p-3 rounded-lg border text-left transition-all ${
                      riskProfile === item.code
                        ? "border-primary bg-primary/10 font-bold"
                        : "border-border/60 hover:border-border bg-muted/20"
                    }`}
                  >
                    <div className="text-sm font-semibold text-foreground">{item.label}</div>
                    <div className="text-[11px] text-muted-foreground mt-1">{item.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Investment Horizon</Label>
                <select
                  className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={horizon}
                  onChange={(e) => setHorizon(e.target.value)}
                >
                  <option value="1 to 3 Years">1 to 3 Years</option>
                  <option value="3 to 5 Years">3 to 5 Years</option>
                  <option value="5+ Years">5+ Years</option>
                  <option value="7+ Years">7+ Years (Long Term)</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label>Total Capital Allocation ($)</Label>
                <Input
                  type="number"
                  min="1000"
                  value={targetAmount}
                  onChange={(e) => setTargetAmount(e.target.value)}
                />
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <Button onClick={() => setStep(2)} className="gap-2">
                Next: Review Rules <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Confirmation & Execution */}
      {step === 2 && (
        <Card className="border-border/60 bg-card/60 backdrop-blur-md">
          <CardHeader>
            <CardTitle>Recommendation Rules Engine</CardTitle>
            <CardDescription>
              Our recommendation engine operates deterministically according to transparent allocation rules: eligibility ➔ risk profile ➔ horizon ➔ approved products.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg bg-muted/40 p-4 border border-border/40 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Selected Risk Profile:</span>
                <Badge variant="outline">{riskProfile}</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Target Time Horizon:</span>
                <span className="font-medium text-foreground">{horizon}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Capital Allocation:</span>
                <span className="font-bold text-primary">${Number(targetAmount).toLocaleString()}</span>
              </div>
            </div>

            <div className="flex justify-between pt-4">
              <Button variant="outline" onClick={() => setStep(1)}>Back</Button>
              <Button onClick={handleGenerateProposal} disabled={loading} className="gap-2">
                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                Generate Tailored Proposal <Sparkles className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Resulting Proposal */}
      {step === 3 && recommendation && (
        <Card className="border-primary/40 bg-card/60 backdrop-blur-md space-y-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl font-bold flex items-center gap-2 text-primary">
                <PieChart className="h-5 w-5" /> Your Recommended Future Portfolio
              </CardTitle>
              <Badge variant="secondary" className="font-mono text-xs">
                Ruleset {recommendation.rulesetVersion || "v1.0.0"}
              </Badge>
            </div>
            <CardDescription>
              Based on your {recommendation.riskProfile} profile and ${recommendation.targetAmount.toLocaleString()} capital target.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            <div className="space-y-4">
              {recommendation.proposedPortfolio.map((item: any) => (
                <div key={item.productId} className="p-4 rounded-lg bg-muted/30 border border-border/40 space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-bold text-foreground">{item.name}</div>
                      <div className="text-xs text-muted-foreground">{item.themeName} • {item.riskLevel} Risk</div>
                    </div>
                    <div className="text-right">
                      <div className="text-base font-extrabold text-primary font-mono">{item.weightPercentage}%</div>
                      <div className="text-xs text-muted-foreground">${item.allocatedAmount.toLocaleString()}</div>
                    </div>
                  </div>

                  <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full"
                      style={{ width: `${item.weightPercentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-4 flex flex-col sm:flex-row gap-3 justify-between items-center">
              <Button variant="outline" onClick={() => setStep(1)}>Adjust Parameters</Button>
              <Button asChild className="w-full sm:w-auto gap-2">
                <Link href="/dashboard/future-markets">
                  Explore Products & Finalize Allocation <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
