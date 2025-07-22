-- Ensure company fields exist in profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS company_name TEXT,
ADD COLUMN IF NOT EXISTS company_document TEXT, 
ADD COLUMN IF NOT EXISTS company_address TEXT;