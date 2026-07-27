-- ============================================================
-- Public general-donation submit — side-door function
-- Run in Supabase SQL Editor.
--
-- Same reason as add_submit_application_rpc.sql: direct anonymous INSERT
-- into general_donations was rejected by RLS despite a PERMISSIVE anon
-- policy with WITH CHECK (true) + the INSERT grant. Route the public
-- donation form through this SECURITY DEFINER function instead.
-- website/general-donate.html now calls this RPC.
-- ============================================================

create or replace function submit_general_donation(
  p_full_name text,
  p_email     text,
  p_amount    numeric,
  p_note      text default null,
  p_currency  text default 'INR'
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  new_id uuid;
begin
  insert into general_donations (full_name, email, amount, currency, note)
  values (p_full_name, p_email, p_amount, coalesce(p_currency, 'INR'), p_note)
  returning id into new_id;
  return new_id;
end;
$$;

grant execute on function submit_general_donation(text, text, numeric, text, text) to anon;
