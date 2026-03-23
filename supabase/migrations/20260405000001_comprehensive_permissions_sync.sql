-- Comprehensive Feature Permissions Sync
-- Date: 2026-04-05

-- 1. Ensure all columns exist in center_feature_permissions
ALTER TABLE public.center_feature_permissions
  ADD COLUMN IF NOT EXISTS dashboard_access BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS class_routine BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS exams_results BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS published_results BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS teachers_attendance BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS hr_management BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS leave_management BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS student_id_cards BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS inventory_assets BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS transport_tracking BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS school_days BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS messaging BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS calendar_events BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS student_report BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS attendance_summary BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS teacher_reports BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS chapter_performance BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS about_institution BOOLEAN DEFAULT true;

-- 2. Ensure all columns exist in teacher_feature_permissions
ALTER TABLE public.teacher_feature_permissions
  ADD COLUMN IF NOT EXISTS dashboard_access BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS take_attendance BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS class_routine BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS lesson_plans BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS lesson_tracking BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS homework_management BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS test_management BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS exams_results BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS published_results BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS preschool_activities BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS discipline_issues BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS register_student BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS teacher_management BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS teachers_attendance BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS hr_management BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS leave_management BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS student_id_cards BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS inventory_assets BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS transport_tracking BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS school_days BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS settings_access BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS messaging BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS meetings_management BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS calendar_events BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS student_report BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS attendance_summary BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS summary BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS teacher_reports BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS chapter_performance BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS view_records BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS finance BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS about_institution BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS ai_insights BOOLEAN DEFAULT true;

-- Rename student_report_access to student_report if it exists to match center permissions
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='teacher_feature_permissions' AND column_name='student_report_access') THEN
    ALTER TABLE public.teacher_feature_permissions RENAME COLUMN student_report_access TO student_report;
  END IF;
EXCEPTION WHEN OTHERS THEN
  NULL;
END $$;

-- Also rename activities to preschool_activities for consistency
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='teacher_feature_permissions' AND column_name='activities') THEN
    ALTER TABLE public.teacher_feature_permissions RENAME COLUMN activities TO preschool_activities;
  END IF;
EXCEPTION WHEN OTHERS THEN
  NULL;
END $$;
