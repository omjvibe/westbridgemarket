-- Create site_settings table for admin-configurable toggles
CREATE TABLE IF NOT EXISTS public.site_settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    description TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed trade page toggle (enabled by default)
INSERT INTO public.site_settings (key, value, description)
VALUES ('trade_page_enabled', 'true', 'Controls whether the Trade page is visible to users in the dashboard navigation')
ON CONFLICT (key) DO NOTHING;

-- Seed signals page toggle (enabled by default)
INSERT INTO public.site_settings (key, value, description)
VALUES ('signals_page_enabled', 'true', 'Controls whether the Signals page is visible to users in the dashboard navigation')
ON CONFLICT (key) DO NOTHING;

-- Allow authenticated users to read settings
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read site settings" ON public.site_settings;
CREATE POLICY "Anyone can read site settings" ON public.site_settings
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Only admins can modify site settings" ON public.site_settings;
CREATE POLICY "Only admins can modify site settings" ON public.site_settings
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.admin_users WHERE id = auth.uid())
    );
