-- Fix and Enhance Database Schema
-- Date: 2026-03-18
-- Description: Addressing 400/404/401 errors by adding missing columns, tables, and RLS policies.

-- 1. Ensure academic_years table exists (Fix 404 error)
CREATE TABLE IF NOT EXISTS public.academic_years (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    center_id uuid REFERENCES public.centers(id) ON DELETE CASCADE,
    name text NOT NULL,
    start_date date NOT NULL,
    end_date date NOT NULL,
    is_current boolean DEFAULT false,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- 2. Add center_id to existing tables (Fix 400 Bad Request errors)
ALTER TABLE IF EXISTS public.student_promotion_history ADD COLUMN IF NOT EXISTS center_id uuid REFERENCES public.centers(id) ON DELETE CASCADE;
ALTER TABLE IF EXISTS public.transfer_certificates ADD COLUMN IF NOT EXISTS center_id uuid REFERENCES public.centers(id) ON DELETE CASCADE;
ALTER TABLE IF EXISTS public.fee_installments ADD COLUMN IF NOT EXISTS center_id uuid REFERENCES public.centers(id) ON DELETE CASCADE;
ALTER TABLE IF EXISTS public.book_loans ADD COLUMN IF NOT EXISTS center_id uuid REFERENCES public.centers(id) ON DELETE CASCADE;
ALTER TABLE IF EXISTS public.staff_contracts ADD COLUMN IF NOT EXISTS center_id uuid REFERENCES public.centers(id) ON DELETE CASCADE;
ALTER TABLE IF EXISTS public.performance_evaluations ADD COLUMN IF NOT EXISTS center_id uuid REFERENCES public.centers(id) ON DELETE CASCADE;
ALTER TABLE IF EXISTS public.staff_documents ADD COLUMN IF NOT EXISTS center_id uuid REFERENCES public.centers(id) ON DELETE CASCADE;
ALTER TABLE IF EXISTS public.transport_assignments ADD COLUMN IF NOT EXISTS center_id uuid REFERENCES public.centers(id) ON DELETE CASCADE;

-- 3. Enhance teachers table
ALTER TABLE IF EXISTS public.teachers ADD COLUMN IF NOT EXISTS employee_id text;
ALTER TABLE IF EXISTS public.teachers ADD COLUMN IF NOT EXISTS address text;
ALTER TABLE IF EXISTS public.teachers ADD COLUMN IF NOT EXISTS date_of_birth date;
ALTER TABLE IF EXISTS public.teachers ADD COLUMN IF NOT EXISTS gender text;
ALTER TABLE IF EXISTS public.teachers ADD COLUMN IF NOT EXISTS qualifications jsonb DEFAULT '[]'::jsonb;
ALTER TABLE IF EXISTS public.teachers ADD COLUMN IF NOT EXISTS bank_details jsonb DEFAULT '{}'::jsonb;
ALTER TABLE IF EXISTS public.teachers ADD COLUMN IF NOT EXISTS emergency_contact jsonb DEFAULT '{}'::jsonb;
ALTER TABLE IF EXISTS public.teachers ADD COLUMN IF NOT EXISTS department text;

-- 4. Create payroll_logs table
CREATE TABLE IF NOT EXISTS public.payroll_logs (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    center_id uuid REFERENCES public.centers(id) ON DELETE CASCADE,
    teacher_id uuid REFERENCES public.teachers(id) ON DELETE CASCADE,
    month text NOT NULL,
    year text NOT NULL,
    basic_pay numeric NOT NULL DEFAULT 0,
    allowances numeric NOT NULL DEFAULT 0,
    deductions numeric NOT NULL DEFAULT 0,
    net_payable numeric NOT NULL DEFAULT 0,
    status text DEFAULT 'Paid',
    paid_at timestamptz,
    created_at timestamptz DEFAULT now()
);

-- 5. Create consumables table
CREATE TABLE IF NOT EXISTS public.consumables (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    center_id uuid REFERENCES public.centers(id) ON DELETE CASCADE,
    name text NOT NULL,
    category text NOT NULL, -- 'Stationery', 'Kitchen', etc.
    unit text, -- 'Packs', 'Liters', etc.
    current_stock numeric DEFAULT 0,
    min_stock_level numeric DEFAULT 0,
    unit_price numeric DEFAULT 0,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- 6. Enable RLS and add Policies (Fix 401 Unauthorized errors)
ALTER TABLE public.academic_years ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payroll_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consumables ENABLE ROW LEVEL SECURITY;

-- Apply center-based policies for ALL new and existing ERP tables
DO $$
DECLARE
    t text;
BEGIN
    FOR t IN
        SELECT table_name
        FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name IN (
            'academic_years', 'payroll_logs', 'consumables', 'admission_applications',
            'student_promotion_history', 'transfer_certificates', 'id_card_designs',
            'exam_types', 'grading_systems', 'fee_installments', 'payment_gateway_settings',
            'books', 'book_loans', 'assets', 'staff_contracts', 'performance_evaluations',
            'staff_documents', 'center_subscriptions', 'bus_routes', 'vehicles',
            'transport_assignments', 'notices'
        )
    LOOP
        -- Drop if exists to avoid errors on re-run
        EXECUTE format('DROP POLICY IF EXISTS "Center Admin access" ON public.%I', t);
        EXECUTE format('CREATE POLICY "Center Admin access" ON public.%I FOR ALL USING (center_id = (SELECT center_id FROM public.users WHERE id = auth.uid()));', t);
    END LOOP;
END $$;

-- Exception for public admission applications
DROP POLICY IF EXISTS "Public can submit admission" ON public.admission_applications;
CREATE POLICY "Public can submit admission" ON public.admission_applications FOR INSERT WITH CHECK (true);
