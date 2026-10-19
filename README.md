# HackCrypt Management System

Internal management web app for **DevClub TRCAC** (Thakur Ramnarayan College of Arts and
Commerce, Mumbai), used to run the preparation and execution of **HackCrypt 2027-28**
(national hackathon, **8–9 January 2027**, planning period **22 October 2026 – 7 January 2027**).

It turns the club's plan of action into software: every responsibility has an owner, every
task has a deadline, every deadline has a follow-up, and every completed task has a record.

- **Web only, mobile-first.** Most members use phones.
- **Stack:** Next.js 16 (App Router) + TypeScript (strict), Tailwind CSS v4 + shadcn/ui
  style primitives, Supabase (Postgres, Auth, Row Level Security, Realtime), Zod,
  lucide-react, Framer Motion, Leaflet + OpenStreetMap (added in Stage 3).
- **Deploy target:** Vercel. HTTPS is required for browser geolocation in Stage 3.

The full specification lives in [`docs/SPEC.md`](docs/SPEC.md), the attendance algorithm in
[`docs/ATTENDANCE_LOGIC.md`](docs/ATTENDANCE_LOGIC.md), and progress in
[`docs/PROGRESS.md`](docs/PROGRESS.md).

---

## What Stage 1 contains

| Area | Status |
|---|---|
| Project scaffold, design tokens, fonts, brand shell | done |
| Full database schema: enums, tables, constraints, helper functions, **RLS on every table**, seed phases | done |
| Google sign-in, approved-email gate, profile creation, `/pending` | done |
| Role-based route guards and the capability matrix in TypeScript + SQL | done |
| `/admin/users` — add, edit and revoke approved emails; pause members | done |
| `/admin/audit` — read-only audit trail | done |
| Tasks (Stage 2), attendance (Stage 3), dashboards and timeline (Stage 4) | not yet |

---

## 1. Create the Supabase project

1. Create a project at [supabase.com](https://supabase.com). Choose the region closest to
   Mumbai (for example `ap-south-1`).
2. Open **Project Settings → API** and note:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon / publishable key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role key** → `SUPABASE_SERVICE_ROLE_KEY` (**server-side only**)

## 2. Apply the database migrations

Run the six files in `supabase/migrations/` **in order** against your project. Either way
works:

**Option A — SQL editor (simplest, no tooling).** Open the Supabase dashboard → **SQL
Editor**, then paste and run each file in order:

```
0001_enums.sql
0002_core_profiles.sql
0003_phases_settings.sql
0004_tasks.sql
0005_attendance.sql
0006_audit_log.sql
```

**Option B — Supabase CLI.**

```bash
supabase link --project-ref <your-project-ref>
supabase db push
```

The migrations are written to be safe to re-run. `0003` seeds the five real planning
phases and the three attendance thresholds defined in the spec. Nothing else is seeded —
there is no invented data anywhere in this project.

## 3. Turn on Google sign-in

1. In [Google Cloud Console](https://console.cloud.google.com/) create an **OAuth 2.0
   Client ID** of type *Web application*.
2. Authorised redirect URI — this is Supabase's callback, not the app's:

   ```
   https://<your-project-ref>.supabase.co/auth/v1/callback
   ```

3. Copy the Client ID and Client secret into **Supabase → Authentication → Providers →
   Google**, and enable the provider.
4. In **Authentication → URL Configuration** set:
   - **Site URL**: `http://localhost:3000` for local work (change to your Vercel URL later)
   - **Redirect URLs**: add both `http://localhost:3000/auth/callback` and
     `https://<your-vercel-domain>/auth/callback`

5. **Authentication → Sign In / Providers** — disable email/password sign-ups. This app
   only uses Google.

> Only emails on the approved list get a profile. Any other Google account signs in but
> gets no profile, so Row Level Security grants it nothing and it sees `/pending`.

## 4. Configure and run locally

```bash
# install dependencies
npm install

# create your local env file
cp .env.example .env.local      # Windows: copy .env.example .env.local
# then fill in the three Supabase values

npm run dev
```

Open <http://localhost:3000>. You will see the login screen and, until `.env.local` is
filled in, a notice explaining what is missing.

Then:

1. Sign in with Google using **your own** email.
2. You will land on **/pending** — expected, because nobody is approved yet.
3. Open the **SQL editor** and approve yourself once, for example:

   ```sql
   insert into public.approved_emails (email, full_name, role)
   values ('you@example.com', 'Your Name', 'development_head');
   ```

   Sign out and in again. You now have access, and you can approve everyone else from
   **/admin/users**.
4. Add the rest of the roster in `/admin/users` with their real club emails, roles and
   departments (see the roster in `docs/SPEC.md` section 3).

## 5. Deploy to Vercel

1. Push the repository to GitHub and import it in Vercel.
2. Add the four environment variables from `.env.example` in **Project → Settings →
   Environment Variables** (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
   `SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_APP_URL`). Set `NEXT_PUBLIC_APP_URL` to your
   Vercel URL.
3. Add `https://<your-vercel-domain>/auth/callback` to Supabase **Redirect URLs** and set
   the **Site URL** to the Vercel domain.
4. Deploy. HTTPS is automatic, which Stage 3 needs for geolocation.

## Commands

```bash
npm run dev        # local development
npm run build      # production build
npm run start      # run the production build
npm run lint       # ESLint
npm run typecheck  # tsc --noEmit
```

## The club logo

Drop the real logo at:

```
public/assets/logo/devclub-logo.png
```

It is shown in the top bar and on the login page with a soft cyan glow. Until the file
exists the badge falls back to the glowing cyan circle with a bulb mark, so the shell never
shows a broken image.

## Brand and design tokens

The palette and fonts are the real values taken from the club website
([devclubtrcac.in](https://devclubtrcac.in)), which uses a Material 3 style theme. They are
defined once in `src/app/globals.css` and mapped onto Tailwind utilities with `@theme`:

| Token | Value | Comes from the site as |
|---|---|---|
| `--accent` | `#00E5FF` | `primary-container` (the solid cyan CTA fill) |
| `--accent-dim` | `#00DAF3` | `primary-fixed-dim` |
| `--accent-soft` | `#C3F5FF` | `primary` |
| `--accent-ink` | `#00363D` | `on-primary` (dark text on cyan) |
| `--bg` | `#0C0E13` | `surface-container-lowest` |
| `--surface` | `#111318` | `surface` |
| `--surface-2` | `#1D2024` | `surface-container` |
| `--surface-3` | `#272A2F` | `surface-container-high` |
| `--text` | `#E1E2E9` | `on-surface` |
| `--text-muted` | `#BAC9CC` | `on-surface-variant` |
| Font (display/body) | **Geist** | `var(--font-geist)` |
| Font (mono) | **JetBrains Mono** | `var(--font-jetbrains)` |

Use utilities such as `bg-surface`, `bg-accent`, `text-accent-ink`, `text-muted-foreground`,
`border-border` and `text-strong` rather than raw hex values.

## Security model

Non-negotiable rules, all enforced in the database as well as in the app:

- **RLS is enabled on every table in the same migration that creates it.**
- **Approved emails only.** A Google account with no profile row is granted nothing.
- **`supabase/migrations`** holds the schema. Helper functions such as
  `public.can_write_department(department)` are the single source of the permission matrix,
  and `src/lib/permissions.ts` mirrors them for the UI. Keep the two in step.
- **Server-only secrets.** `src/lib/supabase/admin.ts` imports `server-only`, so the
  service role key can never reach the browser.
- **Every Server Action** authenticates, loads role and department, checks the permission,
  validates with Zod and only then acts (`src/app/(app)/admin/users/actions.ts` is the
  reference implementation).
- **Self check-in** will be written only by the server with the service role key (Stage 3).
  `attendance_records` has no INSERT policy at all, and raw coordinates are not selectable —
  they are available only through `public.checkin_coordinates()`, which enforces who may see
  them.
- **Audit trail.** `audit_log` has no INSERT policy; rows are written only by the guarded
  `public.log_audit()` function, which always stamps the real caller.
- Never log raw coordinates, tokens or secrets.

### Two deliberate deviations from the indicative schema in the spec

1. **The live-code secret lives in its own table**, `attendance_session_secrets`, with RLS
   enabled and *no policies*. Row Level Security cannot hide a single column, so keeping
   `code_secret` on the session row would have exposed it to every client that can read the
   session. Only the server can read this table.
2. **`flags` is an array of a dedicated enum** (`attendance_flag`), not a free-text column,
   because the attendance logic explicitly allows more than one flag on a check-in
   (`outside_area` plus `low_accuracy`, for example).

Both are security and correctness improvements. `docs/SPEC.md` describes the model as
"indicative", so neither changes the intended behaviour.

## Known notes

- **`middleware.ts` deprecation.** Next 16.4 still supports `src/middleware.ts` and it is
  what guards routes today, but the build prints a deprecation warning suggesting the newer
  `proxy.ts` convention. It is safe to keep for now and worth migrating deliberately.
- **`npm audit`** reports 5 high-severity advisories, all inside the dev-only ESLint
  toolchain (`eslint-config-next` → `fast-glob` → `micromatch` → `braces`, a ReDoS). Nothing
  in the production bundle is affected. `npm audit fix --force` would downgrade
  `eslint-config-next` to v14, so it has deliberately not been applied.
- **`select *` on `attendance_records`** will fail for signed-in users by design: the
  `lat` and `lng` columns have no SELECT grant. Always name the columns you need.
#   h a c k c r y p t m a n a g e m e n t  
 