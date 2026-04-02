-- Migration to add dynamic hero slider
-- Date: 2026-08-14

CREATE TABLE IF NOT EXISTS public.hero_slides (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT,
    subtitle TEXT,
    media_url TEXT NOT NULL,
    media_type TEXT CHECK (media_type IN ('image', 'video')) NOT NULL,
    cta_text TEXT,
    cta_link TEXT,
    order_index INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    overlay_opacity FLOAT DEFAULT 0.5,
    text_align TEXT DEFAULT 'center' CHECK (text_align IN ('left', 'center', 'right')),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.hero_slides ENABLE ROW LEVEL SECURITY;

-- Policies for hero_slides
DROP POLICY IF EXISTS "Public access hero_slides" ON public.hero_slides;
DROP POLICY IF EXISTS "Super Admin manage hero_slides" ON public.hero_slides;

CREATE POLICY "Public access hero_slides" ON public.hero_slides
    FOR SELECT USING (is_active = true);

CREATE POLICY "Super Admin manage hero_slides" ON public.hero_slides
    FOR ALL TO authenticated USING (
        public.get_user_role() = 'admin' AND public.get_user_center_id() IS NULL
    );

-- Storage bucket for hero slides
INSERT INTO storage.buckets (id, name, public)
VALUES ('hero-slides', 'hero-slides', true)
ON CONFLICT (id) DO NOTHING;

-- Policies for hero-slides bucket
DROP POLICY IF EXISTS "Public access hero-slides objects" ON storage.objects;
DROP POLICY IF EXISTS "Super Admin manage hero-slides objects" ON storage.objects;

CREATE POLICY "Public access hero-slides objects" ON storage.objects
    FOR SELECT USING (bucket_id = 'hero-slides');

CREATE POLICY "Super Admin manage hero-slides objects" ON storage.objects
    FOR ALL TO authenticated USING (
        bucket_id = 'hero-slides' AND
        EXISTS (
            SELECT 1 FROM security.users_private_lookup
            WHERE id = auth.uid() AND role = 'admin' AND center_id IS NULL
        )
    );
