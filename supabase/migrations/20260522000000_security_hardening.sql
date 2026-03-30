-- Create a dedicated private schema for internal security lookups
CREATE SCHEMA IF NOT EXISTS security;

-- Move users_private_lookup to the private schema for better isolation
CREATE VIEW security.users_private_lookup AS
SELECT id, role, center_id, student_id, teacher_id
FROM public.users;

-- Revoke all access to the security view from public/authenticated/anon
REVOKE ALL ON security.users_private_lookup FROM public, anon, authenticated;

-- Update SECURITY DEFINER functions to reference the new private view
-- We explicitly target the public schema to ensure we overwrite the existing functions
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS TEXT AS $$
  SELECT role FROM security.users_private_lookup WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.get_user_center_id()
RETURNS UUID AS $$
  SELECT center_id FROM security.users_private_lookup WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER SET search_path = public;

-- Drop function first to avoid parameter name mismatch error (42P13)
-- This happens if the existing function has a different parameter name
DROP FUNCTION IF EXISTS public.is_same_center(uuid);
CREATE OR REPLACE FUNCTION public.is_same_center(target_center_id UUID)
RETURNS BOOLEAN AS $$
  SELECT center_id = target_center_id FROM security.users_private_lookup WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER SET search_path = public;

-- Hardening the UPDATE policy on the users table to prevent self-privilege escalation
DROP POLICY IF EXISTS "Allow users to update their own record" ON public.users;
CREATE POLICY "Allow users to update their own record" ON public.users
FOR UPDATE
USING (id = auth.uid())
WITH CHECK (
  -- Ensure users cannot change their own role, center_id, teacher_id, or student_id
  id = auth.uid() AND
  role = (SELECT role FROM security.users_private_lookup WHERE id = auth.uid()) AND
  (center_id IS NOT DISTINCT FROM (SELECT center_id FROM security.users_private_lookup WHERE id = auth.uid())) AND
  (teacher_id IS NOT DISTINCT FROM (SELECT teacher_id FROM security.users_private_lookup WHERE id = auth.uid())) AND
  (student_id IS NOT DISTINCT FROM (SELECT student_id FROM security.users_private_lookup WHERE id = auth.uid()))
);

-- Remove redundant "Service role full access" policies as service role bypasses RLS by default
DROP POLICY IF EXISTS "Service role full access" ON public.centers;
DROP POLICY IF EXISTS "Service role full access" ON public.users;
DROP POLICY IF EXISTS "Service role full access" ON public.students;
DROP POLICY IF EXISTS "Service role full access" ON public.teachers;
DROP POLICY IF EXISTS "Service role full access" ON public.attendance;
DROP POLICY IF EXISTS "Service role full access" ON public.homework;
DROP POLICY IF EXISTS "Service role full access" ON public.tests;
DROP POLICY IF EXISTS "Service role full access" ON public.lesson_plans;
DROP POLICY IF EXISTS "Service role full access" ON public.chat_conversations;
DROP POLICY IF EXISTS "Service role full access" ON public.chat_messages;
DROP POLICY IF EXISTS "Service role full access" ON public.invoices;
