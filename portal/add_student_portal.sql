-- Run this in Supabase → SQL Editor
-- Sets up the student portal: auth linkage + academic updates table + RLS policies

-- 1. Link students to their Supabase auth accounts
ALTER TABLE students
  ADD COLUMN IF NOT EXISTS auth_user_id          UUID UNIQUE,
  ADD COLUMN IF NOT EXISTS student_login_email   TEXT,
  ADD COLUMN IF NOT EXISTS credentials_issued_at TIMESTAMPTZ;

-- 2. Running academic updates log
CREATE TABLE IF NOT EXISTS student_updates (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id  UUID        NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  category    TEXT        NOT NULL,  -- grade | exam | olympiad | achievement | extracurricular | other
  title       TEXT        NOT NULL,
  score       TEXT,
  description TEXT,
  record_date DATE,
  proof_url   TEXT,
  created_at  TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE student_updates ENABLE ROW LEVEL SECURITY;

-- Students can insert / update / delete only their own updates
CREATE POLICY "student_manage_own_updates"
  ON student_updates FOR ALL TO authenticated
  USING (
    student_id = (SELECT id FROM students WHERE auth_user_id = auth.uid() LIMIT 1)
  )
  WITH CHECK (
    student_id = (SELECT id FROM students WHERE auth_user_id = auth.uid() LIMIT 1)
  );

-- Portal staff (exist in profiles table) can read all updates
CREATE POLICY "portal_staff_read_updates"
  ON student_updates FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid()));

-- Students can read their own student record via the student portal
CREATE POLICY "student_read_own_record"
  ON students FOR SELECT TO authenticated
  USING (auth_user_id = auth.uid());
