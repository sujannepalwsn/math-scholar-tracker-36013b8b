-- Migration: Set teacher_scope_mode default to 'restricted'
-- Date: 2026-04-09

-- 1. Update the column default
ALTER TABLE public.teacher_feature_permissions
ALTER COLUMN teacher_scope_mode SET DEFAULT 'restricted';

-- 2. Update existing records that have NULL to the new default
UPDATE public.teacher_feature_permissions
SET teacher_scope_mode = 'restricted'
WHERE teacher_scope_mode IS NULL;
