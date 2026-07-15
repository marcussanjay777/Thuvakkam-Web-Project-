-- ============================================================
-- Migration: General donations + public funded students function
-- Run in Supabase SQL Editor
-- ============================================================

-- 1. General donations table (no account needed, anyone can donate)
CREATE TABLE IF NOT EXISTS general_donations (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name  TEXT NOT NULL,
  email      TEXT NOT NULL,
  amount     NUMERIC(12,2) NOT NULL,
  currency   TEXT DEFAULT 'INR',
  note       TEXT,
  donated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE general_donations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can submit general donation"
  ON general_donations FOR INSERT TO anon
  WITH CHECK (true);

CREATE POLICY "Authenticated can view general donations"
  ON general_donations FOR SELECT TO authenticated
  USING (true);

-- 2. Public function to get funded students
--    SECURITY DEFINER lets it read students/donations/matches even with RLS,
--    without exposing any personal donor data to the public.
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
    COALESCE(SUM(d.amount), 0) AS total_funded
  FROM students s
  LEFT JOIN donor_student_matches dsm ON dsm.student_id = s.id
  LEFT JOIN donations d ON d.donor_id = dsm.donor_id
  WHERE s.status = 'selected'
  GROUP BY s.id, s.name, s.initials, s.school, s.class, s.district, s.board
  ORDER BY s.name;
$$;

GRANT EXECUTE ON FUNCTION get_public_student_funding() TO anon;
