export type WithdrawalMethod = "crypto" | "bank_transfer"

export interface BankDetails {
  method?: "bank_transfer"
  bank_name: string
  account_holder_name: string
  account_number: string
  routing_number?: string
  swift_code?: string
  bank_country?: string
  account_type?: "checking" | "savings" | string
}

export interface ParsedWithdrawalDestination {
  isBank: boolean
  method: WithdrawalMethod
  bank?: BankDetails
  cryptoSymbol?: string
  walletAddress?: string
  displaySummary: string
}

/**
 * Robustly parses destination details from a transaction row,
 * supporting both modern explicit columns and fallback JSON strings stored in wallet_address.
 */
export function parseWithdrawalDestination(tx: {
  crypto_type?: string | null
  wallet_address?: string | null
  withdrawal_method?: string | null
  bank_name?: string | null
  account_holder_name?: string | null
  account_number?: string | null
  routing_number?: string | null
  swift_code?: string | null
  bank_country?: string | null
  account_type?: string | null
}): ParsedWithdrawalDestination {
  // Case 1: Explicit bank columns exist and are populated
  if (tx.bank_name && tx.account_number) {
    const bank: BankDetails = {
      method: "bank_transfer",
      bank_name: tx.bank_name,
      account_holder_name: tx.account_holder_name || "",
      account_number: tx.account_number,
      routing_number: tx.routing_number || "",
      swift_code: tx.swift_code || "",
      bank_country: tx.bank_country || "",
      account_type: tx.account_type || "checking",
    }
    return {
      isBank: true,
      method: "bank_transfer",
      bank,
      displaySummary: `${bank.bank_name} (${maskAccountNumber(bank.account_number)})`,
    }
  }

  // Case 2: wallet_address contains JSON-encoded bank details
  if (tx.wallet_address && typeof tx.wallet_address === "string" && tx.wallet_address.trim().startsWith("{")) {
    try {
      const parsed = JSON.parse(tx.wallet_address)
      if (parsed && typeof parsed === "object" && (parsed.bank_name || parsed.method === "bank_transfer")) {
        const bank: BankDetails = {
          method: "bank_transfer",
          bank_name: parsed.bank_name || "Bank Wire",
          account_holder_name: parsed.account_holder_name || "",
          account_number: parsed.account_number || "",
          routing_number: parsed.routing_number || "",
          swift_code: parsed.swift_code || "",
          bank_country: parsed.bank_country || "",
          account_type: parsed.account_type || "checking",
        }
        return {
          isBank: true,
          method: "bank_transfer",
          bank,
          displaySummary: `${bank.bank_name} (${maskAccountNumber(bank.account_number)})`,
        }
      }
    } catch {
      // not json, continue
    }
  }

  // Case 3: marked as Bank Transfer without structured json
  if (tx.crypto_type === "Bank Transfer" || tx.withdrawal_method === "bank_transfer") {
    const bank: BankDetails = {
      method: "bank_transfer",
      bank_name: "Bank Wire Transfer",
      account_holder_name: "",
      account_number: tx.wallet_address || "",
    }
    return {
      isBank: true,
      method: "bank_transfer",
      bank,
      displaySummary: `Bank Wire (${maskAccountNumber(tx.wallet_address || "")})`,
    }
  }

  // Case 4: Standard Cryptocurrency withdrawal
  const symbol = tx.crypto_type || "Crypto"
  const wallet = tx.wallet_address || ""
  return {
    isBank: false,
    method: "crypto",
    cryptoSymbol: symbol,
    walletAddress: wallet,
    displaySummary: `${symbol} - ${wallet ? truncateAddress(wallet) : "Wallet"}`,
  }
}

export function maskAccountNumber(num: string): string {
  if (!num) return "—"
  const cleaned = num.trim()
  if (cleaned.length <= 4) return cleaned
  return `•••• ${cleaned.slice(-4)}`
}

export function truncateAddress(addr: string, start = 6, end = 4): string {
  if (!addr) return ""
  if (addr.length <= start + end) return addr
  return `${addr.slice(0, start)}...${addr.slice(-end)}`
}
