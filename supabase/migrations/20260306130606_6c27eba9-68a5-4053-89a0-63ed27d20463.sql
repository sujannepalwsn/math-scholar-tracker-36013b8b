
-- Create class_teacher_assignments table
CREATE TABLE IF NOT EXISTS public.class_teacher_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id uuid NOT NULL REFERENCES public.teachers(id) ON DELETE CASCADE,
  grade text NOT NULL,
  center_id uuid NOT NULL REFERENCES public.centers(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(grade, center_id)
);

-- Enable RLS
ALTER TABLE public.class_teacher_assignments ENABLE ROW LEVEL SECURITY;

-- RLS policy
CREATE POLICY "Service role full access" ON public.class_teacher_assignments FOR ALL USING (true) WITH CHECK (true);

-- Add attendance_locked column to track locked attendance
ALTER TABLE public.attendance ADD COLUMN IF NOT EXISTS is_locked boolean DEFAULT false;
