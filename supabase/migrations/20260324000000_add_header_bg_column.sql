-- Add header background image column to centers table
ALTER TABLE public.centers
ADD COLUMN IF NOT EXISTS header_bg_url TEXT;
