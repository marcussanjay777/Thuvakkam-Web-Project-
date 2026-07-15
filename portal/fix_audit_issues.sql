-- ============================================================
-- Audit fix migration — run in Supabase SQL Editor
-- ============================================================

-- C1: Fix storage bucket policy name (typo: studen-document → student-documents)
DROP POLICY IF EXISTS "Students can upload own documents" ON storage.objects;
CREATE POLICY "Students can upload own documents"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'student-documents');

DROP POLICY IF EXISTS "Authenticated users can read documents" ON storage.objects;
CREATE POLICY "Authenticated users can read documents"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'student-documents');

-- Also allow anon inserts for the public application form uploads
DROP POLICY IF EXISTS "Public can upload application documents" ON storage.objects;
CREATE POLICY "Public can upload application documents"
  ON storage.objects FOR INSERT TO anon
  WITH CHECK (bucket_id = 'student-documents');

DROP POLICY IF EXISTS "Public can read application documents" ON storage.objects;
CREATE POLICY "Public can read application documents"
  ON storage.objects FOR SELECT TO anon
  USING (bucket_id = 'student-documents');

-- C2: Add rejection_reason column if it doesn't exist
ALTER TABLE students ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

-- Also add proof_url to student_updates if missing
ALTER TABLE student_updates ADD COLUMN IF NOT EXISTS proof_url TEXT;

-- W5: Make school and district nullable so old records don't break
-- (New applications will now supply these fields via the updated form)
ALTER TABLE students ALTER COLUMN school DROP NOT NULL;
ALTER TABLE students ALTER COLUMN district DROP NOT NULL;
