-- 1. Create school_days table
CREATE TABLE IF NOT EXISTS public.school_days (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    center_id UUID NOT NULL REFERENCES public.centers(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    is_school_day BOOLEAN DEFAULT true,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(center_id, date)
);

-- Enable RLS
ALTER TABLE public.school_days ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Center isolation for school_days" ON public.school_days
FOR ALL USING (is_same_center(center_id));

-- 2. Add missed_chapters_view for reporting
-- This view identifies lesson plans for which a student does not have a completion record
-- but was either absent or arrived late on that day.
CREATE OR REPLACE VIEW public.student_missed_chapters AS
SELECT
    lp.id as lesson_plan_id,
    lp.center_id,
    lp.subject,
    lp.chapter,
    lp.topic,
    lp.grade,
    lp.lesson_date,
    s.id as student_id,
    s.name as student_name,
    a.status as attendance_status,
    a.time_in as arrival_time
FROM
    public.lesson_plans lp
CROSS JOIN
    public.students s
LEFT JOIN
    public.student_chapters sc ON sc.lesson_plan_id = lp.id AND sc.student_id = s.id
LEFT JOIN
    public.attendance a ON a.date = lp.lesson_date AND a.student_id = s.id
WHERE
    lp.grade = s.grade
    AND lp.status = 'approved'
    AND sc.id IS NULL -- Lesson not marked as completed for this student
    AND (
        a.id IS NULL -- No attendance record (assumed absent)
        OR a.status = 'absent' -- Explicitly absent
        OR (
            a.status = 'present'
            AND a.time_in IS NOT NULL
            AND EXISTS (
                -- Check if student arrived after the period ended
                SELECT 1 FROM public.period_schedules ps
                JOIN public.class_periods cp ON cp.id = ps.class_period_id
                WHERE ps.grade = lp.grade
                AND ps.subject = lp.subject
                AND ps.day_of_week = EXTRACT(DOW FROM lp.lesson_date)
                AND a.time_in > cp.end_time
            )
        )
    );

-- 3. Update Notifications table to handle unread counts better if needed
-- (Schema already supports is_read)

-- 4. Function to automatically mark absent on school days if attendance is not taken
-- This can be a cron or triggered function. For now, we'll rely on the frontend
-- logic to check school_days.
