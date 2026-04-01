-- Allow public access to view centers (required for landing page partner section and institution profiles)
DROP POLICY IF EXISTS "Allow public users to view centers" ON public.centers;
CREATE POLICY "Allow public users to view centers" ON public.centers FOR SELECT USING (true);
