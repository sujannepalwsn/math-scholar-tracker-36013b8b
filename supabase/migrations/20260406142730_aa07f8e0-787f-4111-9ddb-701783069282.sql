
-- Remove center-wide SELECT that exposes password_hash
DROP POLICY IF EXISTS "Users view same center users" ON public.users;

-- Ensure self-view policies exist
-- "Allow users to view their own record" and "User view self" already exist

-- Make users_safe view SECURITY INVOKER to fix the security definer view warning
DROP VIEW IF EXISTS public.users_safe;
CREATE VIEW public.users_safe WITH (security_invoker = true) AS
SELECT id, username, role, center_id, student_id, teacher_id, is_active,
       expiry_date, last_login, created_at, updated_at
FROM public.users;
