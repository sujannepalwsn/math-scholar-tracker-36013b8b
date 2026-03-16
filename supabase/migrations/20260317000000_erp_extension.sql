-- ERP Extension Migration
-- Date: 2026-03-17
-- Description: Extending schema for Student Lifecycle, Exams, Finance, Library, HR, and SaaS features.

-- 1. Student Lifecycle Management

CREATE TABLE IF NOT EXISTS public.admission_applications (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    center_id uuid REFERENCES public.centers(id) ON DELETE CASCADE,
    student_name text NOT NULL,
    parent_name text NOT NULL,
    parent_email text,
    parent_phone text,
    applied_grade text NOT NULL,
    status text DEFAULT 'Application Submitted' CHECK (status IN ('Application Submitted', 'Application Under Review', 'Application Approved', 'Enrollment Completed', 'Rejected')),
    application_data jsonb DEFAULT '{}'::jsonb,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.student_promotion_history (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    student_id uuid REFERENCES public.students(id) ON DELETE CASCADE,
    from_grade text,
    to_grade text,
    academic_year text,
    promoted_at timestamptz DEFAULT now(),
    promoted_by uuid REFERENCES public.users(id)
);

ALTER TABLE public.students ADD COLUMN IF NOT EXISTS status text DEFAULT 'Active' CHECK (status IN ('Active', 'Graduated', 'Transferred', 'Archived'));

CREATE TABLE IF NOT EXISTS public.transfer_certificates (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    student_id uuid REFERENCES public.students(id) ON DELETE CASCADE,
    certificate_number text UNIQUE,
    leaving_date date NOT NULL,
    reason_for_leaving text,
    issue_date date DEFAULT CURRENT_DATE,
    issued_by uuid REFERENCES public.users(id),
    created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.id_card_designs (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    center_id uuid REFERENCES public.centers(id) ON DELETE CASCADE,
    design_name text NOT NULL,
    config jsonb DEFAULT '{}'::jsonb, -- Store colors, layout, fields to show
    is_active boolean DEFAULT false,
    created_at timestamptz DEFAULT now()
);

-- 2. Advanced Examination and Result System

CREATE TABLE IF NOT EXISTS public.exam_types (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    center_id uuid REFERENCES public.centers(id) ON DELETE CASCADE,
    name text NOT NULL, -- e.g., Unit Test, Final Exam
    description text,
    created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.grading_systems (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    center_id uuid REFERENCES public.centers(id) ON DELETE CASCADE,
    name text NOT NULL,
    ranges jsonb NOT NULL, -- e.g., [{"grade": "A+", "min": 90, "max": 100, "gpa": 4.0}, ...]
    created_at timestamptz DEFAULT now()
);

ALTER TABLE public.exams ADD COLUMN IF NOT EXISTS exam_type_id uuid REFERENCES public.exam_types(id);
ALTER TABLE public.exams ADD COLUMN IF NOT EXISTS grading_system_id uuid REFERENCES public.grading_systems(id);

-- Subject weight/credits for GPA calculation
ALTER TABLE public.exam_subjects ADD COLUMN IF NOT EXISTS credit_weight numeric DEFAULT 1.0;

-- 3. Fee and Finance Automation

CREATE TABLE IF NOT EXISTS public.fee_installments (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    invoice_id uuid REFERENCES public.invoices(id) ON DELETE CASCADE,
    due_date date NOT NULL,
    amount numeric NOT NULL,
    status text DEFAULT 'Pending' CHECK (status IN ('Pending', 'Paid', 'Overdue')),
    created_at timestamptz DEFAULT now()
);

ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS late_fee_applied numeric DEFAULT 0;
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS installment_plan_active boolean DEFAULT false;

-- Homework enhancement for submissions
ALTER TABLE public.student_homework_records ADD COLUMN IF NOT EXISTS submission_url text;
ALTER TABLE public.student_homework_records ADD COLUMN IF NOT EXISTS feedback text;
ALTER TABLE public.student_homework_records ADD COLUMN IF NOT EXISTS submitted_at timestamptz;

-- Library RPC
CREATE OR REPLACE FUNCTION public.increment_available_copies(row_id uuid)
RETURNS void AS $$
BEGIN
    UPDATE public.books
    SET available_copies = available_copies + 1
    WHERE id = row_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TABLE IF NOT EXISTS public.payment_gateway_settings (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    center_id uuid REFERENCES public.centers(id) ON DELETE CASCADE,
    provider text NOT NULL, -- 'Stripe', 'Razorpay', etc.
    api_key text,
    api_secret text,
    is_active boolean DEFAULT false,
    created_at timestamptz DEFAULT now()
);

-- 4. Inventory and Library Management

CREATE TABLE IF NOT EXISTS public.books (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    center_id uuid REFERENCES public.centers(id) ON DELETE CASCADE,
    title text NOT NULL,
    author text,
    isbn text,
    category text,
    total_copies integer DEFAULT 1,
    available_copies integer DEFAULT 1,
    created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.book_loans (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    book_id uuid REFERENCES public.books(id) ON DELETE CASCADE,
    user_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
    issue_date date DEFAULT CURRENT_DATE,
    due_date date NOT NULL,
    return_date date,
    fine_amount numeric DEFAULT 0,
    status text DEFAULT 'Issued' CHECK (status IN ('Issued', 'Returned', 'Overdue')),
    created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.assets (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    center_id uuid REFERENCES public.centers(id) ON DELETE CASCADE,
    name text NOT NULL,
    category text, -- 'Lab Equipment', 'Furniture', etc.
    location text, -- 'Room 101', 'Science Lab'
    assigned_to_user_id uuid REFERENCES public.users(id),
    purchase_date date,
    condition text,
    created_at timestamptz DEFAULT now()
);

-- 5. HR and Staff Management

CREATE TABLE IF NOT EXISTS public.staff_contracts (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    teacher_id uuid REFERENCES public.teachers(id) ON DELETE CASCADE,
    contract_type text, -- 'Permanent', 'Probation', 'Contract'
    start_date date NOT NULL,
    end_date date,
    salary numeric,
    document_url text,
    status text DEFAULT 'Active',
    created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.performance_evaluations (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    teacher_id uuid REFERENCES public.teachers(id) ON DELETE CASCADE,
    evaluator_id uuid REFERENCES public.users(id),
    evaluation_date date DEFAULT CURRENT_DATE,
    rating integer CHECK (rating >= 1 AND rating <= 5),
    comments text,
    created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.staff_documents (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    teacher_id uuid REFERENCES public.teachers(id) ON DELETE CASCADE,
    document_name text NOT NULL,
    document_type text, -- 'PAN', 'Certificate', etc.
    document_url text NOT NULL,
    uploaded_at timestamptz DEFAULT now()
);

-- 6. SaaS Scaling

CREATE TABLE IF NOT EXISTS public.subscription_plans (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    name text NOT NULL, -- 'Basic', 'Standard', 'Premium'
    price numeric NOT NULL,
    billing_cycle text DEFAULT 'monthly',
    limits jsonb DEFAULT '{}'::jsonb, -- {"max_students": 500, "max_teachers": 50}
    features jsonb DEFAULT '[]'::jsonb, -- ["inventory", "advanced_reports"]
    created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.center_subscriptions (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    center_id uuid REFERENCES public.centers(id) ON DELETE CASCADE,
    plan_id uuid REFERENCES public.subscription_plans(id),
    status text DEFAULT 'Active',
    start_date timestamptz DEFAULT now(),
    end_date timestamptz,
    created_at timestamptz DEFAULT now()
);

-- 7. Transport Management

CREATE TABLE IF NOT EXISTS public.bus_routes (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    center_id uuid REFERENCES public.centers(id) ON DELETE CASCADE,
    route_name text NOT NULL,
    start_point text,
    end_point text,
    stops jsonb DEFAULT '[]'::jsonb,
    created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.vehicles (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    center_id uuid REFERENCES public.centers(id) ON DELETE CASCADE,
    vehicle_number text NOT NULL,
    capacity integer,
    driver_name text,
    driver_phone text,
    created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.transport_assignments (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    student_id uuid REFERENCES public.students(id) ON DELETE CASCADE,
    route_id uuid REFERENCES public.bus_routes(id),
    vehicle_id uuid REFERENCES public.vehicles(id),
    created_at timestamptz DEFAULT now()
);

-- 8. Communication and Notices

CREATE TABLE IF NOT EXISTS public.notices (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    center_id uuid REFERENCES public.centers(id) ON DELETE CASCADE,
    title text NOT NULL,
    content text NOT NULL,
    target_audience text DEFAULT 'All' CHECK (target_audience IN ('All', 'Teachers', 'Students', 'Parents', 'Grade')),
    target_grade text,
    is_emergency boolean DEFAULT false,
    created_by uuid REFERENCES public.users(id),
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- RLS POLICIES (Simplified for common pattern in this repo)

-- Enable RLS on all new tables
ALTER TABLE public.admission_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_promotion_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transfer_certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.id_card_designs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grading_systems ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fee_installments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_gateway_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.books ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.book_loans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.performance_evaluations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.center_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bus_routes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transport_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notices ENABLE ROW LEVEL SECURITY;

-- Generic center-based policies (assuming get_active_center_id() exists as per memory)
-- These are templates that would be applied to most tables

DO $$
DECLARE
    t text;
BEGIN
    FOR t IN
        SELECT table_name
        FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name IN (
            'admission_applications', 'student_promotion_history', 'transfer_certificates',
            'id_card_designs', 'exam_types', 'grading_systems', 'fee_installments',
            'payment_gateway_settings', 'books', 'book_loans', 'assets', 'staff_contracts',
            'performance_evaluations', 'staff_documents', 'center_subscriptions',
            'bus_routes', 'vehicles', 'transport_assignments', 'notices'
        )
    LOOP
        EXECUTE format('CREATE POLICY "Center Admin access" ON public.%I FOR ALL USING (center_id = (SELECT center_id FROM public.users WHERE id = auth.uid()));', t);
    END LOOP;
END $$;

-- Exception for public admission applications
CREATE POLICY "Public can submit admission" ON public.admission_applications FOR INSERT WITH CHECK (true);

-- Exception for subscription plans (viewable by all center admins)
CREATE POLICY "Center Admin can view plans" ON public.subscription_plans FOR SELECT USING (true);
