-- ============================================================
-- Migration: General donation allocation to students
-- Run in Supabase SQL Editor
--
-- Why: general donations used to be shown as one shared pool across
-- all selected students. Changed so admin manually decides which
-- student each general donation supports — same idea as the existing
-- donor-student matching flow on donor-management.html.
-- ============================================================

-- 1. Allocation columns on general_donations
ALTER TABLE general_donations
  ADD COLUMN IF NOT EXISTS allocated_student_id UUID REFERENCES students(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS allocated_by UUID,
  ADD COLUMN IF NOT EXISTS allocated_at TIMESTAMPTZ;

-- 2. Staff can update allocation (table was select-only for staff before)
DROP POLICY IF EXISTS "staff_update_general_donations" ON general_donations;
CREATE POLICY "staff_update_general_donations"
  ON general_donations FOR UPDATE TO authenticated
  USING (exists (select 1 from profiles where id = auth.uid()))
  WITH CHECK (exists (select 1 from profiles where id = auth.uid()));

-- 3. Public student funding now includes allocated general donations
--    (in addition to matched-donor sponsorship money, same as before)
CREATE OR REPLACE FUNCTION get_public_student_funding()
RETURNS TABLE (
  id           UUID,
  name         TEXT,
  initials     TEXT,
  school       TEXT,
  class        TEXT,
  district     TEXT,
  board        TEXT,
  total_funded NUMERIC
)
SECURITY DEFINER
SET search_path = public
LANGUAGE sql AS $$
  SELECT
    s.id,
    s.name,
    s.initials,
    s.school,
    s.class,
    s.district,
    s.board,
    COALESCE(sponsor_totals.amt, 0) + COALESCE(general_totals.amt, 0) AS total_funded
  FROM students s
  LEFT JOIN (
    SELECT dsm.student_id, SUM(d.amount) AS amt
    FROM donor_student_matches dsm
    JOIN donations d ON d.donor_id = dsm.donor_id
    GROUP BY dsm.student_id
  ) sponsor_totals ON sponsor_totals.student_id = s.id
  LEFT JOIN (
    SELECT gd.allocated_student_id AS student_id, SUM(gd.amount) AS amt
    FROM general_donations gd
    WHERE gd.allocated_student_id IS NOT NULL
    GROUP BY gd.allocated_student_id
  ) general_totals ON general_totals.student_id = s.id
  WHERE s.status = 'selected'
  ORDER BY s.name;
$$;

GRANT EXECUTE ON FUNCTION get_public_student_funding() TO anon;
