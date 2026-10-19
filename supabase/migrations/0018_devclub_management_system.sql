-- FILE: supabase/migrations/0018_devclub_management_system.sql
-- Extension to DevClub Management & Accountability System
-- Covers organizational structure, task lifecycle, daily work logs, review history,
-- social media control room, and enhanced RLS policies.

-- ---------------------------------------------------------------------------
-- 1. Enum Alterations (Idempotent)
-- ---------------------------------------------------------------------------

do $$
begin
  -- Add co-head roles if missing
  if not exists (
    select 1 from pg_enum
    where enumtypid = 'public.app_role'::regtype and enumlabel = 'development_co_head'
  ) then
    alter type public.app_role add value 'development_co_head';
  end if;

  if not exists (
    select 1 from pg_enum
    where enumtypid = 'public.app_role'::regtype and enumlabel = 'management_co_head'
  ) then
    alter type public.app_role add value 'management_co_head';
  end if;

  if not exists (
    select 1 from pg_enum
    where enumtypid = 'public.app_role'::regtype and enumlabel = 'co_head'
  ) then
    alter type public.app_role add value 'co_head';
  end if;

  -- Add task lifecycle statuses if missing
  if not exists (
    select 1 from pg_enum
    where enumtypid = 'public.task_status'::regtype and enumlabel = 'changes_requested'
  ) then
    alter type public.task_status add value 'changes_requested';
  end if;

  if not exists (
    select 1 from pg_enum
    where enumtypid = 'public.task_status'::regtype and enumlabel = 'cancelled'
  ) then
    alter type public.task_status add value 'cancelled';
  end if;
end
$$;

-- ---------------------------------------------------------------------------
-- 2. Schema Column Additions on Existing Tables
-- ---------------------------------------------------------------------------

-- Profiles alterations
alter table public.profiles
  add column if not exists reporting_head_id uuid references public.profiles(id) on delete set null,
  add column if not exists co_head_department public.department,
  add column if not exists joining_date date not null default current_date,
  add column if not exists account_status text not null default 'active';

-- Approved emails alterations
alter table public.approved_emails
  add column if not exists reporting_head_id uuid references public.profiles(id) on delete set null,
  add column if not exists co_head_department public.department;

-- Tasks alterations
alter table public.tasks
  add column if not exists collaborator_ids uuid[] not null default '{}',
  add column if not exists project_name text,
  add column if not exists acknowledged_at timestamptz,
  add column if not exists deliverable_requirements text,
  add column if not exists proof_urls text[] not null default '{}',
  add column if not exists reassignment_reason text,
  add column if not exists extension_reason text,
  add column if not exists extended_deadline timestamptz,
  add column if not exists extension_status text check (extension_status in ('none', 'requested', 'approved', 'rejected'));

-- Attendance session category alteration
alter table public.attendance_sessions
  add column if not exists purpose text;

-- ---------------------------------------------------------------------------
-- 3. New Tables
-- ---------------------------------------------------------------------------

-- Daily Work Reports (1 report per user per date)
create table if not exists public.daily_reports (
  id                 uuid primary key default gen_random_uuid(),
  user_id            uuid not null references public.profiles(id) on delete restrict,
  report_date        date not null,
  summary            text not null check (length(btrim(summary)) between 3 and 4000),
  work_entries       jsonb not null default '[]'::jsonb,
  other_work         text,
  total_time_minutes integer not null default 0 check (total_time_minutes >= 0),
  proof_links        text[] not null default '{}',
  blockers           text,
  next_priorities    text,
  optional_notes     text,
  is_excused         boolean not null default false,
  excused_reason     text,
  status             text not null default 'submitted' check (status in ('draft', 'submitted', 'reviewed', 'changes_requested')),
  submitted_at       timestamptz,
  reviewer_id        uuid references public.profiles(id) on delete set null,
  reviewed_at        timestamptz,
  review_comments    text,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),
  constraint daily_reports_user_date_key unique (user_id, report_date)
);

create index if not exists daily_reports_user_idx on public.daily_reports (user_id);
create index if not exists daily_reports_date_idx on public.daily_reports (report_date);
create index if not exists daily_reports_status_idx on public.daily_reports (status);

-- Daily Report History (Audit log for edits and review decisions)
create table if not exists public.daily_report_history (
  id         uuid primary key default gen_random_uuid(),
  report_id  uuid not null references public.daily_reports(id) on delete cascade,
  changed_by uuid references public.profiles(id) on delete set null,
  action     text not null,
  before     jsonb,
  after      jsonb,
  created_at timestamptz not null default now()
);

create index if not exists daily_report_history_report_idx on public.daily_report_history (report_id, created_at desc);

-- Social Media Control Room Posts
create table if not exists public.social_media_posts (
  id                  uuid primary key default gen_random_uuid(),
  title               text not null check (length(btrim(title)) between 3 and 250),
  campaign            text,
  platform            text not null,
  content_owner_id    uuid references public.profiles(id) on delete set null,
  designer_id         uuid references public.profiles(id) on delete set null,
  copywriter_id       uuid references public.profiles(id) on delete set null,
  reviewer_id         uuid references public.profiles(id) on delete set null,
  task_id             uuid references public.tasks(id) on delete set null,
  approval_deadline   timestamptz,
  publishing_deadline timestamptz not null,
  status              text not null default 'draft' check (status in ('draft', 'in_review', 'revisions_requested', 'approved', 'scheduled', 'published')),
  caption             text,
  creative_urls       text[] not null default '{}',
  publication_url     text,
  proof_url           text,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create index if not exists social_media_posts_status_idx on public.social_media_posts (status);
create index if not exists social_media_posts_deadline_idx on public.social_media_posts (publishing_deadline);

-- Triggers for set_updated_at
drop trigger if exists set_daily_reports_updated_at on public.daily_reports;
create trigger set_daily_reports_updated_at
  before update on public.daily_reports
  for each row execute function public.set_updated_at();

drop trigger if exists set_social_media_posts_updated_at on public.social_media_posts;
create trigger set_social_media_posts_updated_at
  before update on public.social_media_posts
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- 4. Helper Security Definer Functions
-- ---------------------------------------------------------------------------

-- Check if caller can review a user's daily report
create or replace function public.can_review_daily_report(
  p_report_user_id uuid,
  p_report_dept public.department
)
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_role public.app_role;
  v_dept public.department;
begin
  if not public.is_active_member() then
    return false;
  end if;

  select role, department into v_role, v_dept
  from public.profiles
  where id = (select auth.uid()) and is_active;

  if v_role in ('president', 'vice_president', 'faculty') then
    return true;
  end if;

  if v_role = 'development_head' then
    return p_report_dept in ('development', 'hackathon') or p_report_dept is null;
  end if;

  if v_role = 'management_head' then
    return p_report_dept in ('admin', 'pr', 'social_media', 'creatives', 'management');
  end if;

  if v_role in ('team_lead', 'hackathon_head') then
    return v_dept is not distinct from p_report_dept;
  end if;

  if v_role in ('development_co_head', 'management_co_head', 'co_head') then
    return v_dept is not distinct from p_report_dept;
  end if;

  return false;
end;
$$;

-- ---------------------------------------------------------------------------
-- 5. Row Level Security Policies
-- ---------------------------------------------------------------------------

alter table public.daily_reports enable row level security;
alter table public.daily_report_history enable row level security;
alter table public.social_media_posts enable row level security;

-- Daily Reports RLS Policies
drop policy if exists daily_reports_select on public.daily_reports;
create policy daily_reports_select on public.daily_reports
  for select to authenticated
  using (
    user_id = (select auth.uid())
    or public.is_faculty()
    or public.has_all_department_access()
    or exists (
      select 1 from public.profiles p
      where p.id = user_id
        and (
          p.department = public.auth_department()
          or public.can_read_department(p.department)
        )
    )
  );

drop policy if exists daily_reports_insert on public.daily_reports;
create policy daily_reports_insert on public.daily_reports
  for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and public.is_active_member()
  );

drop policy if exists daily_reports_update on public.daily_reports;
create policy daily_reports_update on public.daily_reports
  for update to authenticated
  using (
    user_id = (select auth.uid())
    or exists (
      select 1 from public.profiles p
      where p.id = user_id
        and public.can_review_daily_report(p.id, p.department)
    )
  )
  with check (
    user_id = (select auth.uid())
    or exists (
      select 1 from public.profiles p
      where p.id = user_id
        and public.can_review_daily_report(p.id, p.department)
    )
  );

-- Daily Report History Policies
drop policy if exists daily_report_history_select on public.daily_report_history;
create policy daily_report_history_select on public.daily_report_history
  for select to authenticated
  using (
    exists (
      select 1 from public.daily_reports dr
      where dr.id = report_id
        and (
          dr.user_id = (select auth.uid())
          or public.is_faculty()
          or public.has_all_department_access()
        )
    )
  );

-- Social Media Posts Policies
drop policy if exists social_media_posts_select on public.social_media_posts;
create policy social_media_posts_select on public.social_media_posts
  for select to authenticated
  using (
    public.is_active_member()
  );

drop policy if exists social_media_posts_write on public.social_media_posts;
create policy social_media_posts_write on public.social_media_posts
  for all to authenticated
  using (
    public.is_core_role()
    or public.auth_department() = 'social_media'
    or content_owner_id = (select auth.uid())
    or designer_id = (select auth.uid())
    or copywriter_id = (select auth.uid())
  )
  with check (
    public.is_core_role()
    or public.auth_department() = 'social_media'
    or content_owner_id = (select auth.uid())
    or designer_id = (select auth.uid())
    or copywriter_id = (select auth.uid())
  );

-- Grant privileges
grant execute on function public.can_review_daily_report(uuid, public.department) to authenticated;
