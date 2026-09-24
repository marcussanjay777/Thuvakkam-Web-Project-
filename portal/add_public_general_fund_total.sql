-- ============================================================
-- Migration: Public general fund total
-- Run in Supabase SQL Editor
--
-- Why: general donations (website/general-donate.html) go into a shared
-- pool, not to one named student, so they never showed up anywhere on
-- funded-students.html - a general donor's contribution was invisible.
-- This adds a public, read-only total (no donor names/emails exposed)
-- so the page can show "₹X raised via the general fund" without
-- attributing it to any specific student.
-- ============================================================

CREATE OR REPLACE FUNCTION get_public_general_fund_total()
RETURNS NUMERIC
SECURITY DEFINER
SET search_path = public
LANGUAGE sql AS $$
  SELECT COALESCE(SUM(amount), 0) FROM general_donations;
$$;

GRANT EXECUTE ON FUNCTION get_public_general_fund_total() TO anon;
