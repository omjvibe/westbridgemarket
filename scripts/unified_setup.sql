-- ==========================================================
-- WESTBRIDGE MARKET - UNIFIED PRODUCTION DATABASE SETUP
-- This script sets up the entire database environment:
-- 1. Extensions & Custom Types
-- 2. Consolidated Tables
-- 3. Indexes
-- 4. Functions & Secure Triggers
-- 5. Unified Row Level Security (RLS)
-- 6. Storage Buckets & Policies
-- 7. Seed Data
-- 8. Schema Grants
--
-- IDEMPOTENT: safe to re-run on an existing database.
-- Uses IF NOT EXISTS, ON CONFLICT DO NOTHING,
-- CREATE OR REPLACE, DROP TRIGGER/POLICY IF EXISTS.
-- ==========================================================

-- =========================================================
-- 1. EXTENSIONS & CUSTOM TYPES
-- =========================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('user', 'admin');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE account_status AS ENUM ('active', 'blocked', 'pending');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE kyc_status AS ENUM ('pending', 'approved', 'rejected');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE transaction_type AS ENUM ('deposit', 'withdrawal', 'profit', 'bonus', 'referral', 'investment');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE transaction_status AS ENUM ('pending', 'approved', 'rejected', 'processing');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE trade_status AS ENUM ('open', 'closed', 'pending');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE investment_status AS ENUM ('active', 'completed', 'cancelled');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE plan_type AS ENUM ('basic', 'silver', 'gold', 'platinum', 'diamond');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- =========================================================
-- 2. CONSOLIDATED TABLES
-- =========================================================

-- ---------------------------------------------------------
-- Admin Users Table (MUST exist before policies referencing it)
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.admin_users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    role user_role DEFAULT 'admin',
    permissions JSONB DEFAULT '{"all": true}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ---------------------------------------------------------
-- Users Table (wallet_address replaces web3_address)
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone_number TEXT,
    country TEXT NOT NULL,
    currency TEXT NOT NULL DEFAULT 'USD',
    role user_role DEFAULT 'user',
    account_status account_status DEFAULT 'active',
    kyc_status TEXT DEFAULT 'pending',

    -- Balances
    balance_deposit DECIMAL(15, 2) DEFAULT 0.00,
    balance_profit DECIMAL(15, 2) DEFAULT 0.00,
    balance_bonus DECIMAL(15, 2) DEFAULT 0.00,

    -- Trading settings
    can_trade BOOLEAN DEFAULT false,
    can_withdraw BOOLEAN DEFAULT false,
    required_trades INTEGER DEFAULT 10,
    completed_trades INTEGER DEFAULT 0,
    withdrawal_code TEXT,

    -- Plan & Signal settings
    current_plan plan_type DEFAULT 'basic',
    is_signal_provider BOOLEAN DEFAULT false,
    is_copy_expert BOOLEAN DEFAULT false,

    -- Referral
    referral_code TEXT UNIQUE,
    referred_by UUID REFERENCES public.users(id),

    -- KYC Details
    kyc_document_type TEXT,
    kyc_document_url TEXT,
    kyc_selfie_url TEXT,
    kyc_submitted_at TIMESTAMPTZ,
    tax_code TEXT,
    mfi_code TEXT,
    wallet_address TEXT UNIQUE,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ---------------------------------------------------------
-- Investment Plans (with asset columns from 013, widened ROI from 023)
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.investment_plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    plan_type plan_type NOT NULL,
    min_amount DECIMAL(15, 2) NOT NULL,
    max_amount DECIMAL(15, 2) NOT NULL,
    roi_percentage DECIMAL(15, 2) NOT NULL,
    duration_days INTEGER NOT NULL,
    description TEXT,
    features JSONB DEFAULT '[]'::jsonb,
    is_active BOOLEAN DEFAULT true,
    asset_category TEXT DEFAULT 'crypto',
    specific_asset TEXT DEFAULT 'Bitcoin (BTC)',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ---------------------------------------------------------
-- User Investments (with delivery_details from 013, current_loss from 017)
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.investments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    plan_id UUID NOT NULL REFERENCES public.investment_plans(id),
    amount DECIMAL(15, 2) NOT NULL,
    expected_return DECIMAL(15, 2) NOT NULL,
    current_return DECIMAL(15, 2) DEFAULT 0.00,
    current_loss DECIMAL(15, 2) DEFAULT 0.00,
    status investment_status DEFAULT 'active',
    start_date TIMESTAMPTZ DEFAULT NOW(),
    end_date TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    delivery_details JSONB DEFAULT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ---------------------------------------------------------
-- Transactions
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    type transaction_type NOT NULL,
    status transaction_status DEFAULT 'pending',
    amount DECIMAL(15, 2) NOT NULL,
    currency TEXT DEFAULT 'USD',
    crypto_type TEXT,
    wallet_address TEXT,
    transaction_hash TEXT,
    admin_notes TEXT,
    approved_by UUID REFERENCES public.admin_users(id),
    approved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ---------------------------------------------------------
-- Trades
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.trades (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    symbol TEXT NOT NULL,
    trade_type TEXT NOT NULL CHECK (trade_type IN ('buy', 'sell')),
    amount DECIMAL(15, 2) NOT NULL,
    leverage INTEGER DEFAULT 1,
    entry_price DECIMAL(15, 4) NOT NULL,
    exit_price DECIMAL(15, 4),
    profit_loss DECIMAL(15, 2) DEFAULT 0.00,
    status trade_status DEFAULT 'open',
    expiration TIMESTAMPTZ,
    closed_at TIMESTAMPTZ,
    placed_by_admin UUID REFERENCES public.admin_users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ---------------------------------------------------------
-- Copy Trading Experts (with image_url from 010, fields from 011, widened success_rate from 023)
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.copy_experts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    display_name TEXT NOT NULL,
    bio TEXT,
    total_followers INTEGER DEFAULT 0,
    success_rate DECIMAL(15, 2) DEFAULT 0.00,
    total_profit DECIMAL(15, 2) DEFAULT 0.00,
    is_active BOOLEAN DEFAULT true,
    image_url TEXT,
    years_experience INTEGER DEFAULT 0,
    total_trades INTEGER DEFAULT 0,
    min_investment DECIMAL(15, 2) DEFAULT 1000.00,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ---------------------------------------------------------
-- Copy Subscriptions (with current_loss from 017)
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.copy_subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    expert_id UUID NOT NULL REFERENCES public.copy_experts(id) ON DELETE CASCADE,
    amount_invested DECIMAL(15, 2) DEFAULT 0.00,
    current_profit DECIMAL(15, 2) DEFAULT 0.00,
    current_loss DECIMAL(15, 2) DEFAULT 0.00,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, expert_id)
);

-- ---------------------------------------------------------
-- Signal Providers (widened success_rate from 023)
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.signal_providers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    display_name TEXT NOT NULL,
    description TEXT,
    price DECIMAL(15, 2) NOT NULL,
    success_rate DECIMAL(15, 2) DEFAULT 0.00,
    total_signals INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ---------------------------------------------------------
-- Signals
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.signals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    provider_id UUID NOT NULL REFERENCES public.signal_providers(id) ON DELETE CASCADE,
    symbol TEXT NOT NULL,
    signal_type TEXT NOT NULL CHECK (signal_type IN ('buy', 'sell')),
    entry_price DECIMAL(15, 4) NOT NULL,
    take_profit DECIMAL(15, 4),
    stop_loss DECIMAL(15, 4),
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ---------------------------------------------------------
-- Signal Subscriptions (with current_profit/current_loss from 017)
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.signal_subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    provider_id UUID NOT NULL REFERENCES public.signal_providers(id) ON DELETE CASCADE,
    is_active BOOLEAN DEFAULT true,
    current_profit DECIMAL(15, 2) DEFAULT 0.00,
    current_loss DECIMAL(15, 2) DEFAULT 0.00,
    subscribed_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, provider_id)
);

-- ---------------------------------------------------------
-- Notifications
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    is_admin_notification BOOLEAN DEFAULT false,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ---------------------------------------------------------
-- Crypto Addresses
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.crypto_addresses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    crypto_symbol TEXT NOT NULL UNIQUE,
    crypto_name TEXT NOT NULL,
    wallet_address TEXT NOT NULL,
    network TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ---------------------------------------------------------
-- Support Tickets
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.support_tickets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    subject TEXT NOT NULL,
    message TEXT NOT NULL,
    status TEXT DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'closed')),
    priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
    admin_response TEXT,
    responded_by UUID REFERENCES public.admin_users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ---------------------------------------------------------
-- System Settings
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.system_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    key TEXT UNIQUE NOT NULL,
    value JSONB NOT NULL,
    description TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ---------------------------------------------------------
-- KYC Documents
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.kyc_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    document_type TEXT NOT NULL,
    document_url TEXT NOT NULL,
    status kyc_status DEFAULT 'pending',
    admin_notes TEXT,
    reviewed_by UUID REFERENCES public.admin_users(id),
    reviewed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ---------------------------------------------------------
-- Payment Methods
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.payment_methods (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('crypto', 'bank', 'card')),
    details JSONB NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ---------------------------------------------------------
-- Blog Posts
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.blog_posts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    excerpt TEXT,
    content TEXT NOT NULL,
    image_url TEXT,
    author_id UUID REFERENCES public.admin_users(id),
    is_published BOOLEAN DEFAULT false,
    published_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ---------------------------------------------------------
-- Site Settings (from 014)
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.site_settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    description TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ---------------------------------------------------------
-- Mining Plans (from 015, widened daily_return_rate from 023)
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.mining_plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    coin TEXT NOT NULL DEFAULT 'BTC',
    hashrate TEXT NOT NULL,
    min_amount DECIMAL(15, 2) NOT NULL DEFAULT 2000.00,
    max_amount DECIMAL(15, 2) NOT NULL DEFAULT 50000.00,
    daily_return_rate DECIMAL(15, 4) NOT NULL DEFAULT 0.50,
    duration_days INTEGER NOT NULL DEFAULT 30,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ---------------------------------------------------------
-- User Mining (from 015, current_loss from 017)
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.user_mining (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    plan_id UUID NOT NULL REFERENCES public.mining_plans(id) ON DELETE CASCADE,
    amount DECIMAL(15, 2) NOT NULL,
    current_earnings DECIMAL(15, 2) DEFAULT 0.00,
    current_loss DECIMAL(15, 2) DEFAULT 0.00,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
    start_date TIMESTAMPTZ DEFAULT NOW(),
    end_date TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ---------------------------------------------------------
-- Staking Pools (from 015)
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.staking_pools (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    token TEXT NOT NULL,
    name TEXT NOT NULL,
    apy_rate DECIMAL(8, 2) NOT NULL DEFAULT 12.00,
    min_stake DECIMAL(15, 2) NOT NULL DEFAULT 2000.00,
    max_stake DECIMAL(15, 2) NOT NULL DEFAULT 100000.00,
    lock_period_days INTEGER NOT NULL DEFAULT 30,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ---------------------------------------------------------
-- User Stakes (from 015, current_loss from 017)
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.user_stakes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    pool_id UUID NOT NULL REFERENCES public.staking_pools(id) ON DELETE CASCADE,
    amount DECIMAL(15, 2) NOT NULL,
    current_rewards DECIMAL(15, 2) DEFAULT 0.00,
    current_loss DECIMAL(15, 2) DEFAULT 0.00,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'unstaking')),
    staked_at TIMESTAMPTZ DEFAULT NOW(),
    unlock_date TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ---------------------------------------------------------
-- Stocks (from 019)
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.stocks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    ticker TEXT NOT NULL,
    logo_url TEXT,
    price_per_share DECIMAL(15, 4) NOT NULL DEFAULT 1.00,
    min_shares INTEGER NOT NULL DEFAULT 100,
    max_shares INTEGER NOT NULL DEFAULT 100000,
    category TEXT NOT NULL DEFAULT 'tech',
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ---------------------------------------------------------
-- User Stock Purchases (from 019)
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.user_stock_purchases (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    stock_id UUID NOT NULL REFERENCES public.stocks(id) ON DELETE CASCADE,
    shares INTEGER NOT NULL,
    price_per_share DECIMAL(15, 4) NOT NULL,
    total_cost DECIMAL(15, 2) NOT NULL,
    current_value DECIMAL(15, 2) DEFAULT 0.00,
    current_profit DECIMAL(15, 2) DEFAULT 0.00,
    current_loss DECIMAL(15, 2) DEFAULT 0.00,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'sold', 'cancelled')),
    purchased_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ---------------------------------------------------------
-- Mining Servers (from 019, widened daily_return_rate for consistency with 023)
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.mining_servers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    specs TEXT NOT NULL,
    hashrate TEXT NOT NULL,
    monthly_cost DECIMAL(15, 2) NOT NULL,
    quarterly_cost DECIMAL(15, 2) NOT NULL,
    daily_return_rate DECIMAL(15, 4) NOT NULL DEFAULT 0.80,
    description TEXT,
    image_url TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ---------------------------------------------------------
-- User Server Rentals (from 019)
-- ---------------------------------------------------------
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

-- ---------------------------------------------------------
-- Future Markets: Investment Themes (from 020)
-- ---------------------------------------------------------
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

-- ---------------------------------------------------------
-- Future Markets: Investment Products (from 020, widened decimals from 023)
-- ---------------------------------------------------------
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
    fee_percentage DECIMAL(15, 2) NOT NULL DEFAULT 1.50,
    management_fee DECIMAL(15, 2) NOT NULL DEFAULT 1.00,
    performance_fee DECIMAL(15, 2) NOT NULL DEFAULT 10.00,
    target_return_rate DECIMAL(15, 2) NOT NULL DEFAULT 15.00,
    rebalancing_frequency TEXT NOT NULL DEFAULT 'Quarterly',
    jurisdiction_rules JSONB DEFAULT '{"allowed_countries": ["*"], "excluded_countries": []}'::jsonb,
    eligibility_rules JSONB DEFAULT '{"min_kyc_level": "approved", "accredited_only": false}'::jsonb,
    educational_content TEXT,
    risk_disclosures TEXT,
    effective_date TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ---------------------------------------------------------
-- Future Markets: Portfolio Assets Universe (from 020)
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.portfolio_assets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    symbol TEXT NOT NULL,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    provider_type TEXT NOT NULL DEFAULT 'DIRECT' CHECK (provider_type IN ('DIRECT', 'MANUAL_EXTERNAL')),
    pricing_source TEXT NOT NULL DEFAULT 'FINANCIAL_FEED',
    current_price DECIMAL(15, 4) NOT NULL DEFAULT 100.00,
    price_updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ---------------------------------------------------------
-- Future Markets: Portfolio Allocations (from 020)
-- ---------------------------------------------------------
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

-- ---------------------------------------------------------
-- Future Markets: Risk Profiles (from 020)
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.risk_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    code TEXT UNIQUE NOT NULL,
    description TEXT NOT NULL,
    max_equity_allocation DECIMAL(5, 2) NOT NULL,
    recommended_horizon TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ---------------------------------------------------------
-- Future Markets: Client Portfolios (from 020)
-- ---------------------------------------------------------
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

-- ---------------------------------------------------------
-- Future Markets: Portfolio Transactions Ledger (from 020)
-- ---------------------------------------------------------
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

-- ---------------------------------------------------------
-- Future Markets: Portfolio Performance Snapshots (from 020)
-- ---------------------------------------------------------
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

-- ---------------------------------------------------------
-- Future Markets: Product Fees Schedule (from 020)
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.product_fees (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES public.investment_products(id) ON DELETE CASCADE,
    fee_type TEXT NOT NULL CHECK (fee_type IN ('management', 'performance', 'entry', 'exit')),
    percentage DECIMAL(5, 2) DEFAULT 0.00,
    fixed_amount DECIMAL(15, 2) DEFAULT 0.00,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ---------------------------------------------------------
-- Future Markets: Market Pricing Cache (from 020)
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.market_prices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    asset_id UUID NOT NULL REFERENCES public.portfolio_assets(id) ON DELETE CASCADE,
    price DECIMAL(15, 4) NOT NULL,
    source TEXT NOT NULL DEFAULT 'MARKET_DATA_PROVIDER',
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    valuation_methodology TEXT NOT NULL DEFAULT 'Real-Time Exchange Feed'
);

-- ---------------------------------------------------------
-- Future Markets: Product Documents (from 020)
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.product_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES public.investment_products(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    doc_type TEXT NOT NULL CHECK (doc_type IN ('prospectus', 'factsheet', 'risk_disclosure', 'audit_report')),
    file_url TEXT NOT NULL,
    is_public BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ---------------------------------------------------------
-- Future Markets: Audit Logs (from 020)
-- ---------------------------------------------------------
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

-- ---------------------------------------------------------
-- Future Markets: Portfolio Recommendations (from 020)
-- ---------------------------------------------------------
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

-- ---------------------------------------------------------
-- Future Markets: Telemetry Analytics (from 020)
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.future_markets_analytics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    product_id UUID REFERENCES public.investment_products(id) ON DELETE CASCADE,
    action_type TEXT NOT NULL CHECK (action_type IN ('view', 'research', 'invest', 'watchlist', 'abandon')),
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =========================================================
-- 3. INDEXES
-- =========================================================
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_referral_code ON public.users(referral_code);
CREATE INDEX IF NOT EXISTS idx_users_wallet_address ON public.users(wallet_address);
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON public.transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_trades_user_id ON public.trades(user_id);
CREATE INDEX IF NOT EXISTS idx_investments_user_id ON public.investments(user_id);
CREATE INDEX IF NOT EXISTS idx_blog_posts_slug ON public.blog_posts(slug);
CREATE INDEX IF NOT EXISTS idx_user_mining_user_id ON public.user_mining(user_id);
CREATE INDEX IF NOT EXISTS idx_user_mining_status ON public.user_mining(status);
CREATE INDEX IF NOT EXISTS idx_user_stakes_user_id ON public.user_stakes(user_id);
CREATE INDEX IF NOT EXISTS idx_user_stakes_status ON public.user_stakes(status);
CREATE INDEX IF NOT EXISTS idx_user_stock_purchases_user_id ON public.user_stock_purchases(user_id);
CREATE INDEX IF NOT EXISTS idx_user_stock_purchases_status ON public.user_stock_purchases(status);
CREATE INDEX IF NOT EXISTS idx_user_server_rentals_user_id ON public.user_server_rentals(user_id);
CREATE INDEX IF NOT EXISTS idx_user_server_rentals_status ON public.user_server_rentals(status);

-- =========================================================
-- 4. FUNCTIONS & TRIGGERS
-- =========================================================

-- ---------------------------------------------------------
-- Timestamp Updater
-- ---------------------------------------------------------
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ---------------------------------------------------------
-- Referral Code Generator
-- ---------------------------------------------------------
CREATE OR REPLACE FUNCTION generate_referral_code()
RETURNS TEXT AS $$
DECLARE
    code TEXT;
    exists BOOLEAN := true;
BEGIN
    WHILE exists LOOP
        code := upper(substring(md5(random()::text) from 1 for 8));
        SELECT EXISTS(SELECT 1 FROM public.users WHERE referral_code = code) INTO exists;
    END LOOP;
    RETURN code;
END;
$$ LANGUAGE plpgsql;

-- ---------------------------------------------------------
-- User Creation Handler (from 009 - with $10 signup bonus)
-- ---------------------------------------------------------
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    new_referral_code TEXT;
    ref_user_id UUID := NULL;
BEGIN
    -- Generate a unique referral code
    new_referral_code := upper(substring(md5(random()::text || NEW.id::text) from 1 for 8));
    
    -- Safely handle referred_by - only set if valid
    IF NEW.raw_user_meta_data->>'referred_by' IS NOT NULL 
       AND NEW.raw_user_meta_data->>'referred_by' != '' 
       AND NEW.raw_user_meta_data->>'referred_by' != 'null' THEN
        BEGIN
            ref_user_id := (NEW.raw_user_meta_data->>'referred_by')::UUID;
            -- Verify the referrer exists
            IF NOT EXISTS (SELECT 1 FROM public.users WHERE id = ref_user_id) THEN
                ref_user_id := NULL;
            END IF;
        EXCEPTION WHEN OTHERS THEN
            ref_user_id := NULL;
        END;
    END IF;

    -- Insert the new user with safe defaults ($10 Sign Up Bonus)
    INSERT INTO public.users (
        id,
        full_name,
        email,
        phone_number,
        country,
        currency,
        referral_code,
        referred_by,
        role,
        account_status,
        kyc_status,
        balance_deposit,
        balance_profit,
        balance_bonus,
        can_trade,
        can_withdraw,
        required_trades,
        completed_trades,
        current_plan,
        is_signal_provider,
        is_copy_expert
    )
    VALUES (
        NEW.id,
        COALESCE(NULLIF(NEW.raw_user_meta_data->>'full_name', ''), 'User'),
        NEW.email,
        NULLIF(NEW.raw_user_meta_data->>'phone_number', ''),
        COALESCE(NULLIF(NEW.raw_user_meta_data->>'country', ''), 'US'),
        COALESCE(NULLIF(NEW.raw_user_meta_data->>'currency', ''), 'USD'),
        new_referral_code,
        ref_user_id,
        'user',
        'active',
        'pending',
        0.00,
        0.00,
        10.00,
        false,
        false,
        10,
        0,
        'basic',
        false,
        false
    )
    ON CONFLICT (id) DO NOTHING;
    
    RETURN NEW;
EXCEPTION WHEN OTHERS THEN
    -- Log the error but don't fail the auth signup
    RAISE WARNING 'Error creating user profile: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ---------------------------------------------------------
-- Admin Creation Handler
-- ---------------------------------------------------------
CREATE OR REPLACE FUNCTION handle_new_admin()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.raw_user_meta_data->>'role' = 'admin' THEN
        INSERT INTO public.admin_users (id, full_name, email)
        VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', 'Admin'), NEW.email)
        ON CONFLICT (id) DO NOTHING;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ---------------------------------------------------------
-- Delete User By Admin (from 022)
-- ---------------------------------------------------------
CREATE OR REPLACE FUNCTION public.delete_user_by_admin(target_user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM public.admin_users WHERE id = auth.uid()) THEN
        RAISE EXCEPTION 'Access denied: Administrator privileges required';
    END IF;
    IF target_user_id = auth.uid() THEN
        RAISE EXCEPTION 'Self-deletion is not permitted via admin tool';
    END IF;
    DELETE FROM public.users WHERE id = target_user_id;
    DELETE FROM auth.users WHERE id = target_user_id;
END;
$$;
GRANT EXECUTE ON FUNCTION public.delete_user_by_admin(UUID) TO authenticated;

-- ---------------------------------------------------------
-- Apply Timestamp Triggers (idempotent with DROP IF EXISTS)
-- ---------------------------------------------------------
DROP TRIGGER IF EXISTS update_users_updated_at ON public.users;
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_admin_users_updated_at ON public.admin_users;
CREATE TRIGGER update_admin_users_updated_at BEFORE UPDATE ON public.admin_users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_investment_plans_updated_at ON public.investment_plans;
CREATE TRIGGER update_investment_plans_updated_at BEFORE UPDATE ON public.investment_plans FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_transactions_updated_at ON public.transactions;
CREATE TRIGGER update_transactions_updated_at BEFORE UPDATE ON public.transactions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_trades_updated_at ON public.trades;
CREATE TRIGGER update_trades_updated_at BEFORE UPDATE ON public.trades FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_crypto_addresses_updated_at ON public.crypto_addresses;
CREATE TRIGGER update_crypto_addresses_updated_at BEFORE UPDATE ON public.crypto_addresses FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION handle_new_user();

DROP TRIGGER IF EXISTS on_auth_admin_created ON auth.users;
CREATE TRIGGER on_auth_admin_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION handle_new_admin();

-- =========================================================
-- 5. ROW LEVEL SECURITY (RLS)
-- =========================================================

-- ---------------------------------------------------------
-- Enable RLS on ALL tables
-- ---------------------------------------------------------

-- Original tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.investment_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.investments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.copy_experts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.copy_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.signal_providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.signals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.signal_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crypto_addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kyc_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;

-- Site settings (014)
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

-- Mining & Staking (015)
ALTER TABLE public.mining_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_mining ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staking_pools ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_stakes ENABLE ROW LEVEL SECURITY;

-- Stocks & Server Rentals (019)
ALTER TABLE public.stocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_stock_purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mining_servers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_server_rentals ENABLE ROW LEVEL SECURITY;

-- Future Markets (020)
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

-- ---------------------------------------------------------
-- Helper Function for Admin Check
-- ---------------------------------------------------------
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (SELECT 1 FROM public.admin_users WHERE id = auth.uid());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ---------------------------------------------------------
-- ADMIN FULL ACCESS POLICIES (original tables)
-- ---------------------------------------------------------
DROP POLICY IF EXISTS "Admins full access" ON public.users;
CREATE POLICY "Admins full access" ON public.users FOR ALL TO authenticated USING (is_admin());

DROP POLICY IF EXISTS "Admins full access admin_users" ON public.admin_users;
CREATE POLICY "Admins full access admin_users" ON public.admin_users FOR ALL TO authenticated USING (is_admin());

DROP POLICY IF EXISTS "Admins full access plans" ON public.investment_plans;
CREATE POLICY "Admins full access plans" ON public.investment_plans FOR ALL TO authenticated USING (is_admin());

DROP POLICY IF EXISTS "Admins full access investments" ON public.investments;
CREATE POLICY "Admins full access investments" ON public.investments FOR ALL TO authenticated USING (is_admin());

DROP POLICY IF EXISTS "Admins full access transactions" ON public.transactions;
CREATE POLICY "Admins full access transactions" ON public.transactions FOR ALL TO authenticated USING (is_admin());

DROP POLICY IF EXISTS "Admins full access trades" ON public.trades;
CREATE POLICY "Admins full access trades" ON public.trades FOR ALL TO authenticated USING (is_admin());

DROP POLICY IF EXISTS "Admins full access experts" ON public.copy_experts;
CREATE POLICY "Admins full access experts" ON public.copy_experts FOR ALL TO authenticated USING (is_admin());

DROP POLICY IF EXISTS "Admins full access copy_subs" ON public.copy_subscriptions;
CREATE POLICY "Admins full access copy_subs" ON public.copy_subscriptions FOR ALL TO authenticated USING (is_admin());

DROP POLICY IF EXISTS "Admins full access providers" ON public.signal_providers;
CREATE POLICY "Admins full access providers" ON public.signal_providers FOR ALL TO authenticated USING (is_admin());

DROP POLICY IF EXISTS "Admins full access signals" ON public.signals;
CREATE POLICY "Admins full access signals" ON public.signals FOR ALL TO authenticated USING (is_admin());

DROP POLICY IF EXISTS "Admins full access signal_subs" ON public.signal_subscriptions;
CREATE POLICY "Admins full access signal_subs" ON public.signal_subscriptions FOR ALL TO authenticated USING (is_admin());

DROP POLICY IF EXISTS "Admins full access notifications" ON public.notifications;
CREATE POLICY "Admins full access notifications" ON public.notifications FOR ALL TO authenticated USING (is_admin());

DROP POLICY IF EXISTS "Admins full access crypto" ON public.crypto_addresses;
CREATE POLICY "Admins full access crypto" ON public.crypto_addresses FOR ALL TO authenticated USING (is_admin());

DROP POLICY IF EXISTS "Admins full access support" ON public.support_tickets;
CREATE POLICY "Admins full access support" ON public.support_tickets FOR ALL TO authenticated USING (is_admin());

DROP POLICY IF EXISTS "Admins full access settings" ON public.system_settings;
CREATE POLICY "Admins full access settings" ON public.system_settings FOR ALL TO authenticated USING (is_admin());

DROP POLICY IF EXISTS "Admins full access kyc" ON public.kyc_documents;
CREATE POLICY "Admins full access kyc" ON public.kyc_documents FOR ALL TO authenticated USING (is_admin());

DROP POLICY IF EXISTS "Admins full access payments" ON public.payment_methods;
CREATE POLICY "Admins full access payments" ON public.payment_methods FOR ALL TO authenticated USING (is_admin());

DROP POLICY IF EXISTS "Admins full access blog" ON public.blog_posts;
CREATE POLICY "Admins full access blog" ON public.blog_posts FOR ALL TO authenticated USING (is_admin());

-- ---------------------------------------------------------
-- ADMIN FULL ACCESS POLICIES (new tables from 014, 015, 019, 020)
-- ---------------------------------------------------------

-- Site settings (014) - admin modify policy
DROP POLICY IF EXISTS "Only admins can modify site settings" ON public.site_settings;
CREATE POLICY "Only admins can modify site settings" ON public.site_settings FOR ALL USING (EXISTS (SELECT 1 FROM public.admin_users WHERE id = auth.uid()));

-- Mining & Staking (015)
DROP POLICY IF EXISTS "Admins can manage mining plans" ON public.mining_plans;
CREATE POLICY "Admins can manage mining plans" ON public.mining_plans FOR ALL USING (EXISTS (SELECT 1 FROM public.admin_users WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Admins can manage all mining" ON public.user_mining;
CREATE POLICY "Admins can manage all mining" ON public.user_mining FOR ALL USING (EXISTS (SELECT 1 FROM public.admin_users WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Admins can manage staking pools" ON public.staking_pools;
CREATE POLICY "Admins can manage staking pools" ON public.staking_pools FOR ALL USING (EXISTS (SELECT 1 FROM public.admin_users WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Admins can manage all stakes" ON public.user_stakes;
CREATE POLICY "Admins can manage all stakes" ON public.user_stakes FOR ALL USING (EXISTS (SELECT 1 FROM public.admin_users WHERE id = auth.uid()));

-- Stocks & Server Rentals (019)
DROP POLICY IF EXISTS "Admins manage stocks" ON public.stocks;
CREATE POLICY "Admins manage stocks" ON public.stocks FOR ALL USING (EXISTS (SELECT 1 FROM public.admin_users WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Admins manage all stock purchases" ON public.user_stock_purchases;
CREATE POLICY "Admins manage all stock purchases" ON public.user_stock_purchases FOR ALL USING (EXISTS (SELECT 1 FROM public.admin_users WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Admins manage mining servers" ON public.mining_servers;
CREATE POLICY "Admins manage mining servers" ON public.mining_servers FOR ALL USING (EXISTS (SELECT 1 FROM public.admin_users WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Admins manage all server rentals" ON public.user_server_rentals;
CREATE POLICY "Admins manage all server rentals" ON public.user_server_rentals FOR ALL USING (EXISTS (SELECT 1 FROM public.admin_users WHERE id = auth.uid()));

-- Future Markets (020)
DROP POLICY IF EXISTS "Admins manage themes" ON public.investment_themes;
CREATE POLICY "Admins manage themes" ON public.investment_themes FOR ALL USING (EXISTS (SELECT 1 FROM public.admin_users WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Admins manage products" ON public.investment_products;
CREATE POLICY "Admins manage products" ON public.investment_products FOR ALL USING (EXISTS (SELECT 1 FROM public.admin_users WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Admins manage assets" ON public.portfolio_assets;
CREATE POLICY "Admins manage assets" ON public.portfolio_assets FOR ALL USING (EXISTS (SELECT 1 FROM public.admin_users WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Admins manage allocations" ON public.portfolio_allocations;
CREATE POLICY "Admins manage allocations" ON public.portfolio_allocations FOR ALL USING (EXISTS (SELECT 1 FROM public.admin_users WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Admins manage client portfolios" ON public.client_portfolios;
CREATE POLICY "Admins manage client portfolios" ON public.client_portfolios FOR ALL USING (EXISTS (SELECT 1 FROM public.admin_users WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Admins manage transactions" ON public.portfolio_transactions;
CREATE POLICY "Admins manage transactions" ON public.portfolio_transactions FOR ALL USING (EXISTS (SELECT 1 FROM public.admin_users WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Admins manage audit logs" ON public.audit_logs;
CREATE POLICY "Admins manage audit logs" ON public.audit_logs FOR ALL USING (EXISTS (SELECT 1 FROM public.admin_users WHERE id = auth.uid()));

-- ---------------------------------------------------------
-- USER-LEVEL POLICIES (original tables)
-- ---------------------------------------------------------
DROP POLICY IF EXISTS "Users view own profile" ON public.users;
CREATE POLICY "Users view own profile" ON public.users FOR SELECT TO authenticated USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users update own profile" ON public.users;
CREATE POLICY "Users update own profile" ON public.users FOR UPDATE TO authenticated USING (auth.uid() = id);

DROP POLICY IF EXISTS "Anyone view active plans" ON public.investment_plans;
CREATE POLICY "Anyone view active plans" ON public.investment_plans FOR SELECT TO authenticated USING (is_active = true);

DROP POLICY IF EXISTS "Users manage own investments" ON public.investments;
CREATE POLICY "Users manage own investments" ON public.investments FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users insert own investments" ON public.investments;
CREATE POLICY "Users insert own investments" ON public.investments FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users manage own transactions" ON public.transactions;
CREATE POLICY "Users manage own transactions" ON public.transactions FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users insert own transactions" ON public.transactions;
CREATE POLICY "Users insert own transactions" ON public.transactions FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users manage own trades" ON public.trades;
CREATE POLICY "Users manage own trades" ON public.trades FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users insert own trades" ON public.trades;
CREATE POLICY "Users insert own trades" ON public.trades FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Anyone view active experts" ON public.copy_experts;
CREATE POLICY "Anyone view active experts" ON public.copy_experts FOR SELECT TO authenticated USING (is_active = true);

DROP POLICY IF EXISTS "Users manage own copy subs" ON public.copy_subscriptions;
CREATE POLICY "Users manage own copy subs" ON public.copy_subscriptions FOR ALL TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Anyone view active providers" ON public.signal_providers;
CREATE POLICY "Anyone view active providers" ON public.signal_providers FOR SELECT TO authenticated USING (is_active = true);

DROP POLICY IF EXISTS "Users manage own signal subs" ON public.signal_subscriptions;
CREATE POLICY "Users manage own signal subs" ON public.signal_subscriptions FOR ALL TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users view relevant signals" ON public.signals;
CREATE POLICY "Users view relevant signals" ON public.signals FOR SELECT TO authenticated USING (is_active = true AND (provider_id IN (SELECT provider_id FROM public.signal_subscriptions WHERE user_id = auth.uid() AND is_active = true)));

DROP POLICY IF EXISTS "Users view own notifications" ON public.notifications;
CREATE POLICY "Users view own notifications" ON public.notifications FOR SELECT TO authenticated USING (user_id = auth.uid() AND is_admin_notification = false);

DROP POLICY IF EXISTS "Users update own notifications" ON public.notifications;
CREATE POLICY "Users update own notifications" ON public.notifications FOR UPDATE TO authenticated USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Anyone view active crypto" ON public.crypto_addresses;
CREATE POLICY "Anyone view active crypto" ON public.crypto_addresses FOR SELECT TO authenticated USING (is_active = true);

DROP POLICY IF EXISTS "Users manage own support" ON public.support_tickets;
CREATE POLICY "Users manage own support" ON public.support_tickets FOR ALL TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Anyone view settings" ON public.system_settings;
CREATE POLICY "Anyone view settings" ON public.system_settings FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Users manage own kyc" ON public.kyc_documents;
CREATE POLICY "Users manage own kyc" ON public.kyc_documents FOR ALL TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Anyone view active payments" ON public.payment_methods;
CREATE POLICY "Anyone view active payments" ON public.payment_methods FOR SELECT TO authenticated USING (is_active = true);

DROP POLICY IF EXISTS "Anyone view published blog" ON public.blog_posts;
CREATE POLICY "Anyone view published blog" ON public.blog_posts FOR SELECT TO authenticated USING (is_published = true);

-- ---------------------------------------------------------
-- SITE SETTINGS POLICIES (from 014)
-- ---------------------------------------------------------
DROP POLICY IF EXISTS "Anyone can read site settings" ON public.site_settings;
CREATE POLICY "Anyone can read site settings" ON public.site_settings FOR SELECT USING (true);

-- ---------------------------------------------------------
-- MINING & STAKING USER POLICIES (from 015)
-- ---------------------------------------------------------
DROP POLICY IF EXISTS "Anyone can view active mining plans" ON public.mining_plans;
CREATE POLICY "Anyone can view active mining plans" ON public.mining_plans FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can view own mining" ON public.user_mining;
CREATE POLICY "Users can view own mining" ON public.user_mining FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create mining" ON public.user_mining;
CREATE POLICY "Users can create mining" ON public.user_mining FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Anyone can view active staking pools" ON public.staking_pools;
CREATE POLICY "Anyone can view active staking pools" ON public.staking_pools FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can view own stakes" ON public.user_stakes;
CREATE POLICY "Users can view own stakes" ON public.user_stakes FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create stakes" ON public.user_stakes;
CREATE POLICY "Users can create stakes" ON public.user_stakes FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ---------------------------------------------------------
-- STOCKS & SERVER RENTALS USER POLICIES (from 019)
-- ---------------------------------------------------------
DROP POLICY IF EXISTS "Anyone can view stocks" ON public.stocks;
CREATE POLICY "Anyone can view stocks" ON public.stocks FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users view own stock purchases" ON public.user_stock_purchases;
CREATE POLICY "Users view own stock purchases" ON public.user_stock_purchases FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users create stock purchases" ON public.user_stock_purchases;
CREATE POLICY "Users create stock purchases" ON public.user_stock_purchases FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Anyone can view mining servers" ON public.mining_servers;
CREATE POLICY "Anyone can view mining servers" ON public.mining_servers FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users view own server rentals" ON public.user_server_rentals;
CREATE POLICY "Users view own server rentals" ON public.user_server_rentals FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users create server rentals" ON public.user_server_rentals;
CREATE POLICY "Users create server rentals" ON public.user_server_rentals FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ---------------------------------------------------------
-- FUTURE MARKETS PUBLIC/CLIENT POLICIES (from 020)
-- ---------------------------------------------------------
DROP POLICY IF EXISTS "Anyone can view active themes" ON public.investment_themes;
CREATE POLICY "Anyone can view active themes" ON public.investment_themes FOR SELECT USING (true);

DROP POLICY IF EXISTS "Anyone can view live products" ON public.investment_products;
CREATE POLICY "Anyone can view live products" ON public.investment_products FOR SELECT USING (status = 'LIVE' OR EXISTS (SELECT 1 FROM public.admin_users WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Anyone can view assets" ON public.portfolio_assets;
CREATE POLICY "Anyone can view assets" ON public.portfolio_assets FOR SELECT USING (true);

DROP POLICY IF EXISTS "Anyone can view allocations" ON public.portfolio_allocations;
CREATE POLICY "Anyone can view allocations" ON public.portfolio_allocations FOR SELECT USING (true);

DROP POLICY IF EXISTS "Anyone can view risk profiles" ON public.risk_profiles;
CREATE POLICY "Anyone can view risk profiles" ON public.risk_profiles FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users view own client portfolios" ON public.client_portfolios;
CREATE POLICY "Users view own client portfolios" ON public.client_portfolios FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users view own transactions" ON public.portfolio_transactions;
CREATE POLICY "Users view own transactions" ON public.portfolio_transactions FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Anyone can view performance" ON public.portfolio_performance;
CREATE POLICY "Anyone can view performance" ON public.portfolio_performance FOR SELECT USING (true);

DROP POLICY IF EXISTS "Anyone can view product documents" ON public.product_documents;
CREATE POLICY "Anyone can view product documents" ON public.product_documents FOR SELECT USING (true);

-- ---------------------------------------------------------
-- ADMIN WITHDRAWAL FIX POLICIES (from 021)
-- ---------------------------------------------------------
DROP POLICY IF EXISTS "Admins can view all transactions" ON public.transactions;
CREATE POLICY "Admins can view all transactions" ON public.transactions FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.admin_users WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Admins can update transactions" ON public.transactions;
CREATE POLICY "Admins can update transactions" ON public.transactions FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM public.admin_users WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Admins can view all users" ON public.users;
CREATE POLICY "Admins can view all users" ON public.users FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.admin_users WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Admins can update all users" ON public.users;
CREATE POLICY "Admins can update all users" ON public.users FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM public.admin_users WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Admins can insert notifications" ON public.notifications;
CREATE POLICY "Admins can insert notifications" ON public.notifications FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM public.admin_users WHERE id = auth.uid()));

-- ---------------------------------------------------------
-- ADMIN DELETE USER POLICY (from 022)
-- ---------------------------------------------------------
DROP POLICY IF EXISTS "Admins can delete users" ON public.users;
CREATE POLICY "Admins can delete users" ON public.users FOR DELETE TO authenticated USING (EXISTS (SELECT 1 FROM public.admin_users WHERE id = auth.uid()));

-- =========================================================
-- 6. STORAGE BUCKETS & POLICIES
-- =========================================================
INSERT INTO storage.buckets (id, name, public) VALUES ('deposit-proofs', 'deposit-proofs', true) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('kyc-documents', 'kyc-documents', false) ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Upload deposit proofs" ON storage.objects;
CREATE POLICY "Upload deposit proofs" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'deposit-proofs');

DROP POLICY IF EXISTS "View deposit proofs" ON storage.objects;
CREATE POLICY "View deposit proofs" ON storage.objects FOR SELECT TO public USING (bucket_id = 'deposit-proofs');

DROP POLICY IF EXISTS "Upload own KYC" ON storage.objects;
CREATE POLICY "Upload own KYC" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'kyc-documents' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "View own KYC" ON storage.objects;
CREATE POLICY "View own KYC" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'kyc-documents' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "Admins view all KYC" ON storage.objects;
CREATE POLICY "Admins view all KYC" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'kyc-documents' AND is_admin());

-- =========================================================
-- 7. SEED DATA
-- =========================================================

-- ---------------------------------------------------------
-- Investment Plans (with asset columns from 013)
-- ---------------------------------------------------------
INSERT INTO public.investment_plans (name, plan_type, min_amount, max_amount, roi_percentage, duration_days, description, features, asset_category, specific_asset) VALUES
('Basic Plan', 'basic', 1000.00, 9999.99, 5.00, 7, 'Perfect for beginners starting their investment journey', '["24/7 Support", "Basic Analytics", "Mobile App Access"]'::jsonb, 'crypto', 'Bitcoin (BTC)'),
('Silver Plan', 'silver', 10000.00, 49999.99, 10.00, 14, 'Enhanced returns for growing investors', '["Priority Support", "Advanced Analytics", "Copy Trading Access", "Mobile App Access"]'::jsonb, 'crypto', 'Ethereum (ETH)'),
('Gold Plan', 'gold', 50000.00, 149999.99, 15.00, 21, 'Premium features for serious investors', '["VIP Support", "Pro Analytics", "Copy Trading Access", "Signal Alerts", "Dedicated Account Manager"]'::jsonb, 'physical', 'Gold'),
('Platinum Plan', 'platinum', 150000.00, 499999.99, 20.00, 30, 'Elite investment experience', '["24/7 VIP Support", "Professional Analytics", "Unlimited Copy Trading", "Premium Signals", "Personal Account Manager", "Tax Optimization"]'::jsonb, 'stocks', 'Apple (AAPL)'),
('Diamond Plan', 'diamond', 500000.00, 9999999.99, 30.00, 45, 'Ultimate investment package for high net worth individuals', '["Concierge Support", "Institutional Grade Analytics", "Private Signal Room", "Custom Trading Strategies", "Executive Account Team", "Legal & Tax Services"]'::jsonb, 'forex', 'EUR/USD')
ON CONFLICT DO NOTHING;

-- XRP Investment Plans (from 018)
INSERT INTO public.investment_plans (name, plan_type, min_amount, max_amount, roi_percentage, duration_days, description, features, asset_category, specific_asset) VALUES
('XRP Growth Plan', 'basic', 2000.00, 24999.99, 8.00, 14, 'Entry-level XRP investment with steady returns. Leverage Ripple''s institutional payment network for consistent yield generation.', '["24/7 Support", "Basic Analytics", "Mobile App Access", "XRP Market Reports"]'::jsonb, 'crypto', 'XRP (XRP)'),
('XRP Premium Plan', 'silver', 25000.00, 99999.99, 14.00, 30, 'Premium XRP allocation with enhanced ROI. Access advanced XRPL analytics and on-demand liquidity insights.', '["Priority Support", "Advanced Analytics", "Copy Trading Access", "XRPL DEX Insights", "Mobile App Access"]'::jsonb, 'crypto', 'XRP (XRP)'),
('XRP Elite Plan', 'gold', 100000.00, 500000.00, 22.00, 45, 'Institutional-grade XRP investment vehicle. Includes direct access to cross-border payment flow analytics and premium ODL corridor strategies.', '["VIP Support", "Pro Analytics", "Premium Signals", "ODL Flow Access", "Dedicated Account Manager", "Tax Optimization"]'::jsonb, 'crypto', 'XRP (XRP)')
ON CONFLICT DO NOTHING;

-- ---------------------------------------------------------
-- Crypto Addresses (with XRP from 012)
-- ---------------------------------------------------------
INSERT INTO public.crypto_addresses (crypto_symbol, crypto_name, wallet_address, network) VALUES
('BTC', 'Bitcoin', 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh', 'Bitcoin'),
('ETH', 'Ethereum', '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb', 'Ethereum'),
('USDT', 'Tether', 'TYASr3QxxxxxxxxxxxxxxxxxxxxxxxxxX', 'TRC20'),
('SOL', 'Solana', '7dHbWXmcixxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx', 'Solana'),
('XRP', 'Ripple', 'rEb8tk3gPmD7E95zXrmGgdA6d8259H875A', 'Ripple Network')
ON CONFLICT (crypto_symbol) DO NOTHING;

-- ---------------------------------------------------------
-- System Settings
-- ---------------------------------------------------------
INSERT INTO public.system_settings (key, value, description) VALUES
('referral_bonus', '{"enabled": true, "percentage": 5, "min_deposit": 100}'::jsonb, 'Referral program settings'),
('withdrawal_settings', '{"min_amount": 50, "max_daily": 10000, "processing_time": 24}'::jsonb, 'Withdrawal configuration'),
('trading_settings', '{"min_trade_amount": 10, "max_leverage": 100, "default_leverage": 10}'::jsonb, 'Trading configuration'),
('maintenance_mode', '{"enabled": false, "message": "System maintenance in progress"}'::jsonb, 'Maintenance mode toggle')
ON CONFLICT (key) DO NOTHING;

-- Future Markets page setting (from 020)
INSERT INTO public.system_settings (key, value, description) VALUES
('future_markets_page_enabled', 'true'::jsonb, 'Toggle visibility of Future Markets vertical')
ON CONFLICT (key) DO NOTHING;

-- ---------------------------------------------------------
-- Site Settings seeds (from 014, 015, 018, 019, 020)
-- ---------------------------------------------------------
INSERT INTO public.site_settings (key, value, description) VALUES
('trade_page_enabled', 'true', 'Controls whether the Trade page is visible to users'),
('signals_page_enabled', 'true', 'Controls whether the Signals page is visible to users'),
('mining_page_enabled', 'true', 'Show/hide Mining page for users'),
('staking_page_enabled', 'true', 'Show/hide Staking page for users'),
('stocks_page_enabled', 'true', 'Show/hide Stocks page for users'),
('server_rental_page_enabled', 'true', 'Show/hide Server Rental page for users'),
('future_markets_page_enabled', 'true', 'Show/hide Future Markets page for users')
ON CONFLICT (key) DO NOTHING;

INSERT INTO public.site_settings (key, value, updated_at) VALUES
('investments_page_enabled', 'true', NOW()),
('copy_trading_page_enabled', 'true', NOW()),
('portfolio_page_enabled', 'true', NOW())
ON CONFLICT (key) DO NOTHING;

-- ---------------------------------------------------------
-- Copy Trading Experts, Signal Providers seed (from 016)
-- ---------------------------------------------------------
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

-- ---------------------------------------------------------
-- Mining Plans seed (from 016)
-- ---------------------------------------------------------
INSERT INTO public.mining_plans (name, coin, hashrate, min_amount, max_amount, daily_return_rate, duration_days, description, is_active)
VALUES
  ('Starter Miner', 'BTC', '25 TH/s', 2000.00, 9999.99, 0.35, 30, 'Entry-level Bitcoin mining contract with competitive hashrate allocation. Ideal for first-time miners looking to earn passive BTC income with minimal capital.', true),
  ('Advanced Miner', 'BTC', '100 TH/s', 10000.00, 49999.99, 0.55, 60, 'Professional-grade mining contract with 4x hashrate of the Starter tier. Enhanced cooling infrastructure and priority block allocation for consistent daily returns.', true),
  ('Elite Miner', 'BTC', '500 TH/s', 50000.00, 250000.00, 0.75, 90, 'Institutional mining contract with maximum hashrate allocation and dedicated ASIC hardware. Includes priority support, real-time dashboard analytics, and guaranteed uptime SLA.', true),
  ('Genesis Miner', 'BTC', '1 PH/s', 100000.00, 1000000.00, 0.95, 120, 'Ultra-premium petahash-class mining operation with direct access to hydroelectric-powered mining facilities. The highest yield tier available on the platform.', true)
ON CONFLICT DO NOTHING;

-- ---------------------------------------------------------
-- Staking Pools seed (from 016)
-- ---------------------------------------------------------
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

-- ---------------------------------------------------------
-- Stocks seed (from 019)
-- ---------------------------------------------------------
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

-- ---------------------------------------------------------
-- Mining Servers seed (from 019)
-- ---------------------------------------------------------
INSERT INTO public.mining_servers (name, specs, hashrate, monthly_cost, quarterly_cost, daily_return_rate, description, image_url)
VALUES
  ('Starter Rig', '4x NVIDIA RTX 4090, 64GB RAM, 2TB NVMe', '450 TH/s', 3500.00, 9000.00, 0.65, 'Entry-level mining server ideal for beginners. Optimized for Bitcoin and Ethereum mining with efficient power consumption.', '/image/servers/starter_rig.png'),
  ('Pro Miner', '8x NVIDIA A100, 256GB RAM, 4TB NVMe', '2.4 PH/s', 8500.00, 22000.00, 0.85, 'Professional-grade mining server with enterprise GPUs. High hashrate output suitable for serious miners seeking consistent returns.', '/image/servers/pro_miner.png'),
  ('Elite Supercomputer', '16x NVIDIA H100 SXM, 512GB RAM, 8TB NVMe', '8.5 PH/s', 25000.00, 65000.00, 1.10, 'Top-tier supercomputer node with the latest Hopper architecture. Maximum hashrate for institutional-level mining operations.', '/image/servers/elite_supercomputer.png'),
  ('Quantum Node', '32x NVIDIA H200, 1TB RAM, 16TB NVMe', '22 PH/s', 75000.00, 195000.00, 1.35, 'Ultra-premium next-gen mining supercomputer. Reserved for high-net-worth clients seeking the absolute highest yield in crypto mining.', '/image/servers/quantum_node.png')
ON CONFLICT DO NOTHING;

-- ---------------------------------------------------------
-- Future Markets: Investment Themes seed (from 020)
-- ---------------------------------------------------------
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

-- ---------------------------------------------------------
-- Future Markets: Risk Profiles seed (from 020)
-- ---------------------------------------------------------
INSERT INTO public.risk_profiles (name, code, description, max_equity_allocation, recommended_horizon)
VALUES
  ('Conservative Preservation', 'CONSERVATIVE', 'Capital preservation focus with low volatility exposure. High allocation to energy utilities and tokenized Treasuries.', 30.00, '1 to 3 Years'),
  ('Balanced Growth', 'MODERATE', 'Balanced exposure across established tech leaders, power grids, and high-yield infrastructure.', 60.00, '3 to 5 Years'),
  ('Aggressive Innovation', 'GROWTH', 'High growth allocation targeting AI chips, robotics, and next-gen computational biology.', 85.00, '5+ Years'),
  ('Frontier Multiplier', 'AGGRESSIVE', 'Maximum exposure to disruptive early-stage pre-IPO tech, space logistics, and hyper-scale compute.', 100.00, '7+ Years')
ON CONFLICT (code) DO NOTHING;

-- ---------------------------------------------------------
-- Future Markets: Portfolio Assets seed (from 020)
-- ---------------------------------------------------------
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

-- ---------------------------------------------------------
-- Future Markets: Investment Products seed (from 020)
-- ---------------------------------------------------------
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

-- ---------------------------------------------------------
-- Future Markets: Allocations for AI Infrastructure Product (from 020)
-- ---------------------------------------------------------
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

-- Allocations for AI Leaders (from 020)
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

-- Allocations for Future Energy (from 020)
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

-- =========================================================
-- 8. BANK WITHDRAWAL COLUMNS (from 024)
-- =========================================================
ALTER TABLE public.transactions
  ADD COLUMN IF NOT EXISTS withdrawal_method TEXT DEFAULT 'crypto',
  ADD COLUMN IF NOT EXISTS bank_name TEXT,
  ADD COLUMN IF NOT EXISTS account_holder_name TEXT,
  ADD COLUMN IF NOT EXISTS account_number TEXT,
  ADD COLUMN IF NOT EXISTS routing_number TEXT,
  ADD COLUMN IF NOT EXISTS swift_code TEXT,
  ADD COLUMN IF NOT EXISTS bank_country TEXT,
  ADD COLUMN IF NOT EXISTS account_type TEXT;

-- =========================================================
-- 9. SCHEMA GRANTS
-- =========================================================
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres, service_role;
GRANT SELECT, INSERT, UPDATE ON public.users TO authenticated;
