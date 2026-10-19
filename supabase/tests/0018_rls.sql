-- FILE: supabase/tests/0018_rls.sql
-- Database-Level RLS & Security Acceptance Test Suite for Migration 0018
-- Paste into Supabase SQL Editor or run via psql / supabase test db.
-- Executes inside a transaction (BEGIN ... ROLLBACK) so no data is persisted.

begin;

-- Create temporary output table for test assertions
create temp table _test_results_0018 (
  test_name text primary key,
  status text not null,
  details text
) on commit drop;

do $$
declare
  v_member_dev   uuid := '11111111-1111-1111-1111-111111111111';
  v_member_pr    uuid := '22222222-2222-2222-2222-222222222222';
  v_cohead_dev   uuid := '33333333-3333-3333-3333-333333333333';
  v_cohead_mgmt  uuid := '44444444-4444-4444-4444-444444444444';
  v_lead_pr      uuid := '55555555-5555-5555-5555-555555555555';
  v_president    uuid := '66666666-6666-6666-6666-666666666666';

  v_report_dev   uuid := 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
  v_report_pr    uuid := 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
  v_post_social  uuid := 'cccccccc-cccc-cccc-cccc-cccccccccccc';

  v_count        integer;
  v_err_caught   boolean;
begin
  -- -------------------------------------------------------------------------
  -- 1. Setup Test Profiles & Baseline Data (as postgres superuser)
  -- -------------------------------------------------------------------------
  insert into public.profiles (id, full_name, email, role, department, is_active)
  values
    (v_member_dev,  'Dev Member',      'dev_member@devclub.in',  'member',              'development', true),
    (v_member_pr,   'PR Member',       'pr_member@devclub.in',   'member',              'pr',          true),
    (v_cohead_dev,  'Dev CoHead',      'dev_cohead@devclub.in',  'development_co_head', 'development', true),
    (v_cohead_mgmt, 'Mgmt CoHead',     'mgmt_cohead@devclub.in', 'management_co_head',  'admin',       true),
    (v_lead_pr,     'PR Lead',         'pr_lead@devclub.in',     'team_lead',           'pr',          true),
    (v_president,   'Club President',  'pres@devclub.in',        'president',           null,          true);

  -- Insert daily reports
  insert into public.daily_reports (id, user_id, report_date, summary, total_time_minutes, status)
  values
    (v_report_dev, v_member_dev, '2026-10-10', 'Worked on DevClub App Router refactoring.', 120, 'submitted'),
    (v_report_pr,  v_member_pr,  '2026-10-10', 'Drafted press release for HackCrypt.',      90,  'submitted');

  -- Insert social media post
  insert into public.social_media_posts (id, title, platform, publishing_deadline, status, content_owner_id)
  values
    (v_post_social, 'HackCrypt Teaser Reel', 'instagram', now() + interval '2 days', 'draft', v_member_pr);

  -- -------------------------------------------------------------------------
  -- TEST 1: Unique Constraint on Daily Reports (1 report per user per date)
  -- -------------------------------------------------------------------------
  v_err_caught := false;
  begin
    insert into public.daily_reports (user_id, report_date, summary)
    values (v_member_dev, '2026-10-10', 'Duplicate report attempt for same date');
  exception when unique_violation then
    v_err_caught := true;
  end;

  if v_err_caught then
    insert into _test_results_0018 values ('DB Test 1: Unique Daily Report Constraint', 'PASS', 'Postgres unique constraint daily_reports_user_date_key rejected duplicate report');
  else
    insert into _test_results_0018 values ('DB Test 1: Unique Daily Report Constraint', 'FAIL', 'Duplicate report inserted into daily_reports');
  end if;

  -- -------------------------------------------------------------------------
  -- TEST 2: Member Reading & Modifying Another Member's Daily Report
  -- -------------------------------------------------------------------------
  reset role;
  execute format('set local request.jwt.claims = %L', json_build_object('sub', v_member_dev, 'role', 'authenticated')::text);
  set local role authenticated;

  -- Dev member reading PR member report -> Denied (0 rows)
  select count(*) into v_count from public.daily_reports where id = v_report_pr;
  if v_count = 0 then
    insert into _test_results_0018 values ('DB Test 2a: Member Read Other Report', 'PASS', 'RLS blocked Dev member from reading PR member daily report (0 rows)');
  else
    insert into _test_results_0018 values ('DB Test 2a: Member Read Other Report', 'FAIL', 'Dev member leaked PR member daily report');
  end if;

  -- Dev member modifying PR member report -> Denied (0 rows updated)
  update public.daily_reports set summary = 'Hacked summary content' where id = v_report_pr;
  get diagnostics v_count = row_count;
  if v_count = 0 then
    insert into _test_results_0018 values ('DB Test 2b: Member Modify Other Report', 'PASS', 'RLS blocked Dev member from modifying PR member daily report (0 rows updated)');
  else
    insert into _test_results_0018 values ('DB Test 2b: Member Modify Other Report', 'FAIL', 'Dev member updated PR member report');
  end if;

  -- -------------------------------------------------------------------------
  -- TEST 3: Department & Co-Head Report Review Boundaries
  -- -------------------------------------------------------------------------
  -- Dev CoHead reviewing Dev member report -> Allowed
  reset role;
  execute format('set local request.jwt.claims = %L', json_build_object('sub', v_cohead_dev, 'role', 'authenticated')::text);
  set local role authenticated;

  update public.daily_reports set status = 'reviewed', reviewer_id = v_cohead_dev, reviewed_at = now() where id = v_report_dev;
  get diagnostics v_count = row_count;
  if v_count = 1 then
    insert into _test_results_0018 values ('DB Test 3a: Dev CoHead Review Dev Report', 'PASS', 'Dev CoHead approved Dev member report');
  else
    insert into _test_results_0018 values ('DB Test 3a: Dev CoHead Review Dev Report', 'FAIL', 'Dev CoHead blocked from reviewing Dev report');
  end if;

  -- Dev CoHead reviewing PR member report -> Denied (0 rows updated)
  update public.daily_reports set status = 'reviewed', reviewer_id = v_cohead_dev, reviewed_at = now() where id = v_report_pr;
  get diagnostics v_count = row_count;
  if v_count = 0 then
    insert into _test_results_0018 values ('DB Test 3b: Dev CoHead Review PR Report', 'PASS', 'RLS blocked Dev CoHead from reviewing PR report (0 rows updated)');
  else
    insert into _test_results_0018 values ('DB Test 3b: Dev CoHead Review PR Report', 'FAIL', 'Dev CoHead improperly reviewed PR report');
  end if;

  -- Management CoHead reviewing PR member report -> Allowed
  reset role;
  execute format('set local request.jwt.claims = %L', json_build_object('sub', v_cohead_mgmt, 'role', 'authenticated')::text);
  set local role authenticated;

  update public.daily_reports set status = 'reviewed', reviewer_id = v_cohead_mgmt, reviewed_at = now() where id = v_report_pr;
  get diagnostics v_count = row_count;
  if v_count = 1 then
    insert into _test_results_0018 values ('DB Test 3c: Mgmt CoHead Review PR Report', 'PASS', 'Management CoHead approved PR member report');
  else
    insert into _test_results_0018 values ('DB Test 3c: Mgmt CoHead Review PR Report', 'FAIL', 'Management CoHead blocked from reviewing PR report');
  end if;

  -- -------------------------------------------------------------------------
  -- TEST 4: Member Creating/Approving Unauthorized Social Media Posts
  -- -------------------------------------------------------------------------
  -- Dev member creating social media post -> Denied by RLS
  reset role;
  execute format('set local request.jwt.claims = %L', json_build_object('sub', v_member_dev, 'role', 'authenticated')::text);
  set local role authenticated;

  v_err_caught := false;
  begin
    insert into public.social_media_posts (title, platform, publishing_deadline, content_owner_id)
    values ('Unauthorized Reel', 'instagram', now() + interval '1 day', v_member_dev);
  exception when others then
    v_err_caught := true;
  end;

  if v_err_caught then
    insert into _test_results_0018 values ('DB Test 4a: Member Create Social Post', 'PASS', 'RLS blocked non-social media member from creating post');
  else
    insert into _test_results_0018 values ('DB Test 4a: Member Create Social Post', 'FAIL', 'Non-social media member created post');
  end if;

  -- -------------------------------------------------------------------------
  -- TEST 5: Member Modifying Protected Profile Role or Department Fields
  -- -------------------------------------------------------------------------
  reset role;
  execute format('set local request.jwt.claims = %L', json_build_object('sub', v_member_dev, 'role', 'authenticated')::text);
  set local role authenticated;

  update public.profiles set role = 'president' where id = v_member_dev;
  get diagnostics v_count = row_count;
  if v_count = 0 then
    insert into _test_results_0018 values ('DB Test 5: Member Change Own Role', 'PASS', 'RLS policy profiles_update_managers blocked member from self-escalating role to president');
  else
    insert into _test_results_0018 values ('DB Test 5: Member Change Own Role', 'FAIL', 'Member successfully updated own profile role');
  end if;

  reset role;
end $$;

-- Display formatted test summary table
select
  test_name as "Test Scenario",
  status    as "Result",
  details   as "Details"
from _test_results_0018
order by test_name;

-- Abort transaction to ensure NOTHING is persisted to the database
rollback;
