-- ============================================================
-- Clean up leftover test data found in the 2026-09-21 audit
-- Run in the Supabase SQL Editor, one step at a time.
--
-- Run each PREVIEW first and read the rows it lists. Only run the
-- DELETE under it once the preview shows exactly what you expect.
--
-- The real demo account "Sanjay Marcus" is never touched.
-- ============================================================


-- ── 1. Two fake students showing on the PUBLIC "Our Students" page ──
-- These are leftovers from the 2026-09-16 email test. Both are marked
-- 'selected', which is why visitors can see them right now.

-- PREVIEW
SELECT id, name, status, cycle_year, applied_on
FROM students
WHERE name LIKE 'ZZ %';

-- DELETE (documents, matches and updates for these students go too)
DELETE FROM students WHERE name LIKE 'ZZ %';

-- Their login accounts still exist separately. Remove them by hand in
-- Authentication -> Users, searching for the same ZZ test addresses.


-- ── 2. Twelve orphaned document records ──
-- These are demo rows from the original schema.sql seed data. The students
-- they belonged to were deleted on 2026-09-15, so they now point at nobody
-- and have no uploaded file behind them. They are the only reason the admin
-- Documents page shows "12 documents / 7 verified / 4 pending".

-- PREVIEW
SELECT id, student_name, type, status, file_url
FROM documents
WHERE student_id IS NULL OR file_url IS NULL;

-- DELETE
DELETE FROM documents
WHERE student_id IS NULL OR file_url IS NULL;


-- ── 3. Two test general donations (total 1,000) ──
-- "ZZ Donation Test" and "sanjay" are both from testing. Deleting them
-- resets the General Donations page to zero, which is correct until a
-- real Ketto payment is logged.

-- PREVIEW
SELECT id, full_name, email, amount, note, donated_at
FROM general_donations;

-- DELETE
DELETE FROM general_donations
WHERE full_name IN ('ZZ Donation Test', 'sanjay');


-- ── 4. Duplicate / test donor accounts ──
-- Four donor accounts exist. "Test Donor" is the intentional demo account
-- matched to Sanjay Marcus -- KEEP IT. The other three are from testing.

-- PREVIEW (check this list carefully before deleting)
SELECT id, full_name, email, created_at
FROM donor_accounts
ORDER BY created_at;

-- DELETE the three test ones (keeps testdonor@sfs.com)
DELETE FROM donor_accounts
WHERE email IN (
  'hunter999@test.com',
  'arihanthmuthaavip2006@gmail.com',
  'marcus.sanjay777@gmail.com'
);

-- Their login accounts also remain in Authentication -> Users.
-- Remove those by hand if you no longer need them for testing.


-- ── 5. Check what is left ──
SELECT 'students'          AS table_name, count(*) FROM students
UNION ALL SELECT 'documents',            count(*) FROM documents
UNION ALL SELECT 'general_donations',    count(*) FROM general_donations
UNION ALL SELECT 'donor_accounts',       count(*) FROM donor_accounts
UNION ALL SELECT 'donations',            count(*) FROM donations
UNION ALL SELECT 'donor_student_matches',count(*) FROM donor_student_matches;

-- Expected afterwards:
--   students 1 (Sanjay Marcus), documents 0, general_donations 0,
--   donor_accounts 1 (Test Donor), donations 1, donor_student_matches 1
