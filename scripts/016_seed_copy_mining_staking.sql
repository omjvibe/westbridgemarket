-- ============================================================
-- 016: Seed Copy Trading Experts, Mining Plans & Staking Pools
-- All minimums start at $2,000+ but admin can change via dashboard
-- ============================================================

-- -----------------------------------------------
-- Copy Trading Experts (seeded with admin user_id placeholder)
-- NOTE: Replace the user_id with a real user UUID from your users table,
-- or create a "system" user for seeded experts.
-- -----------------------------------------------

-- First, ensure we have a system user for seeded data
-- We'll use the first admin user as the owner
DO $$
DECLARE
  admin_uid UUID;
BEGIN
  SELECT id INTO admin_uid FROM public.admin_users LIMIT 1;

  -- If no admin exists, try first user
  IF admin_uid IS NULL THEN
    SELECT id INTO admin_uid FROM public.users LIMIT 1;
  END IF;

  -- Only seed if we have a user
  IF admin_uid IS NOT NULL THEN

    -- Copy Trading Experts
    INSERT INTO public.copy_experts (user_id, display_name, bio, total_followers, success_rate, total_profit, is_active, image_url, years_experience, total_trades, min_investment)
    VALUES
      (admin_uid, 'Marcus Sterling', 'Former Goldman Sachs quant strategist with 12+ years managing institutional crypto portfolios. Specializes in BTC/ETH swing trading with a proprietary algorithm that captures 78% of major moves.', 4821, 91.40, 2847500.00, true, 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=face', 12, 8450, 2000),
      (admin_uid, 'Elena Vasquez', 'Certified Market Technician (CMT) and former head of trading at a Dubai-based hedge fund. Focus on forex majors and gold with strict 2:1 reward-to-risk on every trade.', 3156, 87.80, 1923000.00, true, 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=200&h=200&fit=crop&crop=face', 9, 6200, 2500),
      (admin_uid, 'James Whitfield', 'London-based commodities trader turned crypto whale. Built a $14M portfolio from $50K seed capital over 6 years. Known for catching altcoin breakouts before the crowd.', 6743, 89.20, 4156000.00, true, 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop&crop=face', 14, 11200, 3000),
      (admin_uid, 'Sophia Chen', 'Ex-Binance trading desk lead. Specializes in high-frequency scalping across 15 pairs with average trade duration under 4 hours. Consistently profitable every month since 2019.', 5289, 93.10, 3521000.00, true, 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=200&fit=crop&crop=face', 8, 15600, 2000),
      (admin_uid, 'Alexander Petrov', 'Russian-born, Singapore-based macro trader. Combines on-chain analytics with traditional TA for long-term position trading. Average hold time: 14 days, average return per trade: 23%.', 2890, 85.60, 1687000.00, true, 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop&crop=face', 11, 3400, 5000)
    ON CONFLICT DO NOTHING;

    -- Signal Providers (using same admin_uid)
    INSERT INTO public.signal_providers (user_id, display_name, description, price, success_rate, total_signals, is_active)
    VALUES
      (admin_uid, 'Alpha Signals Pro', 'Premium institutional-grade signals with real-time entry, TP and SL levels. Covers BTC, ETH, major forex pairs and gold. Average 15-20 signals per week.', 2500.00, 94.20, 1847, true),
      (admin_uid, 'Crypto Momentum Lab', 'Momentum-based crypto signals leveraging order flow analysis and whale tracking. Focus on high-probability setups with 3:1 R/R minimum.', 2000.00, 88.50, 2340, true),
      (admin_uid, 'FX Masters Elite', 'Forex-focused signal channel run by ex-JPMorgan traders. Specializing in EUR/USD, GBP/USD, USD/JPY and XAU/USD with detailed trade rationale.', 3000.00, 91.80, 3120, true)
    ON CONFLICT DO NOTHING;

  END IF;
END $$;

-- -----------------------------------------------
-- Mining Plans (BTC Cloud Mining)
-- -----------------------------------------------
INSERT INTO public.mining_plans (name, coin, hashrate, min_amount, max_amount, daily_return_rate, duration_days, description, is_active)
VALUES
  ('Starter Miner', 'BTC', '25 TH/s', 2000.00, 9999.99, 0.35, 30, 'Entry-level Bitcoin mining contract with competitive hashrate allocation. Ideal for first-time miners looking to earn passive BTC income with minimal capital.', true),
  ('Advanced Miner', 'BTC', '100 TH/s', 10000.00, 49999.99, 0.55, 60, 'Professional-grade mining contract with 4x hashrate of the Starter tier. Enhanced cooling infrastructure and priority block allocation for consistent daily returns.', true),
  ('Elite Miner', 'BTC', '500 TH/s', 50000.00, 250000.00, 0.75, 90, 'Institutional mining contract with maximum hashrate allocation and dedicated ASIC hardware. Includes priority support, real-time dashboard analytics, and guaranteed uptime SLA.', true),
  ('Genesis Miner', 'BTC', '1 PH/s', 100000.00, 1000000.00, 0.95, 120, 'Ultra-premium petahash-class mining operation with direct access to hydroelectric-powered mining facilities. The highest yield tier available on the platform.', true)
ON CONFLICT DO NOTHING;

-- -----------------------------------------------
-- Staking Pools (Multi-Token Yield)
-- -----------------------------------------------
INSERT INTO public.staking_pools (token, name, apy_rate, min_stake, max_stake, lock_period_days, description, is_active)
VALUES
  ('ETH', 'Ethereum Validator Yield', 18.50, 2000.00, 500000.00, 30, 'Stake ETH through our enterprise validator nodes on the Beacon Chain. Earn consistent proof-of-stake rewards with institutional-grade security and 99.9% uptime.', true),
  ('ETH', 'ETH Max Lock', 24.00, 10000.00, 1000000.00, 90, 'Premium 90-day ETH staking vault with boosted APY. Longer lock period enables higher yield through optimized MEV capture and validator performance bonuses.', true),
  ('SOL', 'Solana Turbo Stake', 22.00, 2000.00, 300000.00, 30, 'High-performance Solana staking with top-tier validator delegation. Benefit from Solana''s fast finality and low fees while earning competitive staking rewards.', true),
  ('ADA', 'Cardano Steady Yield', 15.00, 2000.00, 200000.00, 30, 'Delegate ADA to our optimized stake pools with consistent epoch rewards. Cardano''s mature proof-of-stake design ensures reliable, predictable yield generation.', true),
  ('DOT', 'Polkadot Nominator Pool', 20.00, 2500.00, 400000.00, 60, 'Participate in Polkadot''s nominated proof-of-stake consensus. Our curated validator set maximizes era rewards while minimizing slashing risk across parachains.', true),
  ('MATIC', 'Polygon Yield Farm', 16.50, 2000.00, 250000.00, 30, 'Stake MATIC through Polygon''s checkpoint mechanism. Earn staking rewards plus additional yield from our DeFi strategy overlay on the Polygon network.', true),
  ('AVAX', 'Avalanche Snowstake', 19.00, 3000.00, 350000.00, 45, 'Delegate AVAX to our high-uptime Avalanche validators. Benefit from Avalanche''s sub-second finality and earn top-quartile staking returns with flexible 45-day terms.', true),
  ('XRP', 'XRP Ledger Yield', 14.50, 2000.00, 300000.00, 30, 'Earn yield on XRP through our managed liquidity provision on the XRP Ledger DEX and AMM pools. Benefit from XRP''s ultra-fast settlement and near-zero transaction costs.', true)
ON CONFLICT DO NOTHING;
