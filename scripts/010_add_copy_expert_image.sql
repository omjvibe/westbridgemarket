-- Migration to add image_url to copy_experts table
ALTER TABLE public.copy_experts ADD COLUMN IF NOT EXISTS image_url TEXT;
