# PROGRESS

> The agent must read this at the start of every session and update it after every task.

## Current milestone
DevClub Management & Accountability System Overhaul & Comprehensive QA/AppSec Bug Hunt Audit: **complete and verified**.

## Milestone status
- [x] M1 Foundation: scaffold, Supabase schema + migrations + RLS, Google auth, profiles, invite/approve flow, role guards, seed phases and users
- [x] M2 Tasks: task CRUD with owner and deadline enforcement, 5 status workflow, output requirement on completion, delayed status logic, comments thread, audit trail history, Kanban & List views, department & phase filters, and dashboard widget integration.
- [x] M3 Attendance: location-verified check-ins, Haversine formula, 30s HMAC dynamic passcodes, flag review queue, lead override panel with mandatory remarks, audit logging, CSV export, interactive Leaflet venue map, member attendance stats, and SQL RLS test suite.
- [x] M4 Dashboards and timeline: full production role-aware dashboard, KPI stat cards, task status distribution, urgent deadline matrix, active attendance alerts, department RAG health status, HackCrypt event countdown, chronological activity timeline, and timeline filters.
- [x] M5 Reviews, contribution, and notifications: weekly report form with 9 plan fields, auto-filled task/attendance metrics, automated department RAG status computation, transparent overall contribution formula (50% task + 30% attendance + 20% lead rating), lead rating editor, in-app notification center and action models.
- [x] M6 Issues, Level Up, HackCrypt module: multi-tier issue escalation chain, Level Up lectures pipeline with 7 preparation stages and checklist editor, HackCrypt problem statement tracking and hackathon team registration matrix.
- [x] M7 Final report, event-day mode, polish: production reports dashboard with CSV exports, live event-day operational war room, dynamic passcode presenter, active attendance monitors, and emergency helpdesk.
- [x] Extension: DevClub Management & Accountability System (Migration `0018`, Co-head roles, Daily Work Log & Reviewer Digest Module, Social Media Control Room, Deadline Radar, & Preservation on Deactivation).
- [x] Comprehensive Full-Stack & AppSec Bug Hunt: 12 confirmed bugs remediated with minimal safe fixes, migration `0019` created for cancelled task cron sync, navigation gaps closed, 10-case security permission test suite + 5-case workflow regression test suite added with 100% pass rate, full TypeScript check, ESLint check, and Next.js 16.4 production build verified.
- [x] Playwright E2E Setup & Initial Smoke Test Suite:
  - Configured `playwright.config.ts` (Chromium project, single worker, retries: 0, testDir: `tests/e2e`, outputDir: `test-results`, HTML/JSON reporting, webServer integration with Next.js dev server).
  - Added npm scripts to `package.json`: `test:e2e`, `test:e2e:ui`, and `test:e2e:report`.
  - Updated `.gitignore` to exclude `playwright-report/`, `test-results/`, and `playwright/.auth/`.
  - Created `tests/e2e/smoke.spec.ts` executing TEST 1 (Login page loads & form renders), TEST 2 (Main routes direct navigation crash audit across 9 routes), and TEST 3 (Browser runtime error collection & diagnostic reporting).
  - Executed tests with `npx playwright test`: 3/3 passed (100%), verified against Next.js 16 App Router on Chromium.
- [x] Role-by-Role Authenticated Browser QA Suite:
  - Created `tests/e2e/auth.spec.ts` covering all 17 QA accounts from `docs/ROLE_BY_ROLE_TESTING_GUIDE.md`.
  - Configured isolated browser context per account, automated login form submission, identity verification, session persistence on reload, authorized route verification, restricted route access denial verification (NoAccess state or redirect), and post-logout protection.
  - Implemented secure credential resolution supporting `E2E_TEST_PASSWORD` and per-account variables (`E2E_PASSWORD_<ACCOUNT>`), marking unconfigured accounts as safely SKIPPED with full diagnostic annotation (never hardcoding passwords or falsifying test passes).
  - Created `docs/QA_AUDIT_REPORT.md` providing individual account-by-account breakdown.
  - Executed full suite: 20 total tests (3 passed, 17 skipped as unconfigured, 0 failed).
  - Verified `npx tsc --noEmit` (0 errors) and `npm run lint` (0 errors).
- [x] External Staging QA & Vercel Hosting Preparation:
  - Verified production build: `npm run build` compiled all 37 App Router static and dynamic routes successfully with Turbopack.
  - Verified security architecture: `server-only` guards on Supabase admin & server clients; verified 0 leaks of `SUPABASE_SERVICE_ROLE_KEY` to client-side code.
  - Identified staging environment requirements: isolated staging Supabase project must be provisioned before sharing preview URLs to avoid polluting the owner environment (`fyjsdgufcnnnukcfsdio`).
  - Added Next.js Web App Manifest (`src/app/manifest.ts`) providing immediate mobile PWA installation ("Add to Home Screen").
  - Formulated APK/PWA recommendation: Android Trusted Web Activity (TWA) via Bubblewrap over hosted Vercel staging URL, preserving Next.js App Router dynamic rendering and Server Actions without static export.
  - Created `docs/EXTERNAL_QA_GUIDE.md` for external testers covering access, credentials, role modules, phone GPS attendance, bug reporting, and session hygiene.

- **Next.js Server Action Export Bug Fix Across Project**:
  - Identified root cause: In Next.js 16 App Router (with Turbopack), files marked with `"use server"` can only export asynchronous functions. Exporting runtime objects (such as `INITIAL_REPORT_STATE`, `INITIAL_SOCIAL_STATE`, `INITIAL_TASK_STATE`, `INITIAL_ADMIN_STATE`) causes fatal module evaluation runtime errors when client components import from them.
  - Extracted initial state objects and their TypeScript types into separate dedicated constants modules without `"use server"`:
    - `src/lib/daily-reports/constants.ts` (`INITIAL_REPORT_STATE`, `DailyReportActionState`)
    - `src/lib/social-media/constants.ts` (`INITIAL_SOCIAL_STATE`, `SocialMediaActionState`)
    - `src/lib/tasks/constants.ts` and `src/app/(app)/tasks/constants.ts` (`INITIAL_TASK_STATE`, `TaskActionState`)
    - `src/app/(app)/admin/users/constants.ts` (`INITIAL_ADMIN_STATE`, `AdminActionState`)
  - Updated action modules to export only async functions:
    - `src/lib/daily-reports/actions.ts`: Removed `INITIAL_REPORT_STATE` runtime export.
    - `src/lib/social-media/actions.ts`: Removed `INITIAL_SOCIAL_STATE` runtime export.
    - `src/app/(app)/tasks/actions.ts`: Removed `INITIAL_TASK_STATE` runtime export.
    - `src/app/(app)/admin/users/actions.ts`: Removed `INITIAL_ADMIN_STATE` runtime export.
  - Updated all client component consumers to import initial states from constants modules:
    - `src/app/(app)/daily-reports/new/report-form-client.tsx`
    - `src/app/(app)/daily-reports/digest/review-report-dialog.tsx`
    - `src/app/(app)/social-media/social-media-client.tsx`
    - `src/components/tasks/task-form-dialog.tsx`
    - `src/components/tasks/task-comments.tsx`
    - `src/components/tasks/task-card.tsx`
    - `src/app/(app)/tasks/[id]/task-detail-client.tsx`
    - `src/app/(app)/admin/users/admin-users-client.tsx`
  - Validated with: `npx tsc --noEmit` (0 errors), `npm run lint` (0 errors), `npm test` (100% passed), `npm run build` (Exit 0, all 37 routes static/dynamic compiled cleanly), `.next` cleared, dev server tested across all 25 routes.
- **Comprehensive QA, AppSec, & Database Bug Hunt Audit Complete**:
  - **Security & Authorization Hardening**:
    - `src/lib/permissions.ts`: Corrected `MANAGER_ROLES` to strictly `["management_head", "development_head"]` to align with SPEC Section 3 and migration `0002_core_profiles.sql` (`can_manage_users()`), preventing PostgreSQL `42501` permissions violation when President/VP accessed `/admin/users`.
    - `src/app/(app)/admin/users/actions.ts`: Added guard preventing managers from changing their own role via `updateApprovedEmail`.
    - `src/lib/reviews/actions.ts`: Added missing role guard (`requireActiveProfile` and `canWriteDepartment`) to `submitWeeklyReportAction`, blocking plain members and faculty from submitting weekly reports.
    - `src/lib/contribution/actions.ts`: Hardened `saveLeadRatingAction` by enforcing lead/head role checks, self-rating rejection (`memberId === actor.id`), and department write boundary checks.
    - `src/lib/issues/actions.ts`: Authenticated `escalateIssueAction` and `resolveIssueAction` via `requireActiveProfile` and restricted resolution/escalation to author or department lead/core.
    - `src/lib/social-media/actions.ts`: Enforced status transition checks preventing plain members from approving, requesting revisions, or publishing posts; added mandatory live publication URL validation for `published` status; recorded reviewer ID.
    - `src/app/(app)/tasks/actions.ts`: Fixed `deleteTaskComment` scope check to verify permissions against the task's department (`tasks!inner(department)`), preventing cross-department lead comment deletions.
  - **Data Integrity & Workflow Remediations**:
    - `src/lib/daily-reports/actions.ts`: Replaced `.single()` with `.maybeSingle()`, fixed unused variable, mapped `changes_requested` in audit history, and blocked reverting approved/submitted reports to drafts.
    - `src/lib/tasks/queries.ts` & `src/app/(app)/page.tsx`: Strictly excluded `cancelled` tasks from overdue calculations, active task lists, and high-priority overdue checks, preventing false positive alarms and department RED RAG status.
    - `supabase/migrations/0019_fix_sync_delayed_tasks_cancelled.sql`: Corrected `sync_delayed_tasks()` function (`WHERE status NOT IN ('completed', 'delayed', 'cancelled') AND deadline < now()`) to prevent automated pg_cron from overwriting cancelled tasks to `delayed`.
    - `src/lib/validations/tasks.ts`: Added completion output refinement to `createTaskSchema` so creating a task directly with `status: 'completed'` requires an output link or note, preventing database check constraint `tasks_completed_needs_output` (`23514`) failure.
    - `src/lib/radar/queries.ts` & `src/app/(app)/radar/page.tsx`: Added department filtering support (`department?: Department | "all"`) and filter UI.
    - `src/lib/nav.ts`: Added missing navigation items for `/daily-reports`, `/radar`, and `/social-media` to `NAV_ITEMS`.
    - `src/app/(app)/daily-reports/page.tsx`: Fixed unescaped HTML entity (`&apos;`).
  - **Automated Regression Testing**:
    - Created `scripts/test-workflow-bugs.mjs` verifying task completion output refinement, cancelled task exclusion, social media URL validation, comment deletion department scoping, and self-role escalation blocking.
    - Expanded `scripts/test-permissions.mjs` to 10 comprehensive security test cases.
    - Executed all tests (`npm test`): 11 attendance + 10 security + 5 workflow tests = 26/26 passed (100%).
    - Executed `npx tsc --noEmit`: 0 errors.
    - Executed `npm run lint`: 0 errors, 25 dev-only warnings.
    - Executed `npm run build`: Exit 0 (all 37 Next.js App Router routes compiled and optimized cleanly).
  - **Database Migration `0018_devclub_management_system.sql`**: Added co-head roles (`development_co_head`, `management_co_head`, `co_head`), `daily_reports`, `daily_report_history`, and `social_media_posts` tables with strict RLS policies and foreign key constraints (`ON DELETE RESTRICT` / `ON DELETE SET NULL`) preserving historical records on member deactivation.
  - **Daily Work Log & Reviewer Digest (`/daily-reports`, `/daily-reports/new`, `/daily-reports/digest`)**: Supports draft saving, daily work entries with duration & task linking, proof URLs, excused leave/authorized no-work requests, and leadership digest view with review approvals/revision requests and missing report matrix.
  - **Social Media Control Room (`/social-media`)**: Comprehensive social media pipeline management across Instagram, LinkedIn, Twitter/X, and YouTube, tracking post formats, publishing deadlines, live post links, and status transitions.
  - **Deadline Radar & Escalation Chain (`/radar`)**: Real-time operational radar aggregating overdue tasks, missing daily report submissions, and urgent social media deliverables into a unified alert dashboard.
  - **Strict Quality Verification**: `npx tsc --noEmit` (passed with 0 errors), `npm run lint` (passed with 0 errors), and `npm test` (passed 100% unit tests).
- Next.js 16 (App Router) + TypeScript strict + Tailwind v4 project at the repository root.
- Design tokens taken from the **real** devclubtrcac.in palette (accent `#00E5FF`,
  background `#0C0E13`, Geist + JetBrains Mono) mapped into Tailwind via `@theme`.
- Brand shell: sticky top bar with the club logo, desktop sidebar, mobile bottom nav,
  canvas starfield (login + faint behind the app), subtle Framer Motion fades.
- shadcn/ui style primitives written locally: button, card, input, label, badge, select,
  dialog, dropdown menu, table, separator, alert, skeleton.
- Migrations `0001`–`0016`: every enum, table, constraint, permission helper function and
  RLS policy, plus the five real phases seeded. RLS is enabled in the same migration that
  creates each table.
- **Stage 6 Level Up & HackCrypt Modules Complete**:
  - `lectures`, `problem_statements`, and `teams` database tables with RLS and foreign key constraints.
  - Server actions with Zod validation, role authorization, and audit logging for all lecture, problem statement, and team CRUD operations.
  - Interactive UI pages: `/levelup` (overview & stage progression), `/levelup/new` (lecture initialization & linked attendance creation), `/levelup/[id]` (stage switcher & checklist editor), `/hackcrypt` (event countdown & problem statement / team tabs), `/hackcrypt/ps/new` & `/hackcrypt/ps/[id]` (PS lifecycle management), `/hackcrypt/teams/new` & `/hackcrypt/teams/[id]` (team roster management & track assignment).
- **Stage 7 Reports, Event-Day Mode, & Production Audit Complete**:
  - Built `/reports` analytics dashboard with overall KPIs (active members, task completion rate %, attendance sessions, confirmed hackathon teams) and exportable CSV reports for attendance, tasks, and contribution matrix.
  - Built `/event-day` live operational war room for HackCrypt 2027-28 (8–9 Jan 2027), featuring live attendance session monitors, dynamic passcode presenter, and direct helpdesk issue escalation.
  - Executed full quality audit: `npm run typecheck` (passed with 0 errors), `npm run lint` (passed with 0 errors/warnings), `npm test` (passed 100%), and `npm run build` (Exit code: 0).
- Google auth through `@supabase/ssr`, profile creation by trigger for pre-approved emails
  only, `/pending` for everyone else, POST-only sign-out.
- Middleware session refresh plus route protection; capability matrix mirrored in
  `src/lib/permissions.ts` and enforced independently in SQL.
- `/admin/users`: add, edit and revoke approved emails, pause or restore a member, every
  change written to the audit log.
- `/admin/audit`: read-only trail for Faculty, President, VP, Management Head, Dev Head.
- **Stage 2 Tasks Module complete**:
  - `tasks`, `task_comments`, `task_history` database triggers & RLS policies verified.
  - Server Actions for Task CRUD, status updates, completion output verification, comment handling, and deletion.
  - Kanban Board (5 columns: Not Started, In Progress, Review, Completed, Delayed) and List View with Overdue indicators.
  - Task Detail Page (`/tasks/[id]`) with full task meta, output link/note preview, comment section with author deletion controls, and chronological audit history.
- **Stage 3 Attendance Module complete**:
  - **Server-side Attendance Evaluation**: Implemented pure `evaluateCheckIn()` covering 10-min pre-open window, grace period calculation, venue proximity (Haversine formula), 30s dynamic HMAC passcode verification, and flag generation (`outside_area`, `no_location`, `low_accuracy`).
  - **Zod Validation & Security**: Enforced strict Zod schemas on check-in, session creation, manual override, and flag review to prevent client injection of `status`, `distance_m`, or `flags`.
  - **Server Actions**: Implemented `checkInMemberAction()`, `createAttendanceSessionAction()`, `closeAttendanceSessionAction()`, `overrideAttendanceRecordAction()`, `reviewAttendanceFlagAction()`, and `getLiveSessionCodeAction()`.
  - **Manual Overrides & Audit Log**: Implemented mandatory min 5 character remarks for manual overrides; writes all overrides and flag decisions to `audit_log`.
  - **UI Components & Pages**: Built `/attendance` (overview, stats, pending flag queue, department filters), `/attendance/[id]` (session detail, check-in form with privacy notice, live passcode presenter, interactive Leaflet venue & check-in map, roster table with status badges and overrides, CSV export), and `/attendance/new` (session creation form).
  - **Automated Testing**: Built 16-scenario unit test suite (`scripts/test-attendance.mjs` / `npm test`) achieving 100% pass rate. Created Stage 3 RLS SQL Test Suite (`supabase/tests/stage3_rls.sql`). Enabled Attendance navigation tab (`available: true`).
  - **Final Authentication Migration Complete**:
  - Completely removed Google OAuth dependencies (`GoogleSignInButton`, `signInWithOAuth`, `google-sign-in-button.tsx`).
  - Implemented `LoginForm` using `@supabase/ssr` with `supabase.auth.signInWithPassword()`.
  - Implemented `ForgotPasswordForm` and `ResetPasswordForm` components, `/forgot-password` and `/reset-password` pages for PKCE code exchange recovery flow.
  - Whitelisted `/forgot-password` and `/reset-password` in `middleware.ts`.
  - Refactored `src/app/auth/callback/route.ts` to process code exchange for password reset links.
  - Cleared all references to Google authentication across the codebase (`admin-users-client.tsx`, `pending/page.tsx`, `lib/auth.ts`).
  - Cleaned up all TypeScript `any` types, unused imports, and unescaped entity warnings.
  - Verified full build pipeline: `npm run lint` (0 errors), `npm run typecheck` (0 errors), `npm test` (18/18 passed), and `npm run build` (Exit code: 0).
  - **Final Production Auth Smoke Test Verified**:
    - Login page `/login`: Verified email/password form; confirmed 0 Google/OAuth buttons exist.
    - Route Guard `/tasks`: Attempting to access protected route redirects cleanly to `/login?next=%2Ftasks`.
    - Forgot Password `/forgot-password`: Renders cleanly with email input and recovery request action.
    - Reset Password `/reset-password`: Appropriately handles unauthenticated/expired link states with clear feedback card.

- [x] M4 Dashboards and timeline: full production role-aware dashboard, KPI stat cards, task status distribution, urgent deadline matrix, active attendance alerts, department RAG health status, HackCrypt event countdown, chronological activity timeline, and timeline filters.
- [x] M5 Reviews, contribution, and notifications: weekly report form with 9 plan fields, auto-filled task/attendance metrics, automated department RAG status computation, transparent overall contribution formula (50% task + 30% attendance + 20% lead rating), lead rating editor, in-app notification center and action models.

## In progress
- **Official Email Identities & Migration Plan (devclubtrcac.in)**:
  - Conducted Phase 1 DNS & Email Provider audit for `devclubtrcac.in` on Vercel DNS (`ns1.vercel-dns.com`, `ns2.vercel-dns.com`). Confirmed 0 MX / SPF / DKIM records currently active on the public domain.
  - Formulated Phase 2 Official Email Directory (`docs/OFFICIAL_DEVCLUB_EMAIL_DIRECTORY.md`) specifying personal mailboxes for all actual roster members (`firstname.lastname@devclubtrcac.in`) and functional role-based distribution aliases (`president@...`, `admin@...`).
  - Created Phase 4/6 Email Migration Plan (`docs/EMAIL_MIGRATION_PLAN.md`) enforcing Supabase Auth UUID preservation (`ON DELETE RESTRICT` / CASCADE safety) and atomic migration steps.
  - Built idempotent provisioning/migration utility (`scripts/migrate-email-identities.mjs`) featuring sanitized project reference masking, dry-run by default, owner safeguard for `manish.choudhary@devclubtrcac.in`, and QA account isolation (`@devclub.test`).

## Next up
1. Domain Administrator adds MX/SPF/DKIM records to Vercel DNS for selected provider (Google Workspace, Zoho Mail, or Microsoft 365).
2. Provision mailboxes and aliases on provider dashboard.
3. Execute single test member migration upon user approval.
4. Onboard leadership and department heads via self-service password reset.

## Decisions made
- Members self check-in with location; leads can override manually.
- Stack: Next.js + Supabase + Vercel.
- **Brand values are copied from the live club site rather than guessed** (`#00E5FF` accent,
  `#0C0E13` page background, Geist display font).
- **shadcn/ui primitives are written into `src/components/ui/` directly** instead of using
  the CLI, so they can be themed with the DevClub tokens from the start.
- **The live-code secret moved to `attendance_session_secrets`** (RLS on, no policies),
  because RLS cannot hide a single column on a shared row.
- **`flags` is `attendance_flag[]`** instead of free text, because one check-in can raise
  several flags.
- **`hackathon_head` is department-scoped to `hackathon` for writes** (tasks and overrides),
  but sees every department, matching the matrix in the spec.
- Nav items for unbuilt sections render as disabled "Soon" tabs rather than dead links.
- The planning phases and the three attendance thresholds are the only seed data.

- **Stage 2 Fixes & Acceptance Audit Complete**:
  - `0008_cron_delayed_tasks.sql`: Scheduled `sync_delayed_tasks()` via `pg_cron` every 15 minutes + added `sync_delayed_tasks()` to `getTaskById()`. API cron route deleted (pg_cron only).
  - `0009_comment_delete_policy.sql`: Dropped old author-only comment delete policy and created `task_comments_delete_scope` allowing comment authors AND department team leads to delete comments.
  - `0010_revoke_sync_delayed_tasks_anon.sql`: Security hardening revoking `EXECUTE` on `sync_delayed_tasks()` from `anon` and `public`.
  - `supabase/tests/stage2_rls.sql`: Standalone transaction-based test suite (`BEGIN ... ROLLBACK`) asserting 16 test scenarios across all 6 roles, unapproved user, trigger logging, and cron definer execution.
  - Corrected evidence labels: 375px rendering on `/login` EXECUTED; authenticated page layouts (`/`, `/tasks`, `/tasks/[id]`) NOT VERIFIED without active session; `sync_delayed_tasks()` behavior CODE-REVIEWED & PREPARED IN `stage2_rls.sql`.
  - Typecheck, Lint, and Build verified 100% clean.

## Known bugs / tech debt
- Next 16.4 warns that the `middleware.ts` convention is deprecated in favour of
  `proxy.ts`. Route protection still works as-is; migrate deliberately, not in a hurry.
- `npm audit` flags 5 high-severity advisories inside the dev-only ESLint toolchain. Not
  shipped to production; `npm audit fix --force` would downgrade `eslint-config-next`.
- Unit tests are not set up yet. Stage 3 adds them for the attendance logic (Haversine,
  grace period, code window, flags) per `docs/ATTENDANCE_LOGIC.md`.
- The optional light theme has not been built. Dark is the default and primary theme.

## Open questions for the owner
1. Can you confirm the exact roster emails for the seed list in `docs/SPEC.md`, to be added
   through `/admin/users`?
2. Should `excused` sessions be excluded from the attendance percentage denominator
   (`attendance.excused_excluded`)? It currently defaults to `false`.
3. Is a `hackathon_head` allowed to create an attendance session for **any** department, or
   only for the hackathon team? The matrix says "yes" without qualification for session
   creation, so that is how it is implemented today.

## Environment notes
- Supabase project: https://fyjsdgufcnnnukcfsdio.supabase.co (.env.local created with project credentials & publishable key support)
- Vercel URL: (fill in)
- Google OAuth configured: pending provider client ID configuration in Supabase dashboard
- Brand values verified against devclubtrcac.in: yes
