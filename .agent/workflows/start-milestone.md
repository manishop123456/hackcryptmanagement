---
description: Plan and start a milestone from the spec
---

# Start milestone

Input: the milestone number (for example M1).

1. Read `AGENTS.md`, `docs/SPEC.md` and `docs/PROGRESS.md`.
2. Find the milestone in SPEC section 8 and list its deliverables.
3. Produce a short implementation plan: files to create/change, migrations, routes, and tests. Call out anything touching auth, RLS or attendance.
4. List any questions or missing inputs (env vars, credentials, decisions).
5. STOP and wait for my approval before writing code.
6. After approval: implement step by step, run typecheck + lint + tests, and verify the flows in the browser.
7. Update `docs/PROGRESS.md` (done, next up, decisions, bugs).
8. Summarise what was built, how to run and test it, and wait for my go-ahead before the next milestone.
