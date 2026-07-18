-- ============================================================
-- Fix admin access control — run in Supabase SQL Editor
--
-- PROBLEM: The trigger "on_auth_user_created" automatically added
-- EVERY new auth user (donors AND students included) to the
-- profiles table as "Committee Member". Because the privacy rules
-- treat anyone in profiles as staff, this let donors and students
-- read ALL student records. Testing confirmed a logged-in donor
-- could pull every applicant's data.
--
-- FIX: stop auto-promoting new users, and remove the profiles rows
-- that wrongly belong to donors/students. After this, only people
-- explicitly added to profiles are treated as committee staff.
-- ============================================================

-- 1. Remove the auto-promote trigger + its function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS handle_new_user();

-- 2. Delete profiles rows that actually belong to donors or students
DELETE FROM profiles
WHERE id IN (SELECT auth_user_id FROM donor_accounts WHERE auth_user_id IS NOT NULL)
   OR id IN (SELECT auth_user_id FROM students       WHERE auth_user_id IS NOT NULL);

-- 3. Review who remains as committee staff (should be real staff only):
--    SELECT id, full_name, role FROM profiles ORDER BY full_name;

-- ------------------------------------------------------------
-- HOW TO ADD A NEW COMMITTEE MEMBER IN FUTURE
-- After they have created a login (auth account), grant staff access:
--   INSERT INTO profiles (id, full_name, role)
--   VALUES ('<their-auth-user-id>', 'Their Name', 'Committee Member');
-- (Find the auth-user-id in Supabase → Authentication → Users.)
-- ------------------------------------------------------------
