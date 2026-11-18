import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createClient as createAdminClient } from "@supabase/supabase-js"

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: targetUserId } = await params
    const supabase = await createClient()

    // 1. Authenticate requesting user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // 2. Check if user has admin privileges
    const { data: adminUser, error: adminError } = await supabase
      .from("admin_users")
      .select("id")
      .eq("id", user.id)
      .maybeSingle()

    if (adminError || !adminUser) {
      return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 })
    }

    // 3. Prevent admin self-deletion
    if (targetUserId === user.id) {
      return NextResponse.json({ error: "Cannot delete your own admin account" }, { status: 400 })
    }

    // 4. Try RPC delete_user_by_admin first
    const { error: rpcError } = await supabase.rpc("delete_user_by_admin", {
      target_user_id: targetUserId,
    })

    if (!rpcError) {
      return NextResponse.json({ success: true, message: "User account deleted successfully" })
    }

    // 5. Fallback: Delete from public.users table directly via RLS delete policy
    const { error: tableDeleteError } = await supabase
      .from("users")
      .delete()
      .eq("id", targetUserId)

    if (tableDeleteError) {
      console.error("User deletion error:", tableDeleteError)
      return NextResponse.json({ error: tableDeleteError.message || "Failed to delete user" }, { status: 500 })
    }

    // 6. Optional: Service role deletion from auth.users if service role key is present
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL

    if (serviceRoleKey && supabaseUrl) {
      try {
        const serviceClient = createAdminClient(supabaseUrl, serviceRoleKey)
        await serviceClient.auth.admin.deleteUser(targetUserId)
      } catch (srvErr) {
        console.warn("Service role auth user deletion skipped/warning:", srvErr)
      }
    }

    return NextResponse.json({ success: true, message: "User account deleted successfully" })
  } catch (err: any) {
    console.error("Admin delete user route exception:", err)
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 })
  }
}
