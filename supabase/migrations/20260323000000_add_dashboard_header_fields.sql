-- Add dashboard header fields to centers table
ALTER TABLE public.centers
ADD COLUMN IF NOT EXISTS principal_name TEXT,
ADD COLUMN IF NOT EXISTS website_url TEXT;
