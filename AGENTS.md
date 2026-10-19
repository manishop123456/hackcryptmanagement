# AGENTS.md — HackCrypt Management System

Internal web app for DevClub TRCAC to run HackCrypt 2027-28 (event 8–9 Jan 2027): tasks, location-verified attendance, weekly reviews, contribution tracking, issues, Level Up lectures.

## Read first
- `docs/SPEC.md` is the source of truth for scope, roles, permissions, data model and milestones.
- `docs/ATTENDANCE_LOGIC.md` defines the exact check-in algorithm and test cases.
- `docs/PROGRESS.md`: read at the start of every session, update at the end of every task.
- If a request conflicts with the spec, follow the spec and tell me.

## Stack
Next.js (App Router) + TypeScript (strict), Tailwind + shadcn/ui, Supabase (Postgres, Auth with Google, RLS, Realtime), Zod, Leaflet + OpenStreetMap. Deploy: Vercel (HTTPS needed for geolocation).

## Hard rules
- Web only, mobile-first.
- Enforce permissions on the server AND in Supabase RLS. Never rely on UI checks alone.
- Tasks must have an owner and a deadline (DB NOT NULL + Zod validation).
- Attendance: the client sends only `lat, lng, accuracy, code`. The server computes distance, time window, code validity, status and flags. The client never writes status, distance or flags.
- Location is read only at the moment of check-in. Never track in the background.
- Leads (Creatives, Admin, Social Media, PR) manage attendance only for their own department. The Admin lead has read access to all departments.
- Every manual attendance override needs a remark and must write to `audit_log`.
- Only pre-approved Google emails can access the app.
- No secrets in code. Use `.env.local`; keep `.env.example` updated. Never expose the Supabase service-role key to the client.
- All schema changes go in `supabase/migrations/` as SQL files.

## Workflow
- One milestone at a time (SPEC section 8). Do not start the next one without my approval.
- Plan first for anything touching auth, RLS or attendance, and wait for my OK.
- Before saying "done": run typecheck, lint and tests, then verify the flow in the browser (mobile viewport for check-in).
- Keep changes small and focused. Do not refactor unrelated code.
- If something is ambiguous or blocking, ask one specific question instead of guessing.
- After each task, update `docs/PROGRESS.md`.

## Code style
- TypeScript strict, no `any`. Validate all inputs with Zod on the server.
- Small components. Server actions/route handlers grouped by feature.
- Clear, human error messages (denied location, outside area, expired code, outside time window).
- Accessible UI: keyboard navigable, good contrast, dark and light theme.

## Commands (update if they change)
- `npm run dev` — local dev
- `npm run typecheck` — TypeScript check
- `npm run lint` — lint
- `npm test` — unit tests

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
