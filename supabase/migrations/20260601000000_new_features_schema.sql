-- Migration to support new requirements and features

-- 1. Create center_requirements table
CREATE TABLE IF NOT EXISTS public.center_requirements (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    center_id uuid REFERENCES public.centers(id) ON DELETE CASCADE,
    module_name text NOT NULL,
    requirement_description text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS for center_requirements
ALTER TABLE public.center_requirements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Center Admins manage requirements" ON public.center_requirements
    FOR ALL USING (auth.uid() IN (SELECT id FROM public.users WHERE center_id = center_requirements.center_id AND role = 'admin'))
    WITH CHECK (auth.uid() IN (SELECT id FROM public.users WHERE center_id = center_requirements.center_id AND role = 'admin'));

CREATE POLICY "Super Admins view requirements" ON public.center_requirements
    FOR SELECT USING (auth.uid() IN (SELECT id FROM public.users WHERE role = 'super_admin'));

-- 2. Create suggestions table
CREATE TABLE IF NOT EXISTS public.suggestions (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    center_id uuid REFERENCES public.centers(id) ON DELETE CASCADE,
    user_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
    role_type text NOT NULL, -- 'teacher' or 'parent'
    title text NOT NULL,
    message text NOT NULL,
    status text DEFAULT 'pending', -- 'pending' or 'resolved'
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS for suggestions
ALTER TABLE public.suggestions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view and create their own suggestions" ON public.suggestions
    FOR ALL USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Center Admins manage center suggestions" ON public.suggestions
    FOR ALL USING (auth.uid() IN (SELECT id FROM public.users WHERE center_id = suggestions.center_id AND role = 'admin'))
    WITH CHECK (auth.uid() IN (SELECT id FROM public.users WHERE center_id = suggestions.center_id AND role = 'admin'));

-- 3. Create unified calendar_events table
CREATE TABLE IF NOT EXISTS public.calendar_events (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    center_id uuid REFERENCES public.centers(id) ON DELETE CASCADE,
    title text NOT NULL,
    type text NOT NULL, -- 'event', 'holiday', 'exam', 'meeting'
    date date NOT NULL,
    is_school_day boolean DEFAULT true,
    description text,
    created_by uuid REFERENCES public.users(id),
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    UNIQUE(center_id, date)
);

-- Enable RLS for calendar_events
ALTER TABLE public.calendar_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Center users view calendar events" ON public.calendar_events
    FOR SELECT USING (auth.uid() IN (SELECT id FROM public.users WHERE center_id = calendar_events.center_id));

CREATE POLICY "Center Admins manage calendar events" ON public.calendar_events
    FOR ALL USING (auth.uid() IN (SELECT id FROM public.users WHERE center_id = calendar_events.center_id AND role = 'admin'))
    WITH CHECK (auth.uid() IN (SELECT id FROM public.users WHERE center_id = calendar_events.center_id AND role = 'admin'));

CREATE POLICY "Teachers create calendar events" ON public.calendar_events
    FOR INSERT WITH CHECK (auth.uid() IN (SELECT id FROM public.users WHERE center_id = calendar_events.center_id AND role = 'teacher'));

-- 4. Add academic_year column to users (for persistence)
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS active_academic_year text;

-- 5. Add gps_device_id to centers (for transport tracking)
ALTER TABLE public.centers ADD COLUMN IF NOT EXISTS gps_device_id text;
