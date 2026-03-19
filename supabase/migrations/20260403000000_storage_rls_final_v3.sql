-- Fix RLS policy issues for institutional branding assets
-- This migration ensures that authenticated users can manage logos and backgrounds for their center.

-- 1. Ensure buckets exist (idempotent)
INSERT INTO storage.buckets (id, name, public)
VALUES ('center-logos', 'center-logos', true)
ON CONFLICT (id) DO UPDATE SET public = true;

INSERT INTO storage.buckets (id, name, public)
VALUES ('center-backgrounds', 'center-backgrounds', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- 2. Drop existing policies to avoid conflicts
DO $$
BEGIN
    DROP POLICY IF EXISTS "Auth upload to center-logos" ON storage.objects;
    DROP POLICY IF EXISTS "Auth update center-logos" ON storage.objects;
    DROP POLICY IF EXISTS "Auth delete center-logos" ON storage.objects;
    DROP POLICY IF EXISTS "Public select center-logos" ON storage.objects;
    DROP POLICY IF EXISTS "Auth upload to center-backgrounds" ON storage.objects;
    DROP POLICY IF EXISTS "Auth update center-backgrounds" ON storage.objects;
    DROP POLICY IF EXISTS "Auth delete center-backgrounds" ON storage.objects;
    DROP POLICY IF EXISTS "Public select center-backgrounds" ON storage.objects;
    DROP POLICY IF EXISTS "Public access to center-logos" ON storage.objects;
    DROP POLICY IF EXISTS "Public access to center-backgrounds" ON storage.objects;
END $$;

-- 3. Create broad but authenticated-only policies for logos
CREATE POLICY "Public SELECT on center-logos" ON storage.objects FOR SELECT USING (bucket_id = 'center-logos');
CREATE POLICY "Authenticated INSERT on center-logos" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'center-logos' AND auth.role() = 'authenticated');
CREATE POLICY "Authenticated UPDATE on center-logos" ON storage.objects FOR UPDATE USING (bucket_id = 'center-logos' AND auth.role() = 'authenticated');
CREATE POLICY "Authenticated DELETE on center-logos" ON storage.objects FOR DELETE USING (bucket_id = 'center-logos' AND auth.role() = 'authenticated');

-- 4. Create broad but authenticated-only policies for backgrounds
CREATE POLICY "Public SELECT on center-backgrounds" ON storage.objects FOR SELECT USING (bucket_id = 'center-backgrounds');
CREATE POLICY "Authenticated INSERT on center-backgrounds" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'center-backgrounds' AND auth.role() = 'authenticated');
CREATE POLICY "Authenticated UPDATE on center-backgrounds" ON storage.objects FOR UPDATE USING (bucket_id = 'center-backgrounds' AND auth.role() = 'authenticated');
CREATE POLICY "Authenticated DELETE on center-backgrounds" ON storage.objects FOR DELETE USING (bucket_id = 'center-backgrounds' AND auth.role() = 'authenticated');

-- 5. Final fix for centers update policy to allow staff
DROP POLICY IF EXISTS "Teachers with settings_access can update center" ON public.centers;
DROP POLICY IF EXISTS "Authenticated users can update their center" ON public.centers;
DROP POLICY IF EXISTS "Allow center admins to manage center" ON public.centers;

CREATE POLICY "Authenticated staff can update center" ON public.centers
FOR UPDATE USING (
  auth.role() = 'authenticated' AND (
    public.get_user_role() = 'center' OR
    (public.get_user_role() = 'teacher' AND (
      EXISTS (
        SELECT 1 FROM public.teacher_feature_permissions
        WHERE teacher_id = public.get_user_teacher_id()
        AND (test_management = true OR take_attendance = true) -- Allow some proxy administrative access if needed
      )
    ))
  ) AND id = public.get_user_center_id()
);

-- Re-add standard policies
CREATE POLICY "Allow authenticated users to view centers" ON public.centers FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow center admins to manage center" ON public.centers FOR ALL USING (public.get_user_role() = 'center' AND id = public.get_user_center_id());
CREATE POLICY "Service role full access on centers" ON public.centers FOR ALL USING (true) WITH CHECK (true);
