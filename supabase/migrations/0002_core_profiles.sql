-- FILE: supabase/migrations/0002_core_profiles.sql
-- Approved emails (the sign-in gate), profiles, the permission helper functions that
-- every RLS policy in this project uses, and the triggers that keep profiles in step.

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table if not exists public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  full_name   text not null check (length(btrim(full_name)) between 1 and 120),
  email       text not null unique,
  role        public.app_role not null default 'member',
  department  public.department,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now(),
  constraint profiles_email_lowercase check (email = lower(email)),
  -- A team lead always belongs to exactly one department.
  constraint profiles_lead_needs_department check (role <> 'team_lead' or department is not null)
);

create index if not exists profiles_department_idx on public.profiles (department);
create index if not exists profiles_role_idx on public.profiles (role);

create table if not exists public.approved_emails (
  email       text primary key,
  full_name   text not null check (length(btrim(full_name)) between 1 and 120),
  role        public.app_role not null,
  department  public.department,
  created_by  uuid references public.profiles (id) on delete set null,
  created_at  timestamptz not null default now(),
  constraint approved_emails_email_lowercase check (email = lower(email)),
  constraint approved_emails_email_shape check (position('@' in email) > 1),
  constraint approved_emails_lead_needs_department check (role <> 'team_lead' or department is not null)
);

-- ---------------------------------------------------------------------------
-- Permission helpers
--
-- All of these are SECURITY DEFINER so they can read public.profiles without
-- triggering that table's own row level security (which would recurse forever).
-- They only ever describe the *caller*, so they cannot be used to probe other users.
-- ---------------------------------------------------------------------------

create or replace function public.auth_role()
returns public.app_role
language sql
stable
security definer
set search_path = public
as $$
  select p.role
  from public.profiles p
  where p.id = (select auth.uid()) and p.is_active;
$$;

create or replace function public.auth_department()
returns public.department
language sql
stable
security definer
set search_path = public
as $$
  select p.department
  from public.profiles p
  where p.id = (select auth.uid()) and p.is_active;
$$;

-- True only for a signed-in, approved and active profile. Every policy starts here.
create or replace function public.is_active_member()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = (select auth.uid()) and p.is_active
  );
$$;

create or replace function public.is_faculty()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.auth_role() = 'faculty';
$$;

-- President, Vice President, Management Head, Development Head.
create or replace function public.is_core_role()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.auth_role() in (
    'president', 'vice_president', 'management_head', 'development_head'
  );
$$;

-- Core roles plus the Hackathon Head: everyone who sees every department.
create or replace function public.has_all_department_access()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.auth_role() in (
    'president', 'vice_president', 'management_head', 'development_head', 'hackathon_head'
  );
$$;

create or replace function public.is_team_lead()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.auth_role() = 'team_lead';
$$;

create or replace function public.can_manage_users()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.auth_role() in ('management_head', 'development_head');
$$;

create or replace function public.can_view_audit()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.auth_role() in (
    'faculty', 'president', 'vice_president', 'management_head', 'development_head'
  );
$$;

-- Read scope for a row that belongs to department `d`.
-- Faculty and the all-department roles read everything; a team lead reads their own
-- department; a plain member only reads their own rows (handled by own-row policies).
create or replace function public.can_read_department(d public.department)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select case
    when not public.is_active_member() then false
    when public.is_faculty() then true
    when public.has_all_department_access() then true
    when public.is_team_lead() then d is not distinct from public.auth_department()
    else false
  end;
$$;

-- Write scope for a row that belongs to department `d`.
-- Core roles write anywhere; the Hackathon Head writes inside the hackathon
-- department; a team lead writes inside their own department.
create or replace function public.can_write_department(d public.department)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select case
    when not public.is_active_member() then false
    when public.is_core_role() then true
    when public.auth_role() = 'hackathon_head' then d = 'hackathon'
    when public.is_team_lead() then d is not distinct from public.auth_department()
    else false
  end;
$$;

-- Attendance read scope. Same as can_read_department, with one addition: the Admin
-- lead keeps the organisation-wide attendance record, so they may read every department.
create or replace function public.can_read_attendance_department(d public.department)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.can_read_department(d)
    or (public.is_team_lead() and public.auth_department() = 'admin');
$$;

-- Attendance write scope (manual override, session edits).
create or replace function public.can_write_attendance_department(d public.department)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.can_write_department(d);
$$;

-- Who may open a new attendance session for department `d`.
-- The plan of action gives session creation to core roles, the Hackathon Head (who runs
-- event days) and team leads for their own department.
create or replace function public.can_create_session_for(d public.department)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select case
    when not public.is_active_member() then false
    when public.is_core_role() then true
    when public.auth_role() = 'hackathon_head' then true
    when public.is_team_lead() then d is not distinct from public.auth_department()
    else false
  end;
$$;

-- Who may see raw check-in coordinates for department `d`.
-- Faculty is deliberately excluded; members see only their own record (see
-- public.checkin_coordinates in 0005_attendance.sql).
create or replace function public.can_view_coordinates_for(d public.department)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select case
    when not public.is_active_member() then false
    when public.has_all_department_access() then true
    when public.is_team_lead() then
      d is not distinct from public.auth_department()
      or public.auth_department() = 'admin'
    else false
  end;
$$;

-- Shared trigger helper: keep updated_at honest.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- Triggers
-- ---------------------------------------------------------------------------

-- Called when a Google account signs in for the first time.
-- If the email is not pre-approved we create no profile at all, so every policy in
-- this project denies the account and the app shows the "waiting for approval" page.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_approved public.approved_emails;
begin
  select * into v_approved
  from public.approved_emails
  where email = lower(new.email);

  if not found then
    return new;
  end if;

  insert into public.profiles (id, full_name, email, role, department)
  values (
    new.id,
    coalesce(
      nullif(btrim(v_approved.full_name), ''),
      nullif(btrim(coalesce(new.raw_user_meta_data ->> 'full_name', '')), ''),
      v_approved.email
    ),
    v_approved.email,
    v_approved.role,
    v_approved.department
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Keeps profiles in step when a manager adds, edits or revokes an approved email.
create or replace function public.sync_approved_email()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'DELETE' then
    -- Revoking access deactivates the profile; existing records stay for history.
    update public.profiles
      set is_active = false
      where email = old.email;
    return old;
  end if;

  if tg_op = 'UPDATE' then
    update public.profiles
      set full_name = new.full_name,
          role = new.role,
          department = new.department
      where email = new.email;
    return new;
  end if;

  -- INSERT: the person may have signed in before being approved, in which case they
  -- already have an auth user but no profile. Create it now that access is granted.
  insert into public.profiles (id, full_name, email, role, department)
  select u.id, new.full_name, new.email, new.role, new.department
  from auth.users u
  where u.email = new.email
  order by u.created_at desc
  limit 1
  on conflict (id) do update
    set full_name = excluded.full_name,
        role = excluded.role,
        department = excluded.department,
        is_active = true;

  return new;
end;
$$;

drop trigger if exists on_approved_email_change on public.approved_emails;
create trigger on_approved_email_change
  after insert or update or delete on public.approved_emails
  for each row execute function public.sync_approved_email();

-- ---------------------------------------------------------------------------
-- Row level security
-- ---------------------------------------------------------------------------

alter table public.profiles enable row level security;
alter table public.approved_emails enable row level security;

drop policy if exists profiles_select_self_or_scope on public.profiles;
create policy profiles_select_self_or_scope on public.profiles
  for select to authenticated
  using (
    id = (select auth.uid())
    or public.can_manage_users()
    or public.can_read_department(department)
  );

-- Profiles are only ever created by the on_auth_user_created trigger (security definer),
-- which bypasses RLS. There is deliberately no INSERT policy for clients.
drop policy if exists profiles_update_managers on public.profiles;
create policy profiles_update_managers on public.profiles
  for update to authenticated
  using (public.can_manage_users())
  with check (public.can_manage_users());

drop policy if exists approved_emails_select_managers on public.approved_emails;
create policy approved_emails_select_managers on public.approved_emails
  for select to authenticated
  using (public.can_manage_users());

drop policy if exists approved_emails_insert_managers on public.approved_emails;
create policy approved_emails_insert_managers on public.approved_emails
  for insert to authenticated
  with check (public.can_manage_users());

drop policy if exists approved_emails_update_managers on public.approved_emails;
create policy approved_emails_update_managers on public.approved_emails
  for update to authenticated
  using (public.can_manage_users())
  with check (public.can_manage_users());

drop policy if exists approved_emails_delete_managers on public.approved_emails;
create policy approved_emails_delete_managers on public.approved_emails
  for delete to authenticated
  using (public.can_manage_users());

-- A manager may change names, roles, departments and the active flag - nothing else.
revoke update on public.profiles from authenticated;
grant update (full_name, role, department, is_active) on public.profiles to authenticated;

revoke update on public.approved_emails from authenticated;
grant update (full_name, role, department) on public.approved_emails to authenticated;

-- ---------------------------------------------------------------------------
-- Function privileges
-- ---------------------------------------------------------------------------

revoke all on function public.auth_role() from public;
revoke all on function public.auth_department() from public;
revoke all on function public.is_active_member() from public;
revoke all on function public.is_faculty() from public;
revoke all on function public.is_core_role() from public;
revoke all on function public.has_all_department_access() from public;
revoke all on function public.is_team_lead() from public;
revoke all on function public.can_manage_users() from public;
revoke all on function public.can_view_audit() from public;
revoke all on function public.can_read_department(public.department) from public;
revoke all on function public.can_write_department(public.department) from public;
revoke all on function public.can_read_attendance_department(public.department) from public;
revoke all on function public.can_write_attendance_department(public.department) from public;
revoke all on function public.can_create_session_for(public.department) from public;
revoke all on function public.can_view_coordinates_for(public.department) from public;

grant execute on function public.auth_role() to authenticated;
grant execute on function public.auth_department() to authenticated;
grant execute on function public.is_active_member() to authenticated;
grant execute on function public.is_faculty() to authenticated;
grant execute on function public.is_core_role() to authenticated;
grant execute on function public.has_all_department_access() to authenticated;
grant execute on function public.is_team_lead() to authenticated;
grant execute on function public.can_manage_users() to authenticated;
grant execute on function public.can_view_audit() to authenticated;
grant execute on function public.can_read_department(public.department) to authenticated;
grant execute on function public.can_write_department(public.department) to authenticated;
grant execute on function public.can_read_attendance_department(public.department) to authenticated;
grant execute on function public.can_write_attendance_department(public.department) to authenticated;
grant execute on function public.can_create_session_for(public.department) to authenticated;
grant execute on function public.can_view_coordinates_for(public.department) to authenticated;
