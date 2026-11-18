-- ============================================================
-- 019: Stock Investments & Mining Server Rentals
-- ============================================================

-- -----------------------------------------------
-- Stocks: admin-managed stock listings
-- -----------------------------------------------
CREATE TABLE IF NOT EXISTS public.stocks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    ticker TEXT NOT NULL,
    logo_url TEXT,
    price_per_share DECIMAL(15, 4) NOT NULL DEFAULT 1.00,
    min_shares INTEGER NOT NULL DEFAULT 100,
    max_shares INTEGER NOT NULL DEFAULT 100000,
    category TEXT NOT NULL DEFAULT 'tech',  -- tech, ai, social, etc.
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User stock purchases
CREATE TABLE IF NOT EXISTS public.user_stock_purchases (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    stock_id UUID NOT NULL REFERENCES public.stocks(id) ON DELETE CASCADE,
    shares INTEGER NOT NULL,
    price_per_share DECIMAL(15, 4) NOT NULL,  -- locked at purchase time
    total_cost DECIMAL(15, 2) NOT NULL,
    current_value DECIMAL(15, 2) DEFAULT 0.00,
    current_profit DECIMAL(15, 2) DEFAULT 0.00,
    current_loss DECIMAL(15, 2) DEFAULT 0.00,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'sold', 'cancelled')),
    purchased_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- -----------------------------------------------
-- Mining Server Rentals
-- -----------------------------------------------
CREATE TABLE IF NOT EXISTS public.mining_servers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    specs TEXT NOT NULL,                    -- e.g. 'NVIDIA A100 x8, 256GB RAM'
    hashrate TEXT NOT NULL,                 -- e.g. '2.4 PH/s'
    monthly_cost DECIMAL(15, 2) NOT NULL,
    quarterly_cost DECIMAL(15, 2) NOT NULL, -- discounted
    daily_return_rate DECIMAL(8, 4) NOT NULL DEFAULT 0.80,
    description TEXT,
    image_url TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User server rentals
CREATE TABLE IF NOT EXISTS public.user_server_rentals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    server_id UUID NOT NULL REFERENCES public.mining_servers(id) ON DELETE CASCADE,
    rental_period TEXT NOT NULL CHECK (rental_period IN ('monthly', 'quarterly')),
    cost DECIMAL(15, 2) NOT NULL,
    current_earnings DECIMAL(15, 2) DEFAULT 0.00,
    current_loss DECIMAL(15, 2) DEFAULT 0.00,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'expired', 'cancelled')),
    start_date TIMESTAMPTZ DEFAULT NOW(),
    end_date TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.stocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_stock_purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mining_servers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_server_rentals ENABLE ROW LEVEL SECURITY;

-- RLS: stocks (public read, admin write)
CREATE POLICY "Anyone can view stocks" ON public.stocks FOR SELECT USING (true);
CREATE POLICY "Admins manage stocks" ON public.stocks FOR ALL USING (
    EXISTS (SELECT 1 FROM public.admin_users WHERE id = auth.uid())
);

-- RLS: user_stock_purchases
CREATE POLICY "Users view own stock purchases" ON public.user_stock_purchases FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users create stock purchases" ON public.user_stock_purchases FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins manage all stock purchases" ON public.user_stock_purchases FOR ALL USING (
    EXISTS (SELECT 1 FROM public.admin_users WHERE id = auth.uid())
);

-- RLS: mining_servers (public read, admin write)
CREATE POLICY "Anyone can view mining servers" ON public.mining_servers FOR SELECT USING (true);
CREATE POLICY "Admins manage mining servers" ON public.mining_servers FOR ALL USING (
    EXISTS (SELECT 1 FROM public.admin_users WHERE id = auth.uid())
);

-- RLS: user_server_rentals
CREATE POLICY "Users view own server rentals" ON public.user_server_rentals FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users create server rentals" ON public.user_server_rentals FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins manage all server rentals" ON public.user_server_rentals FOR ALL USING (
    EXISTS (SELECT 1 FROM public.admin_users WHERE id = auth.uid())
);

-- Indexes
CREATE INDEX idx_user_stock_purchases_user_id ON public.user_stock_purchases(user_id);
CREATE INDEX idx_user_stock_purchases_status ON public.user_stock_purchases(status);
CREATE INDEX idx_user_server_rentals_user_id ON public.user_server_rentals(user_id);
CREATE INDEX idx_user_server_rentals_status ON public.user_server_rentals(status);

-- Page visibility
INSERT INTO public.site_settings (key, value, updated_at)
VALUES
    ('stocks_page_enabled', 'true', NOW()),
    ('server_rental_page_enabled', 'true', NOW())
ON CONFLICT (key) DO NOTHING;

-- -----------------------------------------------
-- Seed Stocks (Tech, AI, Social)
-- -----------------------------------------------
INSERT INTO public.stocks (name, ticker, logo_url, price_per_share, min_shares, max_shares, category, description)
VALUES
  ('Microsoft Corporation', 'MSFT', 'https://img.logo.dev/microsoft.com?token=live_6a1a28fd-6420-4492-aeb0-b297461d9de2', 420.50, 50, 10000, 'tech', 'Global technology leader in cloud computing (Azure), enterprise software, and AI integration. Market cap exceeds $3 trillion.'),
  ('X Corp (Twitter)', 'X', 'https://img.logo.dev/x.com?token=live_6a1a28fd-6420-4492-aeb0-b297461d9de2', 45.00, 100, 50000, 'social', 'The world''s real-time information network. Rebranded from Twitter, now the "everything app" for social, payments, and media.'),
  ('NVIDIA Corporation', 'NVDA', 'https://img.logo.dev/nvidia.com?token=live_6a1a28fd-6420-4492-aeb0-b297461d9de2', 875.30, 20, 5000, 'ai', 'Dominant AI chip maker powering the global AI revolution. GPUs used in data centers, autonomous vehicles, and generative AI.'),
  ('OpenAI (Pre-IPO)', 'OAI', 'https://img.logo.dev/openai.com?token=live_6a1a28fd-6420-4492-aeb0-b297461d9de2', 156.00, 50, 20000, 'ai', 'Creator of ChatGPT and GPT-4. Leading the frontier of artificial general intelligence. Pre-IPO allocation available.'),
  ('Alphabet (Google)', 'GOOGL', 'https://img.logo.dev/google.com?token=live_6a1a28fd-6420-4492-aeb0-b297461d9de2', 178.25, 50, 10000, 'ai', 'Parent company of Google. Leader in search, cloud, YouTube, and AI research with Gemini and DeepMind.'),
  ('Meta Platforms', 'META', 'https://img.logo.dev/meta.com?token=live_6a1a28fd-6420-4492-aeb0-b297461d9de2', 510.80, 30, 8000, 'tech', 'Owner of Facebook, Instagram, WhatsApp. Investing heavily in AI and the metaverse with Reality Labs.'),
  ('Tesla Inc', 'TSLA', 'https://img.logo.dev/tesla.com?token=live_6a1a28fd-6420-4492-aeb0-b297461d9de2', 265.40, 50, 10000, 'tech', 'Electric vehicle and clean energy pioneer. Also developing autonomous driving AI and humanoid robots (Optimus).'),
  ('Palantir Technologies', 'PLTR', 'https://img.logo.dev/palantir.com?token=live_6a1a28fd-6420-4492-aeb0-b297461d9de2', 24.50, 200, 100000, 'ai', 'AI-powered data analytics for government and enterprise. AIP platform brings large language models to critical operations.'),
  ('AMD (Advanced Micro Devices)', 'AMD', 'https://img.logo.dev/amd.com?token=live_6a1a28fd-6420-4492-aeb0-b297461d9de2', 165.80, 50, 15000, 'ai', 'Major competitor to NVIDIA in AI accelerator chips. MI300X GPU gaining traction in AI data centers worldwide.'),
  ('Apple Inc', 'AAPL', 'https://img.logo.dev/apple.com?token=live_6a1a28fd-6420-4492-aeb0-b297461d9de2', 198.50, 50, 10000, 'tech', 'World''s most valuable company. Consumer electronics, services ecosystem, and Apple Intelligence AI integration.')
ON CONFLICT DO NOTHING;

-- -----------------------------------------------
-- Seed Mining Servers
-- -----------------------------------------------
INSERT INTO public.mining_servers (name, specs, hashrate, monthly_cost, quarterly_cost, daily_return_rate, description, image_url)
VALUES
  ('Starter Rig', '4x NVIDIA RTX 4090, 64GB RAM, 2TB NVMe', '450 TH/s', 3500.00, 9000.00, 0.65, 'Entry-level mining server ideal for beginners. Optimized for Bitcoin and Ethereum mining with efficient power consumption.', '/image/servers/starter_rig.png'),
  ('Pro Miner', '8x NVIDIA A100, 256GB RAM, 4TB NVMe', '2.4 PH/s', 8500.00, 22000.00, 0.85, 'Professional-grade mining server with enterprise GPUs. High hashrate output suitable for serious miners seeking consistent returns.', '/image/servers/pro_miner.png'),
  ('Elite Supercomputer', '16x NVIDIA H100 SXM, 512GB RAM, 8TB NVMe', '8.5 PH/s', 25000.00, 65000.00, 1.10, 'Top-tier supercomputer node with the latest Hopper architecture. Maximum hashrate for institutional-level mining operations.', '/image/servers/elite_supercomputer.png'),
  ('Quantum Node', '32x NVIDIA H200, 1TB RAM, 16TB NVMe', '22 PH/s', 75000.00, 195000.00, 1.35, 'Ultra-premium next-gen mining supercomputer. Reserved for high-net-worth clients seeking the absolute highest yield in crypto mining.', '/image/servers/quantum_node.png')
ON CONFLICT DO NOTHING;
