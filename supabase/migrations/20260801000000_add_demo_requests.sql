-- Migration: Add demo_requests table and contact-sales settings
-- Created at: 20260801000000

CREATE TABLE IF NOT EXISTS public.demo_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone_number TEXT,
    school_name TEXT NOT NULL,
    role TEXT,
    student_count TEXT,
    message TEXT,
    status TEXT DEFAULT 'pending' NOT NULL,
    admin_notes TEXT,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Enable RLS
ALTER TABLE public.demo_requests ENABLE ROW LEVEL SECURITY;

-- Policies for demo_requests
CREATE POLICY "Public can insert demo requests" ON public.demo_requests
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Super Admins can view demo requests" ON public.demo_requests
    FOR SELECT TO authenticated
    USING (public.get_user_role() = 'admin' AND public.get_user_center_id() IS NULL);

CREATE POLICY "Super Admins can update demo requests" ON public.demo_requests
    FOR UPDATE TO authenticated
    USING (public.get_user_role() = 'admin' AND public.get_user_center_id() IS NULL);

-- Insert default settings for contact-sales page if not exists
INSERT INTO public.login_page_settings (
    page_type,
    title,
    subtitle,
    marketing_title,
    marketing_subtitle,
    primary_color,
    button_text
) VALUES (
    'contact-sales',
    'Book a Personalized Demo',
    'See how EDUFLOW can transform your school administration.',
    'Ready to scale your institution?',
    'Join hundreds of schools already using EDUFLOW to power their growth.',
    '#4f46e5',
    'Schedule My Demo'
) ON CONFLICT (page_type) DO NOTHING;

-- Add updated_at trigger for demo_requests
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER set_demo_requests_updated_at
    BEFORE UPDATE ON public.demo_requests
    FOR EACH ROW
    EXECUTE PROCEDURE public.handle_updated_at();
