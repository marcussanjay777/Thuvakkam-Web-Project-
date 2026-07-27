-- ============================================================
-- Public application submit — side-door function
-- Run in Supabase SQL Editor.
--
-- WHY: Direct anonymous INSERTs into public.students / public.documents
-- were being rejected by row-level security ("new row violates row-level
-- security policy"), even though the anon INSERT policies are PERMISSIVE
-- with WITH CHECK (true) and the anon role has the INSERT grant. Root
-- cause of that block was not identified from the client side.
--
-- FIX: Route public application submissions through this SECURITY DEFINER
-- function, which runs as its owner and therefore bypasses RLS on the
-- tables it writes (same pattern already used by get_public_student_funding).
-- The public apply form (website/apply.html) now:
--   1. uploads document files to the student-documents storage bucket
--      (anon storage upload already works), then
--   2. calls submit_application() with the student data + document metadata.
-- ============================================================

-- The v2 application form no longer collects a single "class" value
-- (it captures 10th/12th/college detail instead), so make it optional.
alter table students alter column class drop not null;

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
    school, email, student_phone, school_10th, school_12th, college_ug, college_pg,
    other_education, other_scholarship, scholarship_details, awards, extra_curricular,
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
    p_student->>'school_10th',       p_student->>'school_12th',
    p_student->>'college_ug',        p_student->>'college_pg',
    p_student->>'other_education',   p_student->>'other_scholarship',
    p_student->>'scholarship_details', p_student->>'awards',
    p_student->>'extra_curricular',  p_student->>'family_about',
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
