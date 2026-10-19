-- FILE: supabase/migrations/0006_audit_log.sql
-- Append-only audit trail: role changes, manual attendance overrides, review decisions
-- and task deletions all land here.

create table if not exists public.audit_log (
  id         uuid primary key default gen_random_uuid(),
  actor_id   uuid references public.profiles (id) on delete set null,
  action     text not null,
  entity     text not null,
  entity_id  uuid,
  before     jsonb,
  after      jsonb,
  created_at timestamptz not null default now()
);

create index if not exists audit_log_created_at_idx on public.audit_log (created_at desc);
create index if not exists audit_log_entity_idx on public.audit_log (entity, entity_id);

alter table public.audit_log enable row level security;

-- Faculty, President, Vice President, Management Head and Development Head may read it.
drop policy if exists audit_log_select_reviewers on public.audit_log;
create policy audit_log_select_reviewers on public.audit_log
  for select to authenticated
  using (public.can_view_audit());

-- There are no INSERT, UPDATE or DELETE policies. Rows can only be written through the
-- function below, which always stamps the real caller as the actor. This is what makes
-- the log trustworthy: nobody can forge an actor or rewrite history from the browser.
create or replace function public.log_audit(
  p_action    text,
  p_entity    text,
  p_entity_id uuid default null,
  p_before    jsonb default null,
  p_after     jsonb default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_active_member() then
    raise exception 'Not authorised to write the audit log';
  end if;

  if length(btrim(coalesce(p_action, ''))) = 0 or length(btrim(coalesce(p_entity, ''))) = 0 then
    raise exception 'audit action and entity are required';
  end if;

  insert into public.audit_log (actor_id, action, entity, entity_id, before, after)
  values ((select auth.uid()), p_action, p_entity, p_entity_id, p_before, p_after);
end;
$$;

revoke all on function public.log_audit(text, text, uuid, jsonb, jsonb) from public;
grant execute on function public.log_audit(text, text, uuid, jsonb, jsonb) to authenticated;

-- The audit log is append-only from the client's point of view.
revoke insert, update, delete on public.audit_log from authenticated, anon;
