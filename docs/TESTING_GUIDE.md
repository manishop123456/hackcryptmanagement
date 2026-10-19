# TESTING & DEVELOPMENT SEEDING GUIDE — HACKCRYPT MANAGEMENT SYSTEM

This guide explains how to set up test accounts, seed synthetic operational data, and execute the role-authorization testing matrix in local development or staging environments.

> [!WARNING]
> Never commit actual passwords, publishable credentials, or service role keys to git repositories. Always use `.env.local` for local environment configuration.

---

## 1. Target Environment & Safety Configuration

The system is configured to connect to your Supabase instance defined in `.env.local`.

### Verifying Connected Project
Check your `.env.local` file:
```bash
NEXT_PUBLIC_SUPABASE_URL=https://<your-project-id>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>
```

- **Connected Project ID**: `fyjsdgufcnnnukcfsdio`
- **Environment Safety**: The seeding script automatically checks `NODE_ENV` and `APP_ENV`. It will refuse to run against production unless explicitly passed `--confirm-production`.

---

## 2. Configuring Primary Owner Account

Set your primary email address in `.env.local`:
```bash
SEED_ADMIN_EMAIL=manish.choudhary@devclubtrcac.in
```

When you run the seeding utility, it automatically registers your email into `approved_emails` with the `development_head` role in the `development` department.

---

## 3. Running Seeding Commands

### Command 1: Seed Test Accounts
To approve all test emails and initialize their Auth accounts:
```bash
npm run seed:test-users
```

This creates approved email entries and active profiles for the following role matrix:

| Full Name | Role | Department | Test Email Example |
| :--- | :--- | :--- | :--- |
| **Manish Choudhary** (Owner) | `development_head` | `development` | `manish.choudhary@devclubtrcac.in` |
| **Dr. Vikram Sharma** | `faculty` | *(Global)* | `test.faculty@devclub.test` |
| **Aarav Mehta** | `president` | *(Global)* | `test.president@devclub.test` |
| **Riya Kapoor** | `vice_president` | *(Global)* | `test.vp@devclub.test` |
| **Siddharth Rao** | `management_head` | `management` | `test.management_head@devclub.test` |
| **Karan Malhotra** | `development_head` | `development` | `test.development_head@devclub.test` |
| **Neha Singh** | `hackathon_head` | `hackathon` | `test.hackathon_head@devclub.test` |
| **Aditya Verma** | `team_lead` | `admin` | `test.lead.admin@devclub.test` |
| **Pooja Joshi** | `team_lead` | `pr` | `test.lead.pr@devclub.test` |
| **Rohan Gupta** | `team_lead` | `social_media` | `test.lead.social_media@devclub.test` |
| **Ananya Iyer** | `team_lead` | `creatives` | `test.lead.creatives@devclub.test` |
| **Dev Associate** | `member` | `development` | `test.member.dev@devclub.test` |
| **Hackathon Associate** | `member` | `hackathon` | `test.member.hackathon@devclub.test` |

### Command 2: Seed Synthetic Operational Data
To populate sample tasks, attendance sessions, Level Up lectures, issues, and HackCrypt teams:
```bash
npm run seed:test-data
```
*Note: All synthetic records are prefixed with `[TEST]` for easy identification and filtering.*

---

## 4. Secure Password Setup

To log in as any test user without hardcoding passwords:

### Option A: Self-Service Password Reset (In-App)
1. Open the application at `http://localhost:3000/forgot-password`.
2. Enter the test account email (e.g. `test.faculty@devclub.test`).
3. If local SMTP/Inbucket or Supabase Email Auth is configured, click the reset link to choose your password.

### Option B: Supabase Dashboard (Recommended for Staging)
1. Go to **Supabase Dashboard → Authentication → Users**.
2. Find the test user in the table.
3. Click **User Actions (...) → Reset Password** or set a password manually.

---

## 5. Account Authorization Test Matrix

Validate permission boundaries by signing in as each role:

1. **Development Head (`development_head`)**:
   - Access to `/admin/users`, `/admin/audit`, `/tasks`, `/attendance`, `/levelup`, `/hackcrypt`, `/reports`, `/event-day`.
   - Full CRUD write access across departments.

2. **Faculty (`faculty`)**:
   - Access to `/admin/audit`, `/tasks`, `/attendance`, `/levelup`, `/hackcrypt`, `/reports`.
   - Read-only audit access across all departments.

3. **President & Vice President (`president`, `vice_president`)**:
   - Global read and write access for tasks, attendance, weekly reviews, and Level Up pipeline.

4. **Hackathon Head (`hackathon_head`)**:
   - Read access across all departments; write access restricted to `hackathon` department tasks/attendance and HackCrypt modules.

5. **Department Team Leads (`team_lead`)**:
   - Access restricted to their specific assigned department (`admin`, `pr`, `social_media`, `creatives`).
   - Admin Lead has organization-wide read access for attendance records.

6. **Members (`member`)**:
   - Can view personal tasks, check-in for open attendance sessions, and view HackCrypt problem statements/teams.
   - Denied access to `/admin/users` and `/admin/audit`.

7. **Unapproved or Revoked Accounts**:
   - Sign-in succeeds but profile status check redirects immediately to `/pending`.

---

## 6. Resetting Test Data

To cleanly remove test data without altering genuine production records:
1. All test data records have titles/names starting with `[TEST]`.
2. Delete rows matching `title LIKE '[TEST]%'` via SQL query in Supabase SQL Editor if cleanup is needed.
