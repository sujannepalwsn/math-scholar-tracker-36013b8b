-- Add more customization fields to centers table
ALTER TABLE public.centers
ADD COLUMN IF NOT EXISTS header_visible_sections JSONB DEFAULT '{"principal": true, "short_code": true, "academic_year": true, "phone": true, "email": true, "website": true}'::jsonb,
ADD COLUMN IF NOT EXISTS header_title_color TEXT DEFAULT '#1e293b',
ADD COLUMN IF NOT EXISTS header_details_color TEXT DEFAULT '#64748b';
