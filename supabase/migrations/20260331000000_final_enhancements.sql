-- 1. Migration for header_text_transform and visibility columns
ALTER TABLE centers ADD COLUMN IF NOT EXISTS header_text_transform TEXT DEFAULT 'none';
ALTER TABLE centers ADD COLUMN IF NOT EXISTS header_title_visible BOOLEAN DEFAULT true;
ALTER TABLE centers ADD COLUMN IF NOT EXISTS header_address_visible BOOLEAN DEFAULT true;
ALTER TABLE centers ADD COLUMN IF NOT EXISTS header_principal_visible BOOLEAN DEFAULT true;
ALTER TABLE centers ADD COLUMN IF NOT EXISTS header_code_visible BOOLEAN DEFAULT true;
ALTER TABLE centers ADD COLUMN IF NOT EXISTS header_year_visible BOOLEAN DEFAULT true;
ALTER TABLE centers ADD COLUMN IF NOT EXISTS header_contact_visible BOOLEAN DEFAULT true;
ALTER TABLE centers ADD COLUMN IF NOT EXISTS header_email_visible BOOLEAN DEFAULT true;
ALTER TABLE centers ADD COLUMN IF NOT EXISTS header_website_visible BOOLEAN DEFAULT true;

-- 2. Storage RLS Policies fix for center-logos and center-backgrounds
-- These policies ensure that authenticated users associated with a center can upload and manage their institutional assets.

-- center-logos
DROP POLICY IF EXISTS "Auth upload to center-logos" ON storage.objects;
CREATE POLICY "Auth upload to center-logos" ON storage.objects FOR INSERT WITH CHECK (
  bucket_id = 'center-logos' AND
  auth.role() = 'authenticated'
);

DROP POLICY IF EXISTS "Auth update center-logos" ON storage.objects;
CREATE POLICY "Auth update center-logos" ON storage.objects FOR UPDATE USING (
  bucket_id = 'center-logos' AND
  auth.role() = 'authenticated'
);

DROP POLICY IF EXISTS "Auth delete center-logos" ON storage.objects;
CREATE POLICY "Auth delete center-logos" ON storage.objects FOR DELETE USING (
  bucket_id = 'center-logos' AND
  auth.role() = 'authenticated'
);

-- center-backgrounds
DROP POLICY IF EXISTS "Auth upload to center-backgrounds" ON storage.objects;
CREATE POLICY "Auth upload to center-backgrounds" ON storage.objects FOR INSERT WITH CHECK (
  bucket_id = 'center-backgrounds' AND
  auth.role() = 'authenticated'
);

DROP POLICY IF EXISTS "Auth update center-backgrounds" ON storage.objects;
CREATE POLICY "Auth update center-backgrounds" ON storage.objects FOR UPDATE USING (
  bucket_id = 'center-backgrounds' AND
  auth.role() = 'authenticated'
);

DROP POLICY IF EXISTS "Auth delete center-backgrounds" ON storage.objects;
CREATE POLICY "Auth delete center-backgrounds" ON storage.objects FOR DELETE USING (
  bucket_id = 'center-backgrounds' AND
  auth.role() = 'authenticated'
);

-- login-assets (restrict to Super Admins - users without center_id)
DROP POLICY IF EXISTS "Super Admin manage login-assets" ON storage.objects;
CREATE POLICY "Super Admin manage login-assets" ON storage.objects FOR ALL USING (
  bucket_id = 'login-assets' AND
  (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin'
);
