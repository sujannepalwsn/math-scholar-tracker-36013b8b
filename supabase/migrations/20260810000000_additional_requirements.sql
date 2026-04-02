-- Migration to handle additional requirements

-- 1. Users table: Add account expiry
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS expiry_date timestamp with time zone;

-- 2. Teachers table: Add contract end date
ALTER TABLE public.teachers ADD COLUMN IF NOT EXISTS contract_end_date date;

-- 3. Centers table: Add finance automation settings and header customization
ALTER TABLE public.centers ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true;
ALTER TABLE public.centers ADD COLUMN IF NOT EXISTS automation_enabled boolean DEFAULT false;
ALTER TABLE public.centers ADD COLUMN IF NOT EXISTS automation_settings jsonb DEFAULT '{}'::jsonb;
ALTER TABLE public.centers ADD COLUMN IF NOT EXISTS header_height text DEFAULT '400px';
ALTER TABLE public.centers ADD COLUMN IF NOT EXISTS payment_description text;

-- Create platform_settings table
CREATE TABLE IF NOT EXISTS public.platform_settings (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    key text UNIQUE NOT NULL,
    value jsonb NOT NULL,
    updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS for platform_settings
ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view platform settings" ON public.platform_settings
    FOR SELECT USING (true);

CREATE POLICY "Super Admins manage platform settings" ON public.platform_settings
    FOR ALL USING (auth.uid() IN (SELECT id FROM public.users WHERE role = 'super_admin'));

-- Initialize SaaS payment details
INSERT INTO public.platform_settings (key, value)
VALUES ('saas_payment_details', '{
    "bank_details": "Bank: Global Bank\nAccount: 1234567890\nName: EduFlow Tech",
    "esewa_qr_url": null,
    "khalti_qr_url": null,
    "payment_instructions": "Please upload a screenshot of your payment after completion."
}'::jsonb)
ON CONFLICT (key) DO NOTHING;

-- 4. Subscription plans: Add original price for discounts
ALTER TABLE public.subscription_plans ADD COLUMN IF NOT EXISTS original_price numeric;
ALTER TABLE public.subscription_plans ADD COLUMN IF NOT EXISTS discount_amount numeric;

-- 5. Create system_pages table for Privacy, Terms, and Support
CREATE TABLE IF NOT EXISTS public.system_pages (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    slug text UNIQUE NOT NULL, -- 'privacy', 'terms', 'support'
    title text NOT NULL,
    content text NOT NULL,
    updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS for system_pages
ALTER TABLE public.system_pages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view system pages" ON public.system_pages
    FOR SELECT USING (true);

CREATE POLICY "Super Admins manage system pages" ON public.system_pages
    FOR ALL USING (auth.uid() IN (SELECT id FROM public.users WHERE role = 'super_admin'));

-- 6. Add indexes to suggestions for performance
CREATE INDEX IF NOT EXISTS idx_suggestions_center_id ON public.suggestions(center_id);
CREATE INDEX IF NOT EXISTS idx_suggestions_user_id ON public.suggestions(user_id);
CREATE INDEX IF NOT EXISTS idx_suggestions_status ON public.suggestions(status);

-- 7. Add notification toggles to centers (or a separate table)
-- We'll use a jsonb column in centers for granular notification settings
ALTER TABLE public.centers ADD COLUMN IF NOT EXISTS notification_settings jsonb DEFAULT '{
  "homework": true,
  "missed_chapters": true,
  "discipline": true,
  "preschool_activities": true,
  "attendance": true,
  "fee_reminders": true,
  "exam_results": true
}'::jsonb;
