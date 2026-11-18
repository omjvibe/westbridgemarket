-- ============================================================
-- 015: Mining Plans, User Mining, Staking Pools & User Stakes
-- ============================================================

-- Mining plans (admin-created Bitcoin cloud mining packages)
CREATE TABLE IF NOT EXISTS public.mining_plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    coin TEXT NOT NULL DEFAULT 'BTC',
    hashrate TEXT NOT NULL,              -- e.g. '50 TH/s'
    min_amount DECIMAL(15, 2) NOT NULL DEFAULT 2000.00,
    max_amount DECIMAL(15, 2) NOT NULL DEFAULT 50000.00,
    daily_return_rate DECIMAL(8, 4) NOT NULL DEFAULT 0.50,  -- percentage
    duration_days INTEGER NOT NULL DEFAULT 30,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User mining positions
CREATE TABLE IF NOT EXISTS public.user_mining (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    plan_id UUID NOT NULL REFERENCES public.mining_plans(id) ON DELETE CASCADE,
    amount DECIMAL(15, 2) NOT NULL,
    current_earnings DECIMAL(15, 2) DEFAULT 0.00,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
    start_date TIMESTAMPTZ DEFAULT NOW(),
    end_date TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Staking pools (admin-created multi-token yield pools)
CREATE TABLE IF NOT EXISTS public.staking_pools (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    token TEXT NOT NULL,                 -- ETH, SOL, ADA, DOT, MATIC, AVAX
    name TEXT NOT NULL,
    apy_rate DECIMAL(8, 2) NOT NULL DEFAULT 12.00,  -- annual percentage yield
    min_stake DECIMAL(15, 2) NOT NULL DEFAULT 2000.00,
    max_stake DECIMAL(15, 2) NOT NULL DEFAULT 100000.00,
    lock_period_days INTEGER NOT NULL DEFAULT 30,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User staking positions
CREATE TABLE IF NOT EXISTS public.user_stakes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    pool_id UUID NOT NULL REFERENCES public.staking_pools(id) ON DELETE CASCADE,
    amount DECIMAL(15, 2) NOT NULL,
    current_rewards DECIMAL(15, 2) DEFAULT 0.00,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'unstaking')),
    staked_at TIMESTAMPTZ DEFAULT NOW(),
    unlock_date TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.mining_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_mining ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staking_pools ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_stakes ENABLE ROW LEVEL SECURITY;

-- RLS Policies: mining_plans (public read, admin write)
CREATE POLICY "Anyone can view active mining plans" ON public.mining_plans
    FOR SELECT USING (true);
CREATE POLICY "Admins can manage mining plans" ON public.mining_plans
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.admin_users WHERE id = auth.uid())
    );

-- RLS Policies: user_mining (user reads own, admin reads all)
CREATE POLICY "Users can view own mining" ON public.user_mining
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create mining" ON public.user_mining
    FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can manage all mining" ON public.user_mining
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.admin_users WHERE id = auth.uid())
    );

-- RLS Policies: staking_pools (public read, admin write)
CREATE POLICY "Anyone can view active staking pools" ON public.staking_pools
    FOR SELECT USING (true);
CREATE POLICY "Admins can manage staking pools" ON public.staking_pools
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.admin_users WHERE id = auth.uid())
    );

-- RLS Policies: user_stakes (user reads own, admin reads all)
CREATE POLICY "Users can view own stakes" ON public.user_stakes
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create stakes" ON public.user_stakes
    FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can manage all stakes" ON public.user_stakes
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.admin_users WHERE id = auth.uid())
    );

-- Indexes for performance
CREATE INDEX idx_user_mining_user_id ON public.user_mining(user_id);
CREATE INDEX idx_user_mining_status ON public.user_mining(status);
CREATE INDEX idx_user_stakes_user_id ON public.user_stakes(user_id);
CREATE INDEX idx_user_stakes_status ON public.user_stakes(status);

-- Seed page visibility settings
INSERT INTO public.site_settings (key, value, description)
VALUES
    ('mining_page_enabled', 'true', 'Show/hide Mining page for users'),
    ('staking_page_enabled', 'true', 'Show/hide Staking page for users')
ON CONFLICT (key) DO NOTHING;
