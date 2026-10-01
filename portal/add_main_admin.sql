-- ============================================================
-- Make marcus.sanjay777@gmail.com the main admin
-- Run in the Supabase SQL Editor AFTER creating that login in
-- Authentication -> Users -> Add user (with "Auto Confirm User" ticked).
-- Safe to run the whole file, and safe to re-run.
--
-- This account is also the only one allowed to add or remove other
-- admins on the Team page (OWNER_EMAILS in manage-staff, SFS_OWNER_EMAIL
-- in portal/js/client.js). It replaces the old admin@gmail.com login,
-- which was deleted on 2026-10-01.
-- ============================================================

INSERT INTO profiles (id, full_name, role)
SELECT id, 'Sanjay Marcus S', 'Administrator'
FROM auth.users
WHERE lower(email) = 'marcus.sanjay777@gmail.com'
ON CONFLICT (id) DO UPDATE
  SET full_name = EXCLUDED.full_name,
      role      = EXCLUDED.role;

-- Check: should show exactly one row with your email
SELECT p.full_name, p.role, u.email
FROM profiles p
JOIN auth.users u ON u.id = p.id;
