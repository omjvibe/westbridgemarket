-- ============================================================
-- 020: Future Markets & AI Investment Vertical
-- ============================================================

-- -----------------------------------------------
-- 1. Investment Themes
-- -----------------------------------------------
CREATE TABLE IF NOT EXISTS public.investment_themes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT NOT NULL,
    icon_name TEXT NOT NULL DEFAULT 'Cpu',
    is_active BOOLEAN DEFAULT true,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- -----------------------------------------------
-- 2. Investment Products
-- -----------------------------------------------
CREATE TABLE IF NOT EXISTS public.investment_products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    theme_id UUID NOT NULL REFERENCES public.investment_themes(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    thesis TEXT NOT NULL,
    summary TEXT NOT NULL,
    risk_level TEXT NOT NULL CHECK (risk_level IN ('Conservative', 'Moderate', 'Growth', 'Aggressive')),
    min_investment_amount DECIMAL(15, 2) NOT NULL DEFAULT 1000.00,
    max_investment_amount DECIMAL(15, 2) NOT NULL DEFAULT 500000.00,
    status TEXT NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'UNDER_REVIEW', 'APPROVED', 'LIVE', 'PAUSED', 'ARCHIVED')),
    version INTEGER NOT NULL DEFAULT 1,
    fee_percentage DECIMAL(5, 2) NOT NULL DEFAULT 1.50,
    management_fee DECIMAL(5, 2) NOT NULL DEFAULT 1.00,
    performance_fee DECIMAL(5, 2) NOT NULL DEFAULT 10.00,
    target_return_rate DECIMAL(5, 2) NOT NULL DEFAULT 15.00,
    rebalancing_frequency TEXT NOT NULL DEFAULT 'Quarterly',
    jurisdiction_rules JSONB DEFAULT '{"allowed_countries": ["*"], "excluded_countries": []}'::jsonb,
    eligibility_rules JSONB DEFAULT '{"min_kyc_level": "approved", "accredited_only": false}'::jsonb,
    educational_content TEXT,
    risk_disclosures TEXT,
    effective_date TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- -----------------------------------------------
-- 3. Portfolio Assets Universe
-- -----------------------------------------------
CREATE TABLE IF NOT EXISTS public.portfolio_assets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    symbol TEXT NOT NULL,
    name TEXT NOT NULL,
    category TEXT NOT NULL, -- e.g. Semiconductor, Compute, Cooling, Energy, Software, Robotics
    provider_type TEXT NOT NULL DEFAULT 'DIRECT' CHECK (provider_type IN ('DIRECT', 'MANUAL_EXTERNAL')),
    pricing_source TEXT NOT NULL DEFAULT 'FINANCIAL_FEED',
    current_price DECIMAL(15, 4) NOT NULL DEFAULT 100.00,
    price_updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- -----------------------------------------------
-- 4. Portfolio Allocations (Versioned)
-- -----------------------------------------------
CREATE TABLE IF NOT EXISTS public.portfolio_allocations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES public.investment_products(id) ON DELETE CASCADE,
    asset_id UUID NOT NULL REFERENCES public.portfolio_assets(id) ON DELETE CASCADE,
    weight_percentage DECIMAL(5, 2) NOT NULL,
    min_weight_limit DECIMAL(5, 2) NOT NULL DEFAULT 1.00,
    max_weight_limit DECIMAL(5, 2) NOT NULL DEFAULT 50.00,
    version INTEGER NOT NULL DEFAULT 1,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- -----------------------------------------------
-- 5. Risk Profiles
-- -----------------------------------------------
CREATE TABLE IF NOT EXISTS public.risk_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    code TEXT UNIQUE NOT NULL, -- CONSERVATIVE, MODERATE, GROWTH, AGGRESSIVE
    description TEXT NOT NULL,
    max_equity_allocation DECIMAL(5, 2) NOT NULL,
    recommended_horizon TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- -----------------------------------------------
-- 6. Client Portfolios (Holdings)
-- -----------------------------------------------
CREATE TABLE IF NOT EXISTS public.client_portfolios (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.investment_products(id) ON DELETE CASCADE,
    invested_amount DECIMAL(15, 2) NOT NULL,
    current_value DECIMAL(15, 2) NOT NULL,
    current_earnings DECIMAL(15, 2) DEFAULT 0.00,
    current_loss DECIMAL(15, 2) DEFAULT 0.00,
    units DECIMAL(15, 6) NOT NULL DEFAULT 1.00,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'redeemed')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- -----------------------------------------------
-- 7. Portfolio Transactions Ledger
-- -----------------------------------------------
CREATE TABLE IF NOT EXISTS public.portfolio_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    portfolio_id UUID REFERENCES public.client_portfolios(id) ON DELETE SET NULL,
    product_id UUID NOT NULL REFERENCES public.investment_products(id) ON DELETE CASCADE,
    transaction_type TEXT NOT NULL CHECK (transaction_type IN ('buy', 'sell', 'rebalance', 'dividend')),
    amount DECIMAL(15, 2) NOT NULL,
    fee_amount DECIMAL(15, 2) DEFAULT 0.00,
    units DECIMAL(15, 6) NOT NULL DEFAULT 1.00,
    status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'failed', 'cancelled')),
    execution_method TEXT NOT NULL DEFAULT 'DIRECT' CHECK (execution_method IN ('DIRECT', 'MANUAL_EXTERNAL')),
    idempotency_key TEXT UNIQUE,
    audit_details JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- -----------------------------------------------
-- 8. Portfolio Performance Snapshots
-- -----------------------------------------------
CREATE TABLE IF NOT EXISTS public.portfolio_performance (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES public.investment_products(id) ON DELETE CASCADE,
    snapshot_date DATE NOT NULL DEFAULT CURRENT_DATE,
    nav_per_unit DECIMAL(15, 4) NOT NULL DEFAULT 100.00,
    daily_change_percent DECIMAL(5, 2) DEFAULT 0.00,
    ytd_return DECIMAL(5, 2) DEFAULT 0.00,
    total_aum DECIMAL(15, 2) DEFAULT 0.00,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- -----------------------------------------------
-- 9. Product Fees Schedule
-- -----------------------------------------------
CREATE TABLE IF NOT EXISTS public.product_fees (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES public.investment_products(id) ON DELETE CASCADE,
    fee_type TEXT NOT NULL CHECK (fee_type IN ('management', 'performance', 'entry', 'exit')),
    percentage DECIMAL(5, 2) DEFAULT 0.00,
    fixed_amount DECIMAL(15, 2) DEFAULT 0.00,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- -----------------------------------------------
-- 10. Market Pricing Cache
-- -----------------------------------------------
CREATE TABLE IF NOT EXISTS public.market_prices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    asset_id UUID NOT NULL REFERENCES public.portfolio_assets(id) ON DELETE CASCADE,
    price DECIMAL(15, 4) NOT NULL,
    source TEXT NOT NULL DEFAULT 'MARKET_DATA_PROVIDER',
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    valuation_methodology TEXT NOT NULL DEFAULT 'Real-Time Exchange Feed'
);

-- -----------------------------------------------
-- 11. Product Documents
-- -----------------------------------------------
CREATE TABLE IF NOT EXISTS public.product_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES public.investment_products(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    doc_type TEXT NOT NULL CHECK (doc_type IN ('prospectus', 'factsheet', 'risk_disclosure', 'audit_report')),
    file_url TEXT NOT NULL,
    is_public BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- -----------------------------------------------
-- 12. Audit Logs (Immutable)
-- -----------------------------------------------
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    admin_id UUID REFERENCES public.admin_users(id),
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id UUID NOT NULL,
    previous_value JSONB,
    new_value JSONB,
    reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- -----------------------------------------------
-- 13. Portfolio Recommendations Audit Record
-- -----------------------------------------------
CREATE TABLE IF NOT EXISTS public.future_portfolio_recommendations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    risk_profile_code TEXT NOT NULL,
    investment_horizon TEXT NOT NULL,
    inputs JSONB NOT NULL,
    proposed_allocations JSONB NOT NULL,
    ruleset_version TEXT NOT NULL DEFAULT 'v1.0.0',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- -----------------------------------------------
-- 14. Telemetry Analytics
-- -----------------------------------------------
CREATE TABLE IF NOT EXISTS public.future_markets_analytics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    product_id UUID REFERENCES public.investment_products(id) ON DELETE CASCADE,
    action_type TEXT NOT NULL CHECK (action_type IN ('view', 'research', 'invest', 'watchlist', 'abandon')),
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on all tables
ALTER TABLE public.investment_themes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.investment_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.portfolio_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.portfolio_allocations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.risk_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_portfolios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.portfolio_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.portfolio_performance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_fees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.market_prices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.future_portfolio_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.future_markets_analytics ENABLE ROW LEVEL SECURITY;

-- Public/Client RLS Policies
CREATE POLICY "Anyone can view active themes" ON public.investment_themes FOR SELECT USING (true);
CREATE POLICY "Anyone can view live products" ON public.investment_products FOR SELECT USING (status = 'LIVE' OR EXISTS (SELECT 1 FROM public.admin_users WHERE id = auth.uid()));
CREATE POLICY "Anyone can view assets" ON public.portfolio_assets FOR SELECT USING (true);
CREATE POLICY "Anyone can view allocations" ON public.portfolio_allocations FOR SELECT USING (true);
CREATE POLICY "Anyone can view risk profiles" ON public.risk_profiles FOR SELECT USING (true);
CREATE POLICY "Users view own client portfolios" ON public.client_portfolios FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users view own transactions" ON public.portfolio_transactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Anyone can view performance" ON public.portfolio_performance FOR SELECT USING (true);
CREATE POLICY "Anyone can view product documents" ON public.product_documents FOR SELECT USING (true);

-- Admin RLS Policies
CREATE POLICY "Admins manage themes" ON public.investment_themes FOR ALL USING (EXISTS (SELECT 1 FROM public.admin_users WHERE id = auth.uid()));
CREATE POLICY "Admins manage products" ON public.investment_products FOR ALL USING (EXISTS (SELECT 1 FROM public.admin_users WHERE id = auth.uid()));
CREATE POLICY "Admins manage assets" ON public.portfolio_assets FOR ALL USING (EXISTS (SELECT 1 FROM public.admin_users WHERE id = auth.uid()));
CREATE POLICY "Admins manage allocations" ON public.portfolio_allocations FOR ALL USING (EXISTS (SELECT 1 FROM public.admin_users WHERE id = auth.uid()));
CREATE POLICY "Admins manage client portfolios" ON public.client_portfolios FOR ALL USING (EXISTS (SELECT 1 FROM public.admin_users WHERE id = auth.uid()));
CREATE POLICY "Admins manage transactions" ON public.portfolio_transactions FOR ALL USING (EXISTS (SELECT 1 FROM public.admin_users WHERE id = auth.uid()));
CREATE POLICY "Admins manage audit logs" ON public.audit_logs FOR ALL USING (EXISTS (SELECT 1 FROM public.admin_users WHERE id = auth.uid()));

-- Enable Future Markets Page Setting
INSERT INTO public.system_settings (key, value, description)
VALUES ('future_markets_page_enabled', 'true'::jsonb, 'Toggle visibility of Future Markets vertical')
ON CONFLICT (key) DO NOTHING;

INSERT INTO public.site_settings (key, value, updated_at)
VALUES ('future_markets_page_enabled', 'true', NOW())
ON CONFLICT (key) DO NOTHING;

-- -----------------------------------------------
-- SEED DATA: Themes
-- -----------------------------------------------
INSERT INTO public.investment_themes (name, slug, description, icon_name, display_order)
VALUES
  ('AI Leaders', 'ai-leaders', 'Top foundational model creators, frontier tech giants, and software category leaders dominating AI deployment.', 'Sparkles', 1),
  ('AI Infrastructure', 'ai-infrastructure', 'The physical economic stack: GPU semiconductors, liquid-cooled compute clusters, high-density data centers, and power grids.', 'Cpu', 2),
  ('Future Energy', 'future-energy', 'Clean power generation, nuclear SMRs, utility grids, and next-gen battery storage powering massive AI workloads.', 'Zap', 3),
  ('Physical AI & Robotics', 'physical-ai-robotics', 'Autonomous humanoid robots, industrial automation systems, sensor arrays, and spatial computing hardware.', 'Bot', 4),
  ('AI Healthcare', 'ai-healthcare', 'Accelerated drug discovery, AI genomic sequencing, robotic surgery, and computational biology platforms.', 'Activity', 5),
  ('Digital Security', 'digital-security', 'Post-quantum encryption, zero-trust cloud security, and real-time AI threat mitigation infrastructure.', 'Shield', 6),
  ('Space Economy', 'space-economy', 'Satellite communication constellations, orbital launch logistics, lunar infrastructure, and space manufacturing.', 'Rocket', 7),
  ('Strategic Resources', 'strategic-resources', 'Critical mineral supplies: lithium, copper, cobalt, neodymium, and rare earth elements for hardware.', 'Layers', 8),
  ('Tokenized Real-World Assets', 'tokenized-rwa', 'Institutional treasury bonds, private credit, and commercial real estate tokenized on liquid blockchains.', 'Coins', 9)
ON CONFLICT (slug) DO NOTHING;

-- -----------------------------------------------
-- SEED DATA: Risk Profiles
-- -----------------------------------------------
INSERT INTO public.risk_profiles (name, code, description, max_equity_allocation, recommended_horizon)
VALUES
  ('Conservative Preservation', 'CONSERVATIVE', 'Capital preservation focus with low volatility exposure. High allocation to energy utilities and tokenized Treasuries.', 30.00, '1 to 3 Years'),
  ('Balanced Growth', 'MODERATE', 'Balanced exposure across established tech leaders, power grids, and high-yield infrastructure.', 60.00, '3 to 5 Years'),
  ('Aggressive Innovation', 'GROWTH', 'High growth allocation targeting AI chips, robotics, and next-gen computational biology.', 85.00, '5+ Years'),
  ('Frontier Multiplier', 'AGGRESSIVE', 'Maximum exposure to disruptive early-stage pre-IPO tech, space logistics, and hyper-scale compute.', 100.00, '7+ Years')
ON CONFLICT (code) DO NOTHING;

-- -----------------------------------------------
-- SEED DATA: Portfolio Assets
-- -----------------------------------------------
INSERT INTO public.portfolio_assets (symbol, name, category, provider_type, current_price)
VALUES
  ('NVDA', 'NVIDIA Corporation', 'Semiconductors', 'DIRECT', 875.30),
  ('MSFT', 'Microsoft Azure AI', 'Compute & Cloud', 'DIRECT', 420.50),
  ('GOOGL', 'Alphabet DeepMind', 'Software & Models', 'DIRECT', 178.25),
  ('VERTIV', 'Vertiv Liquid Cooling Systems', 'Cooling Infrastructure', 'DIRECT', 88.40),
  ('EQIX', 'Equinix Data Center REIT', 'Data Centers', 'DIRECT', 820.10),
  ('ARISTA', 'Arista Networks 800G', 'Networking', 'DIRECT', 290.15),
  ('CEG', 'Constellation Energy Nuclear', 'Clean Energy', 'DIRECT', 215.60),
  ('CAM', 'Cameco Uranium Supply', 'Nuclear Energy', 'DIRECT', 52.30),
  ('TSLA-OPT', 'Tesla Optimus Robotics', 'Robotics', 'DIRECT', 265.40),
  ('ISRG', 'Intuitive Surgical AI', 'Healthcare Tech', 'DIRECT', 390.20),
  ('PANW', 'Palo Alto AI Security', 'Cybersecurity', 'DIRECT', 310.80),
  ('RWA-UST', 'Tokenized US Treasury Fund', 'Tokenized RWA', 'DIRECT', 100.00)
ON CONFLICT DO NOTHING;

-- -----------------------------------------------
-- SEED DATA: Products (3 LIVE, 5 DRAFT/UNDER_REVIEW)
-- -----------------------------------------------
WITH theme_ids AS (
  SELECT id, slug FROM public.investment_themes
)
INSERT INTO public.investment_products (
  theme_id, name, slug, thesis, summary, risk_level, min_investment_amount, max_investment_amount, status, version, fee_percentage, management_fee, performance_fee, target_return_rate, rebalancing_frequency, educational_content, risk_disclosures
)
VALUES
  (
    (SELECT id FROM theme_ids WHERE slug = 'ai-infrastructure'),
    'AI Infrastructure Stack Portfolio',
    'ai-infrastructure-stack',
    'AI is not a single asset class. It is an economic infrastructure stack. Investing in AI compute demand requires exposure to semiconductors, high-density data centers, liquid cooling, high-speed networking, and power generation.',
    'Diversified exposure to the essential hardware, cooling, and energy infrastructure powering global AI expansion.',
    'Growth',
    2500.00,
    500000.00,
    'LIVE',
    1,
    1.50,
    1.00,
    10.00,
    22.50,
    'Quarterly',
    '### The AI Infrastructure Thesis\nDemand for AI inference and training requires unprecedented compute power. This portfolio allocates capital across 5 core pillars of the physical stack:\n1. **Semiconductors**: High-bandwidth memory and tensor processing GPUs.\n2. **Cooling Infrastructure**: Direct-to-chip liquid cooling systems preventing thermal throttling.\n3. **Data Center REITs**: Next-gen hyper-scale facilities engineered for 100kW+ rack density.\n4. **Optical Networking**: 800G switches eliminating latency bottlenecks.\n5. **Energy Systems**: Baseload nuclear and utility power powering compute grids.',
    '**Risk Disclosure**: Investments in hardware and energy infrastructure carry market risks including supply chain disruptions, commodity price volatility, and regulatory shifts in utility power allocations. Past performance is not indicative of future returns.'
  ),
  (
    (SELECT id FROM theme_ids WHERE slug = 'ai-leaders'),
    'Frontier AI Leaders Portfolio',
    'frontier-ai-leaders',
    'Capitalizing on the world''s dominant foundational model developers, hyperscale cloud providers, and enterprise software platforms capturing AI monetization.',
    'Targeted investment in category-defining AI giants with dominant moats and massive R&D budgets.',
    'Moderate',
    1000.00,
    250000.00,
    'LIVE',
    1,
    1.25,
    0.80,
    8.00,
    18.00,
    'Quarterly',
    '### The AI Leaders Thesis\nScale yields dominance in AI development. The companies in this portfolio control proprietary datasets, custom silicon pipelines, and global distribution channels that make replication virtually impossible.',
    '**Risk Disclosure**: Concentrated equity exposure to technology firms may experience elevated price volatility. Diversification across multiple sectors is recommended.'
  ),
  (
    (SELECT id FROM theme_ids WHERE slug = 'future-energy'),
    'Next-Gen Power & Grid Portfolio',
    'next-gen-power-grid',
    'AI compute facilities require reliable 24/7 baseload power. This portfolio targets clean nuclear energy, small modular reactors (SMRs), and smart grid utilities.',
    'Investing in the energy transition and grid infrastructure required to sustain the digital economy.',
    'Conservative',
    1500.00,
    300000.00,
    'LIVE',
    1,
    1.00,
    0.75,
    5.00,
    14.00,
    'Semi-Annually',
    '### The Power Grid Thesis\nA single AI data center can consume as much electricity as 100,000 households. Nuclear energy and modernized power grids provide the zero-carbon baseload energy required for AI operations.',
    '**Risk Disclosure**: Utility and energy sector investments are subject to regulatory price caps, weather events, and capital expenditure cycles.'
  ),
  (
    (SELECT id FROM theme_ids WHERE slug = 'physical-ai-robotics'),
    'Autonomous Robotics & Physical AI',
    'autonomous-robotics-physical-ai',
    'Bridging digital intelligence with physical work through humanoid robotics, autonomous logistics, and industrial automation.',
    'Early exposure to the next decade of physical robotics and spatial computing.',
    'Aggressive',
    5000.00,
    500000.00,
    'UNDER_REVIEW',
    1,
    2.00,
    1.50,
    15.00,
    30.00,
    'Quarterly',
    '### Physical AI Thesis\nEmbodied AI transforms labor economics by deploying autonomous agents into factory floors, warehouses, and domestic settings.',
    '**Risk Disclosure**: High volatility asset class with long commercialization horizons.'
  ),
  (
    (SELECT id FROM theme_ids WHERE slug = 'ai-healthcare'),
    'AI Computational Biology & Medicine',
    'ai-computational-biology-medicine',
    'Accelerating drug discovery, genomic analysis, and precision medicine through deep learning models.',
    'Investing in technology attempting to accelerate the development of the next generation of medicine.',
    'Growth',
    2000.00,
    250000.00,
    'DRAFT',
    1,
    1.50,
    1.00,
    10.00,
    20.00,
    'Quarterly',
    '### AI Healthcare Thesis\nMachine learning models cut drug discovery timelines from 10 years to 18 months by predicting protein folding and molecular interactions.',
    '**Risk Disclosure**: Clinical trial failures and FDA regulatory hurdles can impact sector performance.'
  )
ON CONFLICT (slug) DO NOTHING;

-- -----------------------------------------------
-- SEED DATA: Allocations for AI Infrastructure Product
-- -----------------------------------------------
WITH prod AS (
  SELECT id FROM public.investment_products WHERE slug = 'ai-infrastructure-stack'
),
assets AS (
  SELECT id, symbol FROM public.portfolio_assets
)
INSERT INTO public.portfolio_allocations (product_id, asset_id, weight_percentage, min_weight_limit, max_weight_limit, version)
SELECT
  p.id,
  a.id,
  w.weight,
  5.00,
  40.00,
  1
FROM prod p
CROSS JOIN (
  VALUES
    ('NVDA', 30.00),
    ('VERTIV', 20.00),
    ('EQIX', 20.00),
    ('ARISTA', 15.00),
    ('CEG', 15.00)
) AS w(sym, weight)
JOIN assets a ON a.symbol = w.sym
ON CONFLICT DO NOTHING;

-- Seed Allocations for AI Leaders
WITH prod AS (
  SELECT id FROM public.investment_products WHERE slug = 'frontier-ai-leaders'
),
assets AS (
  SELECT id, symbol FROM public.portfolio_assets
)
INSERT INTO public.portfolio_allocations (product_id, asset_id, weight_percentage, min_weight_limit, max_weight_limit, version)
SELECT
  p.id,
  a.id,
  w.weight,
  5.00,
  50.00,
  1
FROM prod p
CROSS JOIN (
  VALUES
    ('NVDA', 35.00),
    ('MSFT', 35.00),
    ('GOOGL', 30.00)
) AS w(sym, weight)
JOIN assets a ON a.symbol = w.sym
ON CONFLICT DO NOTHING;

-- Seed Allocations for Future Energy
WITH prod AS (
  SELECT id FROM public.investment_products WHERE slug = 'next-gen-power-grid'
),
assets AS (
  SELECT id, symbol FROM public.portfolio_assets
)
INSERT INTO public.portfolio_allocations (product_id, asset_id, weight_percentage, min_weight_limit, max_weight_limit, version)
SELECT
  p.id,
  a.id,
  w.weight,
  10.00,
  60.00,
  1
FROM prod p
CROSS JOIN (
  VALUES
    ('CEG', 50.00),
    ('CAM', 50.00)
) AS w(sym, weight)
JOIN assets a ON a.symbol = w.sym
ON CONFLICT DO NOTHING;
