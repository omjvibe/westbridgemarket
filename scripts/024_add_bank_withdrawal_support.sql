-- =========================================================
-- MIGRATION 024: Add Bank Withdrawal Support to Transactions
-- Supports Wire Transfer, ACH, SEPA, and International Banking
-- =========================================================

-- 1. Ensure 'processing' status is available in transaction_status enum
DO $$ BEGIN
    ALTER TYPE transaction_status ADD VALUE IF NOT EXISTS 'processing';
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 2. Add bank withdrawal columns to public.transactions
ALTER TABLE public.transactions
  ADD COLUMN IF NOT EXISTS withdrawal_method TEXT DEFAULT 'crypto',
  ADD COLUMN IF NOT EXISTS bank_name TEXT,
  ADD COLUMN IF NOT EXISTS account_holder_name TEXT,
  ADD COLUMN IF NOT EXISTS account_number TEXT,
  ADD COLUMN IF NOT EXISTS routing_number TEXT,
  ADD COLUMN IF NOT EXISTS swift_code TEXT,
  ADD COLUMN IF NOT EXISTS bank_country TEXT,
  ADD COLUMN IF NOT EXISTS account_type TEXT;

-- 3. Comments for documentation
COMMENT ON COLUMN public.transactions.withdrawal_method IS 'Withdrawal method: crypto or bank_transfer';
COMMENT ON COLUMN public.transactions.bank_name IS 'Destination bank name for wire/ACH withdrawal';
COMMENT ON COLUMN public.transactions.account_holder_name IS 'Beneficiary account holder name';
COMMENT ON COLUMN public.transactions.account_number IS 'Bank account number or IBAN';
COMMENT ON COLUMN public.transactions.routing_number IS 'Routing transit number (ABA) or Sort Code';
COMMENT ON COLUMN public.transactions.swift_code IS 'SWIFT / BIC code for international wire';
COMMENT ON COLUMN public.transactions.bank_country IS 'Country of destination bank';
COMMENT ON COLUMN public.transactions.account_type IS 'Account type: checking or savings';
