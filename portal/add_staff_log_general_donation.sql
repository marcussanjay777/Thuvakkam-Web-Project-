-- ============================================================
-- Migration: Staff can manually log a general donation
-- Run in Supabase SQL Editor
--
-- Why: general donations now happen through Ketto's real checkout, not
-- the old fake Supabase-only form. Ketto doesn't tell this site when a
-- payment succeeds, so admin has to check Ketto's own dashboard and
-- manually add the record here — this policy lets staff (not just the
-- public RPC) insert directly into general_donations.
-- ============================================================

DROP POLICY IF EXISTS "staff_insert_general_donations" ON general_donations;
CREATE POLICY "staff_insert_general_donations"
  ON general_donations FOR INSERT TO authenticated
  WITH CHECK (exists (select 1 from profiles where id = auth.uid()));
