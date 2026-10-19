# Security and RLS rules

- Enable Row Level Security on EVERY table in the same migration that creates it.
- Never use the Supabase service-role key in client code or in any file that ships to the browser. Use it only inside server-only modules.
- Every API route / server action must: (1) authenticate, (2) load the caller's profile (role + department), (3) check permission against SPEC section 3, (4) validate input with Zod, (5) then act.
- Members can read and write only their own rows, except where the spec grants more.
- Leads are scoped to their own department. The Admin lead may READ attendance across departments but not write outside their own.
- Self check-in is inserted only by a server function after validation. Block direct client inserts/updates to `attendance_records` for status, distance, flag and review columns.
- Write RLS tests: for each role, assert allowed and denied reads/writes on tasks, attendance_sessions, attendance_records, audit_log and profiles.
- Pre-approved emails only: a first Google login for an unknown email gets no access until a manager approves it.
- Rate-limit the check-in endpoint per user.
- Never log raw coordinates, tokens or secrets.
- Audit-log: role changes, manual attendance overrides, review decisions, task deletions.
