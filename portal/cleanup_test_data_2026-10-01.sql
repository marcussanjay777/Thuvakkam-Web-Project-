-- ============================================================
-- Clear out ALL leftover test data before real users arrive
-- Run in the Supabase SQL Editor in TWO goes:
--
--   STEP 1: select only the PREVIEW query below and run it.
--           It lists every row that would be deleted. Check it.
--   STEP 2: select the DELETE block (BEGIN ... COMMIT) and run it.
--
-- Kept on purpose (the demo accounts):
--   admin@gmail.com, teststudent@sfs.com / "Sanjay Marcus",
--   testdonor@sfs.com / "Test Donor", and anyone in profiles (staff).
--
-- ALREADY RUN on 2026-10-01. Kept for the record.
-- Replaces cleanup_test_data_2026-09-21.sql, which was never run.
-- ============================================================


-- ── STEP 1: PREVIEW (deletes nothing) ─────────────────────────
SELECT 'student'          AS what, name      AS label, status::text AS detail FROM students
  WHERE name LIKE 'ZZ %'
UNION ALL
SELECT 'orphan document', coalesce(student_name, '(none)'), type FROM documents
  WHERE student_id IS NULL OR file_url IS NULL
UNION ALL
SELECT 'general donation', full_name, amount::text || ' ' || coalesce(currency, '') FROM general_donations
UNION ALL
SELECT 'donor account', coalesce(full_name, '(no name)'), email FROM donor_accounts
  WHERE email IS DISTINCT FROM 'testdonor@sfs.com'
ORDER BY 1, 2;


-- ── STEP 2: DELETE ───────────────────────────────────────────
BEGIN;

-- Fake students (their documents, matches and updates go with them)
DELETE FROM students WHERE name LIKE 'ZZ %';

-- Old demo document rows that point at nobody / no file
DELETE FROM documents WHERE student_id IS NULL OR file_url IS NULL;

-- Test general donations. No real money has come in yet (Ketto keys are
-- still placeholders), so every row here is from testing.
DELETE FROM general_donations;

-- Test donor profiles (their donations and matches go with them)
DELETE FROM donor_accounts WHERE email IS DISTINCT FROM 'testdonor@sfs.com';

-- Login accounts are NOT deleted here any more. Remove test logins by hand
-- in Authentication -> Users, where you can see exactly who you're removing.

COMMIT;

-- What's left. Expected: students 1, documents 0, general_donations 0,
-- donor_accounts 1, donations 1 or more (demo), matches 1, admin login + staff.
SELECT 'students' AS table_name, count(*) FROM students
UNION ALL SELECT 'documents',             count(*) FROM documents
UNION ALL SELECT 'general_donations',     count(*) FROM general_donations
UNION ALL SELECT 'donor_accounts',        count(*) FROM donor_accounts
UNION ALL SELECT 'donations',             count(*) FROM donations
UNION ALL SELECT 'donor_student_matches', count(*) FROM donor_student_matches
UNION ALL SELECT 'login accounts',        count(*) FROM auth.users;
