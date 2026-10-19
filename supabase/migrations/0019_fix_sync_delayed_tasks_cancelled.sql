-- FILE: supabase/migrations/0019_fix_sync_delayed_tasks_cancelled.sql
-- Fix: Exclude 'cancelled' status from sync_delayed_tasks() so cancelled tasks are not overwritten with 'delayed'.

create or replace function public.sync_delayed_tasks()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.tasks
  set status = 'delayed'
  where status not in ('completed', 'delayed', 'cancelled')
    and deadline < now();
end;
$$;

revoke execute on function public.sync_delayed_tasks() from public, anon;
grant execute on function public.sync_delayed_tasks() to authenticated, service_role;
