import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import { verifyMessage } from "ethers"

export async function POST(request: Request) {
  try {
    const { address, signature, message } = await request.json()

    // 1. Verify the signature
    const recoveredAddress = verifyMessage(message, signature)
    if (recoveredAddress.toLowerCase() !== address.toLowerCase()) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 })
    }

    // 2. Initialize Supabase with service role if available, or just admin access
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set({ name, value, ...options })
              )
            } catch {
              // The `setAll` method was called from a Server Component.
              // This can be ignored if you have middleware refreshing
              // user sessions.
            }
          },
        },
      }
    )

    // 3. Check if user exists
    const { data: userProfile } = await supabase
      .from("users")
      .select("id, email")
      .eq("wallet_address", address)
      .single()

    let email = userProfile?.email
    // Using a deterministic but secure-enough password for this demo/implementation
    // In a real production app, you'd use a more robust custom auth provider
    const password = btoa(`${address}-${process.env.ADMIN_PIN_CODE || 'web3-secret'}`)

    if (!userProfile) {
      // 4. Create new user if doesn't exist
      email = `${address.toLowerCase()}@web3.westbridgemarket.app`
      
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: "Web3 User",
            wallet_address: address,
          }
        }
      })

      if (signUpError) throw signUpError

      // Link wallet address to profile (the trigger handle_new_user will create the profile, but we need to update it with wallet_address)
      if (authData.user) {
          const { error: updateError } = await supabase
            .from("users")
            .update({ wallet_address: address })
            .eq("id", authData.user.id)
          
          if (updateError) console.error("Error updating wallet address:", updateError)
      }
    }

    // 5. Sign in
    const { data: sessionData, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (signInError) throw signInError

    return NextResponse.json({ success: true, session: sessionData.session })
  } catch (error: any) {
    console.error("Web3 Auth Error:", error)
    return NextResponse.json({ error: error.message || "Authentication failed" }, { status: 500 })
  }
}
