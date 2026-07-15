-- ============================================================
-- Data privacy fix — run in Supabase SQL Editor
--
-- PROBLEM: The original schema.sql created policies like
--   "auth_select_students ... USING (true)"
-- which let ANY logged-in user (including donors) read/edit
-- EVERY student record. RLS policies combine with OR, so these
-- broad rules overrode the stricter donor/student rules.
--
-- FIX: Restrict the broad rules to PORTAL STAFF only (people who
-- have a row in the profiles table = admins/committee members).
-- Donors and students are NOT in profiles, so they fall back to
-- their own stricter policies:
--   - students see only their own record
--   - donors see only students they are matched to
-- ============================================================

-- ---------- STUDENTS TABLE ----------

-- Read: portal staff only (donors/students keep their own narrow policies)
DROP POLICY IF EXISTS "auth_select_students" ON students;
CREATE POLICY "staff_select_students"
  ON students FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid()));

-- Insert: portal staff only (public website still inserts via the
-- separate anon "public_can_submit_application" policy)
DROP POLICY IF EXISTS "auth_insert_students" ON students;
CREATE POLICY "staff_insert_students"
  ON students FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid()));

-- Update: portal staff only
DROP POLICY IF EXISTS "auth_update_students" ON students;
CREATE POLICY "staff_update_students"
  ON students FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid()));

-- ---------- DOCUMENTS TABLE ----------

-- Read: portal staff only (documents contain sensitive files —
-- bank statements, ID proofs — donors must never read these)
DROP POLICY IF EXISTS "auth_select_documents" ON documents;
CREATE POLICY "staff_select_documents"
  ON documents FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid()));

-- Insert (staff): portal staff can add document records manually
DROP POLICY IF EXISTS "auth_insert_documents" ON documents;
CREATE POLICY "staff_insert_documents"
  ON documents FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid()));

-- Insert (anon): the public application form saves document records
-- for the student it just created — allow anon to insert them
DROP POLICY IF EXISTS "anon_insert_documents" ON documents;
CREATE POLICY "anon_insert_documents"
  ON documents FOR INSERT TO anon
  WITH CHECK (true);

-- Update: portal staff only (verify/reject document status)
DROP POLICY IF EXISTS "auth_update_documents" ON documents;
CREATE POLICY "staff_update_documents"
  ON documents FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid()));
