-- ============================================================
-- Give someone access to the committee portal
--
-- There are TWO steps. This file is step 2.
--
-- STEP 1 (in the Supabase dashboard, do this first):
--   Authentication -> Users -> "Add user" -> "Create new user"
--   Enter their email + a temporary password
--   Tick "Auto Confirm User" so they can sign in straight away
--
-- STEP 2 (this file):
--   Creating the login above is NOT enough on its own -- the portal
--   blocks anyone who is not listed as staff. This is deliberate: it
--   is what stops a donor or student account from getting in.
--   Run the command below to grant that access.
--
-- Change the three values, then press Run.
-- ============================================================

INSERT INTO profiles (id, full_name, role)
SELECT u.id,
       'Their Full Name',        -- <-- the name shown in the portal top bar
       'Committee Member'        -- <-- or 'Administrator' / 'Volunteer'
FROM auth.users u
WHERE u.email = 'their.email@example.com'   -- <-- the email used in step 1
ON CONFLICT (id) DO UPDATE
  SET full_name = EXCLUDED.full_name,
      role      = EXCLUDED.role;


-- ── Check it worked ─────────────────────────────────────────
-- Should list everyone who can currently open the committee portal.
SELECT p.full_name, p.role, u.email, p.created_at
FROM profiles p
JOIN auth.users u ON u.id = p.id
ORDER BY p.created_at;


-- ── REMOVE someone's portal access ──────────────────────────
-- Deleting this row blocks the portal but keeps their login account.
-- DELETE FROM profiles
-- WHERE id = (SELECT id FROM auth.users WHERE email = 'their.email@example.com');


-- ── Note on the 'role' value ────────────────────────────────
-- 'role' is only a label shown in the top bar. Everyone listed in this
-- table has the same full access. There is no separate permission level
-- yet, so only add people who should see every applicant's details.
