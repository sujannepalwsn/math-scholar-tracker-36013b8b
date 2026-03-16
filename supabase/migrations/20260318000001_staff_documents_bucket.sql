-- Add staff-documents bucket and policies
INSERT INTO storage.buckets (id, name, public)
VALUES ('staff-documents', 'staff-documents', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Public access to staff-documents" ON storage.objects;
CREATE POLICY "Public access to staff-documents" ON storage.objects FOR SELECT
USING (bucket_id = 'staff-documents');

DROP POLICY IF EXISTS "Auth upload to staff-documents" ON storage.objects;
CREATE POLICY "Auth upload to staff-documents" ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'staff-documents');

DROP POLICY IF EXISTS "Auth delete staff-documents" ON storage.objects;
CREATE POLICY "Auth delete staff-documents" ON storage.objects FOR DELETE
USING (bucket_id = 'staff-documents');
