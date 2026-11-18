-- ============================================================
-- 017: Add loss tracking columns across all earning services
-- Admin can control user losses via the User Activities dashboard
-- ============================================================

-- Investments: add current_loss
ALTER TABLE public.investments
  ADD COLUMN IF NOT EXISTS current_loss DECIMAL(15, 2) DEFAULT 0.00;

-- Copy subscriptions: add current_loss
ALTER TABLE public.copy_subscriptions
  ADD COLUMN IF NOT EXISTS current_loss DECIMAL(15, 2) DEFAULT 0.00;

-- User mining: add current_loss
ALTER TABLE public.user_mining
  ADD COLUMN IF NOT EXISTS current_loss DECIMAL(15, 2) DEFAULT 0.00;

-- User stakes: add current_loss
ALTER TABLE public.user_stakes
  ADD COLUMN IF NOT EXISTS current_loss DECIMAL(15, 2) DEFAULT 0.00;

-- Signal subscriptions: add profit and loss tracking
ALTER TABLE public.signal_subscriptions
  ADD COLUMN IF NOT EXISTS current_profit DECIMAL(15, 2) DEFAULT 0.00;
ALTER TABLE public.signal_subscriptions
  ADD COLUMN IF NOT EXISTS current_loss DECIMAL(15, 2) DEFAULT 0.00;
