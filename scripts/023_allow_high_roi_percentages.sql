-- ============================================================
-- 023: Allow High ROI & Yield Percentages (> 2000%)
-- Expands DECIMAL(5,2) columns to DECIMAL(15,2) to allow high ROI inputs.
-- ============================================================

-- 1. Investment Plans (roi_percentage)
ALTER TABLE public.investment_plans
  ALTER COLUMN roi_percentage TYPE DECIMAL(15, 2);

-- 2. Future Markets Investment Products (target_return_rate, fees)
ALTER TABLE public.investment_products
  ALTER COLUMN target_return_rate TYPE DECIMAL(15, 2),
  ALTER COLUMN fee_percentage TYPE DECIMAL(15, 2),
  ALTER COLUMN management_fee TYPE DECIMAL(15, 2),
  ALTER COLUMN performance_fee TYPE DECIMAL(15, 2);

-- 3. Copy Experts & Signal Providers
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'copy_experts') THEN
    ALTER TABLE public.copy_experts ALTER COLUMN success_rate TYPE DECIMAL(15, 2);
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'signal_providers') THEN
    ALTER TABLE public.signal_providers ALTER COLUMN success_rate TYPE DECIMAL(15, 2);
  END IF;
END $$;

-- 4. Mining, Staking & Server Plans
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'mining_plans') THEN
    ALTER TABLE public.mining_plans ALTER COLUMN daily_return_rate TYPE DECIMAL(15, 4);
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'staking_plans') THEN
    ALTER TABLE public.staking_plans ALTER COLUMN apy_rate TYPE DECIMAL(15, 2);
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'server_plans') THEN
    ALTER TABLE public.server_plans ALTER COLUMN daily_return_rate TYPE DECIMAL(15, 4);
  END IF;
END $$;
