-- Navigation and ERP Enhancements
-- Date: 2026-03-19

-- 1. Navigation Management
CREATE TABLE IF NOT EXISTS public.nav_categories (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    center_id uuid REFERENCES public.centers(id) ON DELETE CASCADE,
    name text NOT NULL,
    "order" integer DEFAULT 0,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.nav_items (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    center_id uuid REFERENCES public.centers(id) ON DELETE CASCADE,
    category_id uuid REFERENCES public.nav_categories(id) ON DELETE CASCADE,
    name text NOT NULL,
    route text NOT NULL,
    "order" integer DEFAULT 0,
    is_active boolean DEFAULT true,
    icon text, -- Store lucide icon name
    feature_name text, -- To link with permissions
    role text, -- 'center', 'teacher', 'parent'
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- 2. Student and Center Enhancements
ALTER TABLE public.centers ADD COLUMN IF NOT EXISTS short_code text;

-- 3. Transport GPS Tracking
ALTER TABLE public.vehicles ADD COLUMN IF NOT EXISTS vehicle_name text;
ALTER TABLE public.vehicles ADD COLUMN IF NOT EXISTS gps_device_id text;
ALTER TABLE public.vehicles ADD COLUMN IF NOT EXISTS last_latitude numeric;
ALTER TABLE public.vehicles ADD COLUMN IF NOT EXISTS last_longitude numeric;
ALTER TABLE public.vehicles ADD COLUMN IF NOT EXISTS last_sync timestamptz;

-- 4. HR and Payroll
CREATE TABLE IF NOT EXISTS public.tax_slabs (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    center_id uuid REFERENCES public.centers(id) ON DELETE CASCADE,
    min_income numeric NOT NULL,
    max_income numeric,
    tax_percent numeric NOT NULL,
    created_at timestamptz DEFAULT now()
);

-- Add late penalty settings to centers or a new settings table
ALTER TABLE public.centers ADD COLUMN IF NOT EXISTS late_penalty_per_day numeric DEFAULT 0;

-- 5. Administrative Permissions for Teachers
-- Existing columns: dashboard_access, academics_access, exams_results, published_results,
-- students_registration, teachers_registration, teachers_attendance, hr_management,
-- leave_management, student_id_cards, inventory_assets, transport_tracking,
-- school_days, settings_access, communications_access, teacher_reports, chapter_performance

-- Make sure all requested administrative toggles exist
ALTER TABLE public.teacher_feature_permissions
ADD COLUMN IF NOT EXISTS inventory_assets boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS transport_tracking boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS settings_access boolean DEFAULT false;

-- 6. Super Admin Billing
CREATE TABLE IF NOT EXISTS public.center_invoices (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    center_id uuid REFERENCES public.centers(id) ON DELETE CASCADE,
    invoice_number text UNIQUE NOT NULL,
    amount numeric NOT NULL,
    status text DEFAULT 'Pending' CHECK (status IN ('Pending', 'Paid', 'Overdue')),
    due_date date NOT NULL,
    billing_period_start date,
    billing_period_end date,
    created_at timestamptz DEFAULT now()
);

-- 7. Usage Monitoring
CREATE TABLE IF NOT EXISTS public.center_usage_stats (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    center_id uuid REFERENCES public.centers(id) ON DELETE CASCADE,
    date date DEFAULT CURRENT_DATE,
    api_requests integer DEFAULT 0,
    storage_used_bytes bigint DEFAULT 0,
    db_rows_count integer DEFAULT 0,
    active_users_count integer DEFAULT 0,
    UNIQUE(center_id, date)
);

-- 8. Real-time monitoring
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS last_active_at timestamptz;

-- Enable RLS
ALTER TABLE public.nav_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nav_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tax_slabs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.center_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.center_usage_stats ENABLE ROW LEVEL SECURITY;

-- Policies
DO $$
DECLARE
    t text;
BEGIN
    FOR t IN
        SELECT table_name
        FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name IN (
            'nav_categories', 'nav_items', 'tax_slabs', 'center_usage_stats'
        )
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS "Center Admin access" ON public.%I', t);
        EXECUTE format('CREATE POLICY "Center Admin access" ON public.%I FOR ALL USING (center_id = (SELECT center_id FROM public.users WHERE id = auth.uid()));', t);
    END LOOP;
END $$;

-- Super Admin policy for center_invoices
CREATE POLICY "Super Admin access center_invoices" ON public.center_invoices FOR ALL
USING ((SELECT role FROM public.users WHERE id = auth.uid()) = 'admin');

CREATE POLICY "Center View invoices" ON public.center_invoices FOR SELECT
USING (center_id = (SELECT center_id FROM public.users WHERE id = auth.uid()));

-- Usage stats: Super admin can see all, center admin can see their own
CREATE POLICY "Super Admin view usage" ON public.center_usage_stats FOR SELECT
USING ((SELECT role FROM public.users WHERE id = auth.uid()) = 'admin');
