-- ERP Schema Final Alignment: Naming consistency
-- Date: 2026-03-18

-- 1. Center Permissions Alignment
DO $$ BEGIN ALTER TABLE public.center_feature_permissions RENAME COLUMN communications_access TO messaging; EXCEPTION WHEN OTHERS THEN NULL; END $$;
ALTER TABLE public.center_feature_permissions ADD COLUMN IF NOT EXISTS student_report boolean DEFAULT true;

-- 2. Teacher Permissions Alignment
DO $$ BEGIN ALTER TABLE public.teacher_feature_permissions RENAME COLUMN communications_access TO messaging; EXCEPTION WHEN OTHERS THEN NULL; END $$;
ALTER TABLE public.teacher_feature_permissions ADD COLUMN IF NOT EXISTS student_report boolean DEFAULT true;

-- 3. Standardize Remaining Columns (Exhaustive Sync)
-- Center
ALTER TABLE public.center_feature_permissions ADD COLUMN IF NOT EXISTS messaging boolean DEFAULT true;
ALTER TABLE public.center_feature_permissions ADD COLUMN IF NOT EXISTS meetings_management boolean DEFAULT true;
ALTER TABLE public.center_feature_permissions ADD COLUMN IF NOT EXISTS calendar_events boolean DEFAULT true;
ALTER TABLE public.center_feature_permissions ADD COLUMN IF NOT EXISTS teacher_reports boolean DEFAULT true;
ALTER TABLE public.center_feature_permissions ADD COLUMN IF NOT EXISTS chapter_performance boolean DEFAULT true;
ALTER TABLE public.center_feature_permissions ADD COLUMN IF NOT EXISTS finance boolean DEFAULT true;

-- Teacher
ALTER TABLE public.teacher_feature_permissions ADD COLUMN IF NOT EXISTS messaging boolean DEFAULT true;
ALTER TABLE public.teacher_feature_permissions ADD COLUMN IF NOT EXISTS meetings_management boolean DEFAULT true;
ALTER TABLE public.teacher_feature_permissions ADD COLUMN IF NOT EXISTS calendar_events boolean DEFAULT true;
ALTER TABLE public.teacher_feature_permissions ADD COLUMN IF NOT EXISTS teacher_reports boolean DEFAULT true;
ALTER TABLE public.teacher_feature_permissions ADD COLUMN IF NOT EXISTS chapter_performance boolean DEFAULT true;
ALTER TABLE public.teacher_feature_permissions ADD COLUMN IF NOT EXISTS finance boolean DEFAULT true;
