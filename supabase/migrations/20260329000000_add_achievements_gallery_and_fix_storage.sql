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
-- Restrict management of login-assets to super-admins only (authenticated users with no center_id or specific super-admin flag)
-- In this schema, super-admins are often identified by having no center_id in their profile
CREATE POLICY "Super Admin manage login-assets" ON storage.objects
FOR ALL
TO authenticated
USING (
    bucket_id = 'login-assets' AND
    (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'))
)
WITH CHECK (
    bucket_id = 'login-assets' AND
    (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'))
);

-- Ensure center-logos and center-backgrounds also have WITH CHECK and proper role restrictions
DROP POLICY IF EXISTS "Auth upload to center-logos" ON storage.objects;
CREATE POLICY "Auth upload to center-logos" ON storage.objects FOR ALL
TO authenticated
USING (
    bucket_id = 'center-logos' AND
    (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND (role = 'center' OR role = 'admin')))
)
WITH CHECK (
    bucket_id = 'center-logos' AND
    (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND (role = 'center' OR role = 'admin')))
);

DROP POLICY IF EXISTS "Auth upload to center-backgrounds" ON storage.objects;
CREATE POLICY "Auth upload to center-backgrounds" ON storage.objects FOR ALL
TO authenticated
USING (
    bucket_id = 'center-backgrounds' AND
    (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND (role = 'center' OR role = 'admin')))
)
WITH CHECK (
    bucket_id = 'center-backgrounds' AND
    (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND (role = 'center' OR role = 'admin')))
);

-- Also ensure public read access is solid
DROP POLICY IF EXISTS "Public can read login assets" ON storage.objects;
CREATE POLICY "Public can read login assets" ON storage.objects
FOR SELECT USING (bucket_id = 'login-assets');
