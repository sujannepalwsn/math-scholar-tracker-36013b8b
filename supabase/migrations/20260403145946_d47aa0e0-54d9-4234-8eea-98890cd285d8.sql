-- 1. FIX: Payment Gateway Secrets Exposure
DROP POLICY IF EXISTS "Center users can read gateway settings" ON public.payment_gateway_settings;
DROP POLICY IF EXISTS "Center Admin access" ON public.payment_gateway_settings;

-- 2. FIX: Staff Documents - remove public access, make bucket private
DROP POLICY IF EXISTS "Public access to staff-documents" ON storage.objects;
DROP POLICY IF EXISTS "Auth delete staff-documents" ON storage.objects;
DROP POLICY IF EXISTS "Auth upload to staff-documents" ON storage.objects;

CREATE POLICY "Authenticated upload staff-documents"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'staff-documents');

CREATE POLICY "Authenticated read staff-documents"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'staff-documents');

CREATE POLICY "Authenticated delete staff-documents"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'staff-documents');

UPDATE storage.buckets SET public = false WHERE id = 'staff-documents';

-- 3. FIX: Password Hash Exposure - create safe view, drop overpermissive policy
CREATE OR REPLACE VIEW public.users_safe AS
SELECT id, username, role, center_id, is_active, teacher_id, student_id, 
       expiry_date, last_login, preferences, created_at, updated_at
FROM public.users;

DROP POLICY IF EXISTS "Center Isolation Policy" ON public.users;

-- 4. FIX: Storage USING(true) policies - replace with bucket-scoped
DROP POLICY IF EXISTS "Authenticated users can update their files" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete their files" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can view files" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload files" ON storage.objects;

CREATE POLICY "Auth users view own bucket files"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id IN ('test-files','homework-files','lesson-files','leave-documents',
                 'activity-photos','activity-videos','homework-images',
                 'login-assets','center-logos','center-backgrounds','hero-slides')
);

CREATE POLICY "Auth users upload to allowed buckets"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id IN ('test-files','homework-files','lesson-files','leave-documents',
                 'activity-photos','activity-videos','homework-images',
                 'login-assets','center-logos','center-backgrounds','hero-slides')
);

CREATE POLICY "Auth users update own bucket files"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id IN ('test-files','homework-files','lesson-files','leave-documents',
                 'activity-photos','activity-videos','homework-images',
                 'login-assets','center-logos','center-backgrounds','hero-slides')
);

CREATE POLICY "Auth users delete own bucket files"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id IN ('test-files','homework-files','lesson-files','leave-documents',
                 'activity-photos','activity-videos','homework-images',
                 'login-assets','center-logos','center-backgrounds','hero-slides')
);

-- 5. FIX: parent_students overpermissive SELECT
DROP POLICY IF EXISTS "Allow authenticated select" ON public.parent_students;

CREATE POLICY "Users can view own parent_students links"
ON public.parent_students FOR SELECT TO authenticated
USING (
  parent_user_id = auth.uid()
  OR get_user_role() IN ('admin', 'center')
  OR student_id IN (SELECT student_id FROM public.users WHERE id = auth.uid())
);