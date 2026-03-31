-- Update center_subscriptions for approval workflow
ALTER TABLE public.center_subscriptions ADD COLUMN IF NOT EXISTS package_type text;
ALTER TABLE public.center_subscriptions ALTER COLUMN status SET DEFAULT 'Pending';

-- Create saas_invoices for admin billing centers
CREATE TABLE IF NOT EXISTS public.saas_invoices (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    center_id uuid REFERENCES public.centers(id) ON DELETE CASCADE,
    plan_id uuid REFERENCES public.subscription_plans(id),
    amount numeric NOT NULL,
    invoice_date date DEFAULT CURRENT_DATE,
    due_date date,
    status text DEFAULT 'Unpaid' CHECK (status IN ('Unpaid', 'Paid', 'Overdue', 'Cancelled')),
    payment_date timestamptz,
    created_at timestamptz DEFAULT now()
);

-- Enable RLS for saas_invoices
ALTER TABLE public.saas_invoices ENABLE ROW LEVEL SECURITY;

-- Center Admin can view their own invoices
CREATE POLICY "Center Admin view saas invoices" ON public.saas_invoices
    FOR SELECT USING (center_id = (SELECT center_id FROM public.users WHERE id = auth.uid()));

-- Super Admin has full access
CREATE POLICY "Super Admin manage saas invoices" ON public.saas_invoices
    FOR ALL USING ((SELECT role FROM public.users WHERE id = auth.uid()) = 'admin');
