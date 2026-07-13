-- Run this in Supabase → SQL Editor
-- Allows anyone (unauthenticated) to submit an application via the public website

CREATE POLICY "public_can_submit_application"
  ON students FOR INSERT TO anon
  WITH CHECK (true);
