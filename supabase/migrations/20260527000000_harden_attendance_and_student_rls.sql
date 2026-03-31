-- Migration: 20260527000000_harden_attendance_and_student_rls.sql
-- Description: Move teacher scope enforcement from frontend to RLS.
-- This ensures that teachers can ONLY access data for their assigned grades
-- even if they manually modify API requests.

-- Helper function to check if a user is a teacher and get their teacher_id
CREATE OR REPLACE FUNCTION public.get_auth_teacher_id()
RETURNS UUID AS $$
  SELECT teacher_id FROM public.users WHERE id = auth.uid() AND role = 'teacher';
$$ LANGUAGE sql SECURITY DEFINER;

-- Helper function to check if a teacher is in 'restricted' mode
CREATE OR REPLACE FUNCTION public.is_teacher_restricted()
RETURNS BOOLEAN AS $$
  SELECT COALESCE((
    SELECT teacher_scope_mode = 'restricted'
    FROM public.teacher_feature_permissions
    WHERE teacher_id = (SELECT teacher_id FROM public.users WHERE id = auth.uid())
  ), true); -- Default to true (fail-closed)
$$ LANGUAGE sql SECURITY DEFINER;

-- Helper function to check if a grade is assigned to a teacher
CREATE OR REPLACE FUNCTION public.is_grade_assigned(target_grade TEXT)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.class_teacher_assignments
    WHERE teacher_id = (SELECT teacher_id FROM public.users WHERE id = auth.uid())
    AND grade = target_grade
  );
$$ LANGUAGE sql SECURITY DEFINER;

-- 1. HARDEN ATTENDANCE RLS
DROP POLICY IF EXISTS "Center users can view their students' attendance" ON public.attendance;
CREATE POLICY "Attendance view policy"
ON public.attendance FOR SELECT TO authenticated
USING (
  -- Center admins see everything in their center
  (SELECT role FROM public.users WHERE id = auth.uid()) IN ('admin', 'center') AND (SELECT center_id FROM public.users WHERE id = auth.uid()) = attendance.center_id
  OR
  -- Teachers see their center's data, with grade restrictions if 'restricted'
  (SELECT role FROM public.users WHERE id = auth.uid()) = 'teacher' AND (SELECT center_id FROM public.users WHERE id = auth.uid()) = attendance.center_id
  AND (
    NOT public.is_teacher_restricted()
    OR
    public.is_grade_assigned((SELECT grade FROM public.students WHERE id = attendance.student_id))
  )
  OR
  -- Parents see only their own student's attendance
  (SELECT role FROM public.users WHERE id = auth.uid()) = 'parent' AND attendance.student_id = (SELECT student_id FROM public.users WHERE id = auth.uid())
);

DROP POLICY IF EXISTS "Center users can insert attendance for their students" ON public.attendance;
CREATE POLICY "Attendance insert policy"
ON public.attendance FOR INSERT TO authenticated
WITH CHECK (
  (SELECT role FROM public.users WHERE id = auth.uid()) IN ('admin', 'center') AND (SELECT center_id FROM public.users WHERE id = auth.uid()) = attendance.center_id
  OR
  (SELECT role FROM public.users WHERE id = auth.uid()) = 'teacher' AND (SELECT center_id FROM public.users WHERE id = auth.uid()) = attendance.center_id
  AND (
    NOT public.is_teacher_restricted()
    OR
    public.is_grade_assigned((SELECT grade FROM public.students WHERE id = attendance.student_id))
  )
);

DROP POLICY IF EXISTS "Center users can update attendance for their students" ON public.attendance;
CREATE POLICY "Attendance update policy"
ON public.attendance FOR UPDATE TO authenticated
USING (
  (SELECT role FROM public.users WHERE id = auth.uid()) IN ('admin', 'center') AND (SELECT center_id FROM public.users WHERE id = auth.uid()) = attendance.center_id
  OR
  (SELECT role FROM public.users WHERE id = auth.uid()) = 'teacher' AND (SELECT center_id FROM public.users WHERE id = auth.uid()) = attendance.center_id
  AND (
    NOT public.is_teacher_restricted()
    OR
    public.is_grade_assigned((SELECT grade FROM public.students WHERE id = attendance.student_id))
  )
)
WITH CHECK (
  (SELECT role FROM public.users WHERE id = auth.uid()) IN ('admin', 'center') AND (SELECT center_id FROM public.users WHERE id = auth.uid()) = attendance.center_id
  OR
  (SELECT role FROM public.users WHERE id = auth.uid()) = 'teacher' AND (SELECT center_id FROM public.users WHERE id = auth.uid()) = attendance.center_id
  AND (
    NOT public.is_teacher_restricted()
    OR
    public.is_grade_assigned((SELECT grade FROM public.students WHERE id = attendance.student_id))
  )
);

DROP POLICY IF EXISTS "Center users can delete attendance for their students" ON public.attendance;
CREATE POLICY "Attendance delete policy"
ON public.attendance FOR DELETE TO authenticated
USING (
  (SELECT role FROM public.users WHERE id = auth.uid()) IN ('admin', 'center') AND (SELECT center_id FROM public.users WHERE id = auth.uid()) = attendance.center_id
  OR
  (SELECT role FROM public.users WHERE id = auth.uid()) = 'teacher' AND (SELECT center_id FROM public.users WHERE id = auth.uid()) = attendance.center_id
  AND (
    NOT public.is_teacher_restricted()
    OR
    public.is_grade_assigned((SELECT grade FROM public.students WHERE id = attendance.student_id))
  )
);


-- 2. HARDEN STUDENTS RLS
DROP POLICY IF EXISTS "Center users can view their students" ON public.students;
CREATE POLICY "Student view policy"
ON public.students FOR SELECT TO authenticated
USING (
  (SELECT role FROM public.users WHERE id = auth.uid()) IN ('admin', 'center') AND (SELECT center_id FROM public.users WHERE id = auth.uid()) = students.center_id
  OR
  (SELECT role FROM public.users WHERE id = auth.uid()) = 'teacher' AND (SELECT center_id FROM public.users WHERE id = auth.uid()) = students.center_id
  AND (
    NOT public.is_teacher_restricted()
    OR
    public.is_grade_assigned(students.grade)
  )
  OR
  (SELECT role FROM public.users WHERE id = auth.uid()) = 'parent' AND students.id = (SELECT student_id FROM public.users WHERE id = auth.uid())
);

-- Students should only be managed by admins/center
DROP POLICY IF EXISTS "Center users can manage their students" ON public.students;
CREATE POLICY "Student management policy"
ON public.students FOR ALL TO authenticated
USING (
  (SELECT role FROM public.users WHERE id = auth.uid()) IN ('admin', 'center') AND (SELECT center_id FROM public.users WHERE id = auth.uid()) = students.center_id
);


-- 3. HARDEN LEAVE APPLICATIONS RLS
DROP POLICY IF EXISTS "Center users can view leave applications" ON public.leave_applications;
CREATE POLICY "Leave applications view policy"
ON public.leave_applications FOR SELECT TO authenticated
USING (
  (SELECT role FROM public.users WHERE id = auth.uid()) IN ('admin', 'center') AND (SELECT center_id FROM public.users WHERE id = auth.uid()) = leave_applications.center_id
  OR
  (SELECT role FROM public.users WHERE id = auth.uid()) = 'teacher' AND (SELECT center_id FROM public.users WHERE id = auth.uid()) = leave_applications.center_id
  AND (
    NOT public.is_teacher_restricted()
    OR
    public.is_grade_assigned((SELECT grade FROM public.students WHERE id = leave_applications.student_id))
  )
);
