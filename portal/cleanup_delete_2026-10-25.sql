-- ============================================================
-- DELETES the two fake test applications (TEST Class5Girl, TEST UGGirl)
-- and their document records. Only touches names starting "TEST "
-- with an email ending @example.com - the same rows the preview showed.
-- Run once, after checking the preview.
-- ============================================================

delete from documents
where student_id in (
  select id from students
  where name like 'TEST %' and email like '%@example.com'
);

delete from students
where name like 'TEST %' and email like '%@example.com';

-- Check: should print 0
select count(*) as test_students_left
from students
where name like 'TEST %' and email like '%@example.com';
