-- Migration to add login page customization settings
-- Date: 2026-03-26

CREATE TABLE IF NOT EXISTS public.login_page_settings (
    page_type text PRIMARY KEY, -- 'center', 'admin', 'parent', 'teacher'
    logo_url text,
    background_url text,
    background_color text DEFAULT '#f8fafc',
    title text NOT NULL,
    subtitle text,
    username_label text DEFAULT 'Username',
    username_placeholder text DEFAULT 'Enter username',
    password_label text DEFAULT 'Password',
    password_placeholder text DEFAULT 'Enter password',
    button_text text DEFAULT 'Sign In',
    primary_color text DEFAULT '#4f46e5',
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.login_page_settings ENABLE ROW LEVEL SECURITY;

-- Public read access
CREATE POLICY "Public can read login settings" ON public.login_page_settings
    FOR SELECT USING (true);

-- Super Admin full access (assuming role 'admin' is super admin)
CREATE POLICY "Super Admins can manage login settings" ON public.login_page_settings
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Insert default settings
INSERT INTO public.login_page_settings (
    page_type, title, subtitle, username_label, username_placeholder,
    password_label, password_placeholder, button_text, primary_color
) VALUES
('center', 'Center Login', 'Enter your credentials to access your center', 'Username', 'Enter username', 'Password', 'Enter password', 'Sign In', '#4f46e5'),
('admin', 'Admin Portal', 'Administrator access only', 'Admin Username', 'Enter admin username', 'Admin Password', 'Enter admin password', 'Admin Login', '#ef4444'),
('parent', 'Parent Portal', 'Monitor your child''s journey', 'Username', 'Enter your username', 'Password', 'Enter your password', 'Access Portal', '#2563eb'),
('teacher', 'Teacher Portal', 'Manage your classes and students', 'Username', 'Enter your username', 'Password', 'Enter your password', 'Teacher Login', '#10b981')
ON CONFLICT (page_type) DO NOTHING;

-- Storage bucket for login assets
INSERT INTO storage.buckets (id, name, public)
VALUES ('login-assets', 'login-assets', true)
ON CONFLICT (id) DO NOTHING;

-- Policies for login-assets
CREATE POLICY "Public access to login-assets" ON storage.objects FOR SELECT
USING (bucket_id = 'login-assets');

CREATE POLICY "Super Admin manage login-assets" ON storage.objects FOR ALL
USING (
    bucket_id = 'login-assets' AND
    EXISTS (
        SELECT 1 FROM public.users
        WHERE id = auth.uid() AND role = 'admin'
    )
);
