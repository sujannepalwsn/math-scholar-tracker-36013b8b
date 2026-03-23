-- Fix RLS recursion for navigation tables
-- Migration: 20260406000000_fix_nav_rls_recursion.sql

-- Drop the recursive policies
DROP POLICY IF EXISTS "Center Admin access" ON public.nav_items;
DROP POLICY IF EXISTS "Center Admin access" ON public.nav_categories;
DROP POLICY IF EXISTS "Center and Admin access on nav_items" ON public.nav_items;
DROP POLICY IF EXISTS "Center and Admin access on nav_categories" ON public.nav_categories;
DROP POLICY IF EXISTS "Teacher read access on nav_items" ON public.nav_items;
DROP POLICY IF EXISTS "Teacher read access on nav_categories" ON public.nav_categories;

-- Apply standardized non-recursive policies
-- 1. nav_categories
ALTER TABLE public.nav_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow center admins to manage nav_categories"
ON public.nav_categories FOR ALL
TO authenticated
USING (public.get_user_role() = 'center' AND center_id = public.get_user_center_id());

CREATE POLICY "Allow authenticated users to view nav_categories"
ON public.nav_categories FOR SELECT
TO authenticated
USING (public.is_same_center(center_id));

-- 2. nav_items
ALTER TABLE public.nav_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow center admins to manage nav_items"
ON public.nav_items FOR ALL
TO authenticated
USING (public.get_user_role() = 'center' AND center_id = public.get_user_center_id());

CREATE POLICY "Allow authenticated users to view nav_items"
ON public.nav_items FOR SELECT
TO authenticated
USING (public.is_same_center(center_id));
