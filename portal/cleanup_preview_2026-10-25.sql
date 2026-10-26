-- ============================================================
-- PREVIEW ONLY - deletes nothing. Safe to run the whole file.
-- Shows the two fake applications made while testing the new form
-- (names start with "TEST " and the email ends @example.com).
-- Send Claude a screenshot; the delete file comes after that.
-- ============================================================

select id, name, email, school, applied_on
from students
where name like 'TEST %' and email like '%@example.com';

select s.name, count(d.id) as documents
from students s
left join documents d on d.student_id = s.id
where s.name like 'TEST %' and s.email like '%@example.com'
group by s.name;
