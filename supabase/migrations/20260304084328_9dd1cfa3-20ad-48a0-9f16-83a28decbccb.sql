ALTER TABLE public.center_feature_permissions
  ADD COLUMN IF NOT EXISTS calendar_events boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS class_routine boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS messaging boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS attendance_summary boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS student_report boolean DEFAULT true;