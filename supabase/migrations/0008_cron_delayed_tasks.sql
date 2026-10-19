-- FILE: supabase/migrations/0008_cron_delayed_tasks.sql
-- Enable pg_cron and schedule periodic execution of sync_delayed_tasks().

create extension if not exists pg_cron;

grant usage on schema cron to postgres;

-- Schedule sync_delayed_tasks to run every 15 minutes
select cron.schedule(
  'sync-delayed-tasks-job',
  '*/15 * * * *',
  $$ select public.sync_delayed_tasks(); $$
);
