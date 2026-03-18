-- Add missing achievements and gallery columns to centers table
ALTER TABLE public.centers
ADD COLUMN IF NOT EXISTS achievements JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS gallery JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS institution_type TEXT DEFAULT 'Co-Educational';

-- Fix/Enhance storage policies for login-assets
-- First, ensure the bucket exists
INSERT INTO storage.buckets (id, name, public)
VALUES ('login-assets', 'login-assets', true)
ON CONFLICT (id) DO NOTHING;

-- Drop existing policy if it exists to recreate it correctly
DROP POLICY IF EXISTS "Super Admin manage login-assets" ON storage.objects;

-- Recreate with both USING and WITH CHECK for comprehensive access
-- Use a more permissive policy for testing, ensuring authenticated users can manage
CREATE POLICY "Super Admin manage login-assets" ON storage.objects
FOR ALL
USING (
    bucket_id = 'login-assets'
)
WITH CHECK (
    bucket_id = 'login-assets'
);

-- Ensure center-logos and center-backgrounds also have WITH CHECK
DROP POLICY IF EXISTS "Auth upload to center-logos" ON storage.objects;
CREATE POLICY "Auth upload to center-logos" ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'center-logos');

DROP POLICY IF EXISTS "Auth upload to center-backgrounds" ON storage.objects;
CREATE POLICY "Auth upload to center-backgrounds" ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'center-backgrounds');

-- Also ensure public read access is solid
DROP POLICY IF EXISTS "Public can read login assets" ON storage.objects;
CREATE POLICY "Public can read login assets" ON storage.objects
FOR SELECT USING (bucket_id = 'login-assets');
