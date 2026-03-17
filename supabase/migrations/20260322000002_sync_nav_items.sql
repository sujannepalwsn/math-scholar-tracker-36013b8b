-- Update existing navigation items for About Institution
UPDATE public.nav_items
SET name = 'About Institution', route = '/about-institution', feature_name = 'about_institution'
WHERE route = '/about-school' AND role = 'center';

UPDATE public.nav_items
SET name = 'About Institution', route = '/teacher/about-institution', feature_name = 'about_institution'
WHERE route = '/teacher/about' AND role = 'teacher';

UPDATE public.nav_items
SET name = 'About Institution', route = '/parent-about-institution', feature_name = 'about_institution'
WHERE route = '/parent-about' AND role = 'parent';
