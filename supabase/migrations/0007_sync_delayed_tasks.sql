-- FILE: supabase/migrations/0007_sync_delayed_tasks.sql
-- Security definer helper to auto-transition overdue tasks (status != 'completed' and deadline < now()) to 'delayed'.

create or replace function public.sync_delayed_tasks()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.tasks
  set status = 'delayed'
  where status not in ('completed', 'delayed')
    and deadline < now();
end;
$$;

grant execute on function public.sync_delayed_tasks() to authenticated;
