# DevClub Management & Accountability System
## Individual Role-by-Role Testing & Security Verification Guide

**Document Version:** 1.0.0  
**Environment Project Ref:** `fyjsdgufcnnnukcfsdio`  
**Target Domain:** `@devclub.test`  
**Protected Primary Owner:** `manish.choudhary@devclubtrcac.in` (Strictly excluded from test modifications)  

---

## 1. Complete QA Account Roster & Capability Matrix

| Role | Standardized Display Name | Login Email | Department | Co-head Dept | Reporting Head | Permitted Dashboard & Views | Main Authorized Actions | Actions Denied (Enforced Server-Side) | Manual Login Test Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :---: |
| **Faculty** | Faculty — QA Account | `test.faculty@devclub.test` | *None* | *None* | *Independent* | Global Overview, `/reports`, `/admin/audit`, `/daily-reports/digest` | Organization-wide read-only access; audit trail inspection; daily report oversight. | Task creation/updates; attendance overrides; social media approvals; user admin (`/admin/users`). | **NOT TESTED** *(Password to be set)* |
| **President** | President — QA Account | `test.president@devclub.test` | *None* | *None* | *Board* | Executive Dashboard, all operational modules | Cross-department task assignment; weekly review approvals; lead ratings; attendance overrides. | User management (`/admin/users` restricted to Management Head & Development Head per SPEC Section 3). | **NOT TESTED** *(Password to be set)* |
| **Vice President** | Vice President — QA Account | `test.vp@devclub.test` | *None* | *None* | President | Executive Leadership Dashboard, all operational modules | Cross-department operations oversight; attendance overrides; report reviews; task assignment. | User management (`/admin/users` restricted to Management Head & Development Head). | **NOT TESTED** *(Password to be set)* |
| **Development Head** | Development Head — QA Account | `test.development_head@devclub.test` | `development` | *None* | President | Technical Executive Dashboard, `/admin/users`, `/tasks`, `/levelup`, `/hackcrypt` | User administration (`/admin/users`); dev & hackathon task management; Level Up lecture pipeline; report reviews. | Cannot alter own role; cannot rate own self in lead ratings; cannot complete tasks without deliverable link. | **NOT TESTED** *(Password to be set)* |
| **Development Co-head** | Development Co-head — QA Account | `test.cohead.dev@devclub.test` | `development` | *None* | Development Head | Development & Technical Pillar Workspace | Assign tasks in `development` and `hackathon`; review dev daily reports; create dev attendance sessions. | Cannot access `/admin/users`; cannot modify tasks in `admin`, `pr`, `social_media`, or `creatives`. | **NOT TESTED** *(Password to be set)* |
| **Management Head** | Management Head — QA Account | `test.management_head@devclub.test` | `management` | *None* | President | Operations Executive Dashboard, `/admin/users`, `/radar`, `/social-media`, `/reports` | User administration (`/admin/users`); oversee `admin`, `pr`, `social_media`, `creatives`; approve social posts; radar alerts. | Cannot alter own role; cannot rate own self; cannot delete dev task comments without scope. | **NOT TESTED** *(Password to be set)* |
| **Management Co-head** | Management Co-head — QA Account | `test.cohead.mgmt@devclub.test` | `management` | *None* | Management Head | Management Pillar Operations Workspace, `/social-media`, `/radar` | Manage tasks in `admin`, `pr`, `social_media`, `creatives`, `management`; approve social media; review management daily reports. | Cannot access `/admin/users`; cannot write to development tasks or problem statements. | **NOT TESTED** *(Password to be set)* |
| **Hackathon Head** | Hackathon Head — QA Account | `test.hackathon_head@devclub.test` | `hackathon` | *None* | President | Event Ops War Room, `/hackcrypt`, `/event-day`, `/tasks` | Manage HackCrypt problem statements & teams; assign hackathon tasks; open attendance sessions for any department. | Cannot write to development or management department tasks; cannot access `/admin/users`. | **NOT TESTED** *(Password to be set)* |
| **Admin Team Lead** | Admin Team Lead — QA Account | `test.lead.admin@devclub.test` | `admin` | *None* | Management Head | Department Lead Workspace, `/attendance` | Manage admin tasks and attendance; **read organization-wide attendance records across all departments**. | Cannot override attendance outside `admin`; cannot delete non-admin task comments; cannot access `/admin/users`. | **NOT TESTED** *(Password to be set)* |
| **PR Team Lead** | PR Team Lead — QA Account | `test.lead.pr@devclub.test` | `pr` | *None* | Management Head | Department Lead Workspace, `/tasks`, `/daily-reports/digest` | Assign PR tasks; review PR member daily reports; manage PR attendance sessions; submit PR weekly reports. | Cannot review creatives or dev daily reports; cannot access `/admin/users`. | **NOT TESTED** *(Password to be set)* |
| **Social Media Team Lead** | Social Media Team Lead — QA Account | `test.lead.social_media@devclub.test` | `social_media` | *None* | Management Head | Social Media Control Room (`/social-media`), Lead Workspace | Create, review, request revisions, and approve social media posts; schedule posts; review social media daily reports. | Cannot mark social post `published` without live publication URL; cannot access `/admin/users`. | **NOT TESTED** *(Password to be set)* |
| **Creatives Team Lead** | Creatives Team Lead — QA Account | `test.lead.creatives@devclub.test` | `creatives` | *None* | Management Head | Department Lead Workspace, `/social-media` | Assign creatives tasks; review Creatives daily reports; review creative assets on social posts. | Cannot delete comments on development tasks; cannot review PR/Admin reports; cannot access `/admin/users`. | **NOT TESTED** *(Password to be set)* |
| **Creatives Co-head** | Creatives Co-head — QA Account | `test.cohead.creatives@devclub.test` | `creatives` | `creatives` | Creatives Team Lead | Department Co-head Workspace, `/tasks`, `/daily-reports/digest` | Delegated Creatives leadership: assign creatives tasks; review Creatives daily reports; create creatives attendance sessions. | Cannot modify tasks or attendance in non-creatives departments; cannot access `/admin/users`. | **NOT TESTED** *(Password to be set)* |
| **Development Member** | Development Member — QA Account | `test.member.dev@devclub.test` | `development` | *None* | Development Head | Member Personal Workspace, `/daily-reports/new`, `/tasks` | Self check-in with GPS; submit daily work logs; update assigned task status; comment on tasks. | Cannot assign tasks to others; cannot review other members' daily reports; cannot submit lead ratings; cannot access admin. | **NOT TESTED** *(Password to be set)* |
| **Management Member** | Management Member — QA Account | `test.member.mgmt@devclub.test` | `management` | *None* | Management Head | Member Personal Workspace, `/daily-reports/new`, `/attendance` | Self check-in with GPS; submit daily work logs; view personal contribution score. | Cannot review daily reports; cannot approve social media posts; cannot submit weekly reports. | **NOT TESTED** *(Password to be set)* |
| **Hackathon Member** | Hackathon Member — QA Account | `test.member.hackathon@devclub.test` | `hackathon` | *None* | Hackathon Head | Member Personal Workspace, `/hackcrypt` (read-only), `/tasks` | Work on assigned hackathon tasks; submit daily reports; check in to hackathon sessions. | Cannot create sessions; cannot review daily reports; cannot submit lead ratings. | **NOT TESTED** *(Password to be set)* |
| **Creatives Member** | Creatives Member — QA Account | `test.member.creatives@devclub.test` | `creatives` | *None* | Creatives Team Lead | Member Personal Workspace, `/tasks`, `/daily-reports/new` | Submit design task deliverables; submit daily reports; check in to creatives sessions. | Cannot approve social media posts; cannot review other members' reports; cannot override attendance. | **NOT TESTED** *(Password to be set)* |

---

## 2. Dedicated Role Test Plans

### Scenario A — President (`test.president@devclub.test`)
* **Expected Navigation:** Full club-wide view on `/`, `/tasks`, `/attendance`, `/daily-reports/digest`, `/radar`, `/reviews`, `/contribution`, `/reports`, `/admin/audit`.
* **Step 1:** Log in at `/login`.
* **Step 2 (Authorized Action):** Open `/tasks/new`. Create and assign a task to `creatives` department. Confirm task creates successfully.
* **Step 3 (Authorized Action):** Open `/daily-reports/digest`. Verify all departments are visible and filterable.
* **Step 4 (Authorized Action):** Open `/admin/audit`. Verify audit log records are visible.
* **Step 5 (Boundary Test):** Navigate directly to `/admin/users`. Confirm page displays access restricted or redirects cleanly (since user admin is reserved for Management Head & Development Head per SPEC Section 3).
* **Test Status:** **NOT TESTED** *(Awaiting manual login session)*

### Scenario B — Vice President (`test.vp@devclub.test`)
* **Expected Navigation:** Executive dashboard identical to President.
* **Step 1:** Log in at `/login`.
* **Step 2 (Authorized Action):** Navigate to `/radar`. Verify urgent deadlines across all departments are displayed.
* **Step 3 (Authorized Action):** Open `/contribution`. Edit a member's lead rating. Confirm rating is saved and recalculates score.
* **Step 4 (Boundary Test):** Direct URL access to `/admin/users`. Confirm restricted access.
* **Test Status:** **NOT TESTED** *(Awaiting manual login session)*

### Scenario C — Development Head (`test.development_head@devclub.test`)
* **Expected Navigation:** Tech executive overview, `/admin/users`, `/levelup`, `/hackcrypt`.
* **Step 1:** Log in at `/login`.
* **Step 2 (Authorized Action):** Open `/admin/users`. Verify list of approved emails loads.
* **Step 3 (Authorized Action):** Open `/levelup/new`. Create a Level Up lecture. Verify lecture and linked attendance session initialize.
* **Step 4 (Boundary Test - Self Escalation):** In `/admin/users`, attempt to edit own account (`test.development_head@devclub.test`) to change role to `president`. Confirm server action blocks submission with error: `"You cannot change your own role."`
* **Step 5 (Boundary Test - Task Completion Constraint):** Create a task with status `completed` without output URL. Confirm validation blocks submission.
* **Test Status:** **NOT TESTED** *(Awaiting manual login session)*

### Scenario D — Development Co-head (`test.cohead.dev@devclub.test`)
* **Expected Navigation:** Development pillar workspace.
* **Step 1:** Log in at `/login`.
* **Step 2 (Authorized Action):** Open `/tasks`. Filter by `development` and `hackathon`. Create a development task. Confirm success.
* **Step 3 (Authorized Action):** Open `/daily-reports/digest`. Review a daily report submitted by `test.member.dev@devclub.test`. Confirm review approval works.
* **Step 4 (Boundary Test - Department Isolation):** Attempt to review a daily report submitted by `test.member.creatives@devclub.test`. Confirm server action rejects review: `"You are not authorized to review reports for this department."`
* **Step 5 (Boundary Test - Admin Access):** Direct URL to `/admin/users`. Confirm redirect/access denial.
* **Test Status:** **NOT TESTED** *(Awaiting manual login session)*

### Scenario E — Management Head (`test.management_head@devclub.test`)
* **Expected Navigation:** Operations executive dashboard, `/admin/users`, `/social-media`, `/radar`.
* **Step 1:** Log in at `/login`.
* **Step 2 (Authorized Action):** Open `/admin/users`. Verify access to manage approved emails.
* **Step 3 (Authorized Action):** Open `/social-media`. Change a draft post to `approved`. Verify status transitions and `reviewer_id` records current user ID.
* **Step 4 (Authorized Action):** Open `/daily-reports/digest`. Review reports across `admin`, `pr`, `social_media`, `creatives`.
* **Step 5 (Boundary Test - Cross Pillar Writes):** Attempt to assign a technical development task with custom backend code requirements. Confirm leadership oversight conforms to management scope.
* **Test Status:** **NOT TESTED** *(Awaiting manual login session)*

### Scenario F — Management Co-head (`test.cohead.mgmt@devclub.test`)
* **Expected Navigation:** Management pillar operations workspace, `/social-media`, `/radar`.
* **Step 1:** Log in at `/login`.
* **Step 2 (Authorized Action):** Open `/social-media`. Review post drafts and approve/request revisions.
* **Step 3 (Authorized Action):** Open `/tasks`. Assign tasks in `pr` or `creatives` department.
* **Step 4 (Boundary Test - Admin Access):** Direct URL to `/admin/users`. Confirm access blocked.
* **Step 5 (Boundary Test - Dev Isolation):** Attempt to review dev member daily reports. Confirm blocked.
* **Test Status:** **NOT TESTED** *(Awaiting manual login session)*

### Scenario G — Hackathon Head (`test.hackathon_head@devclub.test`)
* **Expected Navigation:** Event Ops War Room (`/hackcrypt`, `/event-day`).
* **Step 1:** Log in at `/login`.
* **Step 2 (Authorized Action):** Open `/hackcrypt/ps/new`. Create problem statement. Confirm success.
* **Step 3 (Authorized Action):** Open `/attendance/new`. Create event-day session. Verify `canCreateSessionFor` permits session creation for hackathon event.
* **Step 4 (Boundary Test - Scope Isolation):** Attempt to edit non-hackathon tasks or approved emails. Confirm blocked.
* **Test Status:** **NOT TESTED** *(Awaiting manual login session)*

### Scenario H — Department Team Leads (`test.lead.admin`, `test.lead.pr`, `test.lead.social_media`, `test.lead.creatives`)
* **Expected Navigation:** Department lead workspace, `/tasks`, `/attendance`, `/daily-reports/digest`.
* **Step 1 (Admin Lead Special Privilege):** Log in as `test.lead.admin@devclub.test`. Open `/attendance`. Confirm Admin lead can read attendance records across **all departments** (`can_read_attendance_department`).
* **Step 2 (Admin Lead Write Boundary):** Attempt to perform manual attendance override on a Creatives session record. Confirm write is rejected (`canWriteAttendanceDepartment` enforces own department).
* **Step 3 (Creatives Lead Boundary):** Log in as `test.lead.creatives@devclub.test`. Navigate to a Development task comment. Attempt to delete comment written by a development member. Confirm deletion is rejected: `"Only the comment author or a department lead/head can delete this comment."`
* **Step 4 (Social Media Lead Validation):** Log in as `test.lead.social_media@devclub.test`. Mark a post as `published` without providing a live publication URL. Confirm submission is blocked: `"A live publication URL is required when marking a post as published."`
* **Test Status:** **NOT TESTED** *(Awaiting manual login session)*

### Scenario I — Regular Members (`test.member.dev`, `test.member.mgmt`, `test.member.hackathon`, `test.member.creatives`)
* **Expected Navigation:** Member personal workspace, `/daily-reports/new`, `/tasks`, `/attendance`.
* **Step 1:** Log in as `test.member.dev@devclub.test`.
* **Step 2 (Authorized Action):** Open `/daily-reports/new`. Fill in today's work entry with 120 minutes duration and submit. Verify report saves as `submitted`.
* **Step 3 (Authorized Action):** Check in to an active attendance session using GPS. Confirm coordinates are evaluated server-side.
* **Step 4 (Boundary Test - Reviewer Bypass):** Attempt to navigate to `/daily-reports/digest`. Confirm member cannot approve reports.
* **Step 5 (Boundary Test - Lead Rating Self Scoring):** Attempt to invoke `saveLeadRatingAction` awarding self 100/100. Confirm server action rejects call: `"You cannot rate your own profile."`
* **Step 6 (Boundary Test - Social Media Approval):** Attempt to approve a social media post. Confirm server action blocks: `"Only team leads and heads can approve, request revisions, or publish social posts."`
* **Test Status:** **NOT TESTED** *(Awaiting manual login session)*

### Scenario J — Faculty (`test.faculty@devclub.test`)
* **Expected Navigation:** Read-only institutional oversight, `/admin/audit`, `/reports`, `/daily-reports/digest`.
* **Step 1:** Log in at `/login`.
* **Step 2 (Authorized Action):** Open `/admin/audit`. Inspect audit logs. Confirm full read access.
* **Step 3 (Authorized Action):** Open `/reports`. Inspect attendance statistics and task velocity metrics.
* **Step 4 (Boundary Test - Write Lockout):** Attempt to create a task, update a daily report review, override attendance, or access `/admin/users`. Confirm all write actions are strictly rejected.
* **Test Status:** **NOT TESTED** *(Awaiting manual login session)*

---

## 3. Account Passwords & Testing Execution Instructions

### A. How to Set Temporary Passwords (All QA Accounts)
To set a common temporary password across all 17 QA accounts (excluding the owner account):
```bash
npm run set:test-passwords
```
* The script prompts for a temporary password (min 8 characters) with hidden masked input (`*`), requests confirmation, and securely updates all 17 QA accounts via Supabase Admin API.
* In non-interactive or CI environments, pass the password via environment variable:
```bash
TEST_ACCOUNTS_PASSWORD=YourSecureTestPassword123 npm run set:test-passwords -- --confirm
```

### B. How to Set Independent Passwords (Individual Account Isolation)
To set an independent password for a single QA account for isolated testing:
```bash
node scripts/set-test-passwords.mjs --account=test.president@devclub.test
```
*(The owner account `manish.choudhary@devclubtrcac.in` is strictly blocked from this command).*

### C. Logging In as Each Role
1. Navigate to `http://localhost:3000/login` in your browser.
2. Enter the login email corresponding to the target role (e.g. `test.president@devclub.test`).
3. Enter the configured test password and click **Sign In**.
4. Confirm the user badge in the top bar / sidebar displays the standardized display name (e.g. `"President — QA Account"`).
5. Execute the relevant test steps in the scenario above.
6. Click **Sign Out** (or navigate to `/auth/signout`) before logging in as the next role.
