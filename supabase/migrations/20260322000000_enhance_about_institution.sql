-- Enhance About Institution fields in centers table
ALTER TABLE public.centers
ADD COLUMN IF NOT EXISTS academic_info TEXT,
ADD COLUMN IF NOT EXISTS facilities JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS social_links JSONB DEFAULT '{}'::jsonb;
