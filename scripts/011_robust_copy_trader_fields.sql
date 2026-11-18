-- Migration to add advanced fields to copy_experts table for robust UI
ALTER TABLE public.copy_experts ADD COLUMN IF NOT EXISTS years_experience INTEGER DEFAULT 0;
ALTER TABLE public.copy_experts ADD COLUMN IF NOT EXISTS total_trades INTEGER DEFAULT 0;
ALTER TABLE public.copy_experts ADD COLUMN IF NOT EXISTS min_investment DECIMAL(15, 2) DEFAULT 1000.00;
