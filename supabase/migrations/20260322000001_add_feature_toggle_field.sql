-- Add about_institution to feature permission tables
ALTER TABLE public.center_feature_permissions
ADD COLUMN IF NOT EXISTS about_institution BOOLEAN DEFAULT TRUE;

ALTER TABLE public.teacher_feature_permissions
ADD COLUMN IF NOT EXISTS about_institution BOOLEAN DEFAULT TRUE;
