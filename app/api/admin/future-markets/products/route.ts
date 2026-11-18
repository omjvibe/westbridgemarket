import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    // Check admin status
    const { data: admin } = await supabase
      .from("admin_users")
      .select("id")
      .eq("id", user.id)
      .single()

    if (!admin) return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 })

    const { data: products, error } = await supabase
      .from("investment_products")
      .select("*, investment_themes(name, slug), portfolio_allocations(*, portfolio_assets(*))")
      .order("created_at", { ascending: false })

    if (error) throw error

    return NextResponse.json({ products })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to fetch products" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { data: admin } = await supabase
      .from("admin_users")
      .select("id")
      .eq("id", user.id)
      .single()

    if (!admin) return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 })

    const body = await request.json()
    const {
      theme_id, name, slug, thesis, summary, risk_level,
      min_investment_amount, max_investment_amount, status = "DRAFT",
      fee_percentage, target_return_rate, rebalancing_frequency,
      educational_content, risk_disclosures, reason = "Admin product registration"
    } = body

    const { data: newProduct, error } = await supabase
      .from("investment_products")
      .insert({
        theme_id,
        name,
        slug: slug || name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
        thesis,
        summary,
        risk_level,
        min_investment_amount: Number(min_investment_amount),
        max_investment_amount: Number(max_investment_amount),
        status,
        fee_percentage: Number(fee_percentage),
        target_return_rate: Number(target_return_rate),
        rebalancing_frequency,
        educational_content,
        risk_disclosures
      })
      .select("*")
      .single()

    if (error) throw error

    // Create Audit Log
    await supabase.from("audit_logs").insert({
      admin_id: user.id,
      action: "CREATE_PRODUCT",
      entity_type: "investment_products",
      entity_id: newProduct.id,
      previous_value: null,
      new_value: newProduct,
      reason
    })

    return NextResponse.json({ success: true, product: newProduct })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Product creation failed" }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { data: admin } = await supabase
      .from("admin_users")
      .select("id")
      .eq("id", user.id)
      .single()

    if (!admin) return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 })

    const body = await request.json()
    const { id, reason = "Admin state transition", ...updates } = body

    if (!id) return NextResponse.json({ error: "Product ID is required" }, { status: 400 })

    // Fetch previous state for audit log
    const { data: previousState } = await supabase
      .from("investment_products")
      .select("*")
      .eq("id", id)
      .single()

    const { data: updatedProduct, error } = await supabase
      .from("investment_products")
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq("id", id)
      .select("*")
      .single()

    if (error) throw error

    // Create Immutable Audit Log
    await supabase.from("audit_logs").insert({
      admin_id: user.id,
      action: updates.status ? `UPDATE_STATUS_${updates.status}` : "UPDATE_PRODUCT",
      entity_type: "investment_products",
      entity_id: id,
      previous_value: previousState,
      new_value: updatedProduct,
      reason
    })

    return NextResponse.json({ success: true, product: updatedProduct })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Product update failed" }, { status: 500 })
  }
}
