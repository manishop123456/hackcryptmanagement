-- FILE: supabase/tests/stage3_rls.sql
-- Automated RLS and Security Acceptance Test Suite for Stage 3 (Attendance Module).
-- Paste this entire file into the Supabase SQL Editor.
-- It executes inside a transaction (BEGIN ... ROLLBACK) so no data is persisted.

begin;

-- Create temporary output table for test assertions
create temp table _test_results (
  test_name text primary key,
  status text not null,
  details text
) on commit drop;

do $$
declare
  v_member_creatives uuid := '11111111-1111-1111-1111-111111111111';
  v_member_pr        uuid := '22222222-2222-2222-2222-222222222222';
  v_lead_creatives   uuid := '33333333-3333-3333-3333-333333333333';
  v_lead_pr          uuid := '44444444-4444-4444-4444-444444444444';
  v_lead_admin       uuid := '55555555-5555-5555-5555-555555555555';
  v_faculty          uuid := '66666666-6666-6666-6666-666666666666';
  v_unapproved       uuid := '77777777-7777-7777-7777-777777777777';

  v_session_creatives uuid := 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
  v_session_pr        uuid := 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';

  v_record_creatives  uuid := 'cccccccc-cccc-cccc-cccc-cccccccccccc';
  v_record_pr         uuid := 'dddddddd-dddd-dddd-dddd-dddddddddddd';

  v_count            integer;
  v_err_caught       boolean;
begin
  -- -------------------------------------------------------------------------
  -- 1. Setup Test Profiles & Attendance Data (as postgres)
  -- -------------------------------------------------------------------------
  insert into public.profiles (id, full_name, email, role, department, is_active)
  values
    (v_member_creatives, 'Test Member Creatives', 'member_creatives@devclub.in', 'member', 'creatives', true),
    (v_member_pr,        'Test Member PR',        'member_pr@devclub.in',        'member', 'pr',        true),
    (v_lead_creatives,   'Test Lead Creatives',   'lead_creatives@devclub.in',   'team_lead', 'creatives', true),
    (v_lead_pr,          'Test Lead PR',          'lead_pr@devclub.in',          'team_lead', 'pr', true),
    (v_lead_admin,       'Test Lead Admin',       'lead_admin@devclub.in',       'team_lead', 'admin', true),
    (v_faculty,          'Test Faculty',          'faculty@devclub.in',          'faculty', null, true);

  -- Insert test attendance sessions
  insert into public.attendance_sessions (id, title, type, department, starts_at, ends_at, venue_lat, venue_lng, radius_m, created_by)
  values
    (v_session_creatives, 'Creatives Review Session', 'work_session', 'creatives', now(), now() + interval '2 hours', 19.2312, 72.8567, 100, v_lead_creatives),
    (v_session_pr,        'PR Press Conference',     'meeting',      'pr',        now(), now() + interval '2 hours', 19.2312, 72.8567, 100, v_lead_pr);

  -- Insert test attendance records (with coordinates)
  insert into public.attendance_records (id, session_id, member_id, status, checked_in_at, lat, lng, accuracy_m, distance_m, method, flags, review)
  values
    (v_record_creatives, v_session_creatives, v_member_creatives, 'present', now(), 19.2312, 72.8567, 10, 5, 'self', '{}', 'not_needed'),
    (v_record_pr,        v_session_pr,        v_member_pr,        'present', now(), 19.2312, 72.8567, 10, 5, 'self', '{}', 'not_needed');

  -- -------------------------------------------------------------------------
  -- 2. Test Member Session Read Scope
  -- -------------------------------------------------------------------------
  execute format('set local request.jwt.claims = %L', json_build_object('sub', v_member_creatives, 'role', 'authenticated')::text);
  set local role authenticated;

  -- Member Creatives reading Creatives session -> Allowed
  select count(*) into v_count from public.attendance_sessions where id = v_session_creatives;
  if v_count = 1 then
    insert into _test_results values ('Session Read: Creatives Member', 'PASS', 'Member can read own department session');
  else
    insert into _test_results values ('Session Read: Creatives Member', 'FAIL', 'Member could not read own department session');
  end if;

  -- Member Creatives reading PR session -> Denied (0 rows)
  select count(*) into v_count from public.attendance_sessions where id = v_session_pr;
  if v_count = 0 then
    insert into _test_results values ('Session Read: Cross-Dept Member', 'PASS', 'Creatives member denied reading PR session (0 rows)');
  else
    insert into _test_results values ('Session Read: Cross-Dept Member', 'FAIL', 'Member leaked cross-dept session');
  end if;

  -- -------------------------------------------------------------------------
  -- 3. Test Session Creation Scope (can_create_session_for)
  -- -------------------------------------------------------------------------
  reset role;
  execute format('set local request.jwt.claims = %L', json_build_object('sub', v_lead_creatives, 'role', 'authenticated')::text);
  set local role authenticated;

  -- Creatives lead creating session for PR -> Denied by RLS
  v_err_caught := false;
  begin
    insert into public.attendance_sessions (title, type, department, starts_at, ends_at, created_by)
    values ('Illegal PR Session', 'meeting', 'pr', now(), now() + interval '1 hour', v_lead_creatives);
  exception when others then
    v_err_caught := true;
  end;

  if v_err_caught then
    insert into _test_results values ('Session Create: Cross-Dept Lead', 'PASS', 'RLS policy blocked Creatives lead from creating PR session');
  else
    insert into _test_results values ('Session Create: Cross-Dept Lead', 'FAIL', 'Creatives lead allowed to create PR session');
  end if;

  -- -------------------------------------------------------------------------
  -- 4. Test Member Direct Record Insert Rejection
  -- -------------------------------------------------------------------------
  reset role;
  execute format('set local request.jwt.claims = %L', json_build_object('sub', v_member_creatives, 'role', 'authenticated')::text);
  set local role authenticated;

  v_err_caught := false;
  begin
    insert into public.attendance_records (session_id, member_id, status)
    values (v_session_creatives, v_member_creatives, 'present');
  exception when others then
    v_err_caught := true;
  end;

  if v_err_caught then
    insert into _test_results values ('Record Insert: Member Direct SQL', 'PASS', 'Blocked direct INSERT into attendance_records (no insert policy)');
  else
    insert into _test_results values ('Record Insert: Member Direct SQL', 'FAIL', 'Member inserted record directly');
  end if;

  -- -------------------------------------------------------------------------
  -- 5. Test Manual Override Permissions (Own Dept vs Cross Dept)
  -- -------------------------------------------------------------------------
  -- Creatives lead overriding Creatives record -> Allowed
  reset role;
  execute format('set local request.jwt.claims = %L', json_build_object('sub', v_lead_creatives, 'role', 'authenticated')::text);
  set local role authenticated;

  update public.attendance_records
  set status = 'late', remark = 'Traffic delay verified by lead', method = 'manual', marked_by = v_lead_creatives
  where id = v_record_creatives;

  get diagnostics v_count = row_count;
  if v_count = 1 then
    insert into _test_results values ('Override: Own Dept Lead', 'PASS', 'Creatives lead overridden Creatives member record with remark');
  else
    insert into _test_results values ('Override: Own Dept Lead', 'FAIL', 'Creatives lead failed to override record');
  end if;

  -- Creatives lead attempting to override PR record -> Denied (0 rows updated)
  update public.attendance_records
  set status = 'late', remark = 'Unauthorized override attempt', method = 'manual', marked_by = v_lead_creatives
  where id = v_record_pr;

  get diagnostics v_count = row_count;
  if v_count = 0 then
    insert into _test_results values ('Override: Cross-Dept Lead', 'PASS', 'Creatives lead blocked from overriding PR member record (0 rows updated)');
  else
    insert into _test_results values ('Override: Cross-Dept Lead', 'FAIL', 'Creatives lead updated PR record');
  end if;

  -- -------------------------------------------------------------------------
  -- 6. Test Admin Lead Scope (Read All, Write Own Only)
  -- -------------------------------------------------------------------------
  reset role;
  execute format('set local request.jwt.claims = %L', json_build_object('sub', v_lead_admin, 'role', 'authenticated')::text);
  set local role authenticated;

  -- Admin lead reads PR attendance record -> Allowed
  select count(*) into v_count from public.attendance_records where id = v_record_pr;
  if v_count = 1 then
    insert into _test_results values ('Admin Lead Read: PR Attendance', 'PASS', 'Admin lead can read PR attendance records');
  else
    insert into _test_results values ('Admin Lead Read: PR Attendance', 'FAIL', 'Admin lead blocked from reading PR attendance');
  end if;

  -- Admin lead attempts to update PR attendance record -> Denied (0 rows updated)
  update public.attendance_records
  set status = 'absent', remark = 'Admin lead write attempt', method = 'manual', marked_by = v_lead_admin
  where id = v_record_pr;

  get diagnostics v_count = row_count;
  if v_count = 0 then
    insert into _test_results values ('Admin Lead Write: PR Attendance', 'PASS', 'Admin lead blocked from modifying PR attendance (0 rows updated)');
  else
    insert into _test_results values ('Admin Lead Write: PR Attendance', 'FAIL', 'Admin lead modified PR attendance');
  end if;

  -- -------------------------------------------------------------------------
  -- 7. Test Guarded Coordinate Access (checkin_coordinates RPC)
  -- -------------------------------------------------------------------------
  -- Creatives member reading checkin_coordinates -> Returns own row only
  reset role;
  execute format('set local request.jwt.claims = %L', json_build_object('sub', v_member_creatives, 'role', 'authenticated')::text);
  set local role authenticated;

  select count(*) into v_count from public.checkin_coordinates(v_session_creatives);
  if v_count = 1 then
    insert into _test_results values ('Coordinates: Member Guarded Read', 'PASS', 'Member sees only own coordinates');
  else
    insert into _test_results values ('Coordinates: Member Guarded Read', 'FAIL', format('Expected 1 row, got %s', v_count));
  end if;

  -- Faculty reading checkin_coordinates -> Returns 0 rows (denied)
  reset role;
  execute format('set local request.jwt.claims = %L', json_build_object('sub', v_faculty, 'role', 'authenticated')::text);
  set local role authenticated;

  select count(*) into v_count from public.checkin_coordinates(v_session_creatives);
  if v_count = 0 then
    insert into _test_results values ('Coordinates: Faculty Read Denied', 'PASS', 'Faculty denied coordinate access (0 rows)');
  else
    insert into _test_results values ('Coordinates: Faculty Read Denied', 'FAIL', 'Faculty leaked coordinates');
  end if;

  -- -------------------------------------------------------------------------
  -- 8. Test Unapproved User Read Isolation
  -- -------------------------------------------------------------------------
  reset role;
  execute format('set local request.jwt.claims = %L', json_build_object('sub', v_unapproved, 'role', 'authenticated')::text);
  set local role authenticated;

  select count(*) into v_count from public.attendance_sessions;
  if v_count = 0 then
    insert into _test_results values ('Unapproved User: Sessions Read', 'PASS', 'Unapproved user sees 0 attendance sessions');
  else
    insert into _test_results values ('Unapproved User: Sessions Read', 'FAIL', 'Unapproved user leaked sessions');
  end if;

  reset role;
end $$;

-- Display formatted test summary table
select
  test_name as "Test Scenario",
  status    as "Result",
  details   as "Details"
from _test_results
order by test_name;

-- Abort transaction to ensure NOTHING is persisted to the database
rollback;
