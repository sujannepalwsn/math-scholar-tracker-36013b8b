
-- Re-add center-wide SELECT policy (needed for app functionality)
CREATE POLICY "Users view same center users" ON public.users
  FOR SELECT TO authenticated
  USING (center_id = get_user_center_id() OR id = auth.uid());

-- Column-level security: revoke full table SELECT, grant only safe columns
REVOKE SELECT ON public.users FROM authenticated;
GRANT SELECT (id, username, role, center_id, student_id, teacher_id, is_active, 
              expiry_date, last_login, created_at, updated_at) 
ON public.users TO authenticated;

-- Also need INSERT/UPDATE/DELETE grants for the app to work
REVOKE INSERT ON public.users FROM authenticated;
GRANT INSERT (id, username, role, center_id, student_id, teacher_id, is_active, 
              password_hash, expiry_date, last_login, created_at, updated_at) 
ON public.users TO authenticated;

REVOKE UPDATE ON public.users FROM authenticated;
GRANT UPDATE (username, is_active, password_hash, expiry_date, last_login, updated_at) 
ON public.users TO authenticated;
