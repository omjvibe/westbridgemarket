-- Migration to support specific asset categorization for investment plans and delivery details for investments
ALTER TABLE public.investment_plans ADD COLUMN IF NOT EXISTS asset_category TEXT DEFAULT 'crypto';
ALTER TABLE public.investment_plans ADD COLUMN IF NOT EXISTS specific_asset TEXT DEFAULT 'Bitcoin (BTC)';

ALTER TABLE public.investments ADD COLUMN IF NOT EXISTS delivery_details JSONB DEFAULT NULL;

-- Update existing plans with diverse assets
UPDATE public.investment_plans SET asset_category = 'crypto', specific_asset = 'Bitcoin (BTC)' WHERE plan_type = 'basic';
UPDATE public.investment_plans SET asset_category = 'crypto', specific_asset = 'Ethereum (ETH)' WHERE plan_type = 'silver';
UPDATE public.investment_plans SET asset_category = 'physical', specific_asset = 'Gold' WHERE plan_type = 'gold';
UPDATE public.investment_plans SET asset_category = 'stocks', specific_asset = 'Apple (AAPL)' WHERE plan_type = 'platinum';
UPDATE public.investment_plans SET asset_category = 'forex', specific_asset = 'EUR/USD' WHERE plan_type = 'diamond';
