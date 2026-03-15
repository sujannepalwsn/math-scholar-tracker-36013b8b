-- 1. Create subjects table
CREATE TABLE IF NOT EXISTS public.subjects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    center_id UUID NOT NULL REFERENCES public.centers(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 2. Enable RLS
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;

-- 3. Create Policies
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'subjects' AND policyname = 'Users can view subjects of their center') THEN
        CREATE POLICY "Users can view subjects of their center" ON public.subjects
            FOR SELECT USING (is_same_center(center_id));
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'subjects' AND policyname = 'Admins can manage subjects') THEN
        CREATE POLICY "Admins can manage subjects" ON public.subjects
            FOR ALL USING (is_admin() OR (get_user_role(auth.uid()) = 'center' AND is_same_center(center_id)));
    END IF;
END $$;

-- 4. Add index for performance
CREATE INDEX IF NOT EXISTS idx_subjects_center_id ON public.subjects(center_id);
