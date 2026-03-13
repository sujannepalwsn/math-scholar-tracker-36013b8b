-- Fix RLS recursion using a private view and SECURITY DEFINER functions
-- Migration: 20260312000000_fix_rls_recursion_final.sql

-- 1. UTILITY: Helper to drop all policies on a table
CREATE OR REPLACE FUNCTION public.drop_all_policies(table_schema text, table_name text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    pol record;
BEGIN
    FOR pol IN (SELECT policyname FROM pg_policies WHERE schemaname = table_schema AND tablename = table_name) LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', pol.policyname, table_schema, table_name);
    END LOOP;
END;
$$;

-- 2. PRIVACY: Create a view to bypass RLS recursion on the users table
-- This view is owned by postgres and will be used by our helper functions
DROP VIEW IF EXISTS public.users_private_lookup CASCADE;
CREATE VIEW public.users_private_lookup AS
SELECT id, role, center_id, student_id, teacher_id
FROM public.users;

-- Ensure only the owner (postgres) can query this view directly
REVOKE ALL ON public.users_private_lookup FROM public, anon, authenticated;

-- 3. CORE: Security Definer Helper Functions
-- These query the private view to avoid triggering RLS recursion

CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, auth
AS $$
  SELECT role FROM public.users_private_lookup WHERE id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.get_user_center_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, auth
AS $$
  SELECT center_id FROM public.users_private_lookup WHERE id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.get_user_student_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, auth
AS $$
  SELECT student_id FROM public.users_private_lookup WHERE id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.get_user_teacher_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, auth
AS $$
  SELECT teacher_id FROM public.users_private_lookup WHERE id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.is_same_center(target_center_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, auth
AS $$
  SELECT
    COALESCE(target_center_id = public.get_user_center_id(), false)
    OR public.get_user_role() = 'admin';
$$;

-- 4. APPLY: Standardized Policies for Users Table
DO $$ BEGIN
    PERFORM public.drop_all_policies('public', 'users');
    ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

    -- Users can always see and update their own record
    CREATE POLICY "Allow users to view their own record" ON public.users FOR SELECT USING (id = auth.uid());
    CREATE POLICY "Allow users to update their own record" ON public.users FOR UPDATE USING (id = auth.uid());

    -- Admins can manage all users
    CREATE POLICY "Allow admins to manage all users" ON public.users FOR ALL USING (public.get_user_role() = 'admin');

    -- Center users and teachers can see users in their center
    CREATE POLICY "Allow center staff to view center users" ON public.users FOR SELECT
    USING (
        (public.get_user_role() IN ('center', 'teacher') AND center_id = public.get_user_center_id())
    );
END $$;

-- 5. APPLY: Standardized Policies for Centers Table
DO $$ BEGIN
    PERFORM public.drop_all_policies('public', 'centers');
    ALTER TABLE public.centers ENABLE ROW LEVEL SECURITY;

    -- Allow all authenticated users to view center names/logos
    CREATE POLICY "Allow authenticated users to view centers" ON public.centers FOR SELECT USING (auth.role() = 'authenticated');

    -- Center admins can manage their own center details
    CREATE POLICY "Allow center admins to manage center" ON public.centers FOR ALL USING (public.get_user_role() = 'center' AND id = public.get_user_center_id());

    -- Service role access
    CREATE POLICY "Service role full access on centers" ON public.centers FOR ALL USING (true) WITH CHECK (true);
END $$;

-- 6. APPLY: Standardized Policies for Multi-tenant tables (Direct center_id)
DO $$
DECLARE
    t_name text;
BEGIN
    FOR t_name IN SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name IN (
        'students', 'teachers', 'attendance', 'teacher_attendance', 'homework',
        'tests', 'discipline_issues', 'lesson_plans', 'activities',
        'center_events', 'invoices', 'expenses', 'fee_structures', 'fee_headings',
        'meetings', 'period_schedules', 'class_periods',
        'exams', 'exam_subjects', 'exam_marks', 'leave_applications', 'leave_categories',
        'center_feature_permissions', 'teacher_feature_permissions', 'broadcast_messages',
        'class_substitutions', 'notifications', 'activity_logs'
    )
    LOOP
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = t_name AND column_name = 'center_id') THEN
            PERFORM public.drop_all_policies('public', t_name);
            EXECUTE FORMAT('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;', t_name);

            -- Main Center/Admin Policy
            EXECUTE FORMAT('CREATE POLICY "Center and Admin access on %I" ON public.%I FOR ALL USING (public.is_same_center(center_id));', t_name, t_name);

            -- Teacher Read Policy (usually covered by is_same_center, but adding explicit SELECT if needed)
            EXECUTE FORMAT('CREATE POLICY "Teacher read access on %I" ON public.%I FOR SELECT USING (public.get_user_role() = ''teacher'' AND public.is_same_center(center_id));', t_name, t_name);

            -- Service Role
            EXECUTE FORMAT('CREATE POLICY "Service role access on %I" ON public.%I FOR ALL USING (true) WITH CHECK (true);', t_name, t_name);
        END IF;
    END LOOP;
END $$;

-- 7. APPLY: Standardized Policies for Multi-tenant tables (Indirect student_id)
DO $$
DECLARE
    t_name text;
BEGIN
    FOR t_name IN SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name IN (
        'student_homework_records', 'test_results', 'student_chapters', 'student_activities'
    )
    LOOP
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = t_name AND column_name = 'student_id') THEN
            PERFORM public.drop_all_policies('public', t_name);
            EXECUTE FORMAT('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;', t_name);

            -- Center/Admin Policy (check student's center)
            EXECUTE FORMAT('CREATE POLICY "Center and Admin access on %I" ON public.%I FOR ALL USING (EXISTS (SELECT 1 FROM public.students s WHERE s.id = %I.student_id AND public.is_same_center(s.center_id)));', t_name, t_name, t_name);

            -- Parent Policy (check parent_students junction)
            EXECUTE FORMAT('CREATE POLICY "Parent access on %I" ON public.%I FOR SELECT USING (EXISTS (SELECT 1 FROM public.parent_students ps WHERE ps.student_id = %I.student_id AND ps.parent_user_id = auth.uid()));', t_name, t_name, t_name);

            -- Teacher Read Policy
            EXECUTE FORMAT('CREATE POLICY "Teacher read access on %I" ON public.%I FOR SELECT USING (public.get_user_role() = ''teacher'' AND EXISTS (SELECT 1 FROM public.students s WHERE s.id = %I.student_id AND public.is_same_center(s.center_id)));', t_name, t_name, t_name);

            -- Service Role
            EXECUTE FORMAT('CREATE POLICY "Service role access on %I" ON public.%I FOR ALL USING (true) WITH CHECK (true);', t_name, t_name);
        END IF;
    END LOOP;
END $$;

-- 8. SPECIAL CASES

-- parent_students
DO $$ BEGIN
    PERFORM public.drop_all_policies('public', 'parent_students');
    ALTER TABLE public.parent_students ENABLE ROW LEVEL SECURITY;
    CREATE POLICY "Admin full access" ON public.parent_students FOR ALL USING (public.get_user_role() = 'admin');
    CREATE POLICY "Center manage links" ON public.parent_students FOR ALL USING (public.get_user_role() = 'center' AND EXISTS (SELECT 1 FROM public.students s WHERE s.id = parent_students.student_id AND public.is_same_center(s.center_id)));
    CREATE POLICY "Parent view own links" ON public.parent_students FOR SELECT USING (parent_user_id = auth.uid());
    CREATE POLICY "Service role access" ON public.parent_students FOR ALL USING (true);
END $$;

-- payments (linked via invoice_id)
DO $$ BEGIN
    PERFORM public.drop_all_policies('public', 'payments');
    ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
    CREATE POLICY "Center manage payments" ON public.payments FOR ALL USING (EXISTS (SELECT 1 FROM public.invoices i WHERE i.id = payments.invoice_id AND public.is_same_center(i.center_id)));
    CREATE POLICY "Parent view payments" ON public.payments FOR SELECT USING (EXISTS (SELECT 1 FROM public.invoices i JOIN public.parent_students ps ON i.student_id = ps.student_id WHERE i.id = payments.invoice_id AND ps.parent_user_id = auth.uid()));
    CREATE POLICY "Service role access" ON public.payments FOR ALL USING (true);
END $$;

-- chat_conversations
DO $$ BEGIN
    PERFORM public.drop_all_policies('public', 'chat_conversations');
    ALTER TABLE public.chat_conversations ENABLE ROW LEVEL SECURITY;
    CREATE POLICY "Center manage conversations" ON public.chat_conversations FOR ALL USING (public.get_user_role() = 'center' AND public.is_same_center(center_id));
    CREATE POLICY "Parent access conversations" ON public.chat_conversations FOR ALL USING (parent_user_id = auth.uid());
    CREATE POLICY "Teacher view conversations" ON public.chat_conversations FOR SELECT USING (public.get_user_role() = 'teacher' AND public.is_same_center(center_id));
    CREATE POLICY "Service role access" ON public.chat_conversations FOR ALL USING (true);
END $$;

-- chat_messages
DO $$ BEGIN
    PERFORM public.drop_all_policies('public', 'chat_messages');
    ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
    CREATE POLICY "Message access" ON public.chat_messages FOR ALL USING (EXISTS (SELECT 1 FROM public.chat_conversations cc WHERE cc.id = chat_messages.conversation_id AND (cc.parent_user_id = auth.uid() OR public.is_same_center(cc.center_id))));
    CREATE POLICY "Service role access" ON public.chat_messages FOR ALL USING (true);
END $$;

-- Cleanup utility
DROP FUNCTION IF EXISTS public.drop_all_policies(text, text);
