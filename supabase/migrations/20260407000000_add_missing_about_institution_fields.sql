-- Add missing Achievement and Gallery columns to centers table
ALTER TABLE public.centers
ADD COLUMN IF NOT EXISTS achievements JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS gallery JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS institution_type TEXT DEFAULT 'Co-Educational';
