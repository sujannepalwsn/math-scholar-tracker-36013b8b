
-- FIX 1: Remove permissive UPDATE policies allowing role escalation
DROP POLICY IF EXISTS "User update self" ON public.users;
DROP POLICY IF EXISTS "Users update own record" ON public.users;

-- FIX 2: Protect password hashes - drop and recreate view
DROP VIEW IF EXISTS public.users_safe;
CREATE VIEW public.users_safe AS
SELECT id, username, role, center_id, student_id, teacher_id, is_active, 
       expiry_date, last_login, created_at, updated_at
FROM public.users;

DROP POLICY IF EXISTS "Users can view users in their center" ON public.users;
CREATE POLICY "Users view same center users" ON public.users
  FOR SELECT TO authenticated
  USING (center_id = get_user_center_id() OR id = auth.uid());

-- FIX 3: Remove parent/teacher access to payment gateway secrets
DROP POLICY IF EXISTS "Parent access payment_gateway_settings" ON public.payment_gateway_settings;
DROP POLICY IF EXISTS "Teacher access payment_gateway_settings" ON public.payment_gateway_settings;

-- FIX 4: Add center_id to teacher HR policies
DROP POLICY IF EXISTS "Teacher access staff_contracts" ON public.staff_contracts;
CREATE POLICY "Teacher access staff_contracts" ON public.staff_contracts
  FOR SELECT TO authenticated
  USING (get_user_role() = 'teacher' AND get_user_center_id() = center_id);

DROP POLICY IF EXISTS "Teacher access payroll_logs" ON public.payroll_logs;
CREATE POLICY "Teacher access payroll_logs" ON public.payroll_logs
  FOR SELECT TO authenticated
  USING (get_user_role() = 'teacher' AND get_user_center_id() = center_id);

DROP POLICY IF EXISTS "Teacher access performance_evaluations" ON public.performance_evaluations;
CREATE POLICY "Teacher access performance_evaluations" ON public.performance_evaluations
  FOR SELECT TO authenticated
  USING (get_user_role() = 'teacher' AND get_user_center_id() = center_id);

DROP POLICY IF EXISTS "Teacher access consumable_logs" ON public.consumable_logs;
CREATE POLICY "Teacher access consumable_logs" ON public.consumable_logs
  FOR SELECT TO authenticated
  USING (get_user_role() = 'teacher' AND get_user_center_id() = center_id);

DROP POLICY IF EXISTS "Teacher access staff_documents" ON public.staff_documents;
CREATE POLICY "Teacher access staff_documents" ON public.staff_documents
  FOR SELECT TO authenticated
  USING (get_user_role() = 'teacher' AND get_user_center_id() = center_id);

-- FIX 5: Scope staff-documents storage by center
DROP POLICY IF EXISTS "Authenticated read staff-documents" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated upload staff-documents" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated delete staff-documents" ON storage.objects;

CREATE POLICY "Center scoped read staff-documents" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'staff-documents' AND (storage.foldername(name))[1] = get_user_center_id()::text);

CREATE POLICY "Center scoped upload staff-documents" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'staff-documents' AND (storage.foldername(name))[1] = get_user_center_id()::text);

CREATE POLICY "Center scoped delete staff-documents" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'staff-documents' AND (storage.foldername(name))[1] = get_user_center_id()::text);
