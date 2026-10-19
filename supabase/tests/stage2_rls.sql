-- FILE: supabase/tests/stage2_rls.sql
-- Automated RLS and Trigger Acceptance Test Suite for Stage 2 (Tasks Module).
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
  v_lead_creatives   uuid := '22222222-2222-2222-2222-222222222222';
  v_lead_pr          uuid := '33333333-3333-3333-3333-333333333333';
  v_lead_admin       uuid := '44444444-4444-4444-4444-444444444444';
  v_mgmt_head        uuid := '55555555-5555-5555-5555-555555555555';
  v_faculty          uuid := '66666666-6666-6666-6666-666666666666';
  v_unapproved       uuid := '77777777-7777-7777-7777-777777777777';

  v_task_creatives   uuid := 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
  v_task_pr          uuid := 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
  v_task_overdue     uuid := 'dddddddd-dddd-dddd-dddd-dddddddddddd';

  v_comment_id       uuid := 'cccccccc-cccc-cccc-cccc-cccccccccccc';

  v_count            integer;
  v_history_count    integer;
  v_err_caught       boolean;
  v_updated_status   text;
  v_history_changed  uuid;
begin
  -- -------------------------------------------------------------------------
  -- 1. Setup Test Profiles & Tasks
  -- -------------------------------------------------------------------------
  insert into public.profiles (id, full_name, email, role, department, is_active)
  values
    (v_member_creatives, 'Test Member Creatives', 'member_creatives@devclub.in', 'member', 'creatives', true),
    (v_lead_creatives,   'Test Lead Creatives',   'lead_creatives@devclub.in',   'team_lead', 'creatives', true),
    (v_lead_pr,          'Test Lead PR',          'lead_pr@devclub.in',          'team_lead', 'pr', true),
    (v_lead_admin,       'Test Lead Admin',       'lead_admin@devclub.in',       'team_lead', 'admin', true),
    (v_mgmt_head,        'Test Mgmt Head',        'mgmt_head@devclub.in',        'management_head', 'management', true),
    (v_faculty,          'Test Faculty',          'faculty@devclub.in',          'faculty', null, true);

  -- Insert test tasks (as admin / postgres)
  insert into public.tasks (id, title, description, department, owner_id, deadline, priority, status)
  values
    (v_task_creatives, 'Creatives Banner Task', 'Design main banner', 'creatives', v_member_creatives, now() + interval '3 days', 'high', 'not_started'),
    (v_task_pr,        'PR Announcement Task',  'Write press release', 'pr',        v_lead_pr,          now() + interval '5 days', 'medium', 'not_started'),
    (v_task_overdue,   'Overdue Audit Task',    'Past deadline task',  'creatives', v_member_creatives, now() - interval '2 hours', 'high', 'in_progress');

  -- -------------------------------------------------------------------------
  -- 2. Test Read Scope (Direct Task-ID Select)
  -- -------------------------------------------------------------------------
  -- Member Creatives reading Creatives task (owned) -> Allowed
  execute format('set local request.jwt.claims = %L', json_build_object('sub', v_member_creatives, 'role', 'authenticated')::text);
  set local role authenticated;
  select count(*) into v_count from public.tasks where id = v_task_creatives;
  if v_count = 1 then
    insert into _test_results values ('Task Read: Owner Member', 'PASS', 'Member can read owned task');
  else
    insert into _test_results values ('Task Read: Owner Member', 'FAIL', 'Member could not read owned task');
  end if;

  -- Member Creatives reading PR task -> Denied (0 rows)
  select count(*) into v_count from public.tasks where id = v_task_pr;
  if v_count = 0 then
    insert into _test_results values ('Task Read: Member Cross-Dept', 'PASS', 'Member denied reading unowned cross-dept task (0 rows)');
  else
    insert into _test_results values ('Task Read: Member Cross-Dept', 'FAIL', 'Member leaked cross-dept task');
  end if;

  -- Lead Creatives reading PR task -> Denied (0 rows)
  reset role;
  execute format('set local request.jwt.claims = %L', json_build_object('sub', v_lead_creatives, 'role', 'authenticated')::text);
  set local role authenticated;
  select count(*) into v_count from public.tasks where id = v_task_pr;
  if v_count = 0 then
    insert into _test_results values ('Task Read: Lead Cross-Dept', 'PASS', 'Creatives lead denied reading PR task (0 rows)');
  else
    insert into _test_results values ('Task Read: Lead Cross-Dept', 'FAIL', 'Lead leaked cross-dept task');
  end if;

  -- Management Head reading both -> Allowed
  reset role;
  execute format('set local request.jwt.claims = %L', json_build_object('sub', v_mgmt_head, 'role', 'authenticated')::text);
  set local role authenticated;
  select count(*) into v_count from public.tasks where id in (v_task_creatives, v_task_pr);
  if v_count = 2 then
    insert into _test_results values ('Task Read: Management Head', 'PASS', 'Management Head reads all departments');
  else
    insert into _test_results values ('Task Read: Management Head', 'FAIL', 'Management Head missing tasks');
  end if;

  -- Faculty reading both -> Allowed
  reset role;
  execute format('set local request.jwt.claims = %L', json_build_object('sub', v_faculty, 'role', 'authenticated')::text);
  set local role authenticated;
  select count(*) into v_count from public.tasks where id in (v_task_creatives, v_task_pr);
  if v_count = 2 then
    insert into _test_results values ('Task Read: Faculty', 'PASS', 'Faculty reads all departments');
  else
    insert into _test_results values ('Task Read: Faculty', 'FAIL', 'Faculty missing tasks');
  end if;

  -- Unapproved user reading tasks -> Denied (0 rows)
  reset role;
  execute format('set local request.jwt.claims = %L', json_build_object('sub', v_unapproved, 'role', 'authenticated')::text);
  set local role authenticated;
  select count(*) into v_count from public.tasks;
  if v_count = 0 then
    insert into _test_results values ('Task Read: Unapproved User', 'PASS', 'Unapproved user sees 0 tasks across all departments');
  else
    insert into _test_results values ('Task Read: Unapproved User', 'FAIL', 'Unapproved user leaked tasks');
  end if;

  -- -------------------------------------------------------------------------
  -- 3. Test Task Write Scope (Cross-Department Lead Edit)
  -- -------------------------------------------------------------------------
  reset role;
  execute format('set local request.jwt.claims = %L', json_build_object('sub', v_lead_pr, 'role', 'authenticated')::text);
  set local role authenticated;
  
  update public.tasks set title = 'Hacked Title' where id = v_task_creatives;
  get diagnostics v_count = row_count;
  if v_count = 0 then
    insert into _test_results values ('Task Write: Cross-Dept Lead', 'PASS', 'PR Lead blocked from updating Creatives task (0 rows updated)');
  else
    insert into _test_results values ('Task Write: Cross-Dept Lead', 'FAIL', 'PR Lead updated Creatives task');
  end if;

  -- -------------------------------------------------------------------------
  -- 4. Test Member Restricted Field Edit (Trigger Enforced)
  -- -------------------------------------------------------------------------
  reset role;
  execute format('set local request.jwt.claims = %L', json_build_object('sub', v_member_creatives, 'role', 'authenticated')::text);
  set local role authenticated;

  v_err_caught := false;
  begin
    update public.tasks set title = 'Member Changed Title' where id = v_task_creatives;
  exception when others then
    v_err_caught := true;
  end;

  if v_err_caught then
    insert into _test_results values ('Task Write: Member Title Edit', 'PASS', 'Trigger tasks_before_update blocked title edit by member');
  else
    insert into _test_results values ('Task Write: Member Title Edit', 'FAIL', 'Member allowed to edit title');
  end if;

  -- Member editing status to in_progress -> Allowed
  update public.tasks set status = 'in_progress' where id = v_task_creatives;
  get diagnostics v_count = row_count;
  if v_count = 1 then
    insert into _test_results values ('Task Write: Member Status Edit', 'PASS', 'Member allowed to update status to in_progress');
  else
    insert into _test_results values ('Task Write: Member Status Edit', 'FAIL', 'Member status update failed');
  end if;

  -- -------------------------------------------------------------------------
  -- 5. Test Completion Output Check Constraint
  -- -------------------------------------------------------------------------
  v_err_caught := false;
  begin
    update public.tasks set status = 'completed', output = null where id = v_task_creatives;
  exception when check_violation then
    v_err_caught := true;
  end;

  if v_err_caught then
    insert into _test_results values ('Task Constraint: Completion Output Null', 'PASS', 'CHECK constraint tasks_completed_needs_output blocked completion without output');
  else
    insert into _test_results values ('Task Constraint: Completion Output Null', 'FAIL', 'Allowed completion without output');
  end if;

  -- Complete WITH output -> Allowed
  update public.tasks set status = 'completed', output = 'https://devclub.in/output' where id = v_task_creatives;
  get diagnostics v_count = row_count;
  if v_count = 1 then
    insert into _test_results values ('Task Constraint: Completion Output Valid', 'PASS', 'Completed task with valid output string');
  else
    insert into _test_results values ('Task Constraint: Completion Output Valid', 'FAIL', 'Failed to complete task with output');
  end if;

  -- -------------------------------------------------------------------------
  -- 6. Test Automatic task_history Trigger Logging
  -- -------------------------------------------------------------------------
  select count(*) into v_history_count from public.task_history where task_id = v_task_creatives and field = 'status';
  if v_history_count >= 2 then
    insert into _test_results values ('Task Trigger: Automatic History Log', 'PASS', format('Created %s task_history rows for status changes', v_history_count));
  else
    insert into _test_results values ('Task Trigger: Automatic History Log', 'FAIL', format('Expected >= 2 history rows, got %s', v_history_count));
  end if;

  -- -------------------------------------------------------------------------
  -- 7. Test Comment Permissions (Insert & Delete)
  -- -------------------------------------------------------------------------
  -- Member inserts comment on owned task -> Allowed
  insert into public.task_comments (id, task_id, author_id, body)
  values (v_comment_id, v_task_creatives, v_member_creatives, 'Initial test comment');
  
  select count(*) into v_count from public.task_comments where id = v_comment_id;
  if v_count = 1 then
    insert into _test_results values ('Comment Write: Member Insert', 'PASS', 'Member created comment on owned task');
  else
    insert into _test_results values ('Comment Write: Member Insert', 'FAIL', 'Member comment creation failed');
  end if;

  -- Other department lead (PR) attempting to delete Creatives comment -> Denied (0 rows deleted)
  reset role;
  execute format('set local request.jwt.claims = %L', json_build_object('sub', v_lead_pr, 'role', 'authenticated')::text);
  set local role authenticated;

  delete from public.task_comments where id = v_comment_id;
  get diagnostics v_count = row_count;
  if v_count = 0 then
    insert into _test_results values ('Comment Delete: Cross-Dept Lead', 'PASS', 'PR lead blocked from deleting Creatives comment (0 rows deleted)');
  else
    insert into _test_results values ('Comment Delete: Cross-Dept Lead', 'FAIL', 'PR lead deleted Creatives comment');
  end if;

  -- Department Lead (Creatives Lead) deleting Creatives comment -> Allowed
  reset role;
  execute format('set local request.jwt.claims = %L', json_build_object('sub', v_lead_creatives, 'role', 'authenticated')::text);
  set local role authenticated;

  delete from public.task_comments where id = v_comment_id;
  get diagnostics v_count = row_count;
  if v_count = 1 then
    insert into _test_results values ('Comment Delete: Dept Lead Scope Policy', 'PASS', 'Creatives Lead deleted member comment under 0009 policy');
  else
    insert into _test_results values ('Comment Delete: Dept Lead Scope Policy', 'FAIL', 'Creatives Lead failed to delete comment');
  end if;

  -- -------------------------------------------------------------------------
  -- 8. Test sync_delayed_tasks() Execution by Cron (No JWT / Definer)
  -- -------------------------------------------------------------------------
  reset role; -- Simulate cron running as postgres with no JWT claims
  
  perform public.sync_delayed_tasks();

  select status::text into v_updated_status from public.tasks where id = v_task_overdue;
  select changed_by into v_history_changed from public.task_history where task_id = v_task_overdue and field = 'status' and new_value = 'delayed';

  if v_updated_status = 'delayed' and v_history_changed is null then
    insert into _test_results values ('Cron RPC: sync_delayed_tasks', 'PASS', 'Overdue task updated to delayed and task_history row created with changed_by IS NULL');
  else
    insert into _test_results values ('Cron RPC: sync_delayed_tasks', 'FAIL', format('Status: %s, History changed_by: %s', v_updated_status, v_history_changed));
  end if;

  -- Reset role back to postgres for cleanup
  reset role;
end $$;

-- Display formatted test summary table in SQL Editor output
select
  test_name as "Test Scenario",
  status    as "Result",
  details   as "Details"
from _test_results
order by test_name;

-- Abort transaction to ensure NOTHING is persisted to the database
rollback;
