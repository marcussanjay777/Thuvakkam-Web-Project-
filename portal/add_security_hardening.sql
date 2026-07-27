-- ============================================================
-- Security hardening — run in Supabase SQL Editor.
--
-- Fixes issues from a security review:
--
--   1. PRIVILEGE ESCALATION (critical): the policy
--      "Authenticated users can insert profiles ... WITH CHECK (true)"
--      let ANY signed-in account insert its own row into `profiles`.
--      Since the portal treats "has a profiles row" = committee staff,
--      an attacker could self-signup, insert a profiles row, and gain
--      full admin access (read/write all data). Removed here. New staff
--      are added by an admin via SQL editor only. client.js was changed
--      to UPDATE the existing staff row (never INSERT) during name setup.
--
--   2. DATA DISCLOSURE: `profiles`, `donors`, and `general_donations`
--      had "FOR SELECT TO authenticated USING (true)", so any signed-in
--      account could read every staff profile (names/emails/roles),
--      every donor record, and every public-donation record. Restricted
--      to staff (or own row for profiles).
--
-- Note: students / documents / donor_accounts / donations / student_updates
-- are already correctly scoped (staff-only or own-record) by earlier
-- migrations, so they are not changed here.
-- ============================================================

-- 1) Remove the open profiles-INSERT policy (privilege escalation).
drop policy if exists "Authenticated users can insert profiles" on profiles;

-- 2) profiles: each user may read only their OWN row.
drop policy if exists "Authenticated users can read profiles" on profiles;
create policy "read_own_profile" on profiles
  for select to authenticated
  using (id = auth.uid());

-- 3) donors: committee staff only.
drop policy if exists "auth_select_donors" on donors;
create policy "staff_select_donors" on donors
  for select to authenticated
  using (exists (select 1 from profiles where id = auth.uid()));

-- 4) general_donations: committee staff only.
drop policy if exists "Authenticated can view general donations" on general_donations;
create policy "staff_select_general_donations" on general_donations
  for select to authenticated
  using (exists (select 1 from profiles where id = auth.uid()));
