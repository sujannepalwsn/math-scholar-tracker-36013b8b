-- Refine RLS policies for leave_categories and notifications
-- Migration: 20260315000000_refine_rls_policies.sql

DO $$
BEGIN
    -- 1. Refine leave_categories: Allow reading global categories (center_id IS NULL)
    DROP POLICY IF EXISTS "Center and Admin access on leave_categories" ON public.leave_categories;
    DROP POLICY IF EXISTS "Teacher read access on leave_categories" ON public.leave_categories;

    CREATE POLICY "Allow users to view their center or global leave categories"
    ON public.leave_categories FOR SELECT
    USING (
      center_id IS NULL
      OR is_same_center(center_id)
    );

    CREATE POLICY "Center admins can manage their center categories"
    ON public.leave_categories FOR ALL
    USING (get_user_role() = 'center' AND is_same_center(center_id))
    WITH CHECK (get_user_role() = 'center' AND is_same_center(center_id));

    CREATE POLICY "Admins can manage all leave categories"
    ON public.leave_categories FOR ALL
    USING (get_user_role() = 'admin');

    -- 2. Refine notifications: Ensure user-level isolation
    DROP POLICY IF EXISTS "Center and Admin access on notifications" ON public.notifications;
    DROP POLICY IF EXISTS "Teacher read access on notifications" ON public.notifications;
    DROP POLICY IF EXISTS "Allow any user to insert notifications" ON public.notifications;

    -- SELECT policy for notifications
    CREATE POLICY "Users can view their own notifications or center broadcasts"
    ON public.notifications FOR SELECT
    USING (
      (user_id = auth.uid()) -- Personal notification
      OR (user_id IS NULL AND is_same_center(center_id) AND get_user_role() = 'center') -- Center broadcast
      OR (get_user_role() = 'admin') -- Super Admin access
    );

    -- INSERT policy for notifications (allow authenticated users to send notifications)
    CREATE POLICY "Authenticated users can insert notifications"
    ON public.notifications FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');

    -- UPDATE policy (to mark as read)
    CREATE POLICY "Users can update their own notifications"
    ON public.notifications FOR UPDATE
    USING (user_id = auth.uid() OR (user_id IS NULL AND is_same_center(center_id) AND get_user_role() = 'center'))
    WITH CHECK (user_id = auth.uid() OR (user_id IS NULL AND is_same_center(center_id) AND get_user_role() = 'center'));

    -- DELETE policy
    CREATE POLICY "Users can delete their own notifications"
    ON public.notifications FOR DELETE
    USING (user_id = auth.uid() OR (user_id IS NULL AND is_same_center(center_id) AND get_user_role() = 'center') OR get_user_role() = 'admin');

    -- 3. Refine teacher_attendance: Teachers can only manage their own records
    DROP POLICY IF EXISTS "Center and Admin access on teacher_attendance" ON public.teacher_attendance;
    DROP POLICY IF EXISTS "Teacher read access on teacher_attendance" ON public.teacher_attendance;

    CREATE POLICY "Center admins and admins can manage all teacher attendance"
    ON public.teacher_attendance FOR ALL
    USING (get_user_role() IN ('center', 'admin') AND is_same_center(center_id));

    CREATE POLICY "Teachers can manage their own attendance"
    ON public.teacher_attendance FOR ALL
    USING (
      get_user_role() = 'teacher'
      AND teacher_id = get_user_teacher_id()
    )
    WITH CHECK (
      get_user_role() = 'teacher'
      AND teacher_id = get_user_teacher_id()
    );

    -- 4. Refine lesson_plans: Teachers see their own or ones they substitute for
    DROP POLICY IF EXISTS "Teacher read access on lesson_plans" ON public.lesson_plans;
    CREATE POLICY "Teachers can view relevant lesson plans"
    ON public.lesson_plans FOR SELECT
    USING (
      is_same_center(center_id) AND (
        get_user_role() = 'center'
        OR (get_user_role() = 'teacher' AND (
             teacher_id = get_user_teacher_id()
             OR EXISTS (
               SELECT 1 FROM public.class_substitutions cs
               WHERE cs.period_schedule_id IN (
                 SELECT ps.id FROM public.period_schedules ps
                 WHERE ps.subject = lesson_plans.subject
                 AND ps.grade = lesson_plans.grade
               )
               AND cs.substitute_teacher_id = get_user_teacher_id()
               AND cs.date = CURRENT_DATE
             )
           ))
      )
    );

END $$;
