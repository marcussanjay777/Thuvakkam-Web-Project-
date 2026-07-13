-- Run this in Supabase → SQL Editor
-- Adds new columns needed for the expanded SFS 2026 application form

ALTER TABLE students
  ADD COLUMN IF NOT EXISTS referred_by       TEXT,
  ADD COLUMN IF NOT EXISTS referrer_phone    TEXT,
  ADD COLUMN IF NOT EXISTS guardian_name     TEXT,
  ADD COLUMN IF NOT EXISTS state             TEXT,
  ADD COLUMN IF NOT EXISTS email             TEXT,
  ADD COLUMN IF NOT EXISTS student_phone     TEXT,
  ADD COLUMN IF NOT EXISTS school_10th       TEXT,
  ADD COLUMN IF NOT EXISTS school_12th       TEXT,
  ADD COLUMN IF NOT EXISTS college_ug        TEXT,
  ADD COLUMN IF NOT EXISTS college_pg        TEXT,
  ADD COLUMN IF NOT EXISTS other_education   TEXT,
  ADD COLUMN IF NOT EXISTS other_scholarship TEXT,  -- 'Yes' or 'No'
  ADD COLUMN IF NOT EXISTS scholarship_details TEXT,
  ADD COLUMN IF NOT EXISTS awards            TEXT,
  ADD COLUMN IF NOT EXISTS extra_curricular  TEXT,
  ADD COLUMN IF NOT EXISTS family_about      TEXT;

-- Storage bucket for student documents (run once)
-- Go to Supabase → Storage → New bucket → Name: student-documents → Public: ON
-- Then run this policy to allow anon uploads:

CREATE POLICY "anon_can_upload_documents"
  ON storage.objects FOR INSERT TO anon
  WITH CHECK (bucket_id = 'studen-document');
