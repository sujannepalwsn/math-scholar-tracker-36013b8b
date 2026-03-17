-- Add center-logos and center-backgrounds buckets and policies
INSERT INTO storage.buckets (id, name, public)
VALUES ('center-logos', 'center-logos', true), ('center-backgrounds', 'center-backgrounds', true)
ON CONFLICT (id) DO NOTHING;

-- Policies for center-logos
DROP POLICY IF EXISTS "Public access to center-logos" ON storage.objects;
CREATE POLICY "Public access to center-logos" ON storage.objects FOR SELECT
USING (bucket_id = 'center-logos');

DROP POLICY IF EXISTS "Auth upload to center-logos" ON storage.objects;
CREATE POLICY "Auth upload to center-logos" ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'center-logos');

DROP POLICY IF EXISTS "Auth delete center-logos" ON storage.objects;
CREATE POLICY "Auth delete center-logos" ON storage.objects FOR DELETE
USING (bucket_id = 'center-logos');

-- Policies for center-backgrounds
DROP POLICY IF EXISTS "Public access to center-backgrounds" ON storage.objects;
CREATE POLICY "Public access to center-backgrounds" ON storage.objects FOR SELECT
USING (bucket_id = 'center-backgrounds');

DROP POLICY IF EXISTS "Auth upload to center-backgrounds" ON storage.objects;
CREATE POLICY "Auth upload to center-backgrounds" ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'center-backgrounds');

DROP POLICY IF EXISTS "Auth delete center-backgrounds" ON storage.objects;
CREATE POLICY "Auth delete center-backgrounds" ON storage.objects FOR DELETE
USING (bucket_id = 'center-backgrounds');
