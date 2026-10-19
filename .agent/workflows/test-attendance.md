---
description: Test the attendance and location check-in logic end to end
---

# Test attendance

1. Read `docs/ATTENDANCE_LOGIC.md`.
2. Confirm unit tests exist for all 16 listed test cases; add any that are missing.
3. Run the test suite and report pass/fail per case.
4. Run RLS tests for attendance tables across roles: member, each team lead, Admin lead, management head, development head, faculty.
5. In the browser (mobile viewport), walk through:
   - create a session with a map pin and radius
   - check in inside the radius
   - check in outside the radius (mock geolocation) and confirm it is flagged
   - deny location permission and confirm the `no_location` flag
   - use a valid and an expired live code
   - lead approves and rejects a flagged record
   - lead manual override with and without a remark
6. Confirm the audit log entries exist for every override and review decision.
7. Report failures with steps to reproduce, then fix them and re-run.
