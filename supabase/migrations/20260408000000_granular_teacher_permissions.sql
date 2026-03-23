-- Upgrade Teacher Feature Permissions to Granular System (Refined)
-- Date: 2026-04-08

-- 1. Add the granular permissions JSONB column if it doesn't exist
ALTER TABLE public.teacher_feature_permissions
  ADD COLUMN IF NOT EXISTS permissions JSONB DEFAULT '{}'::jsonb;

-- 2. Create metadata table for dynamic module capabilities
CREATE TABLE IF NOT EXISTS public.module_permissions_meta (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    module_key TEXT UNIQUE NOT NULL,
    has_approve BOOLEAN DEFAULT false,
    has_publish BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS for metadata table
ALTER TABLE public.module_permissions_meta ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow authenticated read access" ON public.module_permissions_meta FOR SELECT TO authenticated USING (true);

-- Seed metadata
INSERT INTO public.module_permissions_meta (module_key, has_approve, has_publish)
VALUES
    ('lesson_plans', true, false),
    ('leave_management', true, false),
    ('exams_results', false, true),
    ('published_results', false, true)
ON CONFLICT (module_key) DO UPDATE SET
    has_approve = EXCLUDED.has_approve,
    has_publish = EXCLUDED.has_publish;

-- 3. Migrate existing boolean permissions into the new JSONB structure
DO $$
DECLARE
    col_record RECORD;
    teacher_record RECORD;
    new_perms JSONB;
    col_name TEXT;
    col_val BOOLEAN;
BEGIN
    FOR teacher_record IN SELECT * FROM public.teacher_feature_permissions LOOP
        new_perms := '{}'::jsonb;

        FOR col_record IN
            SELECT column_name
            FROM information_schema.columns
            WHERE table_name = 'teacher_feature_permissions'
            AND table_schema = 'public'
            AND data_type = 'boolean'
        LOOP
            col_name := col_record.column_name;

            EXECUTE format('SELECT %I FROM public.teacher_feature_permissions WHERE id = $1', col_name)
            INTO col_val
            USING teacher_record.id;

            new_perms := jsonb_set(
                new_perms,
                ARRAY[col_name],
                jsonb_build_object(
                    'enabled', COALESCE(col_val, false),
                    'can_view', COALESCE(col_val, false),
                    'can_edit', COALESCE(col_val, false),
                    'can_approve', false,
                    'can_publish', false
                )
            );
        END LOOP;

        UPDATE public.teacher_feature_permissions
        SET permissions = new_perms
        WHERE id = teacher_record.id;
    END LOOP;
END $$;

-- 4. Update specific modules with approve/publish flags where applicable
UPDATE public.teacher_feature_permissions
SET permissions = jsonb_set(permissions, '{lesson_plans,can_approve}', 'true')
WHERE (permissions->'lesson_plans'->>'enabled')::boolean = true;

UPDATE public.teacher_feature_permissions
SET permissions = jsonb_set(permissions, '{leave_management,can_approve}', 'true')
WHERE (permissions->'leave_management'->>'enabled')::boolean = true;

UPDATE public.teacher_feature_permissions
SET permissions = jsonb_set(permissions, '{exams_results,can_publish}', 'true')
WHERE (permissions->'exams_results'->>'enabled')::boolean = true;

UPDATE public.teacher_feature_permissions
SET permissions = jsonb_set(permissions, '{published_results,can_publish}', 'true')
WHERE (permissions->'published_results'->>'enabled')::boolean = true;
