-- FILE: supabase/migrations/0003_phases_settings.sql
-- The five planning phases from the club's Plan of Action, plus an app settings table.

create table if not exists public.phases (
  id          uuid primary key default gen_random_uuid(),
  name        text not null unique,
  starts_on   date not null,
  ends_on     date not null,
  sort_order  integer not null default 0,
  created_at  timestamptz not null default now(),
  constraint phases_date_order check (ends_on >= starts_on)
);

create table if not exists public.settings (
  key         text primary key,
  value       jsonb not null,
  updated_at  timestamptz not null default now(),
  updated_by  uuid references public.profiles (id) on delete set null
);

drop trigger if exists settings_set_updated_at on public.settings;
create trigger settings_set_updated_at
  before update on public.settings
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Seed: the five phases and the real planning window (22 Oct 2026 - 7 Jan 2027).
-- Re-running updates the dates in place instead of duplicating rows.
-- ---------------------------------------------------------------------------

insert into public.phases (name, starts_on, ends_on, sort_order) values
  ('Foundation',           date '2026-10-22', date '2026-10-31', 1),
  ('Execution',            date '2026-11-01', date '2026-11-15', 2),
  ('Active Preparation',   date '2026-11-16', date '2026-12-15', 3),
  ('Final Preparation',    date '2026-12-16', date '2026-12-31', 4),
  ('Final Week',           date '2027-01-01', date '2027-01-07', 5)
on conflict (name) do update
  set starts_on  = excluded.starts_on,
      ends_on    = excluded.ends_on,
      sort_order = excluded.sort_order;

-- Only thresholds that the spec defines explicitly. Real values, no estimates.
insert into public.settings (key, value) values
  ('attendance.default_radius_m',       '100'::jsonb),
  ('attendance.default_grace_minutes',  '10'::jsonb),
  ('attendance.low_accuracy_threshold_m', '200'::jsonb)
on conflict (key) do nothing;

-- ---------------------------------------------------------------------------
-- Row level security
-- ---------------------------------------------------------------------------

alter table public.phases enable row level security;
alter table public.settings enable row level security;

drop policy if exists phases_select_members on public.phases;
create policy phases_select_members on public.phases
  for select to authenticated
  using (public.is_active_member());

drop policy if exists phases_write_managers on public.phases;
create policy phases_write_managers on public.phases
  for all to authenticated
  using (public.can_manage_users())
  with check (public.can_manage_users());

drop policy if exists settings_select_members on public.settings;
create policy settings_select_members on public.settings
  for select to authenticated
  using (public.is_active_member());

drop policy if exists settings_write_managers on public.settings;
create policy settings_write_managers on public.settings
  for all to authenticated
  using (public.can_manage_users())
  with check (public.can_manage_users());
