-- Migration: Add teacher_scope_mode and update RLS policies
-- Date: 2024-05-20 (Simulated)

-- 1. Add teacher_scope_mode to teacher_feature_permissions
ALTER TABLE public.teacher_feature_permissions
ADD COLUMN IF NOT EXISTS teacher_scope_mode TEXT DEFAULT 'full' CHECK (teacher_scope_mode IN ('full', 'restricted'));

-- 2. Create helper functions for Teacher Scope Mode
-- Function to get teacher scope mode
CREATE OR REPLACE FUNCTION public.get_teacher_scope_mode()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, auth
AS $$
  SELECT COALESCE(tfp.teacher_scope_mode, 'full')
  FROM public.teacher_feature_permissions tfp
  JOIN public.teachers t ON t.id = tfp.teacher_id
  WHERE t.user_id = auth.uid();
$$;

-- Function to get assigned grades for the current teacher
CREATE OR REPLACE FUNCTION public.get_teacher_assigned_grades()
RETURNS text[]
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  teacher_uuid uuid;
  grades text[];
BEGIN
  SELECT id INTO teacher_uuid FROM public.teachers WHERE user_id = auth.uid();

  IF teacher_uuid IS NULL THEN
    RETURN '{}'::text[];
  END IF;

  SELECT ARRAY_AGG(DISTINCT grade) INTO grades
  FROM (
    SELECT grade FROM public.class_teacher_assignments WHERE teacher_id = teacher_uuid
    UNION
    SELECT grade FROM public.period_schedules WHERE teacher_id = teacher_uuid
  ) combined_grades;

  RETURN COALESCE(grades, '{}'::text[]);
END;
$$;

-- 3. Update RLS policies for Academic modules

-- Let's do it properly for each table.

DO $$
DECLARE
    t_name text;
BEGIN
    -- List of academic tables to apply restrictions
    FOR t_name IN SELECT unnest(ARRAY[
        'attendance', 'homework', 'tests', 'discipline_issues', 'lesson_plans',
        'preschool_activities', 'period_schedules', 'exam_marks'
    ])
    LOOP
        -- 1. Rename/Modify existing broad center policy to exclude teachers if we are going to manage them separately
        -- Actually, it's safer to drop the broad policy and create role-specific ones.

        EXECUTE FORMAT('DROP POLICY IF EXISTS "Center and Admin access on %I" ON public.%I', t_name, t_name);
        EXECUTE FORMAT('DROP POLICY IF EXISTS "Teacher read access on %I" ON public.%I', t_name, t_name);
        EXECUTE FORMAT('DROP POLICY IF EXISTS "Teacher access on %I" ON public.%I', t_name, t_name);

        -- Admin and Center role still get full access
        EXECUTE FORMAT('CREATE POLICY "Admin and Center full access on %I" ON public.%I
            FOR ALL USING (
                public.get_user_role() IN (''admin'', ''center'')
                AND public.is_same_center(center_id)
            );', t_name, t_name);

        -- Teacher policy depends on scope mode
        CASE t_name
            WHEN 'attendance' THEN
                EXECUTE FORMAT('CREATE POLICY "Teacher access on %I" ON public.%I
                    FOR ALL USING (
                        public.get_user_role() = ''teacher''
                        AND public.is_same_center(center_id)
                        AND (
                            public.get_teacher_scope_mode() = ''full''
                            OR EXISTS (
                                SELECT 1 FROM public.students s
                                WHERE s.id = %I.student_id
                                AND s.grade = ANY(public.get_teacher_assigned_grades())
                            )
                        )
                    );', t_name, t_name, t_name);

            WHEN 'homework' THEN
                EXECUTE FORMAT('CREATE POLICY "Teacher access on %I" ON public.%I
                    FOR ALL USING (
                        public.get_user_role() = ''teacher''
                        AND public.is_same_center(center_id)
                        AND (
                            public.get_teacher_scope_mode() = ''full''
                            OR teacher_id = public.get_user_teacher_id()
                        )
                    );', t_name, t_name);

            WHEN 'tests' THEN
                EXECUTE FORMAT('CREATE POLICY "Teacher access on %I" ON public.%I
                    FOR ALL USING (
                        public.get_user_role() = ''teacher''
                        AND public.is_same_center(center_id)
                        AND (
                            public.get_teacher_scope_mode() = ''full''
                            OR created_by = auth.uid()
                        )
                    );', t_name, t_name);

            WHEN 'discipline_issues' THEN
                EXECUTE FORMAT('CREATE POLICY "Teacher access on %I" ON public.%I
                    FOR ALL USING (
                        public.get_user_role() = ''teacher''
                        AND public.is_same_center(center_id)
                        AND (
                            public.get_teacher_scope_mode() = ''full''
                            OR reported_by = auth.uid()
                            OR EXISTS (
                                SELECT 1 FROM public.students s
                                WHERE s.id = %I.student_id
                                AND s.grade = ANY(public.get_teacher_assigned_grades())
                            )
                        )
                    );', t_name, t_name, t_name);

            WHEN 'lesson_plans' THEN
                EXECUTE FORMAT('CREATE POLICY "Teacher access on %I" ON public.%I
                    FOR ALL USING (
                        public.get_user_role() = ''teacher''
                        AND public.is_same_center(center_id)
                        AND (
                            public.get_teacher_scope_mode() = ''full''
                            OR teacher_id = public.get_user_teacher_id()
                        )
                    );', t_name, t_name);

            WHEN 'preschool_activities' THEN
                EXECUTE FORMAT('CREATE POLICY "Teacher access on %I" ON public.%I
                    FOR ALL USING (
                        public.get_user_role() = ''teacher''
                        AND public.is_same_center(center_id)
                        AND (
                            public.get_teacher_scope_mode() = ''full''
                            OR teacher_id = public.get_user_teacher_id()
                        )
                    );', t_name, t_name);

            WHEN 'period_schedules' THEN
                EXECUTE FORMAT('CREATE POLICY "Teacher access on %I" ON public.%I
                    FOR ALL USING (
                        public.get_user_role() = ''teacher''
                        AND public.is_same_center(center_id)
                        AND (
                            public.get_teacher_scope_mode() = ''full''
                            OR teacher_id = public.get_user_teacher_id()
                        )
                    );', t_name, t_name);

            WHEN 'exam_marks' THEN
                EXECUTE FORMAT('CREATE POLICY "Teacher access on %I" ON public.%I
                    FOR ALL USING (
                        public.get_user_role() = ''teacher''
                        AND public.is_same_center(center_id)
                        AND (
                            public.get_teacher_scope_mode() = ''full''
                            OR entered_by = auth.uid()
                        )
                    );', t_name, t_name);
        END CASE;
    END LOOP;
END $$;

-- 4. Handle exams table separately (applicable_grades array)
DO $$ BEGIN
    DROP POLICY IF EXISTS "Center and Admin access on exams" ON public.exams;
    DROP POLICY IF EXISTS "Teacher read access on exams" ON public.exams;
    DROP POLICY IF EXISTS "Center users can manage exams" ON public.exams;
    DROP POLICY IF EXISTS "Teacher access on exams" ON public.exams;

    CREATE POLICY "Admin and Center full access on exams" ON public.exams
    FOR ALL USING (public.get_user_role() IN ('admin', 'center') AND public.is_same_center(center_id));

    CREATE POLICY "Teacher access on exams" ON public.exams
    FOR ALL USING (
        public.get_user_role() = 'teacher'
        AND public.is_same_center(center_id)
        AND (
            public.get_teacher_scope_mode() = 'full'
            OR created_by = auth.uid()
            OR grade = ANY(public.get_teacher_assigned_grades())
            OR applicable_grades && public.get_teacher_assigned_grades()
        )
    );
END $$;

-- 5. Student Chapters (Lesson Tracking) - Indirect student_id
DO $$ BEGIN
    DROP POLICY IF EXISTS "Center and Admin access on student_chapters" ON public.student_chapters;
    DROP POLICY IF EXISTS "Teacher read access on student_chapters" ON public.student_chapters;
    DROP POLICY IF EXISTS "Teacher access on student_chapters" ON public.student_chapters;

    CREATE POLICY "Admin and Center full access on student_chapters" ON public.student_chapters
    FOR ALL USING (EXISTS (SELECT 1 FROM public.students s WHERE s.id = student_chapters.student_id AND public.is_same_center(s.center_id)) AND public.get_user_role() IN ('admin', 'center'));

    CREATE POLICY "Teacher access on student_chapters" ON public.student_chapters
    FOR ALL USING (
        public.get_user_role() = 'teacher'
        AND (
            public.get_teacher_scope_mode() = 'full'
            OR recorded_by_teacher_id = public.get_user_teacher_id()
            OR EXISTS (
                SELECT 1 FROM public.students s
                WHERE s.id = student_chapters.student_id
                AND s.grade = ANY(public.get_teacher_assigned_grades())
            )
        )
    );
END $$;
