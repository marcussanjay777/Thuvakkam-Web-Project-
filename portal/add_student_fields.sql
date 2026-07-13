-- ============================================================
-- Run this in Supabase → SQL Editor → New query
-- Adds detailed student profile fields
-- ============================================================

ALTER TABLE students
  ADD COLUMN IF NOT EXISTS dob              date,
  ADD COLUMN IF NOT EXISTS gender           text,
  ADD COLUMN IF NOT EXISTS aadhaar          text,
  ADD COLUMN IF NOT EXISTS phone            text,
  ADD COLUMN IF NOT EXISTS address          text,
  ADD COLUMN IF NOT EXISTS father_name      text,
  ADD COLUMN IF NOT EXISTS mother_name      text,
  ADD COLUMN IF NOT EXISTS parent_occupation text,
  ADD COLUMN IF NOT EXISTS annual_income    numeric,
  ADD COLUMN IF NOT EXISTS siblings         integer,
  ADD COLUMN IF NOT EXISTS board            text DEFAULT 'Tamil Nadu State Board',
  ADD COLUMN IF NOT EXISTS prev_percentage  numeric,
  ADD COLUMN IF NOT EXISTS attendance       numeric,
  ADD COLUMN IF NOT EXISTS mentor           text,
  ADD COLUMN IF NOT EXISTS notes            text;
