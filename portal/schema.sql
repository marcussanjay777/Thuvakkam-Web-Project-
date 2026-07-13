-- ============================================================
-- Thuvakkam Education — SFS Portal
-- Run this in: Supabase Dashboard → SQL Editor → New query
-- ============================================================

-- TABLES -------------------------------------------------------

CREATE TABLE IF NOT EXISTS students (
  id          uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  name        text        NOT NULL,
  initials    text,
  school      text        NOT NULL,
  district    text        NOT NULL,
  class       text        NOT NULL,
  status      text        NOT NULL DEFAULT 'pending'
                          CHECK (status IN ('pending','selected','rejected')),
  cycle_year  integer     NOT NULL DEFAULT 2026,
  applied_on  date        DEFAULT CURRENT_DATE,
  outcome     text,
  created_at  timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS documents (
  id           uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id   uuid        REFERENCES students(id) ON DELETE CASCADE,
  student_name text        NOT NULL,
  type         text        NOT NULL,
  uploaded_at  date        DEFAULT CURRENT_DATE,
  status       text        NOT NULL DEFAULT 'pending'
                           CHECK (status IN ('verified','pending','incomplete')),
  file_url     text,
  created_at   timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS donors (
  id                 uuid    DEFAULT gen_random_uuid() PRIMARY KEY,
  name               text    NOT NULL,
  tier               text    NOT NULL CHECK (tier IN ('supporter','champion','patron')),
  amount             numeric NOT NULL,
  country            text    DEFAULT 'India',
  active             boolean DEFAULT true,
  students_sponsored integer DEFAULT 0,
  created_at         timestamptz DEFAULT now()
);

-- ROW LEVEL SECURITY -------------------------------------------

ALTER TABLE students  ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE donors    ENABLE ROW LEVEL SECURITY;

-- Authenticated users can read and write everything
CREATE POLICY "auth_select_students"  ON students  FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_insert_students"  ON students  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth_update_students"  ON students  FOR UPDATE TO authenticated USING (true);

CREATE POLICY "auth_select_documents" ON documents FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_insert_documents" ON documents FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth_update_documents" ON documents FOR UPDATE TO authenticated USING (true);

CREATE POLICY "auth_select_donors"    ON donors    FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_insert_donors"    ON donors    FOR INSERT TO authenticated WITH CHECK (true);

-- SEED DATA — STUDENTS -----------------------------------------

INSERT INTO students (name, initials, school, district, class, status, cycle_year, applied_on) VALUES
('Arun Kumar',     'AK', 'Avvai School',                  'Chennai',         '10th', 'pending',  2026, '2026-05-02'),
('Meena Lakshmi',  'ML', 'Govt. HSS Ramanathapuram',      'Ramanathapuram',  '11th', 'selected', 2026, '2026-04-28'),
('Dinesh Kumar',   'DK', 'Panchayat Union School',        'Madurai',         '12th', 'selected', 2026, '2026-04-25'),
('Priya Devi',     'PD', 'Govt. Girls HSS',               'Tirunelveli',     '9th',  'selected', 2026, '2026-04-22'),
('Karthik Raja',   'KR', 'Municipal School',              'Coimbatore',      '10th', 'pending',  2026, '2026-04-20'),
('Sumathi Arjun',  'SA', 'Avvai School',                  'Chennai',         '11th', 'rejected', 2026, '2026-04-18'),
('Rajesh Murugan', 'RM', 'Panchayat Union School',        'Salem',           '12th', 'selected', 2026, '2026-04-15'),
('Viji Nandini',   'VN', 'Govt. Higher Sec. School',      'Thanjavur',       '10th', 'pending',  2026, '2026-04-12'),
('Bharathi Priya', 'BP', 'Govt. Girls HSS Villupuram',    'Villupuram',      '11th', 'selected', 2026, '2026-04-10'),
('Manoj Selvan',   'MS', 'Municipal Higher Sec. School',  'Madurai',         '12th', 'pending',  2026, '2026-04-08');

INSERT INTO students (name, initials, school, district, class, status, cycle_year, applied_on, outcome) VALUES
('Selvam Pandian',  'SP', 'Govt. HSS Villupuram', 'Villupuram', '12th', 'selected', 2025, '2025-04-10', 'Pursuing B.Sc. Computer Science'),
('Anitha Srinivas', 'AS', 'Govt. Girls HS',       'Thanjavur',  '12th', 'selected', 2025, '2025-04-12', 'Pursuing B.Com.'),
('Mani Kumar',      'MK', 'Municipal School',      'Vellore',    '12th', 'selected', 2024, '2024-04-20', 'Pursuing B.E. Mechanical'),
('Rekha Devi',      'RD', 'Panchayat Union School','Madurai',    '12th', 'selected', 2024, '2024-04-18', 'Pursuing B.A. Tamil'),
('Suresh Kumar',    'SK', 'Govt. Boys HSS',        'Salem',      '12th', 'selected', 2023, '2023-04-15', 'Employed — Textile sector'),
('Padma Mohan',     'PM', 'Govt. Girls HSS',       'Coimbatore', '12th', 'selected', 2023, '2023-04-10', 'Pursuing B.Sc. Nursing');

-- SEED DATA — DOCUMENTS ----------------------------------------

INSERT INTO documents (student_name, type, uploaded_at, status) VALUES
('Arun Kumar',     'Income Certificate',       '2026-05-02', 'pending'),
('Meena Lakshmi',  'Aadhaar Card',             '2026-04-28', 'verified'),
('Meena Lakshmi',  'Marksheet',                '2026-04-28', 'verified'),
('Dinesh Kumar',   'Transfer Certificate',     '2026-04-25', 'verified'),
('Dinesh Kumar',   'Income Certificate',       '2026-04-25', 'verified'),
('Priya Devi',     'Marksheet',                '2026-04-22', 'verified'),
('Priya Devi',     'Community Certificate',    '2026-04-22', 'pending'),
('Karthik Raja',   'Community Certificate',    '2026-04-20', 'pending'),
('Karthik Raja',   'Bank Passbook',            '2026-04-20', 'incomplete'),
('Rajesh Murugan', 'Income Certificate',       '2026-04-15', 'verified'),
('Rajesh Murugan', 'Aadhaar Card',             '2026-04-15', 'verified'),
('Bharathi Priya', 'Transfer Certificate',     '2026-04-10', 'pending');

-- SEED DATA — DONORS -------------------------------------------

INSERT INTO donors (name, tier, amount, country, students_sponsored) VALUES
('Rajan Family Foundation', 'patron',    150000, 'India',     6),
('Anand Krishnan',          'champion',   18000, 'USA',       1),
('Priya Subramaniam',       'champion',   18000, 'UK',        1),
('Senthil Nathan',          'champion',   18000, 'India',     1),
('Meera & Vikram',          'champion',   18000, 'Canada',    1),
('Chennai Tech Group',      'patron',    100000, 'India',     5),
('Lakshmi Venkat',          'supporter',   5000, 'Australia', 0),
('Kumar & Associates',      'supporter',   5000, 'India',     0),
('NRI Tamil Foundation',    'patron',    200000, 'USA',       10),
('Prabhakaran Trust',       'champion',   18000, 'UAE',       1);
