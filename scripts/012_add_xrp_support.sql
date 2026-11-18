-- Migration to insert a default XRP/Ripple deposit address
INSERT INTO public.crypto_addresses (crypto_symbol, crypto_name, wallet_address, network, is_active)
VALUES ('XRP', 'Ripple', 'rEb8tk3gPmD7E95zXrmGgdA6d8259H875A', 'Ripple Network', true)
ON CONFLICT DO NOTHING;
