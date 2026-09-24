-- ============================================================
-- Make uploaded documents PRIVATE
-- Run once in the Supabase SQL Editor: paste everything, press Run.
--
-- BEFORE this:
--   * Anyone on the internet could list and download every uploaded
--     document (Aadhaar, bank statement, income certificate...) with
--     no login at all.
--   * Any signed-in account -- even a self-registered donor -- could
--     read every student's documents.
--
-- AFTER this:
--   * The bucket is private; the old public links stop working.
--   * Committee staff can open (and delete) any document.
--   * A student can open only their own proof files.
--   * A donor can open only the proof files of the student matched to them.
--   * Anyone can still UPLOAD -- the public application form needs that.
--   * Each file is capped at 5 MB.
--
-- The website opens files through short-lived (5 minute) signed links,
-- so this goes live together with the matching code changes.
-- ============================================================


-- 1. Bucket: private, and a 5 MB cap per file
UPDATE storage.buckets
SET public          = false,
    file_size_limit = 5242880
WHERE id = 'student-documents';


-- 2. Remove the two over-broad READ rules
DROP POLICY IF EXISTS "Public can read application documents"  ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can read documents" ON storage.objects;


-- 3. Committee staff can read and delete every document
DROP POLICY IF EXISTS "Staff can read documents" ON storage.objects;
CREATE POLICY "Staff can read documents"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'student-documents'
    AND EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid())
  );

DROP POLICY IF EXISTS "Staff can delete documents" ON storage.objects;
CREATE POLICY "Staff can delete documents"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'student-documents'
    AND EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid())
  );


-- 4. A student can read only their OWN proof files
--    (stored as  student-proofs/<student id>/<file>)
DROP POLICY IF EXISTS "Students can read own proofs" ON storage.objects;
CREATE POLICY "Students can read own proofs"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'student-documents'
    AND (storage.foldername(name))[1] = 'student-proofs'
    AND (storage.foldername(name))[2] IN (
      SELECT s.id::text FROM public.students s WHERE s.auth_user_id = auth.uid()
    )
  );


-- 5. A donor can read only the proof files of the student matched to them
DROP POLICY IF EXISTS "Donors can read matched student proofs" ON storage.objects;
CREATE POLICY "Donors can read matched student proofs"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'student-documents'
    AND (storage.foldername(name))[1] = 'student-proofs'
    AND (storage.foldername(name))[2] IN (
      SELECT m.student_id::text
      FROM public.donor_student_matches m
      JOIN public.donor_accounts d ON d.id = m.donor_id
      WHERE d.auth_user_id = auth.uid()
    )
  );


-- 6. Show the result (this is the list of rules now protecting the bucket)
SELECT policyname, cmd, roles
FROM pg_policies
WHERE schemaname = 'storage' AND tablename = 'objects'
ORDER BY policyname;


-- ------------------------------------------------------------
-- ROLLBACK -- only if uploads or viewing break and you need the old
-- behaviour back while we investigate. Run these lines, nothing else.
-- ------------------------------------------------------------
-- UPDATE storage.buckets SET public = true, file_size_limit = NULL WHERE id = 'student-documents';
-- CREATE POLICY "Public can read application documents"  ON storage.objects FOR SELECT TO anon          USING (bucket_id = 'student-documents');
-- CREATE POLICY "Authenticated users can read documents" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'student-documents');
