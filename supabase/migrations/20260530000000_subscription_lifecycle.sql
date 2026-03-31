-- Update center_subscriptions for pro-rated billing
ALTER TABLE public.center_subscriptions ADD COLUMN IF NOT EXISTS billed_amount numeric;
ALTER TABLE public.center_subscriptions ADD COLUMN IF NOT EXISTS subscription_days integer DEFAULT 30;

-- Ensure saas_invoices is ready for automated generation
-- (Already created in previous migration, but ensuring status is correct)
ALTER TABLE public.saas_invoices ALTER COLUMN status SET DEFAULT 'Unpaid';
