-- ERP Schema Update: Permissions and Inventory Tracking
-- Date: 2026-03-18

-- 1. Expand center_feature_permissions
ALTER TABLE public.center_feature_permissions
ADD COLUMN IF NOT EXISTS dashboard_access boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS academics_access boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS exams_results boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS published_results boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS students_registration boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS teachers_registration boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS teachers_attendance boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS hr_management boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS leave_management boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS student_id_cards boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS inventory_assets boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS transport_tracking boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS school_days boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS settings_access boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS communications_access boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS teacher_reports boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS chapter_performance boolean DEFAULT true;

-- 2. Expand teacher_feature_permissions to mirror relevant center permissions
ALTER TABLE public.teacher_feature_permissions
ADD COLUMN IF NOT EXISTS dashboard_access boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS academics_access boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS exams_results boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS published_results boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS students_registration boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS teachers_registration boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS teachers_attendance boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS hr_management boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS leave_management boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS student_id_cards boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS inventory_assets boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS transport_tracking boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS school_days boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS settings_access boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS communications_access boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS teacher_reports boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS chapter_performance boolean DEFAULT true;

-- 3. Consumable Logs for distribution tracking
CREATE TABLE IF NOT EXISTS public.consumable_logs (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    center_id uuid REFERENCES public.centers(id) ON DELETE CASCADE,
    consumable_id uuid REFERENCES public.consumables(id) ON DELETE CASCADE,
    student_id uuid REFERENCES public.students(id) ON DELETE SET NULL,
    teacher_id uuid REFERENCES public.teachers(id) ON DELETE SET NULL,
    quantity numeric NOT NULL,
    action_type text DEFAULT 'distributed', -- 'consumed', 'distributed', 'disposed'
    notes text,
    created_at timestamptz DEFAULT now()
);

-- Enable RLS for consumable_logs
ALTER TABLE public.consumable_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Center Admin access logs" ON public.consumable_logs;
CREATE POLICY "Center Admin access logs" ON public.consumable_logs FOR ALL USING (center_id = (SELECT center_id FROM public.users WHERE id = auth.uid()));

-- 4. Assets Status
ALTER TABLE public.assets ADD COLUMN IF NOT EXISTS status text DEFAULT 'Active'; -- 'Active', 'Disposed', 'Maintenance'

-- 5. Book Loans: Add student_id if missing (User requested books distributable to students)
DO $$ BEGIN ALTER TABLE public.book_loans ADD COLUMN IF NOT EXISTS student_id uuid REFERENCES public.students(id) ON DELETE CASCADE; EXCEPTION WHEN OTHERS THEN NULL; END $$;
