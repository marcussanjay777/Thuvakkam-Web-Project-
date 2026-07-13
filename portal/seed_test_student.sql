-- Test student: Sanjay Marcus — run in Supabase → SQL Editor

INSERT INTO students (
  name, initials,
  dob, gender,
  father_name, mother_name, guardian_name,
  annual_income, address, phone,
  referred_by, referrer_phone,
  state, email, student_phone,
  school_10th, school_12th, college_ug, college_pg, other_education,
  other_scholarship, scholarship_details,
  awards, extra_curricular, family_about,
  school, district, class, prev_percentage, attendance,
  status, cycle_year, applied_on
)
VALUES (
  'Sanjay Marcus', 'SM',
  '2005-08-14', 'Male',
  'Marcus Durai', 'Selvi Marcus', 'Marcus Durai',
  85000,
  '12, Gandhi Nagar, 3rd Cross Street, Madurai - 625001',
  '+91 94432 11987',
  'Fr. Thomas Joseph', '+91 98410 55321',
  'Tamil Nadu',
  'arihanthmuthawork@gmail.com',
  '+91 91234 56789',
  'St. Xavier''s Higher Secondary School, Madurai — State Board — 2021 — 94.4%',
  'Govt. Hr. Sec. School, Madurai — State Board — 2023 — 91.8%',
  'The American College, Madurai — B.Sc. Physics (2nd Year)',
  NULL,
  NULL,
  'Yes',
  'Chief Minister''s Merit Scholarship — ₹10,000/year — Tamil Nadu Government — 2022 to 2023',
  'District Science Talent Search Exam — 1st Place (2022); School Topper — 10th Standard (2021); Best Student Award — The American College (2023)',
  'NSS Volunteer (2022–present); School Cricket Team — District Level Finalist (2021); Participated in State-level Science Exhibition (2022); Member of College Nature Club',
  'We are a family of five — my parents, two younger sisters, and myself. My father works as a daily-wage construction labourer and my mother does tailoring from home. Our combined monthly income is around ₹7,000. Both my sisters are in school. My father had a knee injury in 2022 which affected his work for several months, and we took on debt during that period. Despite this, my parents have always prioritised education. I am the first in my family to reach college, and this scholarship would mean I can continue without putting further burden on my family.',
  'The American College, Madurai',
  'Madurai', '2nd Year B.Sc.', 91.8, 96,
  'pending', 2026, '2026-07-09'
);
