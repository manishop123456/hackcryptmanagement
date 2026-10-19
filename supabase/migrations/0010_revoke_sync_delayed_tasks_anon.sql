-- FILE: supabase/migrations/0010_revoke_sync_delayed_tasks_anon.sql
-- Security hardening: Revoke EXECUTE permission on sync_delayed_tasks() from anon/public.

revoke execute on function public.sync_delayed_tasks() from public, anon;
grant execute on function public.sync_delayed_tasks() to authenticated, service_role;
