import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    const body = await request.json()
    const { riskProfile = "GROWTH", horizon = "3 to 5 Years", targetAmount = 5000, preferredThemes = [] } = body

    // Fetch Live Investment Products
    const { data: products } = await supabase
      .from("investment_products")
      .select("*, investment_themes(name, slug)")
      .eq("status", "LIVE")

    if (!products || products.length === 0) {
      return NextResponse.json({ error: "No live products available for recommendation" }, { status: 400 })
    }

    // Deterministic Rule Matching Matrix
    // Maps Risk Profile -> Target Weight Allocations
    let targetWeights: Record<string, number> = {}

    switch (riskProfile.toUpperCase()) {
      case "CONSERVATIVE":
        targetWeights = {
          "next-gen-power-grid": 50,
          "frontier-ai-leaders": 30,
          "ai-infrastructure-stack": 20
        }
        break
      case "MODERATE":
        targetWeights = {
          "frontier-ai-leaders": 45,
          "ai-infrastructure-stack": 35,
          "next-gen-power-grid": 20
        }
        break
      case "AGGRESSIVE":
        targetWeights = {
          "ai-infrastructure-stack": 50,
          "frontier-ai-leaders": 30,
          "next-gen-power-grid": 20
        }
        break
      case "GROWTH":
      default:
        targetWeights = {
          "ai-infrastructure-stack": 40,
          "frontier-ai-leaders": 40,
          "next-gen-power-grid": 20
        }
        break
    }

    const proposedPortfolio = products.map((prod) => {
      const weight = targetWeights[prod.slug] || 15
      const allocatedAmount = (Number(targetAmount) * weight) / 100
      return {
        productId: prod.id,
        name: prod.name,
        slug: prod.slug,
        themeName: prod.investment_themes?.name || "AI & Future Tech",
        riskLevel: prod.risk_level,
        weightPercentage: weight,
        allocatedAmount,
        targetReturnRate: prod.target_return_rate
      }
    }).sort((a, b) => b.weightPercentage - a.weightPercentage)

    // Store audit recommendation record if user is authenticated
    if (user) {
      await supabase.from("future_portfolio_recommendations").insert({
        user_id: user.id,
        risk_profile_code: riskProfile,
        investment_horizon: horizon,
        inputs: { riskProfile, horizon, targetAmount, preferredThemes },
        proposed_allocations: proposedPortfolio,
        ruleset_version: "v1.0.0-deterministic"
      })
    }

    return NextResponse.json({
      success: true,
      rulesetVersion: "v1.0.0-deterministic",
      recommendation: {
        riskProfile,
        horizon,
        targetAmount: Number(targetAmount),
        proposedPortfolio
      }
    })
  } catch (err: any) {
    console.error("Future Portfolio Builder exception:", err)
    return NextResponse.json({ error: err.message || "Recommendation calculation error" }, { status: 500 })
  }
}
