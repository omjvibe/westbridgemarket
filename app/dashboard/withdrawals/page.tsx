"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
    AlertCircle,
    CheckCircle2,
    Clock,
    XCircle,
    Lock,
    Wallet,
    Shield,
    FileText,
    Building2,
    Coins,
    Info,
    ArrowUpRight
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import Link from "next/link"
import { parseWithdrawalDestination, WithdrawalMethod } from "@/lib/withdrawal"

interface UserData {
    full_name?: string
    balance_deposit: number
    balance_profit: number
    balance_bonus: number
    can_withdraw: boolean
    completed_trades: number
    required_trades: number
    withdrawal_code?: string
    kyc_status?: string
    tax_code?: string
    mfi_code?: string
}

interface Transaction {
    id: string
    type: string
    status: string
    amount: number
    crypto_type: string
    wallet_address: string
    withdrawal_method?: string
    bank_name?: string
    account_holder_name?: string
    account_number?: string
    routing_number?: string
    swift_code?: string
    bank_country?: string
    account_type?: string
    admin_notes?: string
    created_at: string
}

export default function WithdrawalsPage() {
    const [userData, setUserData] = useState<UserData | null>(null)
    const [withdrawals, setWithdrawals] = useState<Transaction[]>([])
    const [withdrawalMethod, setWithdrawalMethod] = useState<WithdrawalMethod>("crypto")

    // Common fields
    const [amount, setAmount] = useState("")
    const [withdrawalCode, setWithdrawalCode] = useState("")
    const [taxCode, setTaxCode] = useState("")

    // Crypto fields
    const [selectedCrypto, setSelectedCrypto] = useState("BTC")
    const [walletAddress, setWalletAddress] = useState("")

    // Bank transfer fields
    const [bankName, setBankName] = useState("")
    const [accountHolderName, setAccountHolderName] = useState("")
    const [accountNumber, setAccountNumber] = useState("")
    const [routingNumber, setRoutingNumber] = useState("")
    const [swiftCode, setSwiftCode] = useState("")
    const [accountType, setAccountType] = useState("checking")
    const [bankCountry, setBankCountry] = useState("United States")

    const [isSubmitting, setIsSubmitting] = useState(false)
    const [success, setSuccess] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const cryptoOptions = [
        { symbol: "BTC", name: "Bitcoin", network: "Bitcoin Network" },
        { symbol: "ETH", name: "Ethereum", network: "Ethereum (ERC20)" },
        { symbol: "USDT", name: "Tether", network: "Tron (TRC20)" },
        { symbol: "SOL", name: "Solana", network: "Solana Network" },
        { symbol: "XRP", name: "Ripple", network: "Ripple Network" },
    ]

    useEffect(() => {
        fetchUserData()
        fetchWithdrawals()
    }, [])

    const fetchUserData = async () => {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const { data } = await supabase
            .from("users")
            .select("full_name, balance_deposit, balance_profit, balance_bonus, can_withdraw, completed_trades, required_trades, withdrawal_code, kyc_status, tax_code, mfi_code")
            .eq("id", user.id)
            .single()

        if (data) {
            setUserData(data)
            if (data.full_name && !accountHolderName) {
                setAccountHolderName(data.full_name)
            }
        }
    }

    const fetchWithdrawals = async () => {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const { data } = await supabase
            .from("transactions")
            .select("*")
            .eq("user_id", user.id)
            .eq("type", "withdrawal")
            .order("created_at", { ascending: false })
            .limit(15)

        if (data) setWithdrawals(data)
    }

    const totalBalance = userData
        ? (userData.balance_deposit || 0) + (userData.balance_profit || 0) + (userData.balance_bonus || 0)
        : 0

    const kycApproved = userData?.kyc_status === 'approved'
    const tradesCompleted = (userData?.completed_trades || 0) >= 2
    const canWithdrawFlag = userData?.can_withdraw !== false
    const canWithdraw = kycApproved && tradesCompleted && canWithdrawFlag

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsSubmitting(true)
        setError(null)
        setSuccess(false)

        try {
            const supabase = createClient()
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) throw new Error("Please login to continue")

            // Check KYC
            if (!kycApproved) {
                throw new Error("Please complete KYC verification before withdrawing.")
            }

            // Check trades
            if (!tradesCompleted) {
                throw new Error("You need to complete at least 2 trades before withdrawing.")
            }

            // Check withdraw flag
            if (!canWithdrawFlag) {
                throw new Error("Withdrawals are currently disabled on your account.")
            }

            const withdrawAmount = parseFloat(amount)

            if (!withdrawAmount || withdrawAmount < 50) {
                throw new Error("Minimum withdrawal amount is $50")
            }

            if (withdrawAmount > totalBalance) {
                throw new Error("Insufficient balance")
            }

            // Method-specific validations
            if (withdrawalMethod === "crypto") {
                if (!walletAddress.trim()) {
                    throw new Error("Please enter your recipient wallet address")
                }
            } else {
                if (!bankName.trim()) {
                    throw new Error("Please enter your bank name")
                }
                if (!accountHolderName.trim()) {
                    throw new Error("Please enter the account holder name")
                }
                if (!accountNumber.trim()) {
                    throw new Error("Please enter the account number or IBAN")
                }
                if (!routingNumber.trim()) {
                    throw new Error("Please enter the routing number or SWIFT/BIC code")
                }
            }

            // Check withdrawal code if required
            if (userData?.withdrawal_code && userData.withdrawal_code !== withdrawalCode) {
                throw new Error("Invalid withdrawal code")
            }

            // Check tax/MFI code if required
            if (userData?.tax_code && userData.tax_code !== taxCode) {
                throw new Error("Invalid Tax/MFI code. Please enter the correct code to proceed.")
            }

            if (withdrawalMethod === "crypto") {
                // Crypto withdrawal insert
                const insertData: any = {
                    user_id: user.id,
                    type: "withdrawal",
                    status: "pending",
                    amount: withdrawAmount,
                    currency: "USD",
                    crypto_type: selectedCrypto,
                    wallet_address: walletAddress.trim(),
                    withdrawal_method: "crypto",
                }

                let { error: insertError } = await supabase.from("transactions").insert(insertData)

                // Fallback in case withdrawal_method column hasn't migrated yet
                if (insertError && insertError.message?.includes("column")) {
                    const fallback = {
                        user_id: user.id,
                        type: "withdrawal",
                        status: "pending",
                        amount: withdrawAmount,
                        currency: "USD",
                        crypto_type: selectedCrypto,
                        wallet_address: walletAddress.trim(),
                    }
                    const res = await supabase.from("transactions").insert(fallback)
                    insertError = res.error
                }

                if (insertError) throw insertError
            } else {
                // Bank transfer payload
                const bankPayload = {
                    method: "bank_transfer",
                    bank_name: bankName.trim(),
                    account_holder_name: accountHolderName.trim(),
                    account_number: accountNumber.trim(),
                    routing_number: routingNumber.trim(),
                    swift_code: swiftCode.trim() || undefined,
                    account_type: accountType,
                    bank_country: bankCountry.trim() || undefined,
                }

                const insertData: any = {
                    user_id: user.id,
                    type: "withdrawal",
                    status: "pending",
                    amount: withdrawAmount,
                    currency: "USD",
                    crypto_type: "Bank Transfer",
                    wallet_address: JSON.stringify(bankPayload),
                    withdrawal_method: "bank_transfer",
                    bank_name: bankName.trim(),
                    account_holder_name: accountHolderName.trim(),
                    account_number: accountNumber.trim(),
                    routing_number: routingNumber.trim(),
                    swift_code: swiftCode.trim() || null,
                    account_type: accountType,
                    bank_country: bankCountry.trim() || null,
                    admin_notes: `Bank Transfer Request: ${bankName.trim()} (${accountNumber.trim().slice(-4)})`,
                }

                let { error: insertError } = await supabase.from("transactions").insert(insertData)

                // Fallback without newly added schema columns if migration is pending
                if (insertError && insertError.message?.includes("column")) {
                    const fallback = {
                        user_id: user.id,
                        type: "withdrawal",
                        status: "pending",
                        amount: withdrawAmount,
                        currency: "USD",
                        crypto_type: "Bank Transfer",
                        wallet_address: JSON.stringify(bankPayload),
                        admin_notes: `Bank Transfer: ${bankName.trim()} - Acct ending in ${accountNumber.trim().slice(-4)}`,
                    }
                    const res = await supabase.from("transactions").insert(fallback)
                    insertError = res.error
                }

                if (insertError) throw insertError
            }

            setSuccess(true)
            setAmount("")
            setWalletAddress("")
            setBankName("")
            setAccountNumber("")
            setRoutingNumber("")
            setSwiftCode("")
            setWithdrawalCode("")
            setTaxCode("")
            fetchWithdrawals()

        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "An error occurred")
        } finally {
            setIsSubmitting(false)
        }
    }

    const getStatusIcon = (status: string) => {
        switch (status) {
            case "approved":
                return <CheckCircle2 className="h-4 w-4 text-green-500" />
            case "rejected":
                return <XCircle className="h-4 w-4 text-destructive" />
            case "processing":
                return <Clock className="h-4 w-4 text-blue-500" />
            default:
                return <Clock className="h-4 w-4 text-yellow-500" />
        }
    }

    return (
        <div className="min-h-screen bg-background p-4 md:p-8">
            <div className="mx-auto max-w-4xl space-y-6">
                <div>
                    <h1 className="text-3xl font-bold text-foreground">Withdraw Funds</h1>
                    <p className="mt-1 text-muted-foreground">Request a withdrawal via Bank Transfer or Cryptocurrency</p>
                </div>

                {/* KYC Requirement Alert */}
                {!kycApproved && (
                    <Card className="border-blue-500/50 bg-blue-500/5">
                        <CardContent className="flex items-start gap-3 p-4">
                            <Shield className="h-5 w-5 flex-shrink-0 text-blue-500 mt-0.5" />
                            <div className="flex-1">
                                <p className="font-medium text-foreground">KYC Verification Required</p>
                                <p className="text-sm text-muted-foreground mt-1">
                                    You must complete identity verification (KYC) before you can withdraw funds.
                                </p>
                            </div>
                            <Button size="sm" asChild>
                                <Link href="/dashboard/kyc">Verify Now</Link>
                            </Button>
                        </CardContent>
                    </Card>
                )}

                {/* Trade Requirement Alert */}
                {kycApproved && !tradesCompleted && (
                    <Card className="border-yellow-500/50 bg-yellow-500/5">
                        <CardContent className="flex items-start gap-3 p-4">
                            <Lock className="h-5 w-5 flex-shrink-0 text-yellow-500 mt-0.5" />
                            <div>
                                <p className="font-medium text-foreground">Trade Requirement</p>
                                <p className="text-sm text-muted-foreground mt-1">
                                    Complete at least 2 trades to unlock withdrawals.
                                    <br />
                                    <strong>Progress: {userData?.completed_trades || 0}/2 trades completed</strong>
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Admin Restriction Alert */}
                {kycApproved && tradesCompleted && !canWithdrawFlag && (
                    <Card className="border-destructive/50 bg-destructive/5">
                        <CardContent className="flex items-start gap-3 p-4">
                            <Lock className="h-5 w-5 flex-shrink-0 text-destructive mt-0.5" />
                            <div>
                                <p className="font-medium text-foreground">Withdrawal Restricted</p>
                                <p className="text-sm text-muted-foreground mt-1">
                                    Withdrawals have been disabled on your account by an administrator.
                                    Please contact support for assistance.
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Tax/MFI Code Info */}
                {userData?.tax_code && (
                    <Card className="border-orange-500/50 bg-orange-500/5">
                        <CardContent className="flex items-start gap-3 p-4">
                            <FileText className="h-5 w-5 flex-shrink-0 text-orange-500 mt-0.5" />
                            <div>
                                <p className="font-medium text-foreground">Tax/MFI Code Required</p>
                                <p className="text-sm text-muted-foreground mt-1">
                                    A tax clearance or MFI verification code is required for this withdrawal.
                                    Please contact support if you haven't received your code.
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {success && (
                    <Card className="border-green-500/50 bg-green-500/5">
                        <CardContent className="flex items-center gap-3 p-4">
                            <CheckCircle2 className="h-5 w-5 text-green-500" />
                            <div>
                                <p className="font-medium text-foreground">Withdrawal Request Submitted!</p>
                                <p className="text-sm text-muted-foreground">
                                    Your request has been placed in the queue for compliance verification and admin review.
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {error && (
                    <Card className="border-destructive/50 bg-destructive/5">
                        <CardContent className="flex items-center gap-3 p-4">
                            <AlertCircle className="h-5 w-5 text-destructive" />
                            <p className="text-foreground">{error}</p>
                        </CardContent>
                    </Card>
                )}

                {/* Status Overview */}
                <div className="grid gap-4 md:grid-cols-4">
                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                                <Wallet className="h-5 w-5 text-primary" />
                                <div>
                                    <p className="text-sm text-muted-foreground">Balance</p>
                                    <p className="text-xl font-bold text-foreground">${totalBalance.toFixed(2)}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                                <Shield className={`h-5 w-5 ${kycApproved ? 'text-green-500' : 'text-yellow-500'}`} />
                                <div>
                                    <p className="text-sm text-muted-foreground">KYC</p>
                                    <p className={`text-lg font-bold ${kycApproved ? 'text-green-500' : 'text-yellow-500'}`}>
                                        {kycApproved ? 'Verified' : 'Pending'}
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                                <CheckCircle2 className={`h-5 w-5 ${tradesCompleted ? 'text-green-500' : 'text-yellow-500'}`} />
                                <div>
                                    <p className="text-sm text-muted-foreground">Trades</p>
                                    <p className="text-lg font-bold text-foreground">{userData?.completed_trades || 0}/2</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                                {canWithdraw ? (
                                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                                ) : (
                                    <Lock className="h-5 w-5 text-destructive" />
                                )}
                                <div>
                                    <p className="text-sm text-muted-foreground">Status</p>
                                    <p className={`text-lg font-bold ${canWithdraw ? 'text-green-500' : 'text-destructive'}`}>
                                        {canWithdraw ? 'Unlocked' : 'Locked'}
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Withdrawal Form */}
                <form onSubmit={handleSubmit}>
                    <Card>
                        <CardHeader>
                            <CardTitle>Withdrawal Request</CardTitle>
                            <CardDescription>Select your payout channel and enter destination details</CardDescription>

                            {/* Payout Channel Selector (Crypto vs Bank) */}
                            <div className="grid grid-cols-2 gap-3 pt-3">
                                <button
                                    type="button"
                                    onClick={() => setWithdrawalMethod("crypto")}
                                    className={`flex items-center justify-center gap-2.5 p-3.5 rounded-lg border text-sm font-semibold transition-all ${
                                        withdrawalMethod === "crypto"
                                            ? "border-[#f04e23] bg-[#f04e23]/10 text-foreground"
                                            : "border-border hover:border-border/80 bg-card text-muted-foreground"
                                    }`}
                                >
                                    <Coins className={`h-4 w-4 ${withdrawalMethod === "crypto" ? "text-[#f04e23]" : ""}`} />
                                    <span>Cryptocurrency</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setWithdrawalMethod("bank_transfer")}
                                    className={`flex items-center justify-center gap-2.5 p-3.5 rounded-lg border text-sm font-semibold transition-all ${
                                        withdrawalMethod === "bank_transfer"
                                            ? "border-[#f04e23] bg-[#f04e23]/10 text-foreground"
                                            : "border-border hover:border-border/80 bg-card text-muted-foreground"
                                    }`}
                                >
                                    <Building2 className={`h-4 w-4 ${withdrawalMethod === "bank_transfer" ? "text-[#f04e23]" : ""}`} />
                                    <span>Bank Transfer (Wire / ACH)</span>
                                </button>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {/* CRYPTO CHANNEL */}
                            {withdrawalMethod === "crypto" && (
                                <>
                                    <div className="grid gap-6 md:grid-cols-2">
                                        <div className="space-y-2">
                                            <Label htmlFor="crypto">Select Cryptocurrency</Label>
                                            <Select value={selectedCrypto} onValueChange={setSelectedCrypto} disabled={!canWithdraw}>
                                                <SelectTrigger id="crypto">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {cryptoOptions.map((crypto) => (
                                                        <SelectItem key={crypto.symbol} value={crypto.symbol}>
                                                            {crypto.name} ({crypto.symbol}) - {crypto.network}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="amount">Amount (USD)</Label>
                                            <Input
                                                id="amount"
                                                type="number"
                                                placeholder="Enter amount (min $50)"
                                                value={amount}
                                                onChange={(e) => setAmount(e.target.value)}
                                                min="50"
                                                max={totalBalance}
                                                disabled={!canWithdraw}
                                                required
                                            />
                                            <p className="text-xs text-muted-foreground">
                                                Available Balance: ${totalBalance.toFixed(2)}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="wallet">Your {selectedCrypto} Destination Address</Label>
                                        <Input
                                            id="wallet"
                                            placeholder={`Enter your recipient ${selectedCrypto} address`}
                                            value={walletAddress}
                                            onChange={(e) => setWalletAddress(e.target.value)}
                                            className="font-mono"
                                            disabled={!canWithdraw}
                                            required
                                        />
                                    </div>
                                </>
                            )}

                            {/* BANK TRANSFER CHANNEL */}
                            {withdrawalMethod === "bank_transfer" && (
                                <div className="space-y-4">
                                    <div className="rounded-lg bg-blue-500/10 border border-blue-500/20 p-3.5 flex items-start gap-2.5 text-xs text-blue-400">
                                        <Info className="h-4 w-4 shrink-0 mt-0.5" />
                                        <div>
                                            <p className="font-semibold text-foreground">Direct Bank Wire / ACH Information</p>
                                            <p className="text-muted-foreground mt-0.5">
                                                Funds are disbursed directly to your verified personal or corporate banking institution. Account name must match your KYC verified records.
                                            </p>
                                        </div>
                                    </div>

                                    <div className="grid gap-4 sm:grid-cols-2">
                                        <div className="space-y-2">
                                            <Label htmlFor="amount-bank">Withdrawal Amount (USD)</Label>
                                            <Input
                                                id="amount-bank"
                                                type="number"
                                                placeholder="Amount in USD (min $50)"
                                                value={amount}
                                                onChange={(e) => setAmount(e.target.value)}
                                                min="50"
                                                max={totalBalance}
                                                disabled={!canWithdraw}
                                                required
                                            />
                                            <p className="text-xs text-muted-foreground">
                                                Available: ${totalBalance.toFixed(2)}
                                            </p>
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="bankName">Bank / Financial Institution Name</Label>
                                            <Input
                                                id="bankName"
                                                placeholder="e.g. JPMorgan Chase, Barclays, HSBC"
                                                value={bankName}
                                                onChange={(e) => setBankName(e.target.value)}
                                                disabled={!canWithdraw}
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div className="grid gap-4 sm:grid-cols-2">
                                        <div className="space-y-2">
                                            <Label htmlFor="holderName">Beneficiary / Account Holder Name</Label>
                                            <Input
                                                id="holderName"
                                                placeholder="Full legal name on bank account"
                                                value={accountHolderName}
                                                onChange={(e) => setAccountHolderName(e.target.value)}
                                                disabled={!canWithdraw}
                                                required
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="accountType">Account Type</Label>
                                            <Select value={accountType} onValueChange={setAccountType} disabled={!canWithdraw}>
                                                <SelectTrigger id="accountType">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="checking">Checking Account</SelectItem>
                                                    <SelectItem value="savings">Savings Account</SelectItem>
                                                    <SelectItem value="corporate">Corporate / Business Account</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>

                                    <div className="grid gap-4 sm:grid-cols-2">
                                        <div className="space-y-2">
                                            <Label htmlFor="accountNumber">Account Number / IBAN</Label>
                                            <Input
                                                id="accountNumber"
                                                placeholder="Enter Account Number or IBAN"
                                                value={accountNumber}
                                                onChange={(e) => setAccountNumber(e.target.value)}
                                                className="font-mono"
                                                disabled={!canWithdraw}
                                                required
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="routingNumber">Routing Transit Number / Sort Code / ABA</Label>
                                            <Input
                                                id="routingNumber"
                                                placeholder="9-digit Routing or Sort Code"
                                                value={routingNumber}
                                                onChange={(e) => setRoutingNumber(e.target.value)}
                                                className="font-mono"
                                                disabled={!canWithdraw}
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div className="grid gap-4 sm:grid-cols-2">
                                        <div className="space-y-2">
                                            <Label htmlFor="swiftCode">SWIFT / BIC Code (Optional for domestic)</Label>
                                            <Input
                                                id="swiftCode"
                                                placeholder="e.g. CHASUS33"
                                                value={swiftCode}
                                                onChange={(e) => setSwiftCode(e.target.value)}
                                                className="font-mono uppercase"
                                                disabled={!canWithdraw}
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="bankCountry">Bank Country / Jurisdiction</Label>
                                            <Input
                                                id="bankCountry"
                                                placeholder="e.g. United States, United Kingdom"
                                                value={bankCountry}
                                                onChange={(e) => setBankCountry(e.target.value)}
                                                disabled={!canWithdraw}
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* SPECIAL AUTHORIZATION CODES */}
                            {userData?.withdrawal_code && (
                                <div className="space-y-2">
                                    <Label htmlFor="code">Withdrawal Code</Label>
                                    <Input
                                        id="code"
                                        placeholder="Enter your security withdrawal code"
                                        value={withdrawalCode}
                                        onChange={(e) => setWithdrawalCode(e.target.value)}
                                        disabled={!canWithdraw}
                                        required
                                    />
                                </div>
                            )}

                            {userData?.tax_code && (
                                <div className="space-y-2">
                                    <Label htmlFor="taxCode">Tax / MFI Verification Code</Label>
                                    <Input
                                        id="taxCode"
                                        placeholder="Enter your Tax / MFI code"
                                        value={taxCode}
                                        onChange={(e) => setTaxCode(e.target.value)}
                                        disabled={!canWithdraw}
                                        required
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        Enter the tax clearance or MFI clearance code assigned to your account.
                                    </p>
                                </div>
                            )}

                            {/* REQUIREMENTS CHECKLIST */}
                            <div className="space-y-2 bg-muted/50 p-4 rounded-lg">
                                <p className="text-sm font-medium text-foreground">Compliance & Settlement Details:</p>
                                <ul className="space-y-1.5 text-xs text-muted-foreground">
                                    <li className="flex items-center gap-2">
                                        {kycApproved ? <CheckCircle2 className="h-3.5 w-3.5 text-green-500" /> : <XCircle className="h-3.5 w-3.5 text-destructive" />}
                                        Identity Verification (KYC status: {kycApproved ? "Approved" : "Pending"})
                                    </li>
                                    <li className="flex items-center gap-2">
                                        {tradesCompleted ? <CheckCircle2 className="h-3.5 w-3.5 text-green-500" /> : <XCircle className="h-3.5 w-3.5 text-destructive" />}
                                        Trading Activity ({userData?.completed_trades || 0}/2 completed trades)
                                    </li>
                                    <li>• Minimum withdrawal threshold: <strong>$50.00 USD</strong></li>
                                    <li>• Crypto settlement: <strong>Immediate following admin approval</strong></li>
                                    <li>• Bank Wire / ACH settlement: <strong>1-3 business days</strong></li>
                                </ul>
                            </div>

                            <Button type="submit" className="w-full bg-[#f04e23] hover:bg-[#d84018] text-white" size="lg" disabled={!canWithdraw || isSubmitting}>
                                {isSubmitting ? "Submitting Request..." : canWithdraw ? "Submit Withdrawal Request" : "Withdrawal Locked"}
                            </Button>
                        </CardContent>
                    </Card>
                </form>

                {/* Withdrawal History */}
                <Card>
                    <CardHeader>
                        <CardTitle>Withdrawal History</CardTitle>
                        <CardDescription>Your recent withdrawal requests and processing status</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {withdrawals.length > 0 ? (
                            <div className="space-y-4">
                                {withdrawals.map((withdrawal) => {
                                    const details = parseWithdrawalDestination(withdrawal)
                                    return (
                                        <div key={withdrawal.id} className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-border pb-4 last:border-0 last:pb-0 gap-3">
                                            <div className="flex items-start sm:items-center gap-3">
                                                <div className="mt-0.5 sm:mt-0">
                                                    {getStatusIcon(withdrawal.status)}
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        {details.isBank ? (
                                                            <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
                                                                <Building2 className="h-3 w-3" /> Bank Wire
                                                            </span>
                                                        ) : (
                                                            <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                                                                <Coins className="h-3 w-3" /> {details.cryptoSymbol || "Crypto"}
                                                            </span>
                                                        )}
                                                        <p className="font-medium text-foreground text-sm">
                                                            {details.isBank
                                                                ? `${details.bank?.bank_name} (${details.bank?.account_number ? `•••• ${details.bank.account_number.slice(-4)}` : "Direct"})`
                                                                : `${withdrawal.crypto_type} Transfer`}
                                                        </p>
                                                    </div>
                                                    <p className="text-xs text-muted-foreground mt-0.5">
                                                        {new Date(withdrawal.created_at).toLocaleString()}
                                                        {withdrawal.admin_notes && (
                                                            <span className="block text-[11px] text-muted-foreground italic mt-0.5">
                                                                Note: {withdrawal.admin_notes}
                                                            </span>
                                                        )}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="text-left sm:text-right pl-7 sm:pl-0">
                                                <p className="font-semibold text-foreground text-sm sm:text-base">
                                                    ${Number(withdrawal.amount).toFixed(2)}
                                                </p>
                                                <span className={`inline-block text-xs font-medium capitalize ${
                                                    withdrawal.status === 'approved' ? 'text-green-500' :
                                                    withdrawal.status === 'rejected' ? 'text-destructive' :
                                                    withdrawal.status === 'processing' ? 'text-blue-400' :
                                                    'text-yellow-500'
                                                }`}>
                                                    {withdrawal.status === 'processing' ? 'Processing / On Hold' : withdrawal.status}
                                                </span>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        ) : (
                            <p className="text-center text-sm text-muted-foreground py-6">No withdrawals requested yet</p>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
