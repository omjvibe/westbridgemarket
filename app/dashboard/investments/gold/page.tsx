"use client"

import { useState, useEffect, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { 
    Coins, Truck, ShieldCheck, Mail, ArrowLeft, 
    Sparkles, AlertCircle, CheckCircle2, Scale, Dumbbell, Wallet
} from "lucide-react"

interface InvestmentPlan {
    id: string
    name: string
    plan_type: string
    min_amount: number
    max_amount: number
    roi_percentage: number
    duration_days: number
    description: string
    features: string[]
}

interface UserData {
    balance_deposit: number
    balance_profit: number
    balance_bonus: number
    email: string
}

function GoldInvestmentContent() {
    const searchParams = useSearchParams()
    const router = useRouter()
    const planId = searchParams.get("planId")

    const [plan, setPlan] = useState<InvestmentPlan | null>(null)
    const [userData, setUserData] = useState<UserData | null>(null)
    const [loadingPlan, setLoadingPlan] = useState(true)
    const [goldType, setGoldType] = useState<"digital" | "physical">("digital")
    
    // Form States
    const [amount, setAmount] = useState("")
    const [fullName, setFullName] = useState("")
    const [streetAddress, setStreetAddress] = useState("")
    const [city, setCity] = useState("")
    const [stateProvince, setStateProvince] = useState("")
    const [country, setCountry] = useState("")
    const [postalCode, setPostalCode] = useState("")
    const [phoneNumber, setPhoneNumber] = useState("")
    const [specialInstructions, setSpecialInstructions] = useState("")

    // Status States
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [successMessage, setSuccessMessage] = useState<string | null>(null)

    // Current Gold Price spot simulation
    const GOLD_PRICE_PER_GRAM = 75.25 // USD per gram

    useEffect(() => {
        if (!planId) {
            router.push("/dashboard/investments")
            return
        }
        fetchPlanDetails()
        fetchUserData()
    }, [planId])

    const fetchPlanDetails = async () => {
        try {
            const supabase = createClient()
            const { data, error } = await supabase
                .from("investment_plans")
                .select("*")
                .eq("id", planId)
                .single()

            if (error) throw error
            setPlan(data)
        } catch (err) {
            console.error("Error fetching plan:", err)
            router.push("/dashboard/investments")
        } finally {
            setLoadingPlan(false)
        }
    }

    const fetchUserData = async () => {
        try {
            const supabase = createClient()
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            const { data, error } = await supabase
                .from("users")
                .select("balance_deposit, balance_profit, balance_bonus, email")
                .eq("id", user.id)
                .single()

            if (error) throw error
            setUserData(data)
        } catch (err) {
            console.error("Error fetching user data:", err)
        }
    }

    const totalBalance = userData
        ? (userData.balance_deposit || 0) + (userData.balance_profit || 0) + (userData.balance_bonus || 0)
        : 0

    // Live spot estimates
    const investmentVal = parseFloat(amount) || 0
    const estimatedGrams = (investmentVal / GOLD_PRICE_PER_GRAM).toFixed(3)
    const estimatedOunces = (investmentVal / (GOLD_PRICE_PER_GRAM * 31.1035)).toFixed(3)

    const handleBack = () => {
        router.push("/dashboard/investments")
    }

    const handleFormSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!plan) return
        setError(null)
        setIsSubmitting(true)

        try {
            const supabase = createClient()
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) throw new Error("Authentication failed. Please login again.")

            const investAmountVal = parseFloat(amount)
            if (isNaN(investAmountVal) || investAmountVal <= 0) {
                throw new Error("Please enter a valid investment amount.")
            }

            if (investAmountVal < plan.min_amount || investAmountVal > plan.max_amount) {
                throw new Error(`Investment must be within range $${plan.min_amount} - $${plan.max_amount}`)
            }

            if (investAmountVal > totalBalance) {
                throw new Error("Insufficient account balance. Please top up your wallet.")
            }

            if (goldType === "physical") {
                if (!fullName || !streetAddress || !city || !stateProvince || !country || !postalCode || !phoneNumber) {
                    throw new Error("Please fill in all physical gold shipping details.")
                }
            }

            const expectedReturn = investAmountVal * (plan.roi_percentage / 100)
            const endDate = new Date()
            endDate.setDate(endDate.getDate() + plan.duration_days)

            const deliveryDetails = goldType === "physical" ? {
                type: "physical",
                fullName,
                streetAddress,
                city,
                stateProvince,
                country,
                postalCode,
                phoneNumber,
                specialInstructions,
                estimatedGrams: parseFloat(estimatedGrams),
                estimatedOunces: parseFloat(estimatedOunces),
                goldPricePerGramAtPurchase: GOLD_PRICE_PER_GRAM
            } : {
                type: "digital"
            }

            // Create investment row
            const { error: investError } = await supabase.from("investments").insert({
                user_id: user.id,
                plan_id: plan.id,
                amount: investAmountVal,
                expected_return: expectedReturn,
                current_return: 0,
                status: goldType === "physical" ? "pending" : "active",
                start_date: new Date().toISOString(),
                end_date: endDate.toISOString(),
                delivery_details: deliveryDetails
            })

            if (investError) throw investError

            // Deduct balance from user
            const { error: balanceError } = await supabase
                .from("users")
                .update({ balance_deposit: (userData?.balance_deposit || 0) - investAmountVal })
                .eq("id", user.id)

            if (balanceError) throw balanceError

            // Create an administrative notification inside the system for administrators to act
            if (goldType === "physical") {
                await supabase.from("notifications").insert({
                    user_id: user.id,
                    type: "gold_delivery",
                    title: "New Physical Gold Request",
                    message: `User requested physical delivery of gold valued at $${investAmountVal.toLocaleString()}. Delivery destination: ${city}, ${country}. Active Phone: ${phoneNumber}.`,
                    is_admin_notification: true,
                    is_read: false
                })
            }

            // Success feedback
            if (goldType === "physical") {
                setSuccessMessage("Physical Gold Request Successfully Submitted! An administrator will email you at " + (userData?.email || "your registered address") + " within 24 hours with next-step delivery instructions, courier options, secure insurance specs, and authentication certificates.")
            } else {
                setSuccessMessage("Digital Gold investment started successfully! Your funds are allocated and yields are actively accumulating in real-time.")
            }

        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "An unexpected error occurred during submission.")
        } finally {
            setIsSubmitting(false)
        }
    }

    if (loadingPlan) {
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">
                <div className="flex flex-col items-center gap-3">
                    <div className="animate-spin h-10 w-10 border-4 border-amber-500 border-t-transparent rounded-full" />
                    <p className="text-slate-400 font-semibold">Configuring Gold Portal...</p>
                </div>
            </div>
        )
    }

    if (!plan) return null

    if (successMessage) {
        return (
            <div className="min-h-screen bg-slate-950 p-4 md:p-8 flex items-center justify-center text-white">
                <Card className="max-w-xl w-full border-amber-500/30 bg-slate-900 shadow-2xl relative overflow-hidden">
                    <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-amber-400 to-yellow-600" />
                    <CardContent className="p-8 text-center space-y-6">
                        <div className="mx-auto w-16 h-16 rounded-full bg-amber-500/10 flex items-center justify-center border border-amber-500/20 text-amber-500">
                            <CheckCircle2 className="h-10 w-10" />
                        </div>
                        <h2 className="text-2xl font-bold text-white tracking-tight">Investment Verified</h2>
                        <p className="text-slate-300 leading-relaxed text-sm">
                            {successMessage}
                        </p>
                        <Button 
                            onClick={handleBack} 
                            className="w-full h-11 bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 text-white font-bold"
                        >
                            Return to Portfolio Dashboard
                        </Button>
                    </CardContent>
                </Card>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-slate-950 p-4 md:p-8 text-white">
            <div className="mx-auto max-w-4xl space-y-6">
                
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <button 
                        onClick={handleBack}
                        className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm font-semibold self-start"
                    >
                        <ArrowLeft className="h-4 w-4" /> Back to Investments
                    </button>
                    <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-2 flex items-center gap-3">
                        <Wallet className="h-5 w-5 text-amber-500" />
                        <div>
                            <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Available Balance</p>
                            <p className="text-sm font-extrabold text-white">${totalBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                        </div>
                    </div>
                </div>

                <div className="space-y-2">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/30 text-amber-400 text-[10px] font-bold uppercase tracking-wider">
                        <Sparkles className="h-3 w-3" /> Westbridge Premium Assets
                    </div>
                    <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white bg-clip-text bg-gradient-to-r from-white via-slate-100 to-amber-200">
                        Invest in Precious Metals: {plan.name}
                    </h1>
                    <p className="text-slate-400 max-w-2xl">
                        {plan.description || "Deploy capital directly into heavy industrial and precious metals. Secure digital-backed ledger returns, or schedule high-security physical delivery."}
                    </p>
                </div>

                {/* Main Double Column Toggles */}
                <div className="grid gap-6 md:grid-cols-2">
                    
                    {/* Toggle Cards */}
                    <Card 
                        onClick={() => setGoldType("digital")}
                        className={`cursor-pointer transition-all duration-300 relative overflow-hidden bg-slate-900 border ${
                            goldType === "digital" 
                                ? "border-amber-500 shadow-lg shadow-amber-500/10 scale-[1.02]" 
                                : "border-slate-800 hover:border-slate-700 opacity-70"
                        }`}
                    >
                        <CardHeader className="p-6">
                            <div className="flex justify-between items-start">
                                <div className="p-3 bg-amber-500/10 rounded-xl border border-amber-500/20 text-amber-500 mb-2">
                                    <Coins className="h-6 w-6" />
                                </div>
                                {goldType === "digital" && (
                                    <span className="text-[9px] font-bold text-amber-400 border border-amber-400/20 px-2 py-0.5 rounded uppercase tracking-wider bg-amber-500/5">
                                        Selected
                                    </span>
                                )}
                            </div>
                            <CardTitle className="text-lg text-white mt-2">Digital-Backed Gold</CardTitle>
                            <CardDescription className="text-slate-400 text-xs">
                                Instantly allocated, digital ledger-backed asset. Yield returns accumulate automatically and capital can be exited online.
                            </CardDescription>
                        </CardHeader>
                    </Card>

                    <Card 
                        onClick={() => setGoldType("physical")}
                        className={`cursor-pointer transition-all duration-300 relative overflow-hidden bg-slate-900 border ${
                            goldType === "physical" 
                                ? "border-amber-500 shadow-lg shadow-amber-500/10 scale-[1.02]" 
                                : "border-slate-800 hover:border-slate-700 opacity-70"
                        }`}
                    >
                        <CardHeader className="p-6">
                            <div className="flex justify-between items-start">
                                <div className="p-3 bg-amber-500/10 rounded-xl border border-amber-500/20 text-amber-500 mb-2">
                                    <Truck className="h-6 w-6" />
                                </div>
                                {goldType === "physical" && (
                                    <span className="text-[9px] font-bold text-amber-400 border border-amber-400/20 px-2 py-0.5 rounded uppercase tracking-wider bg-amber-500/5">
                                        Selected
                                    </span>
                                )}
                            </div>
                            <CardTitle className="text-lg text-white mt-2">Physical Gold Bullion Delivery</CardTitle>
                            <CardDescription className="text-slate-400 text-xs">
                                Pure investment-grade physical gold bars. Insured courier logistics arranged to your doorstep. Finalized via direct administrative follow-up.
                            </CardDescription>
                        </CardHeader>
                    </Card>

                </div>

                {/* Form Section */}
                <Card className="border-slate-800 bg-slate-900">
                    <CardHeader className="p-6 border-b border-slate-800">
                        <CardTitle className="text-xl text-white flex items-center gap-2">
                            {goldType === "digital" ? <Coins className="h-5 w-5 text-amber-500" /> : <Truck className="h-5 w-5 text-amber-500" />}
                            Configure {goldType === "digital" ? "Digital" : "Physical"} Gold Investment
                        </CardTitle>
                        <CardDescription className="text-slate-400 text-xs">
                            Plan: {plan.name} ({plan.roi_percentage}% ROI - {plan.duration_days} Days Duration)
                        </CardDescription>
                    </CardHeader>

                    <form onSubmit={handleFormSubmit} className="p-6 space-y-6">
                        
                        {error && (
                            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-center gap-3 text-red-400">
                                <AlertCircle className="h-5 w-5" />
                                <span className="text-sm font-semibold">{error}</span>
                            </div>
                        )}

                        <div className="grid gap-6 md:grid-cols-2">
                            {/* Investment Amount */}
                            <div className="space-y-2">
                                <Label htmlFor="amount" className="text-sm font-semibold text-slate-300">
                                    Investment Amount (USD)
                                </Label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-bold">$</span>
                                    <Input
                                        id="amount"
                                        type="number"
                                        placeholder="e.g. 5000"
                                        value={amount}
                                        onChange={(e) => setAmount(e.target.value)}
                                        className="pl-7 bg-slate-950 border-slate-800 focus:border-amber-500 text-white h-11 text-lg font-bold"
                                        required
                                    />
                                </div>
                                <p className="text-[10px] text-slate-400">
                                    Min: ${plan.min_amount.toLocaleString()} | Max: ${plan.max_amount.toLocaleString()}
                                </p>
                            </div>

                            {/* Spot Rate Calculations */}
                            <div className="bg-slate-950/50 rounded-xl p-4 border border-slate-800/80 flex flex-col justify-center space-y-2">
                                <div className="flex justify-between items-center text-xs">
                                    <span className="text-slate-400">Current Spot Gold Price</span>
                                    <span className="font-semibold text-amber-400">${GOLD_PRICE_PER_GRAM}/g</span>
                                </div>
                                <div className="flex justify-between items-center text-xs border-t border-slate-800/50 pt-2">
                                    <span className="text-slate-400 flex items-center gap-1"><Scale className="h-3 w-3" /> Grams (est.)</span>
                                    <span className="font-bold text-white text-sm">{estimatedGrams} g</span>
                                </div>
                                <div className="flex justify-between items-center text-xs">
                                    <span className="text-slate-400 flex items-center gap-1"><Dumbbell className="h-3 w-3" /> Ounces (est.)</span>
                                    <span className="font-bold text-white text-sm">{estimatedOunces} oz</span>
                                </div>
                            </div>
                        </div>

                        {/* Physical gold shipping details form */}
                        {goldType === "physical" && (
                            <div className="space-y-4 pt-4 border-t border-slate-800">
                                <h3 className="text-sm font-extrabold uppercase tracking-wider text-amber-500 flex items-center gap-2">
                                    <Truck className="h-4 w-4" /> Secure Delivery Destination Details
                                </h3>
                                
                                <div className="grid gap-4 sm:grid-cols-2">
                                    <div className="space-y-1">
                                        <Label htmlFor="fullName" className="text-xs text-slate-400 font-semibold">Recipient Full Name</Label>
                                        <Input
                                            id="fullName"
                                            placeholder="e.g. John Doe"
                                            value={fullName}
                                            onChange={(e) => setFullName(e.target.value)}
                                            className="bg-slate-950 border-slate-800 focus:border-amber-500 text-white"
                                            required
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <Label htmlFor="phone" className="text-xs text-slate-400 font-semibold">Active Phone Number</Label>
                                        <Input
                                            id="phone"
                                            placeholder="e.g. +1 (555) 019-2834"
                                            value={phoneNumber}
                                            onChange={(e) => setPhoneNumber(e.target.value)}
                                            className="bg-slate-950 border-slate-800 focus:border-amber-500 text-white"
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <Label htmlFor="address" className="text-xs text-slate-400 font-semibold">Delivery Street Address</Label>
                                    <Input
                                        id="address"
                                        placeholder="e.g. 100 Pine Street, Apt 4B"
                                        value={streetAddress}
                                        onChange={(e) => setStreetAddress(e.target.value)}
                                        className="bg-slate-950 border-slate-800 focus:border-amber-500 text-white"
                                        required
                                    />
                                </div>

                                <div className="grid gap-4 sm:grid-cols-4">
                                    <div className="sm:col-span-2 space-y-1">
                                        <Label htmlFor="city" className="text-xs text-slate-400 font-semibold">City</Label>
                                        <Input
                                            id="city"
                                            placeholder="e.g. San Francisco"
                                            value={city}
                                            onChange={(e) => setCity(e.target.value)}
                                            className="bg-slate-950 border-slate-800 focus:border-amber-500 text-white"
                                            required
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <Label htmlFor="state" className="text-xs text-slate-400 font-semibold">State/Province</Label>
                                        <Input
                                            id="state"
                                            placeholder="e.g. CA"
                                            value={stateProvince}
                                            onChange={(e) => setStateProvince(e.target.value)}
                                            className="bg-slate-950 border-slate-800 focus:border-amber-500 text-white"
                                            required
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <Label htmlFor="postal" className="text-xs text-slate-400 font-semibold">Postal/Zip Code</Label>
                                        <Input
                                            id="postal"
                                            placeholder="e.g. 94111"
                                            value={postalCode}
                                            onChange={(e) => setPostalCode(e.target.value)}
                                            className="bg-slate-950 border-slate-800 focus:border-amber-500 text-white"
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <Label htmlFor="country" className="text-xs text-slate-400 font-semibold">Country</Label>
                                    <Input
                                        id="country"
                                        placeholder="e.g. United States"
                                        value={country}
                                        onChange={(e) => setCountry(e.target.value)}
                                        className="bg-slate-950 border-slate-800 focus:border-amber-500 text-white"
                                        required
                                    />
                                </div>

                                <div className="space-y-1">
                                    <Label htmlFor="instructions" className="text-xs text-slate-400 font-semibold">Special Delivery or Insurance Instructions (Optional)</Label>
                                    <Textarea
                                        id="instructions"
                                        placeholder="e.g. Leave with building security only, requires signature on delivery, add extra shipping insurance..."
                                        value={specialInstructions}
                                        onChange={(e) => setSpecialInstructions(e.target.value)}
                                        className="bg-slate-950 border-slate-800 focus:border-amber-500 text-white"
                                        rows={3}
                                    />
                                </div>

                                <div className="bg-amber-500/5 border border-amber-500/10 rounded-xl p-4 flex gap-3 text-xs text-amber-300">
                                    <ShieldCheck className="h-5 w-5 shrink-0" />
                                    <p>
                                        <strong>Logistics Note:</strong> Physical bullion represents high-security delivery. Westbridge processes delivery authorization immediately. You will receive next-step courier details and premium shipping insurance documentation via email.
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Submit Button */}
                        <div className="pt-4 border-t border-slate-800">
                            <Button
                                type="submit"
                                disabled={isSubmitting}
                                className="w-full h-12 bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 text-white font-bold text-sm tracking-wide rounded-xl shadow-lg hover:scale-[1.01] transition-transform"
                            >
                                {isSubmitting ? (
                                    <span className="flex items-center justify-center gap-2">
                                        <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                                        Processing Gold Allocation...
                                    </span>
                                ) : goldType === "physical" ? (
                                    <span className="flex items-center justify-center gap-1.5">
                                        <Truck className="h-4 w-4" /> Submit Physical Gold Request
                                    </span>
                                ) : (
                                    <span className="flex items-center justify-center gap-1.5">
                                        <Coins className="h-4 w-4" /> Start Digital Gold Investment
                                    </span>
                                )}
                            </Button>
                        </div>

                    </form>
                </Card>

            </div>
        </div>
    )
}

export default function GoldInvestmentPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">
                <div className="flex flex-col items-center gap-3">
                    <div className="animate-spin h-10 w-10 border-4 border-amber-500 border-t-transparent rounded-full" />
                    <p className="text-slate-400 font-semibold">Configuring Gold Portal...</p>
                </div>
            </div>
        }>
            <GoldInvestmentContent />
        </Suspense>
    )
}
