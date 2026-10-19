-- FILE: supabase/migrations/0004_tasks.sql
-- Tasks, per-task comments and the task history trail.

create table if not exists public.tasks (
  id           uuid primary key default gen_random_uuid(),
  title        text not null check (length(btrim(title)) between 3 and 200),
  description  text,
  department   public.department not null,
  -- Owner and deadline are mandatory by design: no task without them.
  owner_id     uuid not null references public.profiles (id) on delete restrict,
  assigned_by  uuid references public.profiles (id) on delete set null,
  deadline     timestamptz not null,
  priority     public.priority not null default 'medium',
  status       public.task_status not null default 'not_started',
  output       text,
  remarks      text,
  phase_id     uuid references public.phases (id) on delete set null,
  blocked_by   uuid[] not null default '{}',
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  completed_at timestamptz,
  -- A completed task must carry a record of the work: an output link or a note.
  constraint tasks_completed_needs_output check (
    status <> 'completed' or (output is not null and length(btrim(output)) > 0)
  )
);

create index if not exists tasks_department_idx on public.tasks (department);
create index if not exists tasks_owner_idx on public.tasks (owner_id);
create index if not exists tasks_status_idx on public.tasks (status);
create index if not exists tasks_deadline_idx on public.tasks (deadline);
create index if not exists tasks_phase_idx on public.tasks (phase_id);

create table if not exists public.task_comments (
  id         uuid primary key default gen_random_uuid(),
  task_id    uuid not null references public.tasks (id) on delete cascade,
  author_id  uuid not null references public.profiles (id) on delete restrict,
  body       text not null check (length(btrim(body)) between 1 and 4000),
  created_at timestamptz not null default now()
);

create index if not exists task_comments_task_idx on public.task_comments (task_id);

create table if not exists public.task_history (
  id         uuid primary key default gen_random_uuid(),
  task_id    uuid not null references public.tasks (id) on delete cascade,
  changed_by uuid references public.profiles (id) on delete set null,
  field      text not null,
  old_value  text,
  new_value  text,
  created_at timestamptz not null default now()
);

create index if not exists task_history_task_idx on public.task_history (task_id, created_at desc);

-- ---------------------------------------------------------------------------
-- Triggers
-- ---------------------------------------------------------------------------

-- BEFORE UPDATE: maintain timestamps, and stop a plain member from editing the
-- fields that only a lead or a core role may change. This is the database half of
-- "members can change status, output and remarks on their own tasks only".
create or replace function public.tasks_before_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if public.auth_role() = 'member' then
    if new.title        is distinct from old.title
       or new.description is distinct from old.description
       or new.owner_id    is distinct from old.owner_id
       or new.deadline    is distinct from old.deadline
       or new.department  is distinct from old.department
       or new.priority    is distinct from old.priority
       or new.phase_id    is distinct from old.phase_id
       or new.blocked_by  is distinct from old.blocked_by
       or new.assigned_by is distinct from old.assigned_by then
      raise exception 'Members can only change the status, output and remarks of their own tasks';
    end if;
  end if;

  new.updated_at := now();

  if new.status = 'completed' and old.status is distinct from 'completed' then
    new.completed_at := now();
  elsif old.status = 'completed' and new.status is distinct from 'completed' then
    new.completed_at := null;
  end if;

  return new;
end;
$$;

drop trigger if exists tasks_before_update on public.tasks;
create trigger tasks_before_update
  before update on public.tasks
  for each row execute function public.tasks_before_update();

-- AFTER UPDATE: every tracked field change becomes a task_history row.
create or replace function public.log_task_changes()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status is distinct from old.status then
    insert into public.task_history (task_id, changed_by, field, old_value, new_value)
    values (new.id, (select auth.uid()), 'status', old.status::text, new.status::text);
  end if;

  if new.owner_id is distinct from old.owner_id then
    insert into public.task_history (task_id, changed_by, field, old_value, new_value)
    values (new.id, (select auth.uid()), 'owner_id', old.owner_id::text, new.owner_id::text);
  end if;

  if new.deadline is distinct from old.deadline then
    insert into public.task_history (task_id, changed_by, field, old_value, new_value)
    values (new.id, (select auth.uid()), 'deadline', old.deadline::text, new.deadline::text);
  end if;

  if new.priority is distinct from old.priority then
    insert into public.task_history (task_id, changed_by, field, old_value, new_value)
    values (new.id, (select auth.uid()), 'priority', old.priority::text, new.priority::text);
  end if;

  if new.title is distinct from old.title then
    insert into public.task_history (task_id, changed_by, field, old_value, new_value)
    values (new.id, (select auth.uid()), 'title', old.title, new.title);
  end if;

  if new.department is distinct from old.department then
    insert into public.task_history (task_id, changed_by, field, old_value, new_value)
    values (new.id, (select auth.uid()), 'department', old.department::text, new.department::text);
  end if;

  if new.output is distinct from old.output then
    insert into public.task_history (task_id, changed_by, field, old_value, new_value)
    values (new.id, (select auth.uid()), 'output', old.output, new.output);
  end if;

  if new.remarks is distinct from old.remarks then
    insert into public.task_history (task_id, changed_by, field, old_value, new_value)
    values (new.id, (select auth.uid()), 'remarks', old.remarks, new.remarks);
  end if;

  if new.phase_id is distinct from old.phase_id then
    insert into public.task_history (task_id, changed_by, field, old_value, new_value)
    values (new.id, (select auth.uid()), 'phase_id', old.phase_id::text, new.phase_id::text);
  end if;

  return new;
end;
$$;

drop trigger if exists tasks_log_changes on public.tasks;
create trigger tasks_log_changes
  after update on public.tasks
  for each row execute function public.log_task_changes();

-- ---------------------------------------------------------------------------
-- Row level security
-- ---------------------------------------------------------------------------

alter table public.tasks enable row level security;
alter table public.task_comments enable row level security;
alter table public.task_history enable row level security;

drop policy if exists tasks_select_scope on public.tasks;
create policy tasks_select_scope on public.tasks
  for select to authenticated
  using (
    public.can_read_department(department)
    or owner_id = (select auth.uid())
  );

drop policy if exists tasks_insert_leads on public.tasks;
create policy tasks_insert_leads on public.tasks
  for insert to authenticated
  with check (public.can_write_department(department));

drop policy if exists tasks_update_scope on public.tasks;
create policy tasks_update_scope on public.tasks
  for update to authenticated
  using (
    public.can_write_department(department)
    or owner_id = (select auth.uid())
  )
  with check (
    public.can_write_department(department)
    or owner_id = (select auth.uid())
  );

drop policy if exists tasks_delete_leads on public.tasks;
create policy tasks_delete_leads on public.tasks
  for delete to authenticated
  using (public.can_write_department(department));

-- Comments: readable and writable wherever the task itself is readable.
-- A plain member can therefore comment only on their own tasks.
drop policy if exists task_comments_select_scope on public.task_comments;
create policy task_comments_select_scope on public.task_comments
  for select to authenticated
  using (
    exists (
      select 1 from public.tasks t
      where t.id = task_id
        and (public.can_read_department(t.department) or t.owner_id = (select auth.uid()))
    )
  );

drop policy if exists task_comments_insert_scope on public.task_comments;
create policy task_comments_insert_scope on public.task_comments
  for insert to authenticated
  with check (
    author_id = (select auth.uid())
    and exists (
      select 1 from public.tasks t
      where t.id = task_id
        and (public.can_read_department(t.department) or t.owner_id = (select auth.uid()))
    )
  );

drop policy if exists task_comments_update_author on public.task_comments;
create policy task_comments_update_author on public.task_comments
  for update to authenticated
  using (author_id = (select auth.uid()))
  with check (author_id = (select auth.uid()));

drop policy if exists task_comments_delete_author on public.task_comments;
create policy task_comments_delete_author on public.task_comments
  for delete to authenticated
  using (author_id = (select auth.uid()));

-- History is written only by the tasks_log_changes trigger (security definer), so there
-- is no INSERT policy. Read scope mirrors the task itself.
drop policy if exists task_history_select_scope on public.task_history;
create policy task_history_select_scope on public.task_history
  for select to authenticated
  using (
    exists (
      select 1 from public.tasks t
      where t.id = task_id
        and (public.can_read_department(t.department) or t.owner_id = (select auth.uid()))
    )
  );

revoke insert, update, delete on public.task_history from authenticated;
grant select on public.task_history to authenticated;
