-- ============================================================
-- 018: Add XRP investment plans + page visibility seeds
-- ============================================================

-- XRP Investment Plans
INSERT INTO public.investment_plans (name, plan_type, min_amount, max_amount, roi_percentage, duration_days, description, features, asset_category, specific_asset)
VALUES
  ('XRP Growth Plan', 'basic', 2000.00, 24999.99, 8.00, 14, 'Entry-level XRP investment with steady returns. Leverage Ripple''s institutional payment network for consistent yield generation.', '["24/7 Support", "Basic Analytics", "Mobile App Access", "XRP Market Reports"]'::jsonb, 'crypto', 'XRP (XRP)'),
  ('XRP Premium Plan', 'silver', 25000.00, 99999.99, 14.00, 30, 'Premium XRP allocation with enhanced ROI. Access advanced XRPL analytics and on-demand liquidity insights.', '["Priority Support", "Advanced Analytics", "Copy Trading Access", "XRPL DEX Insights", "Mobile App Access"]'::jsonb, 'crypto', 'XRP (XRP)'),
  ('XRP Elite Plan', 'gold', 100000.00, 500000.00, 22.00, 45, 'Institutional-grade XRP investment vehicle. Includes direct access to cross-border payment flow analytics and premium ODL corridor strategies.', '["VIP Support", "Pro Analytics", "Premium Signals", "ODL Flow Access", "Dedicated Account Manager", "Tax Optimization"]'::jsonb, 'crypto', 'XRP (XRP)')
ON CONFLICT DO NOTHING;

-- Seed additional page visibility settings (if not already present)
INSERT INTO public.site_settings (key, value, updated_at)
VALUES
  ('investments_page_enabled', 'true', NOW()),
  ('copy_trading_page_enabled', 'true', NOW()),
  ('portfolio_page_enabled', 'true', NOW())
ON CONFLICT (key) DO NOTHING;
