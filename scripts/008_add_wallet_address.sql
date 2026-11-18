-- Add wallet_address column to users table
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS wallet_address TEXT UNIQUE;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_users_wallet_address ON public.users(wallet_address);
