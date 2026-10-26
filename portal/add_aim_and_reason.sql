-- ============================================================
-- Two new application questions:
--   1. "What is your biggest aim and future plan?"   -> students.future_aim
--   2. "Why should we give you the scholarship?"     -> students.why_scholarship
-- Run once in Supabase SQL Editor. Safe to re-run.
--
-- Adds the two columns and teaches submit_application() to save them.
-- Everything else in the function is unchanged from add_alternate_phone.sql.
-- ============================================================

alter table students add column if not exists future_aim text;
alter table students add column if not exists why_scholarship text;

create or replace function submit_application(
  p_student   jsonb,
  p_documents jsonb default '[]'::jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  new_id uuid;
begin
  new_id := coalesce(nullif(p_student->>'id','')::uuid, gen_random_uuid());

  insert into students (
    id, name, initials, dob, gender, father_name, mother_name, annual_income,
    address, phone, referred_by, referrer_phone, guardian_name, state, district,
    school, email, student_phone, alternate_phone, school_10th, school_12th, college_ug, college_pg,
    other_education, other_scholarship, scholarship_details, awards, extra_curricular,
    future_aim, why_scholarship,
    family_about, status, cycle_year, applied_on
  ) values (
    new_id,
    p_student->>'name',              p_student->>'initials',
    nullif(p_student->>'dob','')::date,          p_student->>'gender',
    p_student->>'father_name',       p_student->>'mother_name',
    nullif(p_student->>'annual_income','')::numeric,
    p_student->>'address',           p_student->>'phone',
    p_student->>'referred_by',       p_student->>'referrer_phone',
    p_student->>'guardian_name',     p_student->>'state',
    p_student->>'district',          p_student->>'school',
    p_student->>'email',             p_student->>'student_phone',
    p_student->>'alternate_phone',
    p_student->>'school_10th',       p_student->>'school_12th',
    p_student->>'college_ug',        p_student->>'college_pg',
    p_student->>'other_education',   p_student->>'other_scholarship',
    p_student->>'scholarship_details', p_student->>'awards',
    p_student->>'extra_curricular',
    p_student->>'future_aim',        p_student->>'why_scholarship',
    p_student->>'family_about',
    'pending',
    coalesce(nullif(p_student->>'cycle_year','')::int, 2026),
    coalesce(nullif(p_student->>'applied_on','')::date, current_date)
  );

  if p_documents is not null and jsonb_array_length(p_documents) > 0 then
    insert into documents (student_id, student_name, type, file_url, status, uploaded_at)
    select new_id, p_student->>'name', d->>'type', d->>'file_url', 'pending', now()
    from jsonb_array_elements(p_documents) as d;
  end if;

  return new_id;
end;
$$;

grant execute on function submit_application(jsonb, jsonb) to anon;

-- Check: should print two rows, future_aim and why_scholarship (both text)
select column_name, data_type
from information_schema.columns
where table_name = 'students' and column_name in ('future_aim', 'why_scholarship');
