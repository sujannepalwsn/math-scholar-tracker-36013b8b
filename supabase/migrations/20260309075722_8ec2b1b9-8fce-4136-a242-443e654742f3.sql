
-- Exams table for result management
CREATE TABLE public.exams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  center_id uuid NOT NULL REFERENCES public.centers(id) ON DELETE CASCADE,
  name text NOT NULL,
  grade text NOT NULL,
  academic_year text NOT NULL DEFAULT '2025/2026',
  exam_date date,
  status text NOT NULL DEFAULT 'draft',
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Exam subjects configuration
CREATE TABLE public.exam_subjects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  center_id uuid NOT NULL REFERENCES public.centers(id) ON DELETE CASCADE,
  exam_id uuid NOT NULL REFERENCES public.exams(id) ON DELETE CASCADE,
  subject_name text NOT NULL,
  full_marks numeric NOT NULL DEFAULT 100,
  pass_marks numeric NOT NULL DEFAULT 40,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Exam marks entry
CREATE TABLE public.exam_marks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  center_id uuid NOT NULL REFERENCES public.centers(id) ON DELETE CASCADE,
  exam_id uuid NOT NULL REFERENCES public.exams(id) ON DELETE CASCADE,
  exam_subject_id uuid NOT NULL REFERENCES public.exam_subjects(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  marks_obtained numeric,
  remarks text,
  entered_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(exam_id, exam_subject_id, student_id)
);

-- Add extra fields to students table for ID card
ALTER TABLE public.students 
  ADD COLUMN IF NOT EXISTS gender text,
  ADD COLUMN IF NOT EXISTS blood_group text,
  ADD COLUMN IF NOT EXISTS admission_date date DEFAULT CURRENT_DATE,
  ADD COLUMN IF NOT EXISTS student_id_number text,
  ADD COLUMN IF NOT EXISTS photo_url text;

-- Enable RLS on new tables
ALTER TABLE public.exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_marks ENABLE ROW LEVEL SECURITY;

-- RLS policies for exams
CREATE POLICY "Center users can manage exams" ON public.exams
  FOR ALL USING (is_same_center(center_id)) WITH CHECK (is_same_center(center_id));

CREATE POLICY "Service role full access on exams" ON public.exams
  FOR ALL USING (true) WITH CHECK (true);

-- RLS policies for exam_subjects
CREATE POLICY "Center users can manage exam subjects" ON public.exam_subjects
  FOR ALL USING (is_same_center(center_id)) WITH CHECK (is_same_center(center_id));

CREATE POLICY "Service role full access on exam_subjects" ON public.exam_subjects
  FOR ALL USING (true) WITH CHECK (true);

-- RLS policies for exam_marks
CREATE POLICY "Center users can manage exam marks" ON public.exam_marks
  FOR ALL USING (is_same_center(center_id)) WITH CHECK (is_same_center(center_id));

CREATE POLICY "Service role full access on exam_marks" ON public.exam_marks
  FOR ALL USING (true) WITH CHECK (true);

-- Indexes for performance
CREATE INDEX idx_exams_center_id ON public.exams(center_id);
CREATE INDEX idx_exams_grade ON public.exams(grade);
CREATE INDEX idx_exam_subjects_exam_id ON public.exam_subjects(exam_id);
CREATE INDEX idx_exam_marks_exam_id ON public.exam_marks(exam_id);
CREATE INDEX idx_exam_marks_student_id ON public.exam_marks(student_id);
CREATE INDEX idx_students_student_id_number ON public.students(student_id_number);
