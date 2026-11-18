import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { productId, amount, idempotencyKey } = body

    const numericAmount = Number(amount)
    if (!productId || isNaN(numericAmount) || numericAmount <= 0) {
      return NextResponse.json({ error: "Invalid investment parameters" }, { status: 400 })
    }

    // 1. Idempotency Check
    if (idempotencyKey) {
      const { data: existingTx } = await supabase
        .from("portfolio_transactions")
        .select("id, status")
        .eq("idempotency_key", idempotencyKey)
        .maybeSingle()

      if (existingTx) {
        return NextResponse.json({
          message: "Transaction already processed",
          transactionId: existingTx.id,
          status: existingTx.status,
        })
      }
    }

    // 2. Fetch Product Details
    const { data: product, error: productError } = await supabase
      .from("investment_products")
      .select("*")
      .eq("id", productId)
      .single()

    if (productError || !product) {
      return NextResponse.json({ error: "Investment product not found" }, { status: 404 })
    }

    if (product.status !== "LIVE") {
      return NextResponse.json({ error: "This product is not currently open for new investments" }, { status: 400 })
    }

    if (numericAmount < Number(product.min_investment_amount)) {
      return NextResponse.json({
        error: `Minimum investment for this product is $${Number(product.min_investment_amount).toLocaleString()}`
      }, { status: 400 })
    }

    if (numericAmount > Number(product.max_investment_amount)) {
      return NextResponse.json({
        error: `Maximum investment for this product is $${Number(product.max_investment_amount).toLocaleString()}`
      }, { status: 400 })
    }

    // 3. Fetch User Balance
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("balance_deposit")
      .eq("id", user.id)
      .single()

    if (userError || !userData) {
      return NextResponse.json({ error: "User account not found" }, { status: 404 })
    }

    const currentBalance = Number(userData.balance_deposit || 0)
    if (currentBalance < numericAmount) {
      return NextResponse.json({ error: "Insufficient deposit balance. Please top up your wallet." }, { status: 400 })
    }

    // Calculate Fees (e.g. entry fee if configured)
    const feePercentage = Number(product.fee_percentage || 0)
    const feeAmount = (numericAmount * feePercentage) / 100
    const netInvestedAmount = numericAmount - feeAmount

    // 4. Update User Deposit Balance
    const newBalance = currentBalance - numericAmount
    const { error: balanceError } = await supabase
      .from("users")
      .update({ balance_deposit: newBalance })
      .eq("id", user.id)

    if (balanceError) {
      return NextResponse.json({ error: "Failed to update wallet balance" }, { status: 500 })
    }

    // 5. Check if user already holds this product
    const { data: existingPortfolio } = await supabase
      .from("client_portfolios")
      .select("id, invested_amount, current_value, units")
      .eq("user_id", user.id)
      .eq("product_id", productId)
      .eq("status", "active")
      .maybeSingle()

    let portfolioId = existingPortfolio?.id

    if (existingPortfolio) {
      const updatedInvested = Number(existingPortfolio.invested_amount) + netInvestedAmount
      const updatedValue = Number(existingPortfolio.current_value) + netInvestedAmount
      const updatedUnits = Number(existingPortfolio.units) + (netInvestedAmount / 100)

      const { error: updateError } = await supabase
        .from("client_portfolios")
        .update({
          invested_amount: updatedInvested,
          current_value: updatedValue,
          units: updatedUnits,
          updated_at: new Date().toISOString()
        })
        .eq("id", existingPortfolio.id)

      if (updateError) {
        console.error("Portfolio update error:", updateError)
      }
    } else {
      const navUnits = netInvestedAmount / 100
      const { data: newPortfolio, error: insertError } = await supabase
        .from("client_portfolios")
        .insert({
          user_id: user.id,
          product_id: productId,
          invested_amount: netInvestedAmount,
          current_value: netInvestedAmount,
          current_earnings: 0,
          current_loss: 0,
          units: navUnits,
          status: "active"
        })
        .select("id")
        .single()

      if (insertError) {
        console.error("Portfolio insert error:", insertError)
      } else {
        portfolioId = newPortfolio.id
      }
    }

    // 6. Record Transaction Ledger Entry
    const { data: tx, error: txError } = await supabase
      .from("portfolio_transactions")
      .insert({
        user_id: user.id,
        portfolio_id: portfolioId || null,
        product_id: productId,
        transaction_type: "buy",
        amount: numericAmount,
        fee_amount: feeAmount,
        units: netInvestedAmount / 100,
        status: "completed",
        execution_method: "DIRECT",
        idempotency_key: idempotencyKey || `tx_${Date.now()}_${Math.random().toString(36).substring(7)}`,
        audit_details: {
          product_name: product.name,
          fee_percentage: feePercentage,
          net_invested: netInvestedAmount,
          timestamp: new Date().toISOString()
        }
      })
      .select("id")
      .single()

    if (txError) {
      console.error("Transaction logging error:", txError)
    }

    // 7. Track Analytics Telemetry
    await supabase.from("future_markets_analytics").insert({
      user_id: user.id,
      product_id: productId,
      action_type: "invest",
      metadata: { amount: numericAmount, fee: feeAmount }
    })

    return NextResponse.json({
      success: true,
      message: `Successfully invested $${numericAmount.toLocaleString()} in ${product.name}`,
      transactionId: tx?.id,
      newBalance
    })
  } catch (err: any) {
    console.error("Future Markets investment exception:", err)
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 })
  }
}
