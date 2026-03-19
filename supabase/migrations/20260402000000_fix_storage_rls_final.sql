-- Final Storage RLS Policies for center-logos and center-backgrounds
-- This fix addresses the "new row violates row level security policy" error during upload (INSERT)
-- by ensuring authenticated users can INSERT and that bucket-level permissions are correct.

DO $$
BEGIN
    -- 1. Ensure buckets exist (idempotent)
    INSERT INTO storage.buckets (id, name, public)
    VALUES ('center-logos', 'center-logos', true)
    ON CONFLICT (id) DO UPDATE SET public = true;

    INSERT INTO storage.buckets (id, name, public)
    VALUES ('center-backgrounds', 'center-backgrounds', true)
    ON CONFLICT (id) DO UPDATE SET public = true;

    -- 2. center-logos policies
    DROP POLICY IF EXISTS "Auth upload to center-logos" ON storage.objects;
    CREATE POLICY "Auth upload to center-logos" ON storage.objects FOR INSERT WITH CHECK (
      bucket_id = 'center-logos' AND auth.role() = 'authenticated'
    );

    DROP POLICY IF EXISTS "Auth update center-logos" ON storage.objects;
    CREATE POLICY "Auth update center-logos" ON storage.objects FOR UPDATE USING (
      bucket_id = 'center-logos' AND auth.role() = 'authenticated'
    );

    DROP POLICY IF EXISTS "Auth delete center-logos" ON storage.objects;
    CREATE POLICY "Auth delete center-logos" ON storage.objects FOR DELETE USING (
      bucket_id = 'center-logos' AND auth.role() = 'authenticated'
    );

    DROP POLICY IF EXISTS "Public select center-logos" ON storage.objects;
    CREATE POLICY "Public select center-logos" ON storage.objects FOR SELECT USING (
      bucket_id = 'center-logos'
    );

    -- 3. center-backgrounds policies
    DROP POLICY IF EXISTS "Auth upload to center-backgrounds" ON storage.objects;
    CREATE POLICY "Auth upload to center-backgrounds" ON storage.objects FOR INSERT WITH CHECK (
      bucket_id = 'center-backgrounds' AND auth.role() = 'authenticated'
    );

    DROP POLICY IF EXISTS "Auth update center-backgrounds" ON storage.objects;
    CREATE POLICY "Auth update center-backgrounds" ON storage.objects FOR UPDATE USING (
      bucket_id = 'center-backgrounds' AND auth.role() = 'authenticated'
    );

    DROP POLICY IF EXISTS "Auth delete center-backgrounds" ON storage.objects;
    CREATE POLICY "Auth delete center-backgrounds" ON storage.objects FOR DELETE USING (
      bucket_id = 'center-backgrounds' AND auth.role() = 'authenticated'
    );

    DROP POLICY IF EXISTS "Public select center-backgrounds" ON storage.objects;
    CREATE POLICY "Public select center-backgrounds" ON storage.objects FOR SELECT USING (
      bucket_id = 'center-backgrounds'
    );

    -- 4. Update centers table RLS to be more permissive for authenticated users in the same center
    DROP POLICY IF EXISTS "Authenticated users can update their center" ON public.centers;
    CREATE POLICY "Authenticated users can update their center" ON public.centers
    FOR UPDATE USING (
      auth.role() = 'authenticated' AND (
        EXISTS (SELECT 1 FROM public.users WHERE users.id = auth.uid() AND users.center_id = centers.id)
      )
    ) WITH CHECK (
      auth.role() = 'authenticated' AND (
        EXISTS (SELECT 1 FROM public.users WHERE users.id = auth.uid() AND users.center_id = centers.id)
      )
    );

END $$;
