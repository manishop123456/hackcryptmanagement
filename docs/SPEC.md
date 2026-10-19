# HackCrypt Management System — Product & Technical Spec

Internal web app for **DevClub TRCAC** to run the preparation and execution of **HackCrypt 2027-28** (national hackathon, **8–9 Jan 2027**, planning period **22 Oct 2026 – 7 Jan 2027**).

It digitises the club's "Plan of Action": task assignment, attendance (with location), weekly reviews, contribution tracking, escalation, Level Up lectures and the hackathon workflow.

> Guiding principle from the plan: *Every responsibility must have an owner, every task must have a deadline, every deadline must have a follow-up, and every completed task must have a record.*

---

## 1. Scope & constraints

- **Web only.** Responsive, mobile-first (most members will use phones). No native app.
- Internal tool for roughly 20–60 users. Optimise for simplicity and reliability, not scale.
- Must be usable by end of **October 2026** (MVP), because Phase 1 requires task trackers and attendance tracking.

## 2. Tech stack

| Layer | Choice |
|---|---|
| Framework | Next.js (App Router) + TypeScript |
| UI | Tailwind CSS + shadcn/ui |
| Backend / DB | Supabase (Postgres, Auth, Row Level Security, Realtime) |
| Auth | Google sign-in via Supabase Auth |
| Maps | Leaflet + OpenStreetMap (no paid API key) |
| Validation | Zod |
| Hosting | Vercel (HTTPS is required for browser geolocation) |

Server-side logic goes in Next.js Route Handlers / Server Actions. **All attendance and permission checks must be enforced on the server and in RLS, never only in the UI.**

## 3. Roles & permissions

### Roles
`faculty`, `president`, `vice_president`, `management_head`, `development_head`, `hackathon_head`, `team_lead`, `member`

### Departments
`creatives`, `admin`, `social_media`, `pr`, `development`, `hackathon`, `management`

A `team_lead` always has a department. The four domain leads are: Creatives, Admin, Social Media, PR.

### Permission matrix

| Capability | Faculty | Pres / VP | Mgmt Head | Dev Head | Hackathon Head | Team Lead | Member |
|---|---|---|---|---|---|---|---|
| View all dashboards | read | yes | yes | yes | yes | own dept | own data |
| Create / assign tasks | no | yes | yes | yes | yes (hackathon) | own dept | no |
| Edit any task | no | yes | yes | yes | own dept | own dept | own tasks (status/output only) |
| Create attendance sessions | no | yes | yes | yes | yes | **own dept** | no |
| Manual attendance override | no | yes | yes | yes | own dept | **own dept** | no |
| View all departments' attendance | read | yes | yes | yes | yes | Admin lead: **yes (read)**, others: own dept | own records |
| See raw check-in coordinates | no | yes | yes | yes | yes | own dept | own record only |
| Manage users / roles | no | no | yes | yes | no | no | no |
| Submit weekly report | no | no | no | yes | yes | yes | no |
| View audit log | read | yes | yes | yes | no | no | no |

Notes:
- The **Admin lead** keeps organisation-wide attendance records, so gets read access across departments.
- Faculty gets a read-only dashboard.
- Role/department changes by managers are always audit-logged.

### Seed users (from the Plan of Action; emails to be filled by the admin)
- Faculty Head / DevClub Incharge — Prof. Komal Jambhale
- President — Soujas Mane
- Vice President — Omkar More
- Management Head — Kinjal More
- Development Head — Manish Choudhary
- Team Leads — Creatives: Hiya Sonpar · Admin: Kunal Sakhiya · Social Media: Naeva Parmar · PR: Darshan Gohil
- Management Associates — Yash Khanvilkar, Shubham Dayama

Provide an **admin screen to invite/pre-register users by email** and assign role + department. A first-time Google login for an unknown email gets no access until approved.

---

## 4. Modules

### 4.1 Tasks (core)

Fields (from the plan's task format):
`title`, `description`, `department`, `owner` (required), `deadline` (required), `priority` (High / Medium / Low), `status` (Not Started / In Progress / Review / Completed / Delayed), `output` (link or note), `remarks`, `phase`, `blocked_by` (other task ids), `assigned_by`.

Rules:
- **A task cannot be saved without an owner and a deadline** (DB `NOT NULL` + validation).
- A scheduled job (or on-read computation) flips overdue, not-completed tasks to **Delayed**.
- Moving a task to **Completed** requires an output link or note.
- Members can change status and add output/comments only on their own tasks.
- Every status change is stored in `task_history`.
- Comments per task.
- Views: **My Tasks**, **Department board (kanban)**, **All tasks list with filters** (department, owner, status, priority, phase, overdue), **Calendar**.

### 4.2 Attendance with location (core)

**Session types:** `meeting`, `level_up`, `event_day`, `work_session`.

**Creating a session** (team lead for their dept, or higher roles):
- title, type, department (or all), start, end, grace minutes
- venue: drop a pin on a map, set **allowed radius in metres** (default 100)
- optional: **require live code**

**Member check-in (self check-in, web):**
1. Member opens the session and taps **Check in**.
2. Browser requests location (`navigator.geolocation`, high accuracy).
3. If the session requires a live code, member enters it.
4. Client posts `{ session_id, lat, lng, accuracy_m, code? }` to the server.
5. **Server** computes everything (never trust client-side distance or time):
   - distance from venue using the Haversine formula
   - current time vs session window
   - code validity

**Status logic (server-side):**

| Condition | Result |
|---|---|
| Inside radius, within window (incl. grace), code ok | `present` (verified) |
| Inside radius, after grace period but before end | `late` |
| Outside radius | `present` **flagged: outside_area**, pending lead review |
| Location permission denied or unavailable | `present` **flagged: no_location**, pending lead review |
| Accuracy worse than 200 m | flagged: `low_accuracy`, pending lead review |
| Outside the time window | rejected with a clear message |
| Wrong or expired code | rejected |

Flagged records are **not auto-rejected** (indoor GPS is unreliable). A lead approves or rejects them from the review queue.

**Live code:** time-based code derived from `HMAC(session_secret, floor(now / 30s))`, shown large on the lead's session screen at the venue, refreshing every 30 seconds. Server accepts the current and the previous window.

**Lead attendance panel (per department):**
- create and close sessions
- **live list** of who has checked in (Realtime) with status badges
- map showing check-in points relative to the venue circle
- **manual mark/edit** (present / late / excused / absent) with a **mandatory remark**
- **flag review queue** (approve / reject)
- per-member attendance %, per-session report, **CSV export**

**Privacy:** location is read **only at the moment of check-in**, never in the background. Show a short notice on the check-in screen. Members see their own status; raw coordinates are visible only to roles allowed in the matrix.

**Unique constraint:** one record per `(session_id, member_id)`.

### 4.3 Dashboards

- **Home (member):** my tasks due soon, upcoming sessions, my attendance %.
- **Lead:** department RAG status, delayed tasks, attendance summary, pending reviews.
- **Core (Pres/VP/Mgmt/Dev):** all departments, phase progress, countdown to 8 Jan, overdue list, open issues.
- **Faculty:** read-only summary.

### 4.4 Phases & timeline

Seed the five phases from the plan:
1. Foundation — 22–31 Oct
2. Execution — 1–15 Nov
3. Active Preparation — 16 Nov – 15 Dec
4. Final Preparation — 16–31 Dec
5. Final Week — 1–7 Jan

Tasks can be tagged to a phase. Show a timeline with a "you are here" marker and per-phase completion %.

### 4.5 Weekly review & department status

- Weekly report form per lead/head with the plan's 9 fields: work assigned, completed, pending, delayed, team participation, attendance, problems faced, support required, next week's tasks.
- **Auto-fill** assigned/completed/pending/delayed/attendance from task and attendance data; lead edits and adds problems/support/next tasks.
- **Department status (RAG), configurable thresholds:**
  - **Red:** any overdue High-priority task, or more than 30% tasks delayed, or weekly report missing
  - **Yellow:** 10–30% tasks delayed, or department attendance below 70%
  - **Green:** otherwise
- Reminder to leads who have not submitted.

### 4.6 Contribution tracking

Per member, computed automatically:
- tasks assigned vs completed (on-time weighted)
- attendance %
- lead rating (0–100) and "major contribution" note, entered by the lead

**Overall contribution % = 50% task score + 30% attendance + 20% lead rating** (weights configurable in a settings table). Show the formula in the UI. Export to CSV for certificates.

### 4.7 Issues & escalation

- Issue log: title, description, severity (Low / Medium / High / Critical), department, raised by, status (Open / Escalated / Resolved).
- Escalation chain per the plan: Member → Team Lead → Management Head → President/VP → Faculty. Development: Dev team → Dev Head. Hackathon: Hackathon team → Hackathon Head.
- Escalate button moves the issue up one level and notifies that level. Show issue age ("open 5 days").

### 4.8 Level Up (lectures)

- Pipeline stages: Topic → Speaker → Date → Venue → Preparation → Lecture → Review.
- Per-lecture checklist: topic, speaker, date/time, venue, equipment, schedule, responsibilities, communication to participants, speaker in formal attire.
- Creates a linked **attendance session** and registration for the lecture.
- Post-lecture: feedback form, notes, issues and improvements.

### 4.9 HackCrypt module

- Problem statements: submitted / under review / changes requested / finalised, with the final document link.
- Registrations & teams: team name, members, college, status (pending / confirmed / dropped); CSV import/export. (Link to the public registration site rather than rebuilding it.)
- Rules & guidelines and event schedule with version history.
- Submission and registration deadlines.
- Event-day mode: fast check-in screen for volunteers and participants, live issue board.

### 4.10 Notifications

- In-app notification centre.
- Email for: task assigned, deadline in 24h, task delayed, session starting, weekly report due, issue escalated.
- Daily digest to Management. (WhatsApp/Discord can come later.)

### 4.11 Documentation & reports

- Meeting minutes linked to a session; attendee list auto-pulled.
- Post-event review checklists (immediately / within 2–3 days / within 4–7 days).
- **One-click final report** (PDF): task summary, attendance, contribution, issues, per-department outcomes.
- **Audit log:** who changed what and when (tasks, attendance overrides, roles).

---

## 5. Data model (Postgres, indicative)

```sql
-- enums
create type app_role as enum ('faculty','president','vice_president','management_head','development_head','hackathon_head','team_lead','member');
create type department as enum ('creatives','admin','social_media','pr','development','hackathon','management');
create type task_status as enum ('not_started','in_progress','review','completed','delayed');
create type priority as enum ('high','medium','low');
create type session_type as enum ('meeting','level_up','event_day','work_session');
create type attendance_status as enum ('present','late','excused','absent');
create type attendance_method as enum ('self','manual');
create type review_status as enum ('not_needed','pending','approved','rejected');

profiles(id uuid pk references auth.users, full_name, email unique, role app_role, department department, is_active bool, created_at)
phases(id, name, starts_on, ends_on, sort_order)
tasks(id, title, description, department, owner_id not null, assigned_by, deadline timestamptz not null,
      priority, status, output text, remarks, phase_id, blocked_by uuid[], created_at, updated_at, completed_at)
task_comments(id, task_id, author_id, body, created_at)
task_history(id, task_id, changed_by, field, old_value, new_value, created_at)

attendance_sessions(id, title, type session_type, department null, starts_at, ends_at, grace_minutes default 10,
      venue_name, venue_lat, venue_lng, radius_m default 100, require_code bool, code_secret, linked_lecture_id null, created_by, created_at)
attendance_records(id, session_id, member_id, status attendance_status, checked_in_at,
      lat, lng, accuracy_m, distance_m, method attendance_method, marked_by, remark,
      flag text null, review review_status default 'not_needed', reviewed_by, created_at,
      unique(session_id, member_id))

weekly_reports(id, author_id, department, week_start, assigned, completed, pending, delayed, participation, attendance, problems, support_needed, next_tasks, status_rag, submitted_at)
contribution_ratings(id, member_id, rated_by, period, rating int check (0..100), major_contribution text)
issues(id, title, description, severity, department, raised_by, current_level, status, created_at, resolved_at)
lectures(id, topic, speaker, starts_at, venue, stage, checklist jsonb, feedback_url, notes)
problem_statements(id, title, source, status, document_url, notes)
teams(id, name, college, members jsonb, status, notes)
notifications(id, user_id, kind, payload jsonb, read_at, created_at)
audit_log(id, actor_id, action, entity, entity_id, before jsonb, after jsonb, created_at)
settings(key pk, value jsonb)   -- contribution weights, RAG thresholds, default radius
```

**RLS requirements:** enable RLS on every table. Policies enforce the permission matrix in section 3 (department-scoped for leads, own-row for members). Attendance inserts for self check-in go **only through a server function** using the service role after validation. The client never writes `status`, `distance_m` or `flag` directly.

---

## 6. Pages / routes

- `/login`
- `/` — role-based dashboard
- `/tasks`, `/tasks/new`, `/tasks/[id]`, `/tasks/board`
- `/attendance` — my sessions and my %
- `/attendance/sessions/new` — create session (lead+)
- `/attendance/sessions/[id]` — member check-in view, and lead live panel (role-aware)
- `/attendance/review` — flagged check-in queue
- `/attendance/reports`
- `/reviews/weekly`, `/reviews/status`
- `/contribution`, `/contribution/[memberId]`
- `/issues`
- `/levelup`, `/levelup/[id]`
- `/hackcrypt/problem-statements`, `/hackcrypt/teams`, `/hackcrypt/schedule`
- `/timeline`
- `/admin/users`, `/admin/settings`, `/admin/audit`
- `/reports/final`

---

## 7. Non-functional requirements

- Mobile-first responsive UI, fast on mid-range phones and campus Wi-Fi.
- HTTPS only. No secrets in the repo; provide `.env.example`.
- Validate every input with Zod on the server.
- Rate-limit check-in endpoint (per user).
- Accessible: keyboard navigable, sufficient contrast, clear error messages (especially for location denied, outside area, expired code).
- Clean dark and light theme (design: modern, minimal, tech-club feel).
- README with setup steps, Supabase migration instructions, and seed script.

## 8. Milestones

| # | Milestone | Contents |
|---|---|---|
| **M1** | Foundation | Project scaffold, Supabase schema + migrations + RLS, Google auth, profiles, invite/approve flow, role guards, seed phases and users |
| **M2** | Tasks | Task CRUD with owner/deadline enforcement, statuses, delayed auto-flag, comments, history, My Tasks, board, filters |
| **M3** | Attendance | Sessions, map venue picker, location check-in, live code, server validation, lead panel (live list, manual override, review queue), reports, CSV export |
| **M4** | Dashboards | Role-based dashboards, phase timeline, countdown |
| M5 | Reviews & contribution | Weekly reports (auto-fill), RAG status, contribution %, notifications |
| M6 | Operations | Issues & escalation, Level Up module, HackCrypt module |
| M7 | Wrap-up | Final report PDF, event-day mode, audit views, load test, polish |

**MVP = M1 to M4**, targeted for ~22 Oct 2026.

## 9. MVP acceptance criteria

1. Only pre-approved Google accounts can access the app; roles and departments are enforced.
2. A lead can create a task for a member only with owner and deadline; overdue tasks show as Delayed.
3. A Creatives/Admin/Social/PR lead can create an attendance session for their own department only, with a map pin and radius.
4. A member can check in from a phone browser; the server decides present / late / flagged using location, time and live code.
5. A check-in from outside the radius is flagged and appears in the lead's review queue.
6. A lead can manually override a record with a mandatory remark, and it appears in the audit log.
7. The Admin lead can view attendance for all departments; other leads cannot.
8. Attendance can be exported as CSV, with per-member percentages.
9. A member cannot read or write another member's data through the UI or direct API calls (verified by RLS tests).
