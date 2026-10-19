-- FILE: supabase/migrations/0005_attendance.sql
-- Attendance sessions and records.
--
-- Two deliberate deviations from the indicative schema in the spec, both for security:
--   1. The live-code secret lives in its own table (attendance_session_secrets) with no
--      policies at all, because row level security cannot hide a single column. Only the
--      server (service role) can read it.
--   2. flags is an array of an enum instead of a single text column, because the
--      attendance logic allows several flags on one check-in.

create table if not exists public.attendance_sessions (
  id             uuid primary key default gen_random_uuid(),
  title          text not null check (length(btrim(title)) between 3 and 200),
  type           public.session_type not null,
  -- null means "every department" (used for event days).
  department     public.department,
  starts_at      timestamptz not null,
  ends_at        timestamptz not null,
  grace_minutes  integer not null default 10 check (grace_minutes between 0 and 120),
  venue_name     text,
  venue_lat      double precision check (venue_lat between -90 and 90),
  venue_lng      double precision check (venue_lng between -180 and 180),
  radius_m       integer not null default 100 check (radius_m between 10 and 10000),
  require_code   boolean not null default false,
  created_by     uuid not null references public.profiles (id) on delete restrict,
  created_at     timestamptz not null default now(),
  closed_at      timestamptz,
  constraint attendance_sessions_time_order check (ends_at > starts_at),
  -- Either both coordinates are set (a real map pin) or neither is.
  constraint attendance_sessions_venue_pair check (
    (venue_lat is null and venue_lng is null)
    or (venue_lat is not null and venue_lng is not null)
  )
);

create index if not exists attendance_sessions_department_idx on public.attendance_sessions (department);
create index if not exists attendance_sessions_starts_at_idx on public.attendance_sessions (starts_at desc);

-- Read only by the server. No policies are created on purpose: RLS is enabled, so every
-- client role is denied and only the service role key can reach it.
create table if not exists public.attendance_session_secrets (
  session_id uuid primary key references public.attendance_sessions (id) on delete cascade,
  secret     text not null check (length(secret) >= 32),
  created_at timestamptz not null default now()
);

create table if not exists public.attendance_records (
  id            uuid primary key default gen_random_uuid(),
  session_id    uuid not null references public.attendance_sessions (id) on delete cascade,
  member_id     uuid not null references public.profiles (id) on delete cascade,
  status        public.attendance_status not null,
  checked_in_at timestamptz,
  lat           double precision check (lat between -90 and 90),
  lng           double precision check (lng between -180 and 180),
  accuracy_m    double precision check (accuracy_m is null or accuracy_m >= 0),
  distance_m    double precision check (distance_m is null or distance_m >= 0),
  method        public.attendance_method not null default 'self',
  marked_by     uuid references public.profiles (id) on delete set null,
  remark        text,
  flags         public.attendance_flag[] not null default '{}',
  review        public.review_status not null default 'not_needed',
  reviewed_by   uuid references public.profiles (id) on delete set null,
  reviewed_at   timestamptz,
  created_at    timestamptz not null default now(),
  unique (session_id, member_id),
  -- A lead overriding a record by hand must leave a reason.
  constraint attendance_records_override_remark check (
    method <> 'manual' or (remark is not null and length(btrim(remark)) >= 5)
  ),
  constraint attendance_records_location_pair check (lat is null or lng is not null),
  -- Any flagged check-in must sit in the review queue until a lead decides.
  constraint attendance_records_flags_need_review check (
    cardinality(flags) = 0 or review <> 'not_needed'
  )
);

create index if not exists attendance_records_session_idx on public.attendance_records (session_id);
create index if not exists attendance_records_member_idx on public.attendance_records (member_id);
create index if not exists attendance_records_review_idx on public.attendance_records (review)
  where review = 'pending';

-- ---------------------------------------------------------------------------
-- Guarded coordinate access
--
-- Raw coordinates are revoked from the authenticated role at column level (see the end
-- of this file), so the only way to read them is through this function, which decides
-- for itself whether the caller may see them. Faculty is not allowed; a team lead sees
-- their own department (and the Admin lead sees all); a member sees only their own row.
-- ---------------------------------------------------------------------------

create or replace function public.checkin_coordinates(p_session_id uuid)
returns table (
  checked_in_member_id uuid,
  latitude            double precision,
  longitude           double precision
)
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_department public.department;
begin
  if not public.is_active_member() then
    return;
  end if;

  select s.department into v_department
  from public.attendance_sessions s
  where s.id = p_session_id;

  if not found then
    return;
  end if;

  return query
    select r.member_id, r.lat, r.lng
    from public.attendance_records r
    where r.session_id = p_session_id
      and r.lat is not null
      and r.lng is not null
      and (
        r.member_id = (select auth.uid())
        or public.can_view_coordinates_for(v_department)
      );
end;
$$;

revoke all on function public.checkin_coordinates(uuid) from public;
grant execute on function public.checkin_coordinates(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- Row level security
-- ---------------------------------------------------------------------------

alter table public.attendance_sessions enable row level security;
alter table public.attendance_session_secrets enable row level security;
alter table public.attendance_records enable row level security;

drop policy if exists attendance_sessions_select_scope on public.attendance_sessions;
create policy attendance_sessions_select_scope on public.attendance_sessions
  for select to authenticated
  using (
    public.can_read_attendance_department(department)
    or department = public.auth_department()
    or (department is null and public.is_active_member())
  );

drop policy if exists attendance_sessions_insert_leads on public.attendance_sessions;
create policy attendance_sessions_insert_leads on public.attendance_sessions
  for insert to authenticated
  with check (
    public.can_create_session_for(department)
    and created_by = (select auth.uid())
  );

drop policy if exists attendance_sessions_update_leads on public.attendance_sessions;
create policy attendance_sessions_update_leads on public.attendance_sessions
  for update to authenticated
  using (public.can_write_attendance_department(department))
  with check (public.can_write_attendance_department(department));

drop policy if exists attendance_sessions_delete_core on public.attendance_sessions;
create policy attendance_sessions_delete_core on public.attendance_sessions
  for delete to authenticated
  using (public.is_core_role());

drop policy if exists attendance_records_select_scope on public.attendance_records;
create policy attendance_records_select_scope on public.attendance_records
  for select to authenticated
  using (
    member_id = (select auth.uid())
    or exists (
      select 1 from public.attendance_sessions s
      where s.id = session_id
        and public.can_read_attendance_department(s.department)
    )
  );

-- Self check-in is written by the server with the service role key, after validation.
-- There is deliberately no INSERT policy, so a browser can never create a record.
drop policy if exists attendance_records_update_leads on public.attendance_records;
create policy attendance_records_update_leads on public.attendance_records
  for update to authenticated
  using (
    exists (
      select 1 from public.attendance_sessions s
      where s.id = session_id
        and public.can_write_attendance_department(s.department)
    )
  )
  with check (
    exists (
      select 1 from public.attendance_sessions s
      where s.id = session_id
        and public.can_write_attendance_department(s.department)
    )
  );

-- ---------------------------------------------------------------------------
-- Column level privileges
-- ---------------------------------------------------------------------------

-- The live-code secret table is for the server only.
revoke all on public.attendance_session_secrets from authenticated, anon;

-- Raw coordinates are not selectable directly. They are available through
-- public.checkin_coordinates(), which enforces who may see them.
revoke select on public.attendance_records from authenticated;
grant select (
  id, session_id, member_id, status, checked_in_at, accuracy_m, distance_m,
  method, marked_by, remark, flags, review, reviewed_by, reviewed_at, created_at
) on public.attendance_records to authenticated;

-- A lead may change the outcome of a check-in and nothing else: never the stored
-- location, the computed distance, the flags or the review verdict's raw fields.
revoke update on public.attendance_records from authenticated;
grant update (
  status, remark, method, marked_by, review, reviewed_by, reviewed_at
) on public.attendance_records to authenticated;
