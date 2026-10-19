-- FILE: supabase/migrations/0001_enums.sql
-- Enumerated types for the whole schema.
-- Each block is guarded so a partially applied migration can be re-run safely.

do $$
begin
  if not exists (
    select 1 from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    where t.typname = 'app_role' and n.nspname = 'public'
  ) then
    create type public.app_role as enum (
      'faculty',
      'president',
      'vice_president',
      'management_head',
      'development_head',
      'hackathon_head',
      'team_lead',
      'member'
    );
  end if;

  if not exists (
    select 1 from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    where t.typname = 'department' and n.nspname = 'public'
  ) then
    create type public.department as enum (
      'creatives',
      'admin',
      'social_media',
      'pr',
      'development',
      'hackathon',
      'management'
    );
  end if;

  if not exists (
    select 1 from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    where t.typname = 'task_status' and n.nspname = 'public'
  ) then
    create type public.task_status as enum (
      'not_started',
      'in_progress',
      'review',
      'completed',
      'delayed'
    );
  end if;

  if not exists (
    select 1 from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    where t.typname = 'priority' and n.nspname = 'public'
  ) then
    create type public.priority as enum ('high', 'medium', 'low');
  end if;

  if not exists (
    select 1 from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    where t.typname = 'session_type' and n.nspname = 'public'
  ) then
    create type public.session_type as enum (
      'meeting',
      'level_up',
      'event_day',
      'work_session'
    );
  end if;

  if not exists (
    select 1 from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    where t.typname = 'attendance_status' and n.nspname = 'public'
  ) then
    create type public.attendance_status as enum (
      'present',
      'late',
      'excused',
      'absent'
    );
  end if;

  if not exists (
    select 1 from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    where t.typname = 'attendance_method' and n.nspname = 'public'
  ) then
    create type public.attendance_method as enum ('self', 'manual');
  end if;

  -- A check-in can raise more than one flag (for example outside_area + low_accuracy),
  -- so flags are modelled as an array of a dedicated enum rather than a free-text column.
  if not exists (
    select 1 from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    where t.typname = 'attendance_flag' and n.nspname = 'public'
  ) then
    create type public.attendance_flag as enum (
      'no_location',
      'outside_area',
      'low_accuracy'
    );
  end if;

  if not exists (
    select 1 from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    where t.typname = 'review_status' and n.nspname = 'public'
  ) then
    create type public.review_status as enum (
      'not_needed',
      'pending',
      'approved',
      'rejected'
    );
  end if;
end
$$;
