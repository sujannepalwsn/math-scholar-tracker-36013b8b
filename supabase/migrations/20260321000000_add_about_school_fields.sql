-- Add About School fields to centers table
ALTER TABLE public.centers
ADD COLUMN IF NOT EXISTS mission TEXT,
ADD COLUMN IF NOT EXISTS vision TEXT,
ADD COLUMN IF NOT EXISTS about_description TEXT,
ADD COLUMN IF NOT EXISTS principal_message TEXT,
ADD COLUMN IF NOT EXISTS established_date DATE;
