# DevClub Management & Accountability System — Email Migration Plan
**Target Domain:** `devclubtrcac.in`  
**Database:** PostgreSQL (Supabase Auth & RLS)  
**Safety Invariant:** **Preserve existing Supabase Auth UUID (`user.id`) across all identity updates. Never delete and recreate auth accounts.**  

---

## 1. Migration Overview & Invariants

1. **Foreign Key Integrity:**
   - Every primary entity in the application (`tasks`, `task_history`, `attendance_records`, `daily_reports`, `daily_report_history`, `social_media_posts`, `audit_log`, `task_comments`) has a foreign key referencing `public.profiles(id)` (which is `auth.users(id)`).
   - Deleting an `auth.users` record triggers cascade deletions or fails with `RESTRICT` foreign key violations.
   - **Mandatory Procedure:** When migrating an account from an old email to a new verified official email, update `auth.users.email`, `public.profiles.email`, and `public.approved_emails.email` in-place while keeping the UUID unchanged.
2. **Owner Safeguard:**
   - `manish.choudhary@devclubtrcac.in` is strictly immutable. It cannot be altered by migration scripts or bulk operations.
3. **QA Account Separation:**
   - All 17 `@devclub.test` accounts remain untouched in the database for automated testing (Playwright E2E and regression scripts).
   - Real members are provisioned with genuine `@devclubtrcac.in` mailboxes.

---

## 2. Account-by-Account Migration Matrix

| Existing Email / State | Proposed Official Email | Member Name | Current Supabase User ID | App Role | Department | Reporting Head | Historical Dependencies | Preconditions | Migration Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `manish.choudhary@devclubtrcac.in` | `manish.choudhary@devclubtrcac.in` | Manish Choudhary | `f957eb6a-5421-4f1b-ab5f-8646b9557997` *(Existing)* | `development_head` | `development` | None | Primary owner, tasks, attendance sessions, audit log | Active in DB; requires MX activation | ✅ Already Seeded (Protected) |
| *New Provisioning* | `komal.jambhale@devclubtrcac.in` | Prof. Komal Jambhale | *To be generated upon invite/creation* | `faculty` | None | None | Faculty dashboard review | Mailbox verified; admin approval | ⏳ Staged for Provisioning |
| *New Provisioning* | `soujas.mane@devclubtrcac.in` | Soujas Mane | *To be generated upon invite/creation* | `president` | None | None | Executive oversight, cross-department | Mailbox verified; admin approval | ⏳ Staged for Provisioning |
| *New Provisioning* | `omkar.more@devclubtrcac.in` | Omkar More | *To be generated upon invite/creation* | `vice_president` | None | `soujas.mane@devclubtrcac.in` | Vice presidential management | Mailbox verified; admin approval | ⏳ Staged for Provisioning |
| *New Provisioning* | `kinjal.more@devclubtrcac.in` | Kinjal More | *To be generated upon invite/creation* | `management_head` | `management` | `soujas.mane@devclubtrcac.in` | Management pillar, reviews, tasks | Mailbox verified; admin approval | ⏳ Staged for Provisioning |
| *New Provisioning* | `hiya.sonpar@devclubtrcac.in` | Hiya Sonpar | *To be generated upon invite/creation* | `team_lead` | `creatives` | `kinjal.more@devclubtrcac.in` | Creatives tasks, attendance, reports | Mailbox verified; admin approval | ⏳ Staged for Provisioning |
| *New Provisioning* | `kunal.sakhiya@devclubtrcac.in` | Kunal Sakhiya | *To be generated upon invite/creation* | `team_lead` | `admin` | `kinjal.more@devclubtrcac.in` | Organization-wide attendance, tasks | Mailbox verified; admin approval | ⏳ Staged for Provisioning |
| *New Provisioning* | `naeva.parmar@devclubtrcac.in` | Naeva Parmar | *To be generated upon invite/creation* | `team_lead` | `social_media` | `kinjal.more@devclubtrcac.in` | Social media control room, tasks | Mailbox verified; admin approval | ⏳ Staged for Provisioning |
| *New Provisioning* | `darshan.gohil@devclubtrcac.in` | Darshan Gohil | *To be generated upon invite/creation* | `team_lead` | `pr` | `kinjal.more@devclubtrcac.in` | PR tasks, attendance, reports | Mailbox verified; admin approval | ⏳ Staged for Provisioning |
| *New Provisioning* | `yash.khanvilkar@devclubtrcac.in` | Yash Khanvilkar | *To be generated upon invite/creation* | `member` | `management` | `kinjal.more@devclubtrcac.in` | Management tasks, daily work logs | Mailbox verified; admin approval | ⏳ Staged for Provisioning |
| *New Provisioning* | `shubham.dayama@devclubtrcac.in` | Shubham Dayama | *To be generated upon invite/creation* | `member` | `management` | `kinjal.more@devclubtrcac.in` | Management tasks, daily work logs | Mailbox verified; admin approval | ⏳ Staged for Provisioning |

---

## 3. Atomic Identity Migration Procedure (for Existing Accounts)

When migrating an existing account from an old address to a new address:

```text
Step 1: Check Preconditions
        - Verify target environment (production vs staging).
        - Verify new email mailbox is active and receives test email.
        - Verify new email does NOT already exist in auth.users or profiles.
        - Verify old user exists and retrieve current UUID (auth.users.id).

Step 2: Database Preparation
        - Insert new email into public.approved_emails with member's current role,
          department, reporting_head_id, and co_head_department.

Step 3: Auth Identity Update
        - Invoke Supabase Admin API:
          supabase.auth.admin.updateUserById(userId, {
            email: newEmail,
            email_confirm: true
          });
        - Trigger / Update profiles:
          UPDATE public.profiles
          SET email = newEmail
          WHERE id = userId;

Step 4: Cleanup Old Approval
        - Remove old temporary email from public.approved_emails.
        - Record audit log entry in public.audit_log:
          action: "profile.email_migrated"
          before: { email: oldEmail }
          after:  { email: newEmail }

Step 5: Post-Migration Verification
        - Confirm foreign keys: tasks, attendance, daily reports all still point to userId.
        - Verify profile is active.
        - Verify member can sign in using newEmail.
```

---

## 4. Rollback and Recovery Procedure

If any step fails during an identity transition:
1. **Application Level:**
   - Re-insert old email into `approved_emails`.
   - Update `profiles.email` back to old email.
   - Call `supabase.auth.admin.updateUserById(userId, { email: oldEmail })`.
   - Delete new email from `approved_emails`.
2. **Zero Data Loss Guarantee:**
   - Because the UUID (`profiles.id`) is never deleted or altered, no tasks, attendance records, daily reports, or comments are ever orphaned or modified during the rollback.

---

## 5. Verification Checklist

- [ ] DNS MX records active for `devclubtrcac.in` on Vercel DNS.
- [ ] Provider mailbox created and verified to receive incoming mail.
- [ ] Dry-run script execution shows 0 errors and sanitized target project ref.
- [ ] Single test member migration approved by administrator.
- [ ] Test member signs in via `/login` using new email.
- [ ] Role, department, and dashboard permissions match specifications.
- [ ] Tasks board shows historical tasks associated with the user.
- [ ] Daily reports and attendance history display correctly.
