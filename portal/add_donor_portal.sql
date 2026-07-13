-- ============================================================
-- Donor Portal SQL Migration
-- Run in Supabase → SQL Editor
-- ============================================================

-- 1. Donor accounts (linked to Supabase Auth)
CREATE TABLE IF NOT EXISTS donor_accounts (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id   UUID        UNIQUE,
  full_name      TEXT        NOT NULL,
  dob            DATE,
  occupation     TEXT,
  email          TEXT        UNIQUE NOT NULL,
  email_verified BOOLEAN     DEFAULT false,
  created_at     TIMESTAMPTZ DEFAULT now()
);

-- 2. Individual donation records
CREATE TABLE IF NOT EXISTS donations (
  id         UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  donor_id   UUID          NOT NULL REFERENCES donor_accounts(id) ON DELETE CASCADE,
  amount     NUMERIC(12,2) NOT NULL,
  currency   TEXT          DEFAULT 'INR',
  purpose    TEXT          DEFAULT 'General scholarship support',
  txn_ref    TEXT,
  note       TEXT,
  donated_at TIMESTAMPTZ   DEFAULT now()
);

-- 3. Admin-controlled donor ↔ student matches
CREATE TABLE IF NOT EXISTS donor_student_matches (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  donor_id   UUID        NOT NULL REFERENCES donor_accounts(id) ON DELETE CASCADE,
  student_id UUID        NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  matched_by UUID        REFERENCES profiles(id),
  matched_at TIMESTAMPTZ DEFAULT now(),
  notes      TEXT,
  UNIQUE(donor_id, student_id)
);

-- ── RLS ──────────────────────────────────────────────────────

ALTER TABLE donor_accounts        ENABLE ROW LEVEL SECURITY;
ALTER TABLE donations              ENABLE ROW LEVEL SECURITY;
ALTER TABLE donor_student_matches  ENABLE ROW LEVEL SECURITY;

-- donor_accounts: donors read/update their own row
CREATE POLICY "donor_read_own_account"
  ON donor_accounts FOR SELECT TO authenticated
  USING (auth_user_id = auth.uid());

CREATE POLICY "donor_update_own_account"
  ON donor_accounts FOR UPDATE TO authenticated
  USING (auth_user_id = auth.uid());

CREATE POLICY "donor_insert_account"
  ON donor_accounts FOR INSERT TO authenticated
  WITH CHECK (auth_user_id = auth.uid());

-- donor_accounts: portal staff read & manage all
CREATE POLICY "portal_read_all_donor_accounts"
  ON donor_accounts FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid()));

CREATE POLICY "portal_manage_donor_accounts"
  ON donor_accounts FOR ALL TO authenticated
  USING    (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid()));

-- donations: donors manage their own
CREATE POLICY "donor_manage_own_donations"
  ON donations FOR ALL TO authenticated
  USING    (donor_id = (SELECT id FROM donor_accounts WHERE auth_user_id = auth.uid() LIMIT 1))
  WITH CHECK (donor_id = (SELECT id FROM donor_accounts WHERE auth_user_id = auth.uid() LIMIT 1));

-- donations: portal staff read all
CREATE POLICY "portal_read_all_donations"
  ON donations FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid()));

-- donor_student_matches: donors read their own matches
CREATE POLICY "donor_read_own_matches"
  ON donor_student_matches FOR SELECT TO authenticated
  USING (donor_id = (SELECT id FROM donor_accounts WHERE auth_user_id = auth.uid() LIMIT 1));

-- donor_student_matches: portal staff manage all
CREATE POLICY "portal_manage_all_matches"
  ON donor_student_matches FOR ALL TO authenticated
  USING    (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid()));

-- students: donors can read their matched students
CREATE POLICY "donor_read_matched_students"
  ON students FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM donor_student_matches dsm
      JOIN donor_accounts da ON da.id = dsm.donor_id
      WHERE dsm.student_id = students.id
        AND da.auth_user_id = auth.uid()
    )
  );

-- student_updates: donors can read matched students' updates
CREATE POLICY "donor_read_matched_student_updates"
  ON student_updates FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM donor_student_matches dsm
      JOIN donor_accounts da ON da.id = dsm.donor_id
      WHERE dsm.student_id = student_updates.student_id
        AND da.auth_user_id = auth.uid()
    )
  );

-- Allow anon signups for donor registration (Supabase handles this via auth.users)
-- No extra policy needed — donor_accounts insert is handled after auth via authenticated role
