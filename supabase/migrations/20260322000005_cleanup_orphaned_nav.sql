-- Cleanup navigation records that are causing empty sidebars
-- If a center/role only has 'About Institution' in their dynamic nav,
-- we remove it so it falls back to the defaults (which already includes About Institution).

DELETE FROM public.nav_items n1
WHERE n1.feature_name = 'about_institution'
AND (
    SELECT count(*)
    FROM public.nav_items n2
    WHERE n2.center_id = n1.center_id
    AND n2.role = n1.role
) = 1;
