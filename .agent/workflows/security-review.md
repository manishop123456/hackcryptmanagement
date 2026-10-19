---
description: Review the codebase for security and permission issues
---

# Security review

1. Read `.agent/rules/security-rls.md` and SPEC section 3 (permission matrix).
2. List every table and confirm RLS is enabled with policies matching the matrix.
3. Search the repo for service-role key usage and confirm it is server-only.
4. Review every route handler and server action for: authentication, role/department check, Zod validation, and safe error messages.
5. Confirm the client cannot set attendance status, distance, flag or review fields.
6. Check that no secrets, tokens or raw coordinates are logged or committed; check `.env.example` has no real values.
7. Check the rate limit on check-in and the pre-approved email gate.
8. Output a report with: issues found (High / Medium / Low), the file and line, and a suggested fix. Do not change code until I approve the fixes.
