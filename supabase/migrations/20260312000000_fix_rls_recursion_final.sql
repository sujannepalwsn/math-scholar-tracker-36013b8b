-- Fix RLS recursion and ensure consistent helper functions across the database

-- 1. Ensure all helper functions are defined correctly as SECURITY DEFINER
-- This prevents RLS recursion when these functions query the users table

CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.users WHERE id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.get_user_center_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT center_id FROM public.users WHERE id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.get_user_student_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT student_id FROM public.users WHERE id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.get_user_teacher_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT teacher_id FROM public.users WHERE id = auth.uid();
$$;

-- Versions with argument for specific user lookups
CREATE OR REPLACE FUNCTION public.get_user_role(user_id uuid)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.users WHERE id = user_id;
$$;

CREATE OR REPLACE FUNCTION public.get_user_center_id(user_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT center_id FROM public.users WHERE id = user_id;
$$;

-- Robust is_same_center check that also handles admins
CREATE OR REPLACE FUNCTION public.is_same_center(target_center_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    COALESCE(target_center_id = public.get_user_center_id(), false)
    OR public.get_user_role() = 'admin';
$$;

-- 2. Clean up and recreate users table policies to be non-recursive
DO $$
BEGIN
    -- Drop all potentially recursive policies on users table
    DROP POLICY IF EXISTS "Admins can view all users" ON public.users;
    DROP POLICY IF EXISTS "Admins can modify all users" ON public.users;
    DROP POLICY IF EXISTS "Users can view and modify their own record" ON public.users;
    DROP POLICY IF EXISTS "Center users can view associated users" ON public.users;
    DROP POLICY IF EXISTS "Center users can view other users in their center" ON public.users;
    DROP POLICY IF EXISTS "Teacher users can view associated users" ON public.users;
    DROP POLICY IF EXISTS "Parent users can view associated users" ON public.users;
    DROP POLICY IF EXISTS "Users can view users in their center" ON public.users;
END $$;

-- New non-recursive policies for users table
CREATE POLICY "Allow users to view their own record"
ON public.users FOR SELECT USING (id = auth.uid());

CREATE POLICY "Allow users to update their own record"
ON public.users FOR UPDATE USING (id = auth.uid());

CREATE POLICY "Allow admins to manage all users"
ON public.users FOR ALL USING (public.get_user_role() = 'admin');

CREATE POLICY "Allow center users to view their center's users"
ON public.users FOR SELECT USING (
  public.get_user_role() = 'center' AND center_id = public.get_user_center_id()
);

CREATE POLICY "Allow teachers to view their center's users"
ON public.users FOR SELECT USING (
  public.get_user_role() = 'teacher' AND center_id = public.get_user_center_id()
);

-- 3. Fix centers table policies (essential for frontend to fetch name/logo)
DO $$
BEGIN
    DROP POLICY IF EXISTS "Service role full access" ON public.centers;
    DROP POLICY IF EXISTS "Service role full access on centers" ON public.centers;
    DROP POLICY IF EXISTS "Users can view their own center" ON public.centers;
    DROP POLICY IF EXISTS "Allow authenticated users to view their center" ON public.centers;
    DROP POLICY IF EXISTS "Authenticated users can view centers" ON public.centers;
END $$;

CREATE POLICY "Service role full access on centers"
ON public.centers FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow authenticated users to view centers"
ON public.centers FOR SELECT
USING (auth.role() = 'authenticated');

-- 4. Standardize critical tables with is_same_center
DO $$
DECLARE
    t_name text;
BEGIN
    FOR t_name IN SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name IN (
        'students', 'teachers', 'attendance', 'teacher_attendance', 'homework', 'student_homework_records',
        'tests', 'test_results', 'discipline_issues', 'lesson_plans', 'student_chapters', 'activities',
        'center_events', 'invoices', 'payments', 'expenses', 'fee_structures', 'fee_headings',
        'meetings', 'period_schedules', 'class_periods',
        'exams', 'exam_subjects', 'exam_marks', 'leave_applications', 'leave_categories',
        'center_feature_permissions', 'teacher_feature_permissions', 'broadcast_messages',
        'class_substitutions'
    )
    LOOP
        -- Check if table has center_id column before applying policy
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = t_name AND column_name = 'center_id') THEN
            -- Drop various policy name variants
            EXECUTE FORMAT('DROP POLICY IF EXISTS "Centers can view their own %I" ON public.%I;', t_name, t_name);
            EXECUTE FORMAT('DROP POLICY IF EXISTS "Center users can view their students'' %I" ON public.%I;', t_name, t_name);
            EXECUTE FORMAT('DROP POLICY IF EXISTS "Center users can manage their own data on %I" ON public.%I;', t_name, t_name);
            EXECUTE FORMAT('DROP POLICY IF EXISTS "Teacher users can manage their own data on %I" ON public.%I;', t_name, t_name);
            EXECUTE FORMAT('DROP POLICY IF EXISTS "Admins can manage all data on %I" ON public.%I;', t_name, t_name);
            EXECUTE FORMAT('DROP POLICY IF EXISTS "Center users can manage their own students" ON public.students;');
            EXECUTE FORMAT('DROP POLICY IF EXISTS "Center users can manage their own %I" ON public.%I;', t_name, t_name);

            -- Create standard policies using is_same_center
            EXECUTE FORMAT('DROP POLICY IF EXISTS "Center users can manage %I" ON public.%I;', t_name, t_name);
            EXECUTE FORMAT('CREATE POLICY "Center users can manage %I" ON public.%I FOR ALL USING (public.is_same_center(center_id));', t_name, t_name);

            EXECUTE FORMAT('DROP POLICY IF EXISTS "Teacher users can view %I" ON public.%I;', t_name, t_name);
            EXECUTE FORMAT('CREATE POLICY "Teacher users can view %I" ON public.%I FOR SELECT USING (public.is_same_center(center_id));', t_name, t_name);

            -- Add Service Role policy
            EXECUTE FORMAT('DROP POLICY IF EXISTS "Service role full access on %I" ON public.%I;', t_name, t_name);
            EXECUTE FORMAT('CREATE POLICY "Service role full access on %I" ON public.%I FOR ALL USING (true) WITH CHECK (true);', t_name, t_name);
        END IF;
    END LOOP;
END $$;

-- 5. Special case: parent_students table
DO $$
BEGIN
    DROP POLICY IF EXISTS "Center users can manage parent-student links in their center" ON public.parent_students;
    DROP POLICY IF EXISTS "Center users can manage parent-student links" ON public.parent_students;
    DROP POLICY IF EXISTS "Parent users can view their own linked students" ON public.parent_students;
    DROP POLICY IF EXISTS "Admins can manage all data on parent_students" ON public.parent_students;
END $$;

CREATE POLICY "Center users can manage parent-student links"
ON public.parent_students FOR ALL
USING (
  public.get_user_role() = 'center'
  AND EXISTS (
    SELECT 1 FROM public.students s
    WHERE s.id = parent_students.student_id
    AND s.center_id = public.get_user_center_id()
  )
);

CREATE POLICY "Parent users can view their linked students"
ON public.parent_students FOR SELECT
USING (parent_user_id = auth.uid());

CREATE POLICY "Admins can manage parent-student links"
ON public.parent_students FOR ALL
USING (public.get_user_role() = 'admin');

-- 6. Standardize notifications policies
DO $$
BEGIN
    DROP POLICY IF EXISTS "Users can view their own notifications" ON public.notifications;
    DROP POLICY IF EXISTS "Users can update their own notifications" ON public.notifications;
    DROP POLICY IF EXISTS "Service role full access on notifications" ON public.notifications;
    DROP POLICY IF EXISTS "Allow any user to insert notifications" ON public.notifications;
END $$;

CREATE POLICY "Service role full access on notifications"
  ON public.notifications FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow any user to insert notifications"
  ON public.notifications FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can view their own notifications"
  ON public.notifications FOR SELECT
  USING (
    (user_id IS NULL AND public.is_same_center(center_id))
    OR user_id = auth.uid()
  );

CREATE POLICY "Users can update their own notifications"
  ON public.notifications FOR UPDATE
  USING (
    user_id = auth.uid()
    OR (user_id IS NULL AND public.is_same_center(center_id))
  );

-- 7. Fix Chat policies
DO $$
BEGIN
    DROP POLICY IF EXISTS "Center users can manage conversations" ON public.chat_conversations;
    DROP POLICY IF EXISTS "Parents can access their conversations" ON public.chat_conversations;
    DROP POLICY IF EXISTS "Teachers can view center conversations" ON public.chat_conversations;
    DROP POLICY IF EXISTS "Users can view messages in their conversations" ON public.chat_messages;
    DROP POLICY IF EXISTS "Users can insert messages in their conversations" ON public.chat_messages;
    DROP POLICY IF EXISTS "Users can update messages in their conversations" ON public.chat_messages;
END $$;

CREATE POLICY "Center users can manage conversations"
ON public.chat_conversations FOR ALL
USING (
  public.get_user_role() = 'center' AND public.is_same_center(center_id)
)
WITH CHECK (
  public.get_user_role() = 'center' AND public.is_same_center(center_id)
);

CREATE POLICY "Parents can access their conversations"
ON public.chat_conversations FOR ALL
USING (parent_user_id = auth.uid())
WITH CHECK (parent_user_id = auth.uid());

CREATE POLICY "Teachers can view center conversations"
ON public.chat_conversations FOR SELECT
USING (
  public.get_user_role() = 'teacher' AND public.is_same_center(center_id)
);

CREATE POLICY "Users can view messages in their conversations"
ON public.chat_messages FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.chat_conversations cc
    WHERE cc.id = chat_messages.conversation_id
    AND (
      cc.parent_user_id = auth.uid()
      OR public.is_same_center(cc.center_id)
    )
  )
);

CREATE POLICY "Users can insert messages in their conversations"
ON public.chat_messages FOR INSERT
WITH CHECK (
  sender_user_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM public.chat_conversations cc
    WHERE cc.id = chat_messages.conversation_id
    AND (
      cc.parent_user_id = auth.uid()
      OR public.is_same_center(cc.center_id)
    )
  )
);

CREATE POLICY "Users can update messages in their conversations"
ON public.chat_messages FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.chat_conversations cc
    WHERE cc.id = chat_messages.conversation_id
    AND (
      cc.parent_user_id = auth.uid()
      OR public.is_same_center(cc.center_id)
    )
  )
);
