-- Migration: 20260527000200_expand_teacher_grade_access.sql
-- Description: Expand the `is_grade_assigned` function to check both official class assignments
-- AND scheduled periods. This ensures teachers can see all students they interact with.

CREATE OR REPLACE FUNCTION public.is_grade_assigned(target_grade TEXT)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    -- 1. Check official class teacher assignments
    SELECT 1
    FROM public.class_teacher_assignments
    WHERE teacher_id = (SELECT teacher_id FROM public.users WHERE id = auth.uid())
    AND grade = target_grade

    UNION

    -- 2. Check period schedules (any grade they teach a subject in)
    SELECT 1
    FROM public.period_schedules
    WHERE teacher_id = (SELECT teacher_id FROM public.users WHERE id = auth.uid())
    AND grade = target_grade
  );
$$ LANGUAGE sql SECURITY DEFINER;
