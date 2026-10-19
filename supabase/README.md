# Database migrations

Apply these **in order**. Each one is written to be safe to re-run, so a failure halfway
through does not leave you stuck.

| File | Creates |
|---|---|
| `0001_enums.sql` | `app_role`, `department`, `task_status`, `priority`, `session_type`, `attendance_status`, `attendance_method`, `attendance_flag`, `review_status` |
| `0002_core_profiles.sql` | `approved_emails`, `profiles`, every permission helper function (`auth_role`, `can_write_department`, ...), the `handle_new_user` and `sync_approved_email` triggers, RLS and policies |
| `0003_phases_settings.sql` | `phases` (seeded with the five real phases) and `settings` (the three thresholds from the spec) |
| `0004_tasks.sql` | `tasks`, `task_comments`, `task_history`, the update guards, the history trigger, RLS |
| `0005_attendance.sql` | `attendance_sessions`, `attendance_session_secrets`, `attendance_records`, `checkin_coordinates()`, RLS and column-level grants |
| `0006_audit_log.sql` | `audit_log` and the guarded `log_audit()` writer |

## Applying them

**Supabase SQL editor:** open each file, paste it into a new query and run it, in order.

**Supabase CLI:**

```bash
supabase link --project-ref <your-project-ref>
supabase db push
```

## What the security model assumes

- RLS is enabled on every table in the same migration that creates it.
- `profiles` rows are created **only** by the `on_auth_user_created` trigger, and only for
  emails that are already in `approved_emails`. There is deliberately no client INSERT
  policy on `profiles`.
- `attendance_records` has no INSERT policy: self check-ins are written by the server with
  the service role key after validation.
- `attendance_session_secrets` has **no policies at all**, so no signed-in client can read
  the live-code secret.
- `lat` and `lng` on `attendance_records` have no SELECT grant. Use the
  `public.checkin_coordinates(session_id)` function, which decides for itself whether the
  caller may see coordinates.
- `task_history` and `audit_log` have no INSERT policy; they are written only by security
  definer functions.

## Verifying RLS quickly

After applying the migrations, run this in the SQL editor to confirm every table is
protected (it should return no rows):

```sql
select tablename
from pg_tables
where schemaname = 'public'
  and rowsecurity = false;
```
