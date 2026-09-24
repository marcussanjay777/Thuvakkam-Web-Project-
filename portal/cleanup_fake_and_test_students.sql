-- ============================================================
-- One-time cleanup: remove fake seed "students" + QA test rows
-- Run in Supabase SQL Editor
--
-- Removes:
--   - 16 fake seed students created early in development to make the
--     portal look populated (Meena Lakshmi, Priya Devi, etc.) - not real
--     people, some show on the live public "Our Students" page today.
--   - 6 "ZZ ..." rows left over from testing sessions.
-- Keeps: "Sanjay Marcus" - the intentional demo/test account used for
-- the donor-matching demo. Do not delete that one.
--
-- Their documents, academic updates, and any donor matches are deleted
-- automatically along with them (the tables are linked with
-- ON DELETE CASCADE), so this one statement cleans up everything.
-- ============================================================

-- Step 1: run this first to confirm it matches exactly 22 rows before deleting anything
SELECT id, name, status, applied_on
FROM students
WHERE name IN (
  'Padma Mohan','Suresh Kumar','Rekha Devi','Mani Kumar','Selvam Pandian','Anitha Srinivas',
  'Manoj Selvan','Bharathi Priya','Viji Nandini','Rajesh Murugan','Sumathi Arjun','Karthik Raja',
  'Priya Devi','Dinesh Kumar','Meena Lakshmi','Arun Kumar'
)
OR name LIKE 'ZZ %';

-- Step 2: once the count above looks right (22 rows, no "Sanjay Marcus"), run this
DELETE FROM students
WHERE name IN (
  'Padma Mohan','Suresh Kumar','Rekha Devi','Mani Kumar','Selvam Pandian','Anitha Srinivas',
  'Manoj Selvan','Bharathi Priya','Viji Nandini','Rajesh Murugan','Sumathi Arjun','Karthik Raja',
  'Priya Devi','Dinesh Kumar','Meena Lakshmi','Arun Kumar'
)
OR name LIKE 'ZZ %';
