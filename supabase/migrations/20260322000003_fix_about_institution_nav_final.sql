-- Fix About Institution navigation: Ensure it's at the end and out of categories
DO $$
DECLARE
    center_record RECORD;
BEGIN
    FOR center_record IN SELECT id FROM public.centers LOOP
        -- Center Role
        IF EXISTS (SELECT 1 FROM public.nav_items WHERE center_id = center_record.id AND route IN ('/about-school', '/about-institution') AND role = 'center') THEN
            UPDATE public.nav_items
            SET name = 'About Institution',
                route = '/about-institution',
                feature_name = 'about_institution',
                category_id = NULL,
                "order" = 100,
                icon = 'Building'
            WHERE center_id = center_record.id AND route IN ('/about-school', '/about-institution') AND role = 'center';
        ELSE
            INSERT INTO public.nav_items (center_id, category_id, name, route, "order", is_active, icon, feature_name, role)
            VALUES (center_record.id, NULL, 'About Institution', '/about-institution', 100, true, 'Building', 'about_institution', 'center');
        END IF;

        -- Teacher Role
        IF EXISTS (SELECT 1 FROM public.nav_items WHERE center_id = center_record.id AND route IN ('/teacher/about', '/teacher/about-institution') AND role = 'teacher') THEN
            UPDATE public.nav_items
            SET name = 'About Institution',
                route = '/teacher/about-institution',
                feature_name = 'about_institution',
                category_id = NULL,
                "order" = 100,
                icon = 'Building'
            WHERE center_id = center_record.id AND route IN ('/teacher/about', '/teacher/about-institution') AND role = 'teacher';
        ELSE
            INSERT INTO public.nav_items (center_id, category_id, name, route, "order", is_active, icon, feature_name, role)
            VALUES (center_record.id, NULL, 'About Institution', '/teacher/about-institution', 100, true, 'Building', 'about_institution', 'teacher');
        END IF;

        -- Parent Role
        IF EXISTS (SELECT 1 FROM public.nav_items WHERE center_id = center_record.id AND route IN ('/parent-about', '/parent-about-institution') AND role = 'parent') THEN
            UPDATE public.nav_items
            SET name = 'About Institution',
                route = '/parent-about-institution',
                feature_name = 'about_institution',
                category_id = NULL,
                "order" = 100,
                icon = 'Building'
            WHERE center_id = center_record.id AND route IN ('/parent-about', '/parent-about-institution') AND role = 'parent';
        ELSE
            INSERT INTO public.nav_items (center_id, category_id, name, route, "order", is_active, icon, feature_name, role)
            VALUES (center_record.id, NULL, 'About Institution', '/parent-about-institution', 100, true, 'Building', 'about_institution', 'parent');
        END IF;
    END LOOP;
END $$;
