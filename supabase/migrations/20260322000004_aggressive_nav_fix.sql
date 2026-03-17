-- Comprehensive Fix for About Institution Navigation
-- This migration ensures the item exists for all centers and roles,
-- and is placed correctly at the bottom without a category.

DO $$
DECLARE
    center_rec RECORD;
BEGIN
    FOR center_rec IN SELECT id FROM public.centers LOOP

        -- 1. CENTER ROLE
        -- Update existing if it exists (handles both old and new routes/names)
        UPDATE public.nav_items
        SET name = 'About Institution',
            route = '/about-institution',
            feature_name = 'about_institution',
            category_id = NULL,
            "order" = 100,
            icon = 'Building',
            is_active = true
        WHERE center_id = center_rec.id
        AND (route = '/about-school' OR route = '/about-institution')
        AND role = 'center';

        -- Insert if it doesn't exist
        IF NOT EXISTS (SELECT 1 FROM public.nav_items WHERE center_id = center_rec.id AND route = '/about-institution' AND role = 'center') THEN
            INSERT INTO public.nav_items (center_id, category_id, name, route, "order", is_active, icon, feature_name, role)
            VALUES (center_rec.id, NULL, 'About Institution', '/about-institution', 100, true, 'Building', 'about_institution', 'center');
        END IF;

        -- 2. TEACHER ROLE
        UPDATE public.nav_items
        SET name = 'About Institution',
            route = '/teacher/about-institution',
            feature_name = 'about_institution',
            category_id = NULL,
            "order" = 100,
            icon = 'Building',
            is_active = true
        WHERE center_id = center_rec.id
        AND (route = '/teacher/about' OR route = '/teacher/about-institution')
        AND role = 'teacher';

        IF NOT EXISTS (SELECT 1 FROM public.nav_items WHERE center_id = center_rec.id AND route = '/teacher/about-institution' AND role = 'teacher') THEN
            INSERT INTO public.nav_items (center_id, category_id, name, route, "order", is_active, icon, feature_name, role)
            VALUES (center_rec.id, NULL, 'About Institution', '/teacher/about-institution', 100, true, 'Building', 'about_institution', 'teacher');
        END IF;

        -- 3. PARENT ROLE
        UPDATE public.nav_items
        SET name = 'About Institution',
            route = '/parent-about-institution',
            feature_name = 'about_institution',
            category_id = NULL,
            "order" = 100,
            icon = 'Building',
            is_active = true
        WHERE center_id = center_rec.id
        AND (route = '/parent-about' OR route = '/parent-about-institution')
        AND role = 'parent';

        IF NOT EXISTS (SELECT 1 FROM public.nav_items WHERE center_id = center_rec.id AND route = '/parent-about-institution' AND role = 'parent') THEN
            INSERT INTO public.nav_items (center_id, category_id, name, route, "order", is_active, icon, feature_name, role)
            VALUES (center_rec.id, NULL, 'About Institution', '/parent-about-institution', 100, true, 'Building', 'about_institution', 'parent');
        END IF;

    END LOOP;
END $$;
